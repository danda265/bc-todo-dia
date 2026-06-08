// POST /api/auth/recuperar-senha — Solicitar reset de senha
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email().max(255),
});

// Rate limit simples: 3 tentativas por hora por email
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hora
  const max = 3;
  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    // Rate limit por email
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 1 hora." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // Verificar se usuário existe (resposta genérica para não vazar info)
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.password) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Apagar tokens anteriores deste email
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      // Gerar token seguro
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/recuperar-senha/${token}`;

      await resend.emails.send({
        from: "BC Todo Dia <onboarding@resend.dev>",
        to: email,
        subject: "Recuperar senha — BC Todo Dia",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Recuperar sua senha</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>BC Todo Dia</strong>.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #e63946; color: white; padding: 12px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Criar nova senha
            </a>
            <p style="color: #666; font-size: 14px;">Este link expira em <strong>1 hora</strong>.</p>
            <p style="color: #666; font-size: 14px;">Se você não solicitou isso, pode ignorar este email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px;">BC Todo Dia — Balneário Camboriú</p>
          </div>
        `,
      });
    }

    // Sempre retornar sucesso (não revelar se email existe)
    return NextResponse.json({
      message: "Se este email estiver cadastrado, você receberá as instruções em breve.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("[RECUPERAR SENHA]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

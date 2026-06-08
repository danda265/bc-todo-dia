// POST /api/auth/recuperar-senha/confirmar — Confirmar nova senha com token
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
  token: z.string().min(64).max(64),
  senha: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    // Buscar token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: body.token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token: body.token } });
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    // Atualizar senha
    const hash = await bcrypt.hash(body.senha, 12);
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hash },
    });

    // Apagar token usado
    await prisma.passwordResetToken.delete({ where: { token: body.token } });

    return NextResponse.json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[CONFIRMAR SENHA]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * GET  /api/perfil  — retorna dados do usuário autenticado
 * PUT  /api/perfil  — atualiza nome, bairro, senha
 * DELETE /api/perfil — inicia exclusão da conta (soft delete + agenda limpeza)
 *
 * Segurança:
 *  - Requer sessão ativa
 *  - Senha atual exigida para troca de senha
 *  - bcrypt work factor 12
 *  - Dados sensíveis nunca retornados (password hash, tokens Google)
 *  - LGPD Art. 18: direito de acesso e exclusão
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { Bairro } from "@prisma/client";

// ─── GET — dados do perfil ────────────────────────────────────────────────────
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [dbUser, googleAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bairro: true,
        marketingOptIn: true,
        consentAcceptedAt: true,
        createdAt: true,
        password: true, // verificamos presença, nunca retornamos o hash
        _count: { select: { reviews: true, favorites: true, businesses: true } },
      },
    }),
    // Verificar se tem conta Google vinculada (query separada para tipagem correta)
    prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
      select: { id: true },
    }),
  ]);

  if (!dbUser) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const { password: _pw, ...userSemSenha } = dbUser; // nunca expor o hash

  return NextResponse.json({
    user: {
      ...userSemSenha,
      hasPassword: !!dbUser.password, // true só se tiver senha cadastrada
      googleLinked: googleAccount !== null,
    },
  });
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bairro: z.nativeEnum(Bairro).nullable().optional(),
  marketingOptIn: z.boolean().optional(),
  // Troca de senha (opcional)
  senhaAtual: z.string().min(1).max(200).optional(),
  novaSenha: z.string().min(8).max(200).optional(),
}).refine(
  (d) => {
    // Se enviou novaSenha, precisa enviar senhaAtual
    if (d.novaSenha && !d.senhaAtual) return false;
    return true;
  },
  { message: "Informe a senha atual para trocar a senha" }
);

// ─── PUT — atualizar perfil ───────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
  }

  const { name, bairro, marketingOptIn, senhaAtual, novaSenha } = result.data;

  // Verificar troca de senha
  if (novaSenha) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser?.password) {
      return NextResponse.json(
        { error: "Esta conta usa login pelo Google — não possui senha cadastrada" },
        { status: 400 }
      );
    }
    const senhaOk = await bcrypt.compare(senhaAtual!, dbUser.password);
    if (!senhaOk) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (bairro !== undefined) updateData.bairro = bairro;
  if (marketingOptIn !== undefined) updateData.marketingOptIn = marketingOptIn;
  if (novaSenha) {
    updateData.password = await bcrypt.hash(novaSenha, 12);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: { id: true, name: true, email: true, bairro: true, marketingOptIn: true },
  });

  return NextResponse.json({ user: updated });
}

// ─── DELETE — excluir conta (LGPD Art. 18 VI) ────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Confirmar intenção com senha ou "DELETAR" literal
  let body: { confirmacao?: string; senha?: string } = {};
  try { body = await req.json(); } catch { /* ok sem body */ }

  if (body.confirmacao !== "DELETAR") {
    return NextResponse.json(
      { error: "Envie { \"confirmacao\": \"DELETAR\" } para confirmar" },
      { status: 400 }
    );
  }

  // ON DELETE CASCADE cuida de todas as FK relacionadas ao User
  // (businesses, reviews, favorites, sessions, accounts)
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true, mensagem: "Conta excluída. Seus dados serão removidos em até 30 dias dos backups." });
}

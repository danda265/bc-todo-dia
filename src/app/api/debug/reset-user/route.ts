// Endpoint temporário — deleta usuário sem contas OAuth vinculadas
// Só funciona se o usuário não tem senha (foi criado via OAuth mas ficou incompleto)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email obrigatório" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: "Usuário tem senha — não pode ser deletado por este endpoint" },
        { status: 403 }
      );
    }

    if (user.accounts.length > 0) {
      return NextResponse.json(
        { error: "Usuário tem contas OAuth vinculadas — não é um usuário zumbi" },
        { status: 403 }
      );
    }

    // Usuário sem senha e sem contas OAuth = zumbi de tentativa anterior
    await prisma.user.delete({ where: { email } });

    return NextResponse.json({
      deleted: true,
      email: user.email,
      message: "Usuário zumbi deletado. Pode fazer login com Google agora.",
    });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

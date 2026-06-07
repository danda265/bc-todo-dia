// GET /api/favoritos/[businessId] — Verifica se o usuário atual favoritou este negócio
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const user = await getSessionUser();

  // Sem sessão: retorna false sem erro (página pública)
  if (!user) return NextResponse.json({ favoritado: false });

  const fav = await prisma.favorite.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
    select: { id: true },
  });

  return NextResponse.json({ favoritado: !!fav });
}

// GET  /api/favoritos   — Lista favoritos do usuário autenticado
// POST /api/favoritos   — Adiciona ou remove um favorito (toggle)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { z } from "zod";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const favoritos = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      business: {
        include: {
          medias: { where: { isCover: true }, take: 1 },
          _count: { select: { menuItems: true, promocoes: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favoritos: favoritos.map((f) => f.business) });
}

const schema = z.object({ businessId: z.string().min(1).max(100) });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "businessId inválido" }, { status: 400 });

  const { businessId } = result.data;

  // Verificar que o negócio existe e está ativo
  const business = await prisma.business.findFirst({
    where: { id: businessId, status: "ATIVO" },
    select: { id: true },
  });
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 });

  // Toggle
  const existente = await prisma.favorite.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });

  if (existente) {
    await prisma.favorite.delete({ where: { userId_businessId: { userId: user.id, businessId } } });
    return NextResponse.json({ favoritado: false });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, businessId } });
    return NextResponse.json({ favoritado: true });
  }
}

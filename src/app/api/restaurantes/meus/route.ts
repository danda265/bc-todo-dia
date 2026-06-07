// GET /api/restaurantes/meus — Restaurantes do comerciante logado com métricas
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerComerciante } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const { erro, user } = await requerComerciante();
  if (erro) return erro;

  // 1. Buscar restaurantes com contagens
  const restaurantes = await prisma.business.findMany({
    where: { ownerId: user!.id, category: "RESTAURANTES" },
    include: {
      _count: {
        select: {
          menuItems: true,
          promocoes: true,
          medias: true,
          favorites: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (restaurantes.length === 0) {
    return NextResponse.json({ restaurantes: [] });
  }

  // 2. Média de avaliações por restaurante (groupBy — 1 query para todos)
  const ids = restaurantes.map((r) => r.id);
  const reviewStats = await prisma.review.groupBy({
    by: ["businessId"],
    where: { businessId: { in: ids } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  // 3. Promoções ativas agora (count separado para precisão de datas)
  const agora = new Date();
  const promoAtivas = await prisma.promocao.groupBy({
    by: ["businessId"],
    where: {
      businessId: { in: ids },
      status: "ATIVA",
      startsAt: { lte: agora },
      endsAt: { gte: agora },
    },
    _count: { _all: true },
  });

  // 4. Merge dos dados
  const reviewMap = new Map(reviewStats.map((s) => [s.businessId, s]));
  const promoMap = new Map(promoAtivas.map((p) => [p.businessId, p._count._all]));

  const resultado = restaurantes.map((r) => {
    const rv = reviewMap.get(r.id);
    return {
      ...r,
      mediaAvaliacoes: rv?._avg.rating ?? null,
      totalAvaliacoes: rv?._count._all ?? 0,
      promocoesAtivas: promoMap.get(r.id) ?? 0,
    };
  });

  return NextResponse.json({ restaurantes: resultado });
}

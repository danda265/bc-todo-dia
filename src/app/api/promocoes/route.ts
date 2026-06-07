// GET /api/promocoes — Promoções ATIVAS hoje (público)
// Retorna apenas promoções cujo período cobre o momento atual
// Expiradas são automaticamente excluídas da resposta
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Bairro, OfferTarget } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bairro = searchParams.get("bairro") as Bairro | null;
  const target = searchParams.get("target") as OfferTarget | null;

  const agora = new Date();

  try {
    // Nota: a expiração de promoções é feita pelo endpoint de admin/cron,
    // não aqui. O filtro por data já garante que promoções vencidas não aparecem.
    // Expirar no GET público permitiria writes ilimitados via bot.
    const promocoes = await prisma.promocao.findMany({
      where: {
        status: "ATIVA",
        startsAt: { lte: agora },
        endsAt: { gte: agora },
        ...(target ? { target: { in: [target, "TODOS"] } } : {}),
        business: {
          status: "ATIVO",
          ...(bairro ? { bairro } : {}),
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            bairro: true,
            coverUrl: true,
            phone: true,
            whatsapp: true,
          },
        },
      },
      orderBy: { endsAt: "asc" }, // as que expiram primeiro aparecem primeiro
      take: 100,
    });

    return NextResponse.json({
      promocoes,
      total: promocoes.length,
      geradoEm: agora.toISOString(),
      aviso: "Preços e promoções são de inteira responsabilidade do estabelecimento. Verifique condições diretamente com o restaurante.",
    });
  } catch (error) {
    console.error("[PROMOCOES GET]", error);
    return NextResponse.json({ error: "Erro ao buscar promoções" }, { status: 500 });
  }
}

// POST /api/restaurantes/[id]/promocoes/[pid]/reativar
// Restaurante reativa uma promoção expirada com novas datas
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";

const schema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
}).refine(
  (d) => new Date(d.endsAt) > new Date(d.startsAt),
  { message: "Data de término deve ser após o início" }
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const promo = await prisma.promocao.findUnique({ where: { id: pid } });
    if (!promo || promo.businessId !== id) {
      return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 });
    }
    if (promo.status === "CANCELADA") {
      return NextResponse.json({ error: "Promoções canceladas não podem ser reativadas" }, { status: 400 });
    }

    const data = schema.parse(await req.json());
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    const agora = new Date();

    if (endsAt <= agora) {
      return NextResponse.json({ error: "A nova data de término deve ser no futuro" }, { status: 400 });
    }

    const reativada = await prisma.promocao.update({
      where: { id: pid },
      data: {
        startsAt,
        endsAt,
        status: startsAt <= agora ? "ATIVA" : "RASCUNHO",
        reativadoEm: agora,
        reativacoesCount: { increment: 1 },
      },
    });

    return NextResponse.json({ promocao: reativada });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Datas inválidas", details: error.issues }, { status: 400 });
    console.error("[REATIVAR]", error);
    return NextResponse.json({ error: "Erro ao reativar promoção" }, { status: 500 });
  }
}

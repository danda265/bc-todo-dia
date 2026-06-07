// POST/GET /api/restaurantes/[id]/promocoes
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { OfferTarget } from "@prisma/client";

const schema = z.object({
  title: z.string().min(5).max(150),
  description: z.string().min(10).max(500),
  discount: z.string().max(80).optional(),
  target: z.nativeEnum(OfferTarget).default("TODOS"),
  imageUrl: z.string().max(500).optional().nullable(),
  startsAt: z.string().datetime(),  // ISO string
  endsAt: z.string().datetime(),
}).refine(
  (d) => new Date(d.endsAt) > new Date(d.startsAt),
  { message: "A data de término deve ser após a data de início" }
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const data = schema.parse(await req.json());
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    // Limite de 10 promoções ativas simultâneas
    const ativas = await prisma.promocao.count({
      where: { businessId: id, status: "ATIVA" },
    });
    if (ativas >= 10) {
      return NextResponse.json({ error: "Limite de 10 promoções ativas atingido" }, { status: 400 });
    }

    const agora = new Date();
    const status = startsAt <= agora && endsAt >= agora ? "ATIVA" : startsAt > agora ? "RASCUNHO" : "EXPIRADA";

    const promocao = await prisma.promocao.create({
      data: {
        businessId: id,
        title: data.title,
        description: data.description,
        discount: data.discount ?? null,
        target: data.target,
        imageUrl: data.imageUrl ?? null,
        startsAt,
        endsAt,
        status,
      },
    });

    return NextResponse.json({ promocao }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    console.error("[PROMOCAO POST]", error);
    return NextResponse.json({ error: "Erro ao criar promoção" }, { status: 500 });
  }
}

// GET — listar promoções do restaurante (para o painel do dono)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  // Sincronizar status de expiração antes de retornar
  const agora = new Date();
  await prisma.promocao.updateMany({
    where: {
      businessId: id,
      status: "ATIVA",
      endsAt: { lt: agora },
    },
    data: { status: "EXPIRADA" },
  });

  const promocoes = await prisma.promocao.findMany({
    where: { businessId: id },
    orderBy: [{ status: "asc" }, { endsAt: "desc" }],
  });

  return NextResponse.json({ promocoes });
}

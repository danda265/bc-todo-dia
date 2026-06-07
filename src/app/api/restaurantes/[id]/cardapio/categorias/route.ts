// POST/GET /api/restaurantes/[id]/cardapio/categorias
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";

const schema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const data = schema.parse(await req.json());
    const count = await prisma.menuCategory.count({ where: { businessId: id } });
    if (count >= 20) return NextResponse.json({ error: "Máximo de 20 categorias" }, { status: 400 });

    const categoria = await prisma.menuCategory.create({
      data: { businessId: id, name: data.name, sortOrder: data.sortOrder ?? count },
    });
    return NextResponse.json({ categoria }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categorias = await prisma.menuCategory.findMany({
    where: { businessId: id },
    include: { items: { where: { available: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ categorias });
}

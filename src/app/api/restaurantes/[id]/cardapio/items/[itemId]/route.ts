// PUT/DELETE /api/restaurantes/[id]/cardapio/items/[itemId]
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive().optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  imageUrl: z.string().max(500).optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const item = await prisma.menuItem.findUnique({ where: { id: itemId }, select: { businessId: true } });
    if (!item || item.businessId !== id) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    const data = updateSchema.parse(await req.json());

    const atualizado = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.tags !== undefined && { tags: JSON.stringify(data.tags) }),
        ...(data.available !== undefined && { available: data.available }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
    return NextResponse.json({ item: atualizado });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar item" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const item = await prisma.menuItem.findUnique({ where: { id: itemId }, select: { businessId: true } });
    if (!item || item.businessId !== id) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    await prisma.menuItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar item" }, { status: 500 });
  }
}

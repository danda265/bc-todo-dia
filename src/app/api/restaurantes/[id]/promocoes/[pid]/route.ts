// PUT/DELETE /api/restaurantes/[id]/promocoes/[pid]
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { OfferTarget } from "@prisma/client";

const updateSchema = z.object({
  title: z.string().min(5).max(150).optional(),
  description: z.string().min(10).max(500).optional(),
  discount: z.string().max(80).optional().nullable(),
  target: z.nativeEnum(OfferTarget).optional(),
  imageUrl: z.string().max(500).optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const promo = await prisma.promocao.findUnique({ where: { id: pid }, select: { businessId: true } });
    if (!promo || promo.businessId !== id) return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 });

    const data = updateSchema.parse(await req.json());
    const agora = new Date();
    const startsAt = data.startsAt ? new Date(data.startsAt) : undefined;
    const endsAt = data.endsAt ? new Date(data.endsAt) : undefined;

    const updated = await prisma.promocao.update({
      where: { id: pid },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.target && { target: data.target }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(startsAt && { startsAt }),
        ...(endsAt && { endsAt }),
        // Recalcular status
        status: (() => {
          const s = startsAt ?? new Date();
          const e = endsAt ?? new Date();
          if (e < agora) return "EXPIRADA";
          if (s <= agora && e >= agora) return "ATIVA";
          return "RASCUNHO";
        })(),
      },
    });

    return NextResponse.json({ promocao: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar promoção" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  const { id, pid } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  const promo = await prisma.promocao.findUnique({ where: { id: pid }, select: { businessId: true } });
  if (!promo || promo.businessId !== id) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  await prisma.promocao.delete({ where: { id: pid } });
  return NextResponse.json({ ok: true });
}

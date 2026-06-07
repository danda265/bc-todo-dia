/**
 * DELETE /api/restaurantes/[id]/reviews/[reviewId]
 * — usuário deleta sua própria avaliação (direito LGPD Art. 18 VI)
 * — admin pode deletar qualquer avaliação abusiva
 * PUT /api/restaurantes/[id]/reviews/[reviewId]
 * — usuário edita sua própria avaliação
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string; reviewId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { reviewId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true },
  });
  if (!review) return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });

  // Só o autor ou um admin pode deletar
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(user.email?.toLowerCase() ?? "");

  if (review.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return NextResponse.json({ ok: true });
}

const editSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .max(1000)
    .refine((v) => !v || v.trim().length >= 10, {
      message: "Mínimo 10 caracteres",
    })
    .optional()
    .nullable(),
});

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { reviewId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true },
  });
  if (!review) return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
  if (review.userId !== user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const result = editSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: result.data.rating,
      comment: result.data.comment?.trim() || null,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json({ review: updated });
}

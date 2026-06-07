/**
 * GET  /api/admin/restaurantes   — lista todos os restaurantes
 * PATCH /api/admin/restaurantes  — atualiza status de um restaurante
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const VALID_STATUS = ["ATIVO", "PENDENTE", "SUSPENSO"] as const;
type ValidStatus = typeof VALID_STATUS[number];

export async function GET(req: NextRequest) {
  const { erro } = await requerAdmin();
  if (erro) return erro;

  const { searchParams } = new URL(req.url);
  const statusRaw = searchParams.get("status");
  const q = searchParams.get("q")?.slice(0, 200); // limitar tamanho de busca
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  // Validar status contra enum — rejeita valores arbitrários
  const status: ValidStatus | undefined =
    statusRaw && (VALID_STATUS as readonly string[]).includes(statusRaw)
      ? (statusRaw as ValidStatus)
      : undefined;

  const where: { status?: ValidStatus; name?: { contains: string; mode: "insensitive" } } = {};
  if (status) where.status = status;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const [total, restaurantes] = await Promise.all([
    prisma.business.count({ where }),
    prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, slug: true, category: true, bairro: true,
        status: true, verificacaoStatus: true, verificadoEm: true,
        googleRating: true, googleReviewCount: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    restaurantes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

const patchSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["ATIVO", "PENDENTE", "SUSPENSO"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const { erro } = await requerAdmin();
  if (erro) return erro;

  try {
    const body = patchSchema.parse(await req.json());
    const updated = await prisma.business.update({
      where: { id: body.id },
      data: { ...(body.status ? { status: body.status } : {}) },
      select: { id: true, name: true, status: true },
    });
    return NextResponse.json({ restaurante: updated });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos", details: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

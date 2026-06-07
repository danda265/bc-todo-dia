/**
 * GET  /api/admin/verificacoes         — lista pendentes + recentes
 * POST /api/admin/verificacoes/aprovar — aprova manualmente
 * POST /api/admin/verificacoes/rejeitar — rejeita
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { erro } = await requerAdmin();
  if (erro) return erro;

  const { searchParams } = new URL(req.url);
  const filtro = searchParams.get("status") ?? "PENDENTE_ADMIN";

  const verificacoes = await prisma.business.findMany({
    where: { verificacaoStatus: filtro as any },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true, name: true, slug: true, bairro: true,
      verificacaoStatus: true, verificacaoMetodo: true,
      verificadoEm: true, googleOwnerEmail: true,
      googlePlaceId: true, googleRating: true,
      createdAt: true, updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ verificacoes });
}

const acaoSchema = z.object({
  businessId: z.string().cuid(),
  acao: z.enum(["aprovar", "rejeitar"]),
  observacao: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const { erro, user } = await requerAdmin();
  if (erro) return erro;

  try {
    const body = acaoSchema.parse(await req.json());

    const business = await prisma.business.findUnique({
      where: { id: body.businessId },
      select: { id: true, verificacaoStatus: true },
    });

    if (!business) return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });

    if (body.acao === "aprovar") {
      await prisma.business.update({
        where: { id: body.businessId },
        data: {
          verificacaoStatus: "VERIFICADO_MANUAL",
          verificacaoMetodo: "MANUAL",
          verificadoEm: new Date(),
          status: "ATIVO",
        },
      });
    } else {
      await prisma.business.update({
        where: { id: body.businessId },
        data: {
          verificacaoStatus: "REJEITADO",
          verificadoEm: null,
        },
      });
    }

    return NextResponse.json({ ok: true, acao: body.acao });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos", details: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Erro ao processar ação" }, { status: 500 });
  }
}

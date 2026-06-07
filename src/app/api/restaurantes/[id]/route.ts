// GET/PUT /api/restaurantes/[id]
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono, getSessionUser } from "@/lib/auth-helpers";
import { Bairro } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  bairro: z.nativeEnum(Bairro).optional(),
  description: z.string().min(10).max(1000).optional(),
  address: z.string().min(5).max(300).optional(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  website: z.string().max(255).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  hours: z.string().optional().nullable(),
  logoUrl: z.string().max(500).optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
});

// GET público — detalhes de um restaurante
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const restaurante = await prisma.business.findUnique({
      where: { id },
      include: {
        medias: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
        menuCategories: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              where: { available: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        menuItems: {
          where: { categoryId: null, available: true },
          orderBy: { sortOrder: "asc" },
        },
        promocoes: {
          where: {
            status: "ATIVA",
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          },
          orderBy: { endsAt: "asc" },
        },
        _count: { select: { favorites: true } },
      },
    });

    if (!restaurante) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ restaurante });
  } catch (error) {
    console.error("[RESTAURANTE GET]", error);
    return NextResponse.json({ error: "Erro ao buscar restaurante" }, { status: 500 });
  }
}

// PUT — atualizar restaurante (somente dono)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro, business } = await verificarDono(id);
  if (erro) return erro;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const atualizado = await prisma.business.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.bairro !== undefined && { bairro: data.bairro }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.lat !== undefined && { lat: data.lat }),
        ...(data.lng !== undefined && { lng: data.lng }),
        ...(data.hours !== undefined && { hours: data.hours }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
      },
    });

    return NextResponse.json({ restaurante: atualizado });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error("[RESTAURANTE PUT]", error);
    return NextResponse.json({ error: "Erro ao atualizar restaurante" }, { status: 500 });
  }
}

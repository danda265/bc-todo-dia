// POST /api/restaurantes — Cadastrar restaurante
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requerComerciante } from "@/lib/auth-helpers";
import { uniqueSlug } from "@/lib/slugify";
import { Bairro } from "@prisma/client";

const schema = z.object({
  name: z.string().min(2).max(150),
  bairro: z.nativeEnum(Bairro),
  description: z.string().min(10).max(1000),
  address: z.string().min(5).max(300),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  website: z.string().url().max(255).optional().or(z.literal("")),
  instagram: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  hours: z.string().optional(), // JSON serializado
});

export async function POST(req: NextRequest) {
  const { erro, user } = await requerComerciante();
  if (erro) return erro;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Um comerciante pode ter mais de um negócio, mas vamos verificar se já tem restaurante com mesmo nome
    const slug = await uniqueSlug(data.name, prisma);

    const restaurante = await prisma.business.create({
      data: {
        ownerId: user!.id,
        category: "RESTAURANTES",
        name: data.name,
        slug,
        bairro: data.bairro,
        description: data.description,
        address: data.address,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        website: data.website || null,
        instagram: data.instagram ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        hours: data.hours ?? null,
        status: "PENDENTE",
      },
    });

    return NextResponse.json({ restaurante }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error("[RESTAURANTES POST]", error);
    return NextResponse.json({ error: "Erro ao cadastrar restaurante" }, { status: 500 });
  }
}

// GET /api/restaurantes — Lista pública de restaurantes ativos
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bairro = searchParams.get("bairro");
  const q = searchParams.get("q"); // busca por prato/tag

  try {
    if (q && q.trim().length > 0) {
      // Busca por nome de prato ou tag no cardápio
      const termo = q.trim().toLowerCase();
      const restaurantes = await prisma.business.findMany({
        where: {
          category: "RESTAURANTES",
          status: "ATIVO",
          OR: [
            {
              menuItems: {
                some: {
                  available: true,
                  OR: [
                    { name: { contains: termo, mode: "insensitive" } },
                    { tags: { contains: termo, mode: "insensitive" } },
                    { description: { contains: termo, mode: "insensitive" } },
                  ],
                },
              },
            },
            { name: { contains: termo, mode: "insensitive" } },
            { description: { contains: termo, mode: "insensitive" } },
          ],
          ...(bairro ? { bairro: bairro as Bairro } : {}),
        },
        include: {
          medias: { where: { isCover: true }, take: 1 },
          _count: { select: { menuItems: true, promocoes: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ restaurantes, termo });
    }

    const restaurantes = await prisma.business.findMany({
      where: {
        category: "RESTAURANTES",
        status: "ATIVO",
        ...(bairro ? { bairro: bairro as Bairro } : {}),
      },
      include: {
        medias: { where: { isCover: true }, take: 1 },
        _count: { select: { menuItems: true, promocoes: true } },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    return NextResponse.json({ restaurantes });
  } catch (error) {
    console.error("[RESTAURANTES GET]", error);
    return NextResponse.json({ error: "Erro ao buscar restaurantes" }, { status: 500 });
  }
}

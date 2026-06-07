// POST /api/restaurantes/[id]/cardapio/items — Adicionar item ao cardápio
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { salvarArquivo } from "@/lib/upload";

const schema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  available: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro, business } = await verificarDono(id);
  if (erro) return erro;

  try {
    const contentType = req.headers.get("content-type") ?? "";

    let data: z.infer<typeof schema>;
    let imageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const raw = formData.get("dados") as string;
      data = schema.parse(JSON.parse(raw));

      const foto = formData.get("foto") as File | null;
      if (foto) {
        const { url, erro: erroUpload } = await salvarArquivo(foto, "foto", business!.slug);
        if (erroUpload) return NextResponse.json({ error: erroUpload }, { status: 400 });
        imageUrl = url;
      }
    } else {
      const body = await req.json();
      data = schema.parse(body);
    }

    const count = await prisma.menuItem.count({ where: { businessId: id } });
    if (count >= 200) return NextResponse.json({ error: "Máximo de 200 itens no cardápio" }, { status: 400 });

    const item = await prisma.menuItem.create({
      data: {
        businessId: id,
        categoryId: data.categoryId ?? null,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        imageUrl,
        available: data.available,
        tags: JSON.stringify(data.tags),
        sortOrder: data.sortOrder ?? count,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    console.error("[ITEM POST]", error);
    return NextResponse.json({ error: "Erro ao adicionar item" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await prisma.menuItem.findMany({
    where: { businessId: id },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ items });
}

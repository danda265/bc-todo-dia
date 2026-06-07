// GET /api/explorar — Busca geral de negócios (todas as categorias)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Bairro, BusinessCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const categoriaRaw = searchParams.get("categoria") ?? "";
  const bairroRaw = searchParams.get("bairro") ?? "";

  const categoria = Object.values(BusinessCategory).includes(categoriaRaw as BusinessCategory)
    ? (categoriaRaw as BusinessCategory)
    : null;

  const bairro = Object.values(Bairro).includes(bairroRaw as Bairro)
    ? (bairroRaw as Bairro)
    : null;

  try {
    const businesses = await prisma.business.findMany({
      where: {
        status: "ATIVO",
        ...(categoria ? { category: categoria } : {}),
        ...(bairro ? { bairro } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        medias: { where: { isCover: true }, take: 1 },
        _count: { select: { menuItems: true, promocoes: true } },
      },
      orderBy: [
        { googleRating: "desc" },
        { name: "asc" },
      ],
      take: 80,
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("[EXPLORAR GET]", error);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

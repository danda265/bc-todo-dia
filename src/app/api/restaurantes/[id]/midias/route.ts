// POST /api/restaurantes/[id]/midias — Upload de foto ou vídeo
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { salvarArquivo } from "@/lib/upload";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro, business } = await verificarDono(id);
  if (erro) return erro;

  try {
    const formData = await req.formData();
    const file = formData.get("arquivo") as File | null;
    const caption = (formData.get("caption") as string) ?? "";
    const isCover = formData.get("isCover") === "true";

    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

    const tipoMidia = file.type.startsWith("video/") ? "video" : "foto";

    const { url, erro: erroUpload } = await salvarArquivo(file, tipoMidia, business!.slug);
    if (erroUpload) return NextResponse.json({ error: erroUpload }, { status: 400 });

    // Contar quantas mídias já tem
    const count = await prisma.businessMedia.count({ where: { businessId: id } });
    if (count >= 20) return NextResponse.json({ error: "Limite de 20 mídias por restaurante" }, { status: 400 });

    // Se for capa, tirar capa das outras fotos
    if (isCover) {
      await prisma.businessMedia.updateMany({
        where: { businessId: id, type: "FOTO" },
        data: { isCover: false },
      });
      // Atualizar coverUrl no Business também
      await prisma.business.update({ where: { id }, data: { coverUrl: url } });
    }

    const media = await prisma.businessMedia.create({
      data: {
        businessId: id,
        url,
        type: tipoMidia === "foto" ? "FOTO" : "VIDEO",
        caption: caption.slice(0, 200),
        isCover,
        sortOrder: count,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error("[MIDIAS POST]", error);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}

// GET — listar mídias do restaurante
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const medias = await prisma.businessMedia.findMany({
      where: { businessId: id },
      orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ medias });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar mídias" }, { status: 500 });
  }
}

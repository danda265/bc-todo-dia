// DELETE /api/restaurantes/[id]/midias/[mediaId]
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { id, mediaId } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const media = await prisma.businessMedia.findUnique({
      where: { id: mediaId },
      select: { id: true, businessId: true, url: true },
    });

    if (!media || media.businessId !== id) {
      return NextResponse.json({ error: "Mídia não encontrada" }, { status: 404 });
    }

    // Deletar arquivo físico
    if (media.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", media.url);
      await unlink(filePath).catch(() => {}); // silencioso se não existir
    }

    await prisma.businessMedia.delete({ where: { id: mediaId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MIDIA DELETE]", error);
    return NextResponse.json({ error: "Erro ao deletar mídia" }, { status: 500 });
  }
}

// PATCH — definir como capa
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { id, mediaId } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  try {
    const media = await prisma.businessMedia.findUnique({
      where: { id: mediaId },
      select: { id: true, businessId: true, url: true, type: true },
    });
    if (!media || media.businessId !== id) {
      return NextResponse.json({ error: "Mídia não encontrada" }, { status: 404 });
    }
    if (media.type !== "FOTO") {
      return NextResponse.json({ error: "Apenas fotos podem ser capa" }, { status: 400 });
    }

    // Remove capa das outras
    await prisma.businessMedia.updateMany({
      where: { businessId: id },
      data: { isCover: false },
    });
    await prisma.businessMedia.update({ where: { id: mediaId }, data: { isCover: true } });
    await prisma.business.update({ where: { id }, data: { coverUrl: media.url } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao definir capa" }, { status: 500 });
  }
}

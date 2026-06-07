// POST /api/restaurantes/[id]/youtube — Conectar canal do YouTube
// GET  — retornar vídeos sincronizados
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { resolveChannelId, getChannelInfo, getChannelVideos } from "@/lib/youtube";

const schema = z.object({
  channelUrl: z.string().min(3).max(300), // URL ou @handle
});

// GET — vídeos já sincronizados
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const biz = await prisma.business.findUnique({
      where: { id },
      select: { youtubeChannelId: true, youtubeChannelUrl: true, youtubeVideosJson: true, youtubeDataSyncAt: true },
    });
    if (!biz) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const videos = biz.youtubeVideosJson ? JSON.parse(biz.youtubeVideosJson) : [];
    return NextResponse.json({ channelId: biz.youtubeChannelId, channelUrl: biz.youtubeChannelUrl, videos, syncAt: biz.youtubeDataSyncAt });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar vídeos" }, { status: 500 });
  }
}

// POST — conectar ou resincronizar canal
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY não configurada no .env" }, { status: 503 });
  }

  try {
    const { channelUrl } = schema.parse(await req.json());

    // Resolver para Channel ID
    const channelId = await resolveChannelId(channelUrl);
    if (!channelId) {
      return NextResponse.json({ error: "Canal não encontrado. Tente com a URL completa do YouTube." }, { status: 404 });
    }

    const [info, videos] = await Promise.all([
      getChannelInfo(channelId),
      getChannelVideos(channelId, 12),
    ]);

    await prisma.business.update({
      where: { id },
      data: {
        youtubeChannelId: channelId,
        youtubeChannelUrl: channelUrl,
        youtubeVideosJson: JSON.stringify(videos),
        youtubeDataSyncAt: new Date(),
      },
    });

    return NextResponse.json({ channelId, info, videos, total: videos.length });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    console.error("[YOUTUBE]", error);
    return NextResponse.json({ error: "Erro ao conectar com YouTube" }, { status: 500 });
  }
}

// DELETE — desconectar canal
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  await prisma.business.update({
    where: { id },
    data: { youtubeChannelId: null, youtubeChannelUrl: null, youtubeVideosJson: null, youtubeDataSyncAt: null },
  });
  return NextResponse.json({ ok: true });
}

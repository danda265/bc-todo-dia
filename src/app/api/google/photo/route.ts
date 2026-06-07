// GET /api/google/photo?ref=PHOTO_REFERENCE&w=800
// Proxy para fotos do Google Places — mantém a API key segura no servidor
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  const w = req.nextUrl.searchParams.get("w") ?? "800";
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!ref) return NextResponse.json({ error: "ref obrigatório" }, { status: 400 });
  if (!key) return NextResponse.json({ error: "API key não configurada" }, { status: 503 });

  const maxWidth = Math.min(parseInt(w), 1600); // limitar tamanho máximo

  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${key}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });

    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400", // cache 24h
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar foto" }, { status: 500 });
  }
}

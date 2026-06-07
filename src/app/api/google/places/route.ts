// GET /api/google/places?q=nome+restaurante — Busca pública de places
import { NextRequest, NextResponse } from "next/server";
import { searchGooglePlaces } from "@/lib/google-places";
import { getSessionUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Informe pelo menos 2 caracteres" }, { status: 400 });
  }

  try {
    const results = await searchGooglePlaces(q.trim());
    return NextResponse.json({ results });
  } catch (error: any) {
    if (error.message?.includes("não configurada")) {
      return NextResponse.json({ error: "Google Places API não configurada. Adicione GOOGLE_PLACES_API_KEY no .env" }, { status: 503 });
    }
    console.error("[PLACES SEARCH]", error);
    return NextResponse.json({ error: "Erro ao buscar no Google" }, { status: 500 });
  }
}

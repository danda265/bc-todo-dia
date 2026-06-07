// POST /api/restaurantes/[id]/importar-google
// Importa dados do Google Places para o restaurante (sem sobrescrever dados já customizados)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";
import { getGooglePlaceDetails, googlePhotoUrl } from "@/lib/google-places";

const schema = z.object({
  placeId: z.string().min(5).max(300),
  // Quais campos o usuário quer importar (pode escolher)
  importar: z.object({
    nome: z.boolean().default(true),
    endereco: z.boolean().default(true),
    telefone: z.boolean().default(true),
    website: z.boolean().default(true),
    horarios: z.boolean().default(true),
    localizacao: z.boolean().default(true),
    fotos: z.boolean().default(true),
  }).default({ nome: true, endereco: true, telefone: true, website: true, horarios: true, localizacao: true, fotos: true }),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro, business } = await verificarDono(id);
  if (erro) return erro;

  try {
    const body = schema.parse(await req.json());
    const place = await getGooglePlaceDetails(body.placeId);

    // Montar dados a atualizar (só sobrescreve campos que o usuário selecionou E que o Google tem)
    const updates: Record<string, any> = {
      googlePlaceId: place.placeId,
      googleRating: place.rating ?? null,
      googleReviewCount: place.reviewCount ?? null,
      googleDataSyncAt: new Date(),
    };

    if (body.importar.nome && place.name) updates.name = place.name;
    if (body.importar.endereco && place.address) updates.address = place.address;
    if (body.importar.telefone && place.phone) updates.phone = place.phone;
    if (body.importar.website && place.website) updates.website = place.website;
    if (body.importar.localizacao && place.lat) { updates.lat = place.lat; updates.lng = place.lng; }
    if (body.importar.horarios && place.hours) updates.hours = JSON.stringify(place.hours);
    if (body.importar.fotos && place.photoReferences.length > 0) {
      // Salva as referências; o frontend pode exibir via googlePhotoUrl()
      updates.googlePhotosJson = JSON.stringify(place.photoReferences);
      // Se ainda não tem capa, usar a primeira foto do Google como capa temporária
      if (!business!.status || !updates.coverUrl) {
        // Não fazemos download, apenas registramos a URL da API do Google
        const firstPhotoUrl = googlePhotoUrl(place.photoReferences[0], 1200);
        updates.coverUrl = firstPhotoUrl;
      }
    }

    const atualizado = await prisma.business.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      restaurante: atualizado,
      importado: {
        placeId: place.placeId,
        rating: place.rating,
        reviewCount: place.reviewCount,
        fotoCount: place.photoReferences.length,
        temHorarios: !!place.hours,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("não configurada")) {
      return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY não configurada" }, { status: 503 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error("[IMPORTAR GOOGLE]", error);
    return NextResponse.json({ error: "Erro ao importar dados do Google" }, { status: 500 });
  }
}

// POST para apenas atualizar rating/reviews sem reimportar tudo
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  const biz = await prisma.business.findUnique({ where: { id }, select: { googlePlaceId: true } });
  if (!biz?.googlePlaceId) return NextResponse.json({ error: "Restaurante não tem Place ID vinculado" }, { status: 400 });

  try {
    const place = await getGooglePlaceDetails(biz.googlePlaceId);
    await prisma.business.update({
      where: { id },
      data: {
        googleRating: place.rating ?? null,
        googleReviewCount: place.reviewCount ?? null,
        googleDataSyncAt: new Date(),
      },
    });
    return NextResponse.json({ rating: place.rating, reviewCount: place.reviewCount });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao sincronizar rating" }, { status: 500 });
  }
}

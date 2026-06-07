/**
 * POST /api/google/business-connect/confirmar
 * ────────────────────────────────────────────
 * Chamado quando o usuário tem MÚLTIPLOS negócios no GBP e precisa escolher qual é o dele.
 *
 * Fluxo:
 *  1. Lê cookie `gbp_pending` (assinado) com a lista de negócios candidatos
 *  2. Valida que o userId do cookie bate com a sessão
 *  3. Pega o negócio selecionado pelo índice
 *  4. Lê os tokens OAuth salvos no User
 *  5. Re-busca detalhes completos do GBP + YouTube com os tokens
 *  6. Cria/atualiza o Business no banco
 *  7. Limpa o cookie e retorna sucesso
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarNegociosGBP, detectarYouTube, criarOuAtualizarBusinessDeGBP, NegocioGBP } from "@/lib/google-auto-import";
import { getGooglePlaceDetails, googlePhotoUrl } from "@/lib/google-places";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  locationIndex: z.number().int().min(0).max(50),
});

type PendingLocation = {
  gbpName: string;
  gbpTitle: string;
  gbpAddress: string;
  gbpCategoria?: string;
  placeId?: string;
  rating?: number;
  reviewCount?: number;
};

type PendingPayload = {
  userId: string;
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  locations: PendingLocation[];
};

function parseCookie(cookieValue: string, secret: string): PendingPayload | null {
  try {
    const [b64, sig] = cookieValue.split(".");
    if (!b64 || !sig) return null;

    const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return null;
    }

    return JSON.parse(Buffer.from(b64, "base64url").toString()) as PendingPayload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // ── Verificar e ler cookie ────────────────────────────────────────────────
  const cookieValue = req.cookies.get("gbp_pending")?.value;
  if (!cookieValue) {
    return NextResponse.json({ error: "Sessão de onboarding expirada. Conecte o Google novamente." }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET ?? "dev";
  const pending = parseCookie(cookieValue, secret);

  if (!pending) {
    return NextResponse.json({ error: "Cookie inválido ou adulterado." }, { status: 400 });
  }

  if (pending.userId !== session.user.id) {
    return NextResponse.json({ error: "Sessão não corresponde ao usuário." }, { status: 403 });
  }

  // ── Validar input ─────────────────────────────────────────────────────────
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json({ error: "Índice inválido", details: e.issues }, { status: 400 });
  }

  const { locationIndex } = body;
  if (locationIndex >= pending.locations.length) {
    return NextResponse.json({ error: "Índice fora do intervalo" }, { status: 400 });
  }

  const loc = pending.locations[locationIndex];

  // ── Ler tokens OAuth do banco ─────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { googleBizAccessToken: true, googleBizExpiresAt: true },
  });

  if (!user?.googleBizAccessToken) {
    return NextResponse.json({ error: "Tokens do Google não encontrados. Reconecte o Google." }, { status: 400 });
  }

  const accessToken = user.googleBizAccessToken;

  // ── Montar NegocioGBP com detalhes completos ──────────────────────────────
  const negocio: NegocioGBP = {
    gbpName: loc.gbpName,
    gbpTitle: loc.gbpTitle,
    gbpAddress: loc.gbpAddress,
    gbpPhone: undefined,
    gbpWebsite: undefined,
    gbpCategoria: loc.gbpCategoria,
    placeId: loc.placeId,
    rating: loc.rating,
    reviewCount: loc.reviewCount,
    photoReferences: [],
  };

  // Enriquecer com Google Places se tiver placeId
  if (loc.placeId && process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const place = await getGooglePlaceDetails(loc.placeId);
      negocio.lat = place.lat;
      negocio.lng = place.lng;
      negocio.hours = place.hours;
      negocio.photoReferences = place.photoReferences;
      negocio.rating = place.rating ?? negocio.rating;
      negocio.reviewCount = place.reviewCount ?? negocio.reviewCount;
      if (!negocio.gbpPhone && place.phone) negocio.gbpPhone = place.phone;
      if (!negocio.gbpWebsite && place.website) negocio.gbpWebsite = place.website;
      if (place.photoReferences.length > 0) {
        negocio.coverUrl = googlePhotoUrl(place.photoReferences[0], 1200);
      }
    } catch {
      // Places não essencial; continua só com GBP
    }
  }

  // ── YouTube ───────────────────────────────────────────────────────────────
  const youtube = await detectarYouTube(accessToken).catch(() => null);

  // ── Criar/atualizar Business ──────────────────────────────────────────────
  try {
    await criarOuAtualizarBusinessDeGBP(session.user.id, negocio, youtube);
  } catch (err: any) {
    console.error("[CONFIRMAR] criarBusiness error:", err);
    return NextResponse.json({ error: "Erro ao salvar restaurante: " + err.message }, { status: 500 });
  }

  // ── Limpar cookie e retornar sucesso ──────────────────────────────────────
  const response = NextResponse.json({ ok: true, redirect: "/dashboard/comerciante?onboarding=sucesso" });
  response.cookies.delete("gbp_pending");
  return response;
}

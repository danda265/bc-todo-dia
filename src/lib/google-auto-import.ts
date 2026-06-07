/**
 * google-auto-import.ts
 * ─────────────────────
 * Motor do "um clique, app faz tudo".
 *
 * Dado um access_token do Google com escopos:
 *   - business.manage  (Google Business Profile)
 *   - youtube.readonly (YouTube Data API)
 *
 * Este módulo:
 *   1. Lista todos os negócios gerenciados pela conta
 *   2. Para cada negócio, busca detalhes no Google Places (rating, fotos, horários)
 *   3. Detecta canal do YouTube vinculado à mesma conta
 *   4. Retorna estrutura pronta para criar/atualizar um Business no banco
 */

import { getGooglePlaceDetails, googlePhotoUrl } from "./google-places";
import { getChannelVideos } from "./youtube";

const GBP_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GBP_ACCOUNTS = "https://mybusinessaccountmanagement.googleapis.com/v1";

export type NegocioGBP = {
  // Dados do Google Business Profile
  gbpName: string;        // ex: "accounts/123/locations/456"
  gbpTitle: string;       // nome do estabelecimento
  gbpAddress: string;
  gbpPhone?: string;
  gbpWebsite?: string;
  gbpCategoria?: string;

  // Dados do Google Places (enriquecidos)
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  lat?: number;
  lng?: number;
  hours?: Record<string, string>;
  photoReferences: string[];
  coverUrl?: string;

  // YouTube
  youtubeChannelId?: string;
  youtubeChannelUrl?: string;
  youtubeVideosJson?: string;
};

// ─── 1. Listar negócios na conta Google Business ──────────────────────────────

export async function listarNegociosGBP(accessToken: string): Promise<NegocioGBP[]> {
  // Buscar accounts
  const accRes = await fetch(`${GBP_ACCOUNTS}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!accRes.ok) {
    const err = await accRes.json().catch(() => ({}));
    throw new Error(`GBP accounts: ${accRes.status} — ${err.error?.message ?? "sem acesso"}`);
  }

  const accData = await accRes.json();
  const accounts: any[] = accData.accounts ?? [];

  const negocios: NegocioGBP[] = [];

  for (const account of accounts) {
    // Buscar locations desta account
    const locsRes = await fetch(
      `${GBP_BASE}/${account.name}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,categories,metadata`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!locsRes.ok) continue;

    const locsData = await locsRes.json();
    const locations: any[] = locsData.locations ?? [];

    for (const loc of locations) {
      const endereco = [
        loc.storefrontAddress?.addressLines?.join(", "),
        loc.storefrontAddress?.locality,
        loc.storefrontAddress?.administrativeArea,
      ].filter(Boolean).join(", ") || "";

      const negocio: NegocioGBP = {
        gbpName: loc.name,
        gbpTitle: loc.title ?? "",
        gbpAddress: endereco,
        gbpPhone: loc.phoneNumbers?.primaryPhone,
        gbpWebsite: loc.websiteUri,
        gbpCategoria: loc.categories?.primaryCategory?.displayName,
        photoReferences: [],
      };

      // Enriquecer com Google Places se tiver placeId nos metadata
      const placeId = loc.metadata?.placeId;
      if (placeId && process.env.GOOGLE_PLACES_API_KEY) {
        try {
          const place = await getGooglePlaceDetails(placeId);
          negocio.placeId = place.placeId;
          negocio.rating = place.rating;
          negocio.reviewCount = place.reviewCount;
          negocio.lat = place.lat;
          negocio.lng = place.lng;
          negocio.hours = place.hours;
          negocio.photoReferences = place.photoReferences;
          if (place.photoReferences.length > 0) {
            negocio.coverUrl = googlePhotoUrl(place.photoReferences[0], 1200);
          }
          if (!negocio.gbpPhone && place.phone) negocio.gbpPhone = place.phone;
          if (!negocio.gbpWebsite && place.website) negocio.gbpWebsite = place.website;
        } catch {
          // Places API pode falhar; usa só dados do GBP
        }
      }

      negocios.push(negocio);
    }
  }

  return negocios;
}

// ─── 2. Detectar canal do YouTube da conta ────────────────────────────────────

export async function detectarYouTube(accessToken: string): Promise<{
  channelId?: string;
  channelUrl?: string;
  videosJson?: string;
} | null> {
  // Usar o OAuth token para buscar o canal do próprio usuário
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    // Listar canais do usuário autenticado (requer youtube.readonly scope)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const channel = data.items?.[0];
    if (!channel) return null;

    const channelId = channel.id;
    const customUrl = channel.snippet?.customUrl;
    const channelUrl = customUrl
      ? `https://youtube.com/@${customUrl.replace("@", "")}`
      : `https://youtube.com/channel/${channelId}`;

    // Buscar vídeos
    const videos = await getChannelVideos(channelId, 12);

    return {
      channelId,
      channelUrl,
      videosJson: JSON.stringify(videos),
    };
  } catch {
    return null;
  }
}

// ─── 3. Montar dados para criar/atualizar Business no banco ───────────────────

import { prisma } from "./prisma";
import { uniqueSlug } from "./slugify";

export async function criarOuAtualizarBusinessDeGBP(
  userId: string,
  negocio: NegocioGBP,
  youtube: Awaited<ReturnType<typeof detectarYouTube>>
) {
  // Verificar se já existe um Business deste usuário com este placeId
  const existing = negocio.placeId
    ? await prisma.business.findFirst({ where: { ownerId: userId, googlePlaceId: negocio.placeId } })
    : await prisma.business.findFirst({ where: { ownerId: userId, category: "RESTAURANTES" } });

  const bairro = detectarBairroBC(negocio.gbpAddress);
  const slug = existing?.slug ?? await uniqueSlug(negocio.gbpTitle, prisma);

  const dados = {
    ownerId: userId,
    category: "RESTAURANTES" as const,
    name: negocio.gbpTitle,
    slug,
    bairro,
    description: negocio.gbpCategoria
      ? `${negocio.gbpCategoria} em Balneário Camboriú`
      : "Restaurante em Balneário Camboriú",
    address: negocio.gbpAddress,
    phone: negocio.gbpPhone ?? null,
    website: negocio.gbpWebsite ?? null,
    coverUrl: negocio.coverUrl ?? null,
    lat: negocio.lat ?? null,
    lng: negocio.lng ?? null,
    hours: negocio.hours ? JSON.stringify(negocio.hours) : null,
    status: "ATIVO" as const,

    // Google
    googlePlaceId: negocio.placeId ?? null,
    googleRating: negocio.rating ?? null,
    googleReviewCount: negocio.reviewCount ?? null,
    googlePhotosJson: negocio.photoReferences.length > 0
      ? JSON.stringify(negocio.photoReferences)
      : null,
    googleDataSyncAt: new Date(),

    // Verificação
    verificacaoStatus: "VERIFICADO_GOOGLE" as const,
    verificacaoMetodo: "GOOGLE_OAUTH",
    verificadoEm: new Date(),

    // YouTube
    youtubeChannelId: youtube?.channelId ?? null,
    youtubeChannelUrl: youtube?.channelUrl ?? null,
    youtubeVideosJson: youtube?.videosJson ?? null,
    youtubeDataSyncAt: youtube ? new Date() : null,
  };

  let business;
  if (existing) {
    business = await prisma.business.update({ where: { id: existing.id }, data: dados });
  } else {
    business = await prisma.business.create({ data: dados });
  }

  // Marcar onboarding como completo
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleto: true },
  });

  return business;
}

// ─── Utilidade: detectar bairro pela string do endereço ───────────────────────

function detectarBairroBC(address: string): "CENTRO" | "BARRA_SUL" | "INTERPRAIAS" | "MUNICAO" | "ARQUIPELAGO" | "CANTO_DO_MORCEGO" | "PRAIA_LARANJEIRAS" | "PRAIA_DOS_AMORES" | "PIONEIROS" | "OUTRO" {
  const a = address.toLowerCase();
  if (a.includes("barra sul") || a.includes("barra-sul")) return "BARRA_SUL";
  if (a.includes("interpraias")) return "INTERPRAIAS";
  if (a.includes("municão") || a.includes("municao")) return "MUNICAO";
  if (a.includes("arquipélago") || a.includes("arquipelago")) return "ARQUIPELAGO";
  if (a.includes("morcego")) return "CANTO_DO_MORCEGO";
  if (a.includes("laranjeiras")) return "PRAIA_LARANJEIRAS";
  if (a.includes("amores")) return "PRAIA_DOS_AMORES";
  if (a.includes("pioneiros")) return "PIONEIROS";
  if (a.includes("centro")) return "CENTRO";
  return "OUTRO";
}

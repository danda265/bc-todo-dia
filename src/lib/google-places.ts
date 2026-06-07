// Google Places API — integração com dados de restaurantes
// Documentação: https://developers.google.com/maps/documentation/places/web-service

const BASE = "https://maps.googleapis.com/maps/api";
const KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

export type GooglePlaceSummary = {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
  types?: string[];
  openNow?: boolean;
};

export type GooglePlaceDetails = GooglePlaceSummary & {
  hours?: Record<string, string>; // { seg: "09:00-18:00", ... }
  photoReferences: string[];       // photo_reference strings para buscar fotos
  googleMapsUrl: string;
  priceLevel?: number; // 0-4
};

export type GoogleVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
};

// ─── Buscar restaurante por texto ─────────────────────────────────────────────

export async function searchGooglePlaces(query: string, location = "Balneário Camboriú, SC"): Promise<GooglePlaceSummary[]> {
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY não configurada");

  const q = encodeURIComponent(`${query} ${location}`);
  const url = `${BASE}/place/textsearch/json?query=${q}&type=restaurant&language=pt-BR&key=${KEY}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API: ${data.status} — ${data.error_message ?? ""}`);
  }

  return (data.results ?? []).slice(0, 10).map((r: any) => ({
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    rating: r.rating,
    reviewCount: r.user_ratings_total,
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
    types: r.types,
    openNow: r.opening_hours?.open_now,
  }));
}

// ─── Detalhes completos de um lugar ───────────────────────────────────────────

const DIAS_PT: Record<number, string> = {
  0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab",
};

export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY não configurada");

  const fields = [
    "place_id", "name", "formatted_address", "international_phone_number",
    "website", "rating", "user_ratings_total", "geometry",
    "opening_hours", "photos", "price_level", "url",
  ].join(",");

  const url = `${BASE}/place/details/json?place_id=${placeId}&fields=${fields}&language=pt-BR&key=${KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places Details: ${data.status}`);
  }

  const r = data.result;

  // Converter horários para nosso formato JSON { seg: "09:00-22:00", ... }
  const hours: Record<string, string> = {};
  if (r.opening_hours?.periods) {
    for (const period of r.opening_hours.periods) {
      const dia = DIAS_PT[period.open?.day];
      if (dia && period.open?.time && period.close?.time) {
        const open = period.open.time.replace(/(\d{2})(\d{2})/, "$1:$2");
        const close = period.close.time.replace(/(\d{2})(\d{2})/, "$1:$2");
        hours[dia] = `${open}-${close}`;
      }
    }
  }

  const photoReferences: string[] = (r.photos ?? [])
    .slice(0, 10)
    .map((p: any) => p.photo_reference);

  return {
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    phone: r.international_phone_number,
    website: r.website,
    rating: r.rating,
    reviewCount: r.user_ratings_total,
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
    hours: Object.keys(hours).length > 0 ? hours : undefined,
    photoReferences,
    googleMapsUrl: r.url,
    priceLevel: r.price_level,
  };
}

// ─── URL de foto do Google Places ─────────────────────────────────────────────

export function googlePhotoUrl(photoReference: string, maxWidth = 800): string {
  return `${BASE}/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${KEY}`;
}

// ─── Verificar se conta Google é manager do Place ─────────────────────────────
// Usa a Google Business Profile API (My Business)
// Requer scope: https://www.googleapis.com/auth/business.manage

export async function verificarProprietarioGBP(
  accessToken: string,
  placeId: string
): Promise<{ verificado: boolean; accountName?: string; email?: string }> {
  // 1. Buscar accounts gerenciadas pelo token
  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!accountsRes.ok) return { verificado: false };
  const accountsData = await accountsRes.json();
  const accounts: any[] = accountsData.accounts ?? [];

  for (const account of accounts) {
    // 2. Para cada account, buscar os locations (estabelecimentos)
    const locsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,storeCode,title`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!locsRes.ok) continue;
    const locsData = await locsRes.json();
    const locs: any[] = locsData.locations ?? [];

    for (const loc of locs) {
      // Comparar pelo Place ID (store code ou attributes do location)
      if (loc.name?.includes(placeId) || loc.storeCode === placeId) {
        return { verificado: true, accountName: account.accountName };
      }
    }
  }

  // Fallback: se tem ao menos uma location gerenciada, consideramos válido para manual review
  return { verificado: accounts.length > 0, accountName: accounts[0]?.accountName };
}

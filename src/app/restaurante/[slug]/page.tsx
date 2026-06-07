import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BAIRRO_LABELS } from "@/lib/constants";
import RestauranteClient from "./RestauranteClient";
import { VerificacaoBadgePublico } from "@/components/integracao/VerificacaoBadge";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurante = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, description: true, coverUrl: true },
  });
  if (!restaurante) return { title: "Restaurante não encontrado" };
  return {
    title: restaurante.name,
    description: restaurante.description.slice(0, 160),
    openGraph: { images: restaurante.coverUrl ? [restaurante.coverUrl] : [] },
  };
}

export default async function RestaurantePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agora = new Date();

  const restaurante = await prisma.business.findUnique({
    where: { slug },
    include: {
      medias: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      menuCategories: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { available: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      menuItems: {
        where: { categoryId: null, available: true },
        orderBy: { sortOrder: "asc" },
      },
      promocoes: {
        where: {
          status: "ATIVA",
          startsAt: { lte: agora },
          endsAt: { gte: agora },
        },
        orderBy: { endsAt: "asc" },
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!restaurante || restaurante.status !== "ATIVO") notFound();

  const fotos = restaurante.medias.filter((m) => m.type === "FOTO");
  const videosLocais = restaurante.medias.filter((m) => m.type === "VIDEO");
  const capa = restaurante.coverUrl ?? fotos[0]?.url;
  const hours = restaurante.hours ? JSON.parse(restaurante.hours) : null;
  const youtubeVideos = restaurante.youtubeVideosJson ? JSON.parse(restaurante.youtubeVideosJson) : [];
  const googlePhotos: string[] = restaurante.googlePhotosJson ? JSON.parse(restaurante.googlePhotosJson) : [];

  const DIAS: Record<string, string> = {
    seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Capa */}
      <div className="h-64 md:h-80 bg-gradient-to-br from-[#023E58] to-[#0077B6] relative overflow-hidden">
        {capa && <img src={capa} alt={restaurante.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Link href="/restaurantes" className="text-white/70 text-sm hover:text-white mb-2 inline-block">
            ← Restaurantes
          </Link>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">{restaurante.name}</h1>
              <div className="text-white/80 text-sm mt-1">
                📍 {BAIRRO_LABELS[restaurante.bairro] ?? restaurante.bairro}
                {restaurante.address && <> · {restaurante.address}</>}
              </div>
            </div>
            {/* Google Rating na capa */}
            {restaurante.googleRating && (
              <div className="flex-shrink-0 bg-white/15 backdrop-blur rounded-xl px-3 py-2 text-right">
                <div className="text-amber-400 font-bold text-lg leading-none">⭐ {restaurante.googleRating.toFixed(1)}</div>
                <div className="text-white/70 text-xs mt-0.5">{restaurante.googleReviewCount?.toLocaleString()} no Google</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Badges de verificação + Google Reviews */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <VerificacaoBadgePublico status={restaurante.verificacaoStatus} />
          {restaurante.googlePlaceId && restaurante.googleRating && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${restaurante.googlePlaceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm hover:border-[#0077B6] transition-colors"
            >
              <span className="text-amber-500 font-bold">⭐ {restaurante.googleRating.toFixed(1)}</span>
              <span className="text-gray-500 text-xs">({restaurante.googleReviewCount?.toLocaleString()} avaliações)</span>
              <span className="text-[#0077B6] text-xs font-medium">Ver no Google →</span>
            </a>
          )}
          {restaurante.youtubeChannelId && (
            <a href={`https://youtube.com/channel/${restaurante.youtubeChannelId}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-red-100 transition-colors">
              ▶ Canal no YouTube
            </a>
          )}
          {restaurante.instagram && (
            <a href={`https://instagram.com/${restaurante.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-pink-100 transition-colors">
              📷 @{restaurante.instagram.replace("@", "")}
            </a>
          )}
        </div>
        {/* Promoções ativas */}
        {restaurante.promocoes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#023E58] mb-3">🏷️ Promoções ativas agora</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-700">
              ⚠️ Preços e condições são de inteira responsabilidade do restaurante. Confirme diretamente com o estabelecimento.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {restaurante.promocoes.map((p) => {
                const diff = new Date(p.endsAt).getTime() - agora.getTime();
                const horas = Math.floor(diff / 3600000);
                const urgente = horas < 3;
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-[#F4A261]/40 p-4">
                    <div className="flex items-start gap-3">
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {p.discount && <span className="bg-[#F4A261] text-white text-xs font-bold px-2 py-0.5 rounded-full">{p.discount}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${urgente ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                            ⏱ {horas < 24 ? `${horas}h` : `${Math.floor(horas / 24)}d`} restantes
                          </span>
                        </div>
                        <h3 className="font-semibold text-[#023E58] text-sm">{p.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <RestauranteClient
          restaurante={restaurante}
          fotos={fotos}
          videosLocais={videosLocais}
          youtubeVideos={youtubeVideos}
          googlePhotos={googlePhotos}
          hours={hours}
          DIAS={DIAS}
        />
      </div>
    </div>
  );
}

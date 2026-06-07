"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BotaoNavegacao from "@/components/ui/BotaoNavegacao";
import { useRouter } from "next/navigation";

const BAIRRO_LABELS: Record<string, string> = {
  CENTRO: "Centro", BARRA_SUL: "Barra Sul", INTERPRAIAS: "Interpraias",
  MUNICAO: "Municão", ARQUIPELAGO: "Arquipélago", CANTO_DO_MORCEGO: "Canto do Morcego",
  PRAIA_LARANJEIRAS: "Praia das Laranjeiras", PRAIA_DOS_AMORES: "Praia dos Amores",
  PIONEIROS: "Pioneiros", OUTRO: "Outro",
};

const CAT_ICONS: Record<string, string> = {
  RESTAURANTES: "🍽️", BARES_BALADAS: "🎵", LOJAS_MODA: "🛍️",
  BELEZA_ESTETICA: "💅", HOSPEDAGEM: "🏨", ESPORTES_AVENTURA: "🏄",
  CULTURA_ARTE: "🎨", SERVICOS_LOCAIS: "🔧",
};

type Negocio = {
  id: string;
  name: string;
  slug: string;
  category: string;
  bairro: string;
  description: string;
  address: string | null;
  coverUrl: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  medias: { url: string }[];
  _count: { menuItems: number; promocoes: number };
};

export default function FavoritosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/entrar?redirect=/favoritos");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/favoritos")
        .then((r) => r.json())
        .then((d) => { setFavoritos(d.favoritos ?? []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function remover(id: string) {
    setRemovendo(id);
    await fetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    setFavoritos((prev) => prev.filter((f) => f.id !== id));
    setRemovendo(null);
  }

  const capa = (n: Negocio) => n.coverUrl ?? n.medias?.[0]?.url ?? null;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#023E58] to-[#0077B6] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="text-white/70 text-sm hover:text-white mb-4 inline-block">
            ← BC Todo Dia
          </Link>
          <h1 className="text-3xl font-bold mb-2">❤️ Meus favoritos</h1>
          <p className="text-white/80">
            {session?.user?.name?.split(" ")[0]}
            {favoritos.length > 0
              ? `, você salvou ${favoritos.length} lugar${favoritos.length !== 1 ? "es" : ""}`
              : ", comece salvando seus lugares favoritos"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {favoritos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💔</div>
            <p className="text-gray-500 font-medium">Nenhum favorito ainda</p>
            <p className="text-gray-400 text-sm mt-1">
              Clique no ❤️ em qualquer negócio para salvar aqui
            </p>
            <Link
              href="/explorar"
              className="mt-6 inline-block bg-[#0077B6] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#005f92] transition-colors"
            >
              Explorar negócios →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favoritos.map((n) => (
              <div
                key={n.id}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-hidden group relative"
              >
                {/* Botão remover favorito */}
                <button
                  onClick={() => remover(n.id)}
                  disabled={removendo === n.id}
                  className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-red-50 text-red-400 hover:text-red-600 w-9 h-9 rounded-full flex items-center justify-center shadow transition-colors disabled:opacity-50"
                  title="Remover dos favoritos"
                >
                  {removendo === n.id ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <HeartFilledIcon />
                  )}
                </button>

                <Link href={`/restaurante/${n.slug}`} className="block">
                  {/* Foto */}
                  <div className="h-40 bg-gradient-to-br from-[#0077B6] to-[#023E58] relative overflow-hidden">
                    {capa(n) ? (
                      <img
                        src={capa(n)!}
                        alt={n.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {CAT_ICONS[n.category] ?? "🏪"}
                      </div>
                    )}
                    {n._count.promocoes > 0 && (
                      <div className="absolute top-3 left-3 bg-[#F4A261] text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        🏷️ Promoção
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-[#0077B6] mb-1 font-medium">
                      {CAT_ICONS[n.category]} {BAIRRO_LABELS[n.bairro] ?? n.bairro}
                    </div>
                    <h3 className="font-bold text-[#023E58] group-hover:text-[#0077B6] transition-colors text-lg">
                      {n.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.description}</p>

                    {n.address && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
                        <span>📍</span>
                        <span className="truncate">{n.address}</span>
                      </p>
                    )}
                    {n.googleRating && (
                      <p className="text-xs text-amber-500 font-semibold mt-1">
                        ⭐ {n.googleRating.toFixed(1)}
                        <span className="text-gray-400 font-normal">
                          {" "}({n.googleReviewCount?.toLocaleString("pt-BR")} avaliações)
                        </span>
                      </p>
                    )}
                  </div>
                </Link>

                {/* Ações fora do Link */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  {(n.lat || n.address) && (
                    <BotaoNavegacao
                      lat={n.lat}
                      lng={n.lng}
                      endereco={n.address}
                      nome={n.name}
                      variante="link"
                    />
                  )}
                  {n.whatsapp && (
                    <a
                      href={`https://wa.me/55${n.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 transition-colors font-medium"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/explorar" className="text-[#0077B6] text-sm font-medium hover:underline">
            Explorar mais negócios →
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeartFilledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

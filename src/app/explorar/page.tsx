"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BotaoNavegacao from "@/components/ui/BotaoNavegacao";

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: "", label: "Todos", icon: "🔍" },
  { value: "RESTAURANTES", label: "Restaurantes", icon: "🍽️" },
  { value: "BARES_BALADAS", label: "Bares & Baladas", icon: "🎵" },
  { value: "LOJAS_MODA", label: "Lojas & Moda", icon: "🛍️" },
  { value: "BELEZA_ESTETICA", label: "Beleza & Estética", icon: "💅" },
  { value: "HOSPEDAGEM", label: "Hospedagem", icon: "🏨" },
  { value: "ESPORTES_AVENTURA", label: "Esportes & Aventura", icon: "🏄" },
  { value: "CULTURA_ARTE", label: "Cultura & Arte", icon: "🎨" },
  { value: "SERVICOS_LOCAIS", label: "Serviços Locais", icon: "🔧" },
];

const BAIRROS = [
  { value: "", label: "Todos os bairros" },
  { value: "CENTRO", label: "Centro" },
  { value: "BARRA_SUL", label: "Barra Sul" },
  { value: "INTERPRAIAS", label: "Interpraias" },
  { value: "MUNICAO", label: "Municão" },
  { value: "ARQUIPELAGO", label: "Arquipélago" },
  { value: "PRAIA_LARANJEIRAS", label: "Praia das Laranjeiras" },
  { value: "PRAIA_DOS_AMORES", label: "Praia dos Amores" },
  { value: "PIONEIROS", label: "Pioneiros" },
];

const BAIRRO_LABELS: Record<string, string> = {
  CENTRO: "Centro", BARRA_SUL: "Barra Sul", INTERPRAIAS: "Interpraias",
  MUNICAO: "Municão", ARQUIPELAGO: "Arquipélago", CANTO_DO_MORCEGO: "Canto do Morcego",
  PRAIA_LARANJEIRAS: "Praia das Laranjeiras", PRAIA_DOS_AMORES: "Praia dos Amores",
  PIONEIROS: "Pioneiros", OUTRO: "Outro",
};

const CAT_LABELS: Record<string, string> = {
  RESTAURANTES: "Restaurantes", BARES_BALADAS: "Bares & Baladas",
  LOJAS_MODA: "Lojas & Moda", BELEZA_ESTETICA: "Beleza & Estética",
  HOSPEDAGEM: "Hospedagem", ESPORTES_AVENTURA: "Esportes & Aventura",
  CULTURA_ARTE: "Cultura & Arte", SERVICOS_LOCAIS: "Serviços Locais",
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
  phone: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  verificacaoStatus: string;
  medias: { url: string }[];
  _count: { menuItems: number; promocoes: number };
};

// ─── Inner component (usa useSearchParams) ────────────────────────────────────

function ExplorarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const catParam = searchParams.get("categoria") ?? "";
  const bairroParam = searchParams.get("bairro") ?? "";
  const qParam = searchParams.get("q") ?? "";

  const [busca, setBusca] = useState(qParam);
  const [bairro, setBairro] = useState(bairroParam);
  const [categoria, setCategoria] = useState(catParam);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);

  const buscar = useCallback(async (q: string, cat: string, b: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("categoria", cat);
    if (b) params.set("bairro", b);
    const res = await fetch(`/api/explorar?${params}`);
    const d = await res.json();
    setNegocios(d.businesses ?? []);
    setLoading(false);
  }, []);

  // Atualizar URL ao mudar filtros
  function atualizarUrl(novaCategoria: string, novoBairro: string, novaQ: string) {
    const params = new URLSearchParams();
    if (novaCategoria) params.set("categoria", novaCategoria);
    if (novoBairro) params.set("bairro", novoBairro);
    if (novaQ.trim()) params.set("q", novaQ.trim());
    router.replace(`/explorar${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    buscar(catParam, catParam, bairroParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function mudarCategoria(cat: string) {
    setCategoria(cat);
    setBusca("");
    atualizarUrl(cat, bairro, "");
    buscar("", cat, bairro);
  }

  function mudarBairro(b: string) {
    setBairro(b);
    atualizarUrl(categoria, b, busca);
    buscar(busca, categoria, b);
  }

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    atualizarUrl(categoria, bairro, busca);
    buscar(busca, categoria, bairro);
  }

  const catAtual = CATEGORIAS.find((c) => c.value === categoria);
  const capa = (n: Negocio) => n.coverUrl ?? n.medias?.[0]?.url ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#023E58] via-[#0077B6] to-[#339fdf] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link href="/" className="text-white/70 text-sm hover:text-white mb-4 inline-block">
            ← BC Todo Dia
          </Link>

          <h1 className="text-3xl font-bold mb-2">
            {catAtual && catAtual.value ? (
              <>{catAtual.icon} {catAtual.label} em BC</>
            ) : (
              <>🔍 Explorar Balneário Camboriú</>
            )}
          </h1>
          <p className="text-white/80 mb-6">
            {catAtual?.value
              ? `Descubra os melhores ${catAtual.label.toLowerCase()} da cidade`
              : "Descubra os melhores negócios locais da cidade"}
          </p>

          {/* Barra de busca */}
          <form onSubmit={handleBusca} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Nome do negócio, serviço..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
              />
            </div>
            <select
              value={bairro}
              onChange={(e) => mudarBairro(e.target.value)}
              className="bg-white text-gray-800 px-4 py-3 rounded-xl text-sm focus:outline-none"
            >
              {BAIRROS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[#F4A261] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#c3824e] transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
          </form>

          {/* Pills de categoria */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                onClick={() => mudarCategoria(c.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  categoria === c.value
                    ? "bg-white text-[#023E58] shadow"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Resultados ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Atalho: ir para promoções */}
        <Link
          href="/promocoes"
          className="flex items-center gap-3 bg-[#F4A261]/10 border border-[#F4A261]/30 rounded-2xl px-5 py-4 mb-8 hover:bg-[#F4A261]/15 transition-colors group"
        >
          <span className="text-2xl">🏷️</span>
          <div className="flex-1">
            <div className="font-semibold text-[#023E58] group-hover:text-[#c3824e] transition-colors">
              Promoções de hoje
            </div>
            <div className="text-sm text-gray-500">Veja todas as ofertas ativas agora em BC</div>
          </div>
          <span className="text-[#F4A261] font-bold">→</span>
        </Link>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Buscando negócios...</div>
        ) : negocios.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">
              {categoria && categoria !== "RESTAURANTES"
                ? `Nenhum negócio de ${CAT_LABELS[categoria] ?? categoria} cadastrado ainda`
                : "Nenhum resultado encontrado"}
            </p>
            {categoria && categoria !== "RESTAURANTES" && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5 max-w-sm mx-auto text-sm text-[#0077B6]">
                🚀 Esta categoria está chegando em breve!
                <div className="mt-2">
                  <Link href="/cadastro?perfil=comerciante" className="font-semibold underline">
                    Cadastre seu negócio agora →
                  </Link>
                </div>
              </div>
            )}
            {(!categoria || categoria === "RESTAURANTES") && (
              <button
                onClick={() => { setBusca(""); setCategoria(""); setBairro(""); buscar("", "", ""); }}
                className="mt-4 text-[#0077B6] text-sm hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <strong className="text-[#023E58]">{negocios.length}</strong> resultado{negocios.length !== 1 ? "s" : ""}
                {categoria && <span className="text-[#0077B6]"> em {CAT_LABELS[categoria] ?? categoria}</span>}
                {bairro && <span className="text-gray-400"> · {BAIRRO_LABELS[bairro]}</span>}
              </p>
              {(categoria || bairro || busca) && (
                <button
                  onClick={() => { setBusca(""); setCategoria(""); setBairro(""); router.replace("/explorar"); buscar("", "", ""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {negocios.map((n) => (
                <Link
                  key={n.id}
                  href={`/restaurante/${n.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-[#0077B6] transition-all overflow-hidden group"
                >
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

                    {/* Badge categoria */}
                    <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {CAT_ICONS[n.category]} {CAT_LABELS[n.category]}
                    </div>

                    {/* Badge promoção */}
                    {n._count.promocoes > 0 && (
                      <div className="absolute top-3 right-3 bg-[#F4A261] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        🏷️ Promoção
                      </div>
                    )}

                    {/* Badge verificado */}
                    {(n.verificacaoStatus === "VERIFICADO_GOOGLE" || n.verificacaoStatus === "VERIFICADO_MANUAL") && (
                      <div className="absolute bottom-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        ✓ Verificado
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-[#0077B6] mb-1 font-medium">
                      {BAIRRO_LABELS[n.bairro] ?? n.bairro}
                    </div>
                    <h3 className="font-bold text-[#023E58] group-hover:text-[#0077B6] transition-colors">
                      {n.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.description}</p>

                    {/* Endereço */}
                    {n.address && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
                        <span>📍</span>
                        <span className="truncate">{n.address}</span>
                      </p>
                    )}

                    {/* Rating */}
                    {n.googleRating && (
                      <p className="text-xs text-amber-500 font-semibold mt-1">
                        ⭐ {n.googleRating.toFixed(1)}
                        <span className="text-gray-400 font-normal">
                          {" "}({n.googleReviewCount?.toLocaleString("pt-BR")} avaliações)
                        </span>
                      </p>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {n._count.menuItems > 0 && (
                        <span className="text-xs text-gray-400">🍽️ {n._count.menuItems} itens</span>
                      )}

                      {(n.lat || n.address) && (
                        <div onClick={(e) => e.preventDefault()} className="ml-auto flex gap-2">
                          <div onClick={(e) => e.stopPropagation()}>
                            <BotaoNavegacao
                              lat={n.lat}
                              lng={n.lng}
                              endereco={n.address}
                              nome={n.name}
                              variante="link"
                            />
                          </div>
                          {n.whatsapp && (
                            <a
                              href={`https://wa.me/55${n.whatsapp.replace(/\D/g, "")}`}
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 transition-colors font-medium"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                      {!n.lat && !n.address && n.whatsapp && (
                        <a
                          href={`https://wa.me/55${n.whatsapp.replace(/\D/g, "")}`}
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 transition-colors font-medium"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Exportação com Suspense ──────────────────────────────────────────────────

export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Carregando...
        </div>
      }
    >
      <ExplorarContent />
    </Suspense>
  );
}

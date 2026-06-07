"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BotaoNavegacao from "@/components/ui/BotaoNavegacao";
import { estaAberto } from "@/lib/horarios";

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

type Restaurante = {
  id: string;
  name: string;
  slug: string;
  bairro: string;
  description: string;
  address: string | null;
  coverUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  lat: number | null;
  lng: number | null;
  hours: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  medias: { url: string; isCover: boolean }[];
  _count: { menuItems: number; promocoes: number };
};

const BAIRRO_LABELS: Record<string, string> = {
  CENTRO: "Centro", BARRA_SUL: "Barra Sul", INTERPRAIAS: "Interpraias",
  MUNICAO: "Municão", ARQUIPELAGO: "Arquipélago", CANTO_DO_MORCEGO: "Canto do Morcego",
  PRAIA_LARANJEIRAS: "Praia das Laranjeiras", PRAIA_DOS_AMORES: "Praia dos Amores",
  PIONEIROS: "Pioneiros", OUTRO: "Outro",
};

const SUGESTOES = ["camarão", "pizza", "burger", "sushi", "churrasco", "salada", "frutos do mar", "pastel", "açaí", "sorvete"];

export default function RestaurantesPage() {
  const [busca, setBusca] = useState("");
  const [bairro, setBairro] = useState("");
  const [somenteAbertos, setSomenteAbertos] = useState(false);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(false);
  const [termoBuscado, setTermoBuscado] = useState("");

  const buscar = useCallback(async (q: string, b: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (b) params.set("bairro", b);
    const r = await fetch(`/api/restaurantes?${params}`);
    const d = await r.json();
    setRestaurantes(d.restaurantes ?? []);
    setTermoBuscado(d.termo ?? "");
    setLoading(false);
  }, []);

  // Busca inicial
  useEffect(() => { buscar("", ""); }, [buscar]);

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    buscar(busca, bairro);
  };

  const capa = (r: Restaurante) => r.coverUrl ?? r.medias?.[0]?.url ?? null;

  // Filtragem client-side por "Aberto agora"
  const lista = somenteAbertos
    ? restaurantes.filter(r => estaAberto(r.hours) === true)
    : restaurantes;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero de busca */}
      <div className="bg-gradient-to-br from-[#023E58] via-[#0077B6] to-[#339fdf] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="text-white/70 text-sm hover:text-white mb-4 inline-block">← BC Todo Dia</Link>
          <h1 className="text-3xl font-bold mb-2">🍽️ Restaurantes em BC</h1>
          <p className="text-white/80 mb-6">Busque pelo prato que você quer comer</p>

          <form onSubmit={handleBusca} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="camarão, pizza, burguer, sushi..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#F4A261]"
              />
            </div>
            <select
              value={bairro}
              onChange={e => { setBairro(e.target.value); buscar(busca, e.target.value); }}
              className="bg-white text-gray-800 px-4 py-3 rounded-xl text-sm focus:outline-none"
            >
              {BAIRROS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <button type="submit" className="bg-[#F4A261] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#c3824e] transition-colors whitespace-nowrap">
              Buscar
            </button>
          </form>

          {/* Sugestões rápidas + filtro Aberto Agora */}
          <div className="flex gap-2 mt-4 flex-wrap items-center">
            {/* Filtro "Aberto agora" */}
            <button
              onClick={() => setSomenteAbertos(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                somenteAbertos
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white/20 text-white border-white/30 hover:bg-white/30"
              }`}
            >
              <span>🟢</span> Aberto agora
            </button>
            <div className="w-px h-4 bg-white/30 mx-1" />
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => { setBusca(s); buscar(s, bairro); }}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Atalho promoções */}
        <Link href="/promocoes"
          className="flex items-center gap-3 bg-[#F4A261]/10 border border-[#F4A261]/30 rounded-2xl px-5 py-4 mb-8 hover:bg-[#F4A261]/15 transition-colors group">
          <span className="text-2xl">🏷️</span>
          <div className="flex-1">
            <div className="font-semibold text-[#023E58] group-hover:text-[#c3824e] transition-colors">Promoções de hoje</div>
            <div className="text-sm text-gray-500">Veja todas as ofertas ativas agora em BC</div>
          </div>
          <span className="text-[#F4A261] font-bold">→</span>
        </Link>

        {/* Resultado */}
        {termoBuscado && (
          <div className="mb-4 text-sm text-gray-600">
            Mostrando restaurantes com <strong>"{termoBuscado}"</strong> no cardápio
            <button onClick={() => { setBusca(""); buscar("", bairro); }} className="ml-2 text-[#0077B6] hover:underline">limpar</button>
          </div>
        )}

        {/* Filtro "Aberto agora" ativo */}
        {somenteAbertos && !loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Mostrando apenas restaurantes abertos agora
            <button onClick={() => setSomenteAbertos(false)} className="ml-1 text-gray-400 hover:text-gray-600 text-xs underline">remover</button>
          </div>
        )}

        {/* Grid de cards */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Buscando...</div>
        ) : lista.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">Nenhum restaurante encontrado</p>
            <p className="text-gray-400 text-sm mt-1">
              {somenteAbertos
                ? "Nenhum restaurante está aberto agora. Remova o filtro."
                : "Tente outro prato ou remova o filtro de bairro"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map((r) => (
              <Link key={r.id} href={`/restaurante/${r.slug}`}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-[#0077B6] transition-all overflow-hidden group">
                {/* Foto capa */}
                <div className="h-44 bg-gradient-to-br from-[#0077B6] to-[#023E58] relative overflow-hidden">
                  {capa(r) ? (
                    <img src={capa(r)!} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                  )}
                  {r._count.promocoes > 0 && (
                    <div className="absolute top-3 left-3 bg-[#F4A261] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                      🏷️ Promoção
                    </div>
                  )}
                  {/* Badge "Aberto agora" */}
                  {estaAberto(r.hours) === true && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                      Aberto
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="text-xs text-[#0077B6] mb-1 font-medium">{BAIRRO_LABELS[r.bairro] ?? r.bairro}</div>
                  <h3 className="font-bold text-[#023E58] group-hover:text-[#0077B6] transition-colors text-lg">{r.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.description}</p>

                  {/* Endereço compacto */}
                  {r.address && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
                      <span>📍</span>
                      <span className="truncate">{r.address}</span>
                    </p>
                  )}

                  {/* Rating Google */}
                  {r.googleRating && (
                    <p className="text-xs text-amber-500 font-semibold mt-1">
                      ⭐ {r.googleRating.toFixed(1)}
                      <span className="text-gray-400 font-normal"> ({r.googleReviewCount?.toLocaleString("pt-BR")} avaliações)</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {r._count.menuItems > 0 && (
                      <span className="text-xs text-gray-400">🍽️ {r._count.menuItems} itens</span>
                    )}

                    {/* Botão GPS — abre opções de navegação */}
                    {(r.lat || r.address) && (
                      <div onClick={e => e.preventDefault()} className="ml-auto flex gap-2">
                        <div onClick={e => e.stopPropagation()}>
                          <BotaoNavegacao
                            lat={r.lat}
                            lng={r.lng}
                            endereco={r.address}
                            nome={r.name}
                            variante="link"
                          />
                        </div>
                        {r.whatsapp && (
                          <a
                            href={`https://wa.me/55${r.whatsapp.replace(/\D/g, "")}`}
                            onClick={e => e.stopPropagation()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 transition-colors font-medium"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                    {!r.lat && !r.address && r.whatsapp && (
                      <a
                        href={`https://wa.me/55${r.whatsapp.replace(/\D/g, "")}`}
                        onClick={e => e.stopPropagation()}
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
        )}
      </div>
    </div>
  );
}

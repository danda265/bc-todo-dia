"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import BotaoNavegacao from "@/components/ui/BotaoNavegacao";
import ReviewSection from "@/components/ui/ReviewSection";

type Media = { id: string; url: string; type: string; caption: string | null };
type MenuItem = { id: string; name: string; description: string | null; price: number; imageUrl: string | null; tags: string | null };
type MenuCategory = { id: string; name: string; items: MenuItem[] };

type YoutubeVideo = { id: string; title: string; thumbnail: string; url: string; publishedAt: string };

type Props = {
  restaurante: any;
  fotos: Media[];
  videosLocais: Media[];
  youtubeVideos: YoutubeVideo[];
  googlePhotos: string[];  // photo_reference strings
  hours: Record<string, string> | null;
  DIAS: Record<string, string>;
};

const TABS = ["cardapio", "fotos", "videos", "info", "avaliacoes"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  cardapio: "🍽️ Cardápio",
  fotos: "📸 Fotos",
  videos: "🎬 Vídeos",
  info: "ℹ️ Informações",
  avaliacoes: "⭐ Avaliações",
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RestauranteClient({ restaurante, fotos, videosLocais, youtubeVideos, googlePhotos, hours, DIAS }: Props) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("cardapio");
  const [buscaCardapio, setBuscaCardapio] = useState("");
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);

  // ── Favorito ────────────────────────────────────────────────────────
  const [favoritado, setFavoritado] = useState<boolean | null>(null);
  const [favoritando, setFavoritando] = useState(false);

  // ── Compartilhar ─────────────────────────────────────────────────────
  const [copiado, setCopiado] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: restaurante.name,
          text: restaurante.description?.slice(0, 120) ?? restaurante.name,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      // usuário cancelou o share — ignorar silenciosamente
    }
  }
  // ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/favoritos/${restaurante.id}`)
      .then((r) => r.json())
      .then((d) => setFavoritado(d.favoritado ?? false))
      .catch(() => setFavoritado(false));
  }, [restaurante.id]);

  async function toggleFavorito() {
    if (!session) {
      window.location.href = `/entrar?redirect=/restaurante/${restaurante.slug}`;
      return;
    }
    setFavoritando(true);
    const r = await fetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: restaurante.id }),
    });
    const d = await r.json();
    if (r.ok) setFavoritado(d.favoritado);
    setFavoritando(false);
  }
  // ────────────────────────────────────────────────────────────────────

  const allItems: MenuItem[] = [
    ...restaurante.menuItems,
    ...restaurante.menuCategories.flatMap((c: MenuCategory) => c.items),
  ];

  const itemsFiltrados = buscaCardapio.trim()
    ? allItems.filter((it) =>
        it.name.toLowerCase().includes(buscaCardapio.toLowerCase()) ||
        it.tags?.toLowerCase().includes(buscaCardapio.toLowerCase()) ||
        it.description?.toLowerCase().includes(buscaCardapio.toLowerCase())
      )
    : null;

  return (
    <>
      {/* Contatos rápidos */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        {/* Botão favoritar */}
        <button
          onClick={toggleFavorito}
          disabled={favoritando || favoritado === null}
          title={favoritado ? "Remover dos favoritos" : "Salvar nos favoritos"}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${
            favoritado
              ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
              : "bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-400"
          }`}
        >
          {favoritado ? <HeartFilledIcon /> : <HeartIcon />}
          {favoritado ? "Salvo" : "Salvar"}
        </button>

        {/* Botão compartilhar */}
        <button
          onClick={handleShare}
          title="Compartilhar este restaurante"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:border-[#0077B6] hover:text-[#0077B6] transition-all"
        >
          {copiado ? (
            <><CheckIcon /> Link copiado!</>
          ) : (
            <><ShareIcon /> Compartilhar</>
          )}
        </button>

        {restaurante.whatsapp && (
          <a href={`https://wa.me/55${restaurante.whatsapp.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            💬 WhatsApp
          </a>
        )}
        {restaurante.phone && (
          <a href={`tel:${restaurante.phone}`}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:border-[#0077B6] transition-colors">
            📞 {restaurante.phone}
          </a>
        )}
        {/* Navegação GPS — sempre visível se tiver endereço */}
        {(restaurante.lat || restaurante.address) && (
          <BotaoNavegacao
            lat={restaurante.lat}
            lng={restaurante.lng}
            endereco={restaurante.address}
            nome={restaurante.name}
          />
        )}
        {restaurante.instagram && (
          <a href={`https://instagram.com/${restaurante.instagram.replace("@", "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:border-[#0077B6] transition-colors">
            📷 @{restaurante.instagram.replace("@", "")}
          </a>
        )}
        {restaurante.website && (
          <a href={restaurante.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:border-[#0077B6] transition-colors">
            🌐 Site
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 border border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? "bg-[#0077B6] text-white" : "text-gray-500 hover:text-[#0077B6]"
            }`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Cardápio ─────────────────────────────────────────────── */}
      {tab === "cardapio" && (
        <div>
          {allItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Cardápio não disponível no momento</div>
          ) : (
            <>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar no cardápio..."
                  value={buscaCardapio}
                  onChange={e => setBuscaCardapio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#0077B6]"
                />
              </div>

              {itemsFiltrados ? (
                <div className="space-y-3">
                  {itemsFiltrados.length === 0 && <p className="text-gray-400 text-sm text-center py-6">Nenhum item encontrado</p>}
                  {itemsFiltrados.map(item => <CardapioItem key={item.id} item={item} />)}
                </div>
              ) : (
                <>
                  {/* Itens sem categoria */}
                  {restaurante.menuItems.length > 0 && (
                    <div className="mb-6">
                      <div className="space-y-3">
                        {restaurante.menuItems.map((item: MenuItem) => <CardapioItem key={item.id} item={item} />)}
                      </div>
                    </div>
                  )}
                  {/* Por categoria */}
                  {restaurante.menuCategories.map((cat: MenuCategory) => (
                    <div key={cat.id} className="mb-8">
                      <h3 className="text-base font-bold text-[#023E58] mb-3 pb-2 border-b border-gray-100">{cat.name}</h3>
                      <div className="space-y-3">
                        {cat.items.map(item => <CardapioItem key={item.id} item={item} />)}
                        {cat.items.length === 0 && <p className="text-gray-400 text-sm">Sem itens nesta categoria</p>}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Fotos ─────────────────────────────────────────────────── */}
      {tab === "fotos" && (
        <div>
          {fotos.length === 0 && googlePhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhuma foto disponível</div>
          ) : (
            <>
              {/* Fotos do próprio restaurante */}
              {fotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {fotos.map((f) => (
                    <button key={f.id} onClick={() => setFotoAberta(f.url)}
                      className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                      <img src={f.url} alt={f.caption ?? ""} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Fotos do Google */}
              {googlePhotos.length > 0 && (
                <>
                  {fotos.length > 0 && <div className="text-xs text-gray-400 mb-2 flex items-center gap-2"><span>📸 Fotos do Google Maps</span></div>}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {googlePhotos.slice(0, 9).map((ref, i) => {
                      const url = `/api/google/photo?ref=${encodeURIComponent(ref)}`;
                      return (
                        <button key={i} onClick={() => setFotoAberta(url)}
                          className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity relative">
                          <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">Google</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Lightbox */}
          {fotoAberta && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setFotoAberta(null)}
            >
              <img src={fotoAberta} alt="" className="max-w-full max-h-full rounded-2xl" />
              <button onClick={() => setFotoAberta(null)}
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl">
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Vídeos ────────────────────────────────────────────────── */}
      {tab === "videos" && (
        <div>
          {videosLocais.length === 0 && youtubeVideos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum vídeo disponível</div>
          ) : (
            <div className="space-y-6">
              {/* Vídeos do próprio restaurante (upload) */}
              {videosLocais.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Vídeos do restaurante</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {videosLocais.map((v) => (
                      <div key={v.id} className="rounded-2xl overflow-hidden bg-black aspect-video">
                        <video src={v.url} controls className="w-full h-full" preload="metadata">
                          Seu navegador não suporta vídeo.
                        </video>
                        {v.caption && <p className="text-xs text-gray-500 p-2">{v.caption}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vídeos do YouTube */}
              {youtubeVideos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                    <span className="text-red-600">▶</span> Canal no YouTube
                    {restaurante.youtubeChannelId && (
                      <a href={`https://youtube.com/channel/${restaurante.youtubeChannelId}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#0077B6] hover:underline">
                        Ver canal completo →
                      </a>
                    )}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {youtubeVideos.map((v: YoutubeVideo) => (
                      <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                        className="group rounded-2xl overflow-hidden border border-gray-100 hover:border-red-300 hover:shadow-md transition-all">
                        <div className="relative aspect-video bg-black">
                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                            <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg">
                              ▶
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-[#023E58] line-clamp-2 group-hover:text-red-600 transition-colors">{v.title}</h4>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(v.publishedAt).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Informações ───────────────────────────────────────────── */}
      {tab === "info" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-[#023E58] mb-2">Sobre</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{restaurante.description}</p>
          </div>

          {restaurante.address && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Mapa embed no topo (se tiver coordenadas) */}
              {restaurante.lat && restaurante.lng && (
                <div className="h-48 relative">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}&q=${restaurante.lat},${restaurante.lng}&zoom=16`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização no mapa"
                  />
                  {/* Overlay clicável no mapa para abrir navegação */}
                  <div className="absolute bottom-3 right-3">
                    <BotaoNavegacao
                      lat={restaurante.lat}
                      lng={restaurante.lng}
                      endereco={restaurante.address}
                      nome={restaurante.name}
                      variante="botao"
                    />
                  </div>
                </div>
              )}

              {/* Detalhes do endereço */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#023E58] mb-1">📍 Endereço</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{restaurante.address}</p>
                    {!restaurante.lat && (
                      <p className="text-xs text-gray-400 mt-1">
                        Coordenadas GPS não disponíveis — a navegação usará o endereço como texto
                      </p>
                    )}
                  </div>
                  {/* Botão navegação sem mapa (fallback quando não tem embed) */}
                  {!restaurante.lat && (
                    <div className="flex-shrink-0">
                      <BotaoNavegacao
                        lat={restaurante.lat}
                        lng={restaurante.lng}
                        endereco={restaurante.address}
                        nome={restaurante.name}
                        variante="botao"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {hours && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-[#023E58] mb-3">🕐 Horários</h3>
              <div className="space-y-2">
                {Object.entries(DIAS).map(([dia, label]) => (
                  hours[dia] ? (
                    <div key={dia} className="flex justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-[#023E58]">{hours[dia]}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Avaliações ───────────────────────────────────────────── */}
      {tab === "avaliacoes" && (
        <div id="avaliacoes">
          <ReviewSection businessId={restaurante.id} businessSlug={restaurante.slug} />
        </div>
      )}
    </>
  );
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CardapioItem({ item }: { item: MenuItem }) {
  return (
    <div className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-[#0077B6]/30 transition-colors">
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-[#023E58] text-sm">{item.name}</h4>
          <span className="font-bold text-[#0077B6] text-sm whitespace-nowrap">{formatPrice(item.price)}</span>
        </div>
        {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
        {item.tags && item.tags !== "[]" && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {JSON.parse(item.tags).map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-[#0077B6] px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

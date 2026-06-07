"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Restaurante = {
  id: string;
  name: string;
  slug: string;
  status: string;
  coverUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  verificacaoStatus: string;
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number;
  promocoesAtivas: number;
  _count: {
    menuItems: number;
    medias: number;
    favorites: number;
    reviews: number;
  };
};

// ─── Inner component — usa useSearchParams ────────────────────────────────────

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingMsg, setOnboardingMsg] = useState("");

  const onboardingParam = searchParams.get("onboarding");

  useEffect(() => {
    fetch("/api/restaurantes/meus")
      .then((r) => r.json())
      .then((d) => { setRestaurantes(d.restaurantes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (onboardingParam === "sucesso") {
      setOnboardingMsg("🎉 Restaurante configurado com sucesso! Seus dados foram importados do Google.");
    }
  }, [onboardingParam]);

  const temRestaurante = restaurantes.length > 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[#023E58] mb-2">
        Olá, {session?.user.name?.split(" ")[0]}! 👋
      </h1>
      <p className="text-gray-500 mb-6">Gerencie seu restaurante no BC Todo Dia</p>

      {/* ── Mensagem de sucesso do onboarding ─────────────────────────────── */}
      {onboardingMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-6 text-sm font-medium">
          {onboardingMsg}
        </div>
      )}

      {/* ── CTA principal: Conectar Google (quando não tem restaurante) ──────── */}
      {!loading && !temRestaurante && (
        <div className="bg-gradient-to-br from-[#0077B6] to-[#023E58] rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="text-5xl flex-shrink-0">🔗</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Configure seu restaurante em 30 segundos</h2>
              <p className="text-white/80 text-sm mb-4">
                Conecte sua conta Google e importamos automaticamente: fotos, horários, avaliações,
                localização e canal do YouTube — sem digitar nada.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/api/google/business-connect"
                  className="flex items-center gap-2 bg-white text-[#023E58] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                  <GoogleColorIcon />
                  Conectar com Google
                </a>
                <Link
                  href="/dashboard/comerciante/restaurante"
                  className="flex items-center gap-2 border border-white/30 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors"
                >
                  Configurar manualmente
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "⭐", label: "Avaliações Google" },
              { icon: "📸", label: "Fotos do local" },
              { icon: "🕐", label: "Horários" },
              { icon: "✅", label: "Badge verificado" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-white/80 text-xs">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Métricas dos restaurantes ──────────────────────────────────────── */}
      {!loading && temRestaurante && (
        <div className="space-y-6 mb-8">
          {restaurantes.map((r) => (
            <RestauranteMetricas key={r.id} r={r} />
          ))}
        </div>
      )}

      {/* Skeleton de loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* ── Cards de navegação ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: "🏪", label: "Configure seu perfil", href: "/dashboard/comerciante/restaurante", desc: "Fotos, endereço, horários" },
          { icon: "🍽️", label: "Monte o cardápio", href: "/dashboard/comerciante/cardapio", desc: "Pratos, preços, categorias" },
          { icon: "📸", label: "Adicione mídias", href: "/dashboard/comerciante/midias", desc: "Fotos e vídeos do local" },
          { icon: "🏷️", label: "Crie promoções", href: "/dashboard/comerciante/promocoes", desc: "Atraia clientes com ofertas" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#0077B6] hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="font-semibold text-[#023E58] text-sm group-hover:text-[#0077B6] mb-1">{card.label}</div>
            <div className="text-xs text-gray-500">{card.desc}</div>
          </Link>
        ))}
      </div>

      {/* ── Dica dinâmica ─────────────────────────────────────────────────── */}
      {temRestaurante ? (
        <div className="bg-[#0077B6]/5 border border-[#0077B6]/20 rounded-2xl p-6">
          <h2 className="font-semibold text-[#023E58] mb-2">💡 Dica rápida</h2>
          <p className="text-sm text-gray-600">
            Restaurantes com cardápio completo e pelo menos 3 fotos aparecem{" "}
            <strong>3x mais</strong> nas buscas dos clientes. Comece pelo cardápio!
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="font-semibold text-amber-700 mb-2">📋 Por que conectar o Google?</h2>
          <p className="text-sm text-amber-700">
            Em vez de digitar tudo manualmente, você autoriza uma vez e o app puxa automaticamente
            as informações que você já tem no Google Maps — incluindo todas as fotos e avaliações de clientes.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Card de métricas por restaurante ────────────────────────────────────────

function RestauranteMetricas({ r }: { r: Restaurante }) {
  const statusLabel: Record<string, { label: string; cor: string }> = {
    ATIVO:    { label: "Ativo",    cor: "bg-green-100 text-green-700" },
    PENDENTE: { label: "Pendente", cor: "bg-amber-100 text-amber-700" },
    INATIVO:  { label: "Inativo",  cor: "bg-gray-100  text-gray-500"  },
  };
  const st = statusLabel[r.status] ?? statusLabel.PENDENTE;

  // Rating consolidado: plataforma tem prioridade; fallback Google
  const mediaPlataforma = r.mediaAvaliacoes;
  const mediaGoogle = r.googleRating;

  const metricas = [
    {
      icon: "❤️",
      valor: r._count.favorites,
      label: "Favoritos",
      cor: "text-red-500",
      dica: r._count.favorites === 0
        ? "Nenhum favorito ainda — complete o perfil para aparecer mais"
        : undefined,
    },
    {
      icon: "⭐",
      valor: mediaPlataforma !== null
        ? mediaPlataforma.toFixed(1)
        : mediaGoogle !== null
          ? `${mediaGoogle.toFixed(1)} G`
          : "—",
      label: r.totalAvaliacoes > 0
        ? `${r.totalAvaliacoes} avaliações`
        : "Avaliações BC",
      cor: "text-amber-500",
      dica: r.totalAvaliacoes === 0
        ? "Peça para clientes avaliarem na página do restaurante"
        : undefined,
    },
    {
      icon: "🍽️",
      valor: r._count.menuItems,
      label: "Itens no cardápio",
      cor: "text-[#0077B6]",
      dica: r._count.menuItems === 0
        ? "Cardápio vazio — adicione pratos para aparecer nas buscas"
        : undefined,
    },
    {
      icon: "📸",
      valor: r._count.medias,
      label: "Fotos/vídeos",
      cor: "text-purple-500",
      dica: r._count.medias < 3
        ? "Adicione ao menos 3 fotos para mais visibilidade"
        : undefined,
    },
    {
      icon: "🏷️",
      valor: r.promocoesAtivas,
      label: "Promoções ativas",
      cor: "text-[#F4A261]",
      dica: r.promocoesAtivas === 0
        ? "Crie uma promoção para atrair clientes agora"
        : undefined,
    },
  ];

  const dicas = metricas.filter((m) => m.dica);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        {r.coverUrl && (
          <img src={r.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#023E58] truncate">{r.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cor}`}>{st.label}</span>
            {r.verificacaoStatus === "VERIFICADO" && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">✓ Verificado</span>
            )}
          </div>
        </div>
        <Link
          href={`/restaurante/${r.slug}`}
          target="_blank"
          className="text-xs text-[#0077B6] hover:underline whitespace-nowrap"
        >
          Ver página →
        </Link>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-gray-100">
        {metricas.map((m) => (
          <div key={m.label} className="bg-white px-4 py-4 text-center">
            <div className={`text-2xl font-bold ${m.cor}`}>{m.valor}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Dicas inteligentes (somente quando há pontos a melhorar) */}
      {dicas.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 font-medium mb-1">💡 Melhore seu desempenho:</p>
          <ul className="space-y-0.5">
            {dicas.map((d) => (
              <li key={d.label} className="text-xs text-amber-600 flex items-start gap-1.5">
                <span className="mt-0.5">•</span>
                <span>{d.dica}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Página exportada com Suspense ────────────────────────────────────────────

export default function DashboardHome() {
  return (
    <Suspense fallback={<div className="text-gray-400 py-8 text-center text-sm">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

// ─── Ícone Google ─────────────────────────────────────────────────────────────

function GoogleColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

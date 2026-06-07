"use client";

/**
 * BotaoNavegacao
 * ──────────────
 * Botão "Como chegar?" que abre um dropdown com opções de navegação.
 *
 * - Google Maps (funciona em qualquer dispositivo)
 * - Waze (abre o app se instalado, senão web)
 * - Apple Maps (mostrado apenas em iOS/macOS)
 * - Copiar endereço (clipboard)
 *
 * Prioridade: coordenadas lat/lng > string de endereço
 */

import { useState, useEffect, useRef } from "react";

type Props = {
  lat?: number | null;
  lng?: number | null;
  endereco?: string | null;
  nome?: string | null;           // nome do restaurante (para label no mapa)
  variante?: "botao" | "link";   // estilo do trigger
};

export default function BotaoNavegacao({ lat, lng, endereco, nome, variante = "botao" }: Props) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detectar iOS / macOS para exibir Apple Maps
  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod|Macintosh/i.test(ua));
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [aberto]);

  // ── Montar URLs de destino ────────────────────────────────────────────────
  const temCoordenadas = !!(lat && lng);
  const destQuery = temCoordenadas ? `${lat},${lng}` : encodeURIComponent(`${nome ?? ""} ${endereco ?? ""}`.trim());

  const urls = {
    googleMaps: temCoordenadas
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destQuery}`,

    waze: temCoordenadas
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://waze.com/ul?q=${destQuery}&navigate=yes`,

    appleMaps: temCoordenadas
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://maps.apple.com/?daddr=${destQuery}`,
  };

  async function copiarEndereco() {
    const texto = [nome, endereco].filter(Boolean).join(" — ") || "Endereço não disponível";
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback: selecionar texto (browsers antigos)
    }
    setAberto(false);
  }

  const opcoes = [
    {
      icon: <GoogleMapsIcon />,
      label: "Google Maps",
      sublabel: "Abre no app ou navegador",
      href: urls.googleMaps,
      cor: "text-[#4285F4]",
    },
    {
      icon: <WazeIcon />,
      label: "Waze",
      sublabel: "Abre no app se instalado",
      href: urls.waze,
      cor: "text-[#33CCFF]",
    },
    ...(isIOS
      ? [{
          icon: <AppleMapsIcon />,
          label: "Apple Maps",
          sublabel: "App nativo do iPhone",
          href: urls.appleMaps,
          cor: "text-gray-700",
        }]
      : []),
  ];

  if (!lat && !lng && !endereco) return null;

  return (
    <div className="relative" ref={ref}>
      {/* ── Trigger ─────────────────────────────────────────────────── */}
      {variante === "botao" ? (
        <button
          onClick={() => setAberto(v => !v)}
          className="flex items-center gap-2 bg-[#0077B6] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#005f92] active:scale-95 transition-all shadow-sm"
        >
          <span>🧭</span>
          <span>Como chegar?</span>
          <span className={`text-xs transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}>▾</span>
        </button>
      ) : (
        <button
          onClick={() => setAberto(v => !v)}
          className="flex items-center gap-1.5 text-[#0077B6] text-sm font-medium hover:underline"
        >
          🧭 Como chegar?
        </button>
      )}

      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      {aberto && (
        <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/80">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
              Abrir navegação em
            </div>
            {nome && <div className="text-sm font-medium text-[#023E58] truncate">{nome}</div>}
            {endereco && <div className="text-xs text-gray-400 truncate">{endereco}</div>}
          </div>

          {/* Apps de mapa */}
          <div className="py-1">
            {opcoes.map(op => (
              <a
                key={op.label}
                href={op.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-white border border-gray-100 flex-shrink-0">
                  {op.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${op.cor}`}>{op.label}</div>
                  <div className="text-xs text-gray-400">{op.sublabel}</div>
                </div>
                <span className="text-gray-300 group-hover:text-gray-400 text-sm">→</span>
              </a>
            ))}

            {/* Divisor */}
            <div className="mx-4 my-1 border-t border-gray-50" />

            {/* Copiar endereço */}
            <button
              onClick={copiarEndereco}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-white border border-gray-100 flex-shrink-0 text-lg">
                {copiado ? "✅" : "📋"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-gray-700">
                  {copiado ? "Copiado!" : "Copiar endereço"}
                </div>
                <div className="text-xs text-gray-400">Para colar onde quiser</div>
              </div>
            </button>
          </div>

          {/* Footer — coordenadas disponíveis */}
          {temCoordenadas && (
            <div className="px-4 py-2 bg-green-50/60 border-t border-green-100 flex items-center gap-1.5">
              <span className="text-green-500 text-xs">📡</span>
              <span className="text-xs text-green-600">GPS preciso disponível</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ícones SVG dos apps ──────────────────────────────────────────────────────

function GoogleMapsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
      <path d="M12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
    </svg>
  );
}

function WazeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20.4 8.5C19.7 4.8 16.2 2 12 2 7.8 2 4.3 4.8 3.6 8.5 1.6 9.2 0 11.1 0 13.4c0 2.7 2.2 4.9 4.9 4.9h1.3c.5 1.8 2.1 3.1 4 3.1h.6c.3.5.8.8 1.4.8.5 0 1-.2 1.4-.6.3.3.8.6 1.3.6.8 0 1.5-.5 1.7-1.3.1 0 .3.1.4.1 1.5 0 2.8-1.1 3-2.5h.1c2.7 0 4.9-2.2 4.9-4.9-.1-2.3-1.6-4.2-3.6-5.1z" fill="#33CCFF"/>
      <circle cx="8.5" cy="14" r="1.2" fill="white"/>
      <circle cx="14.5" cy="14" r="1.2" fill="white"/>
      <path d="M10 16.5c.5.5 1.2.8 2 .8s1.5-.3 2-.8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function AppleMapsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#fff"/>
      <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill="#3478F6"/>
      <path d="M12 6l1.5 4.5H18l-3.75 2.73 1.43 4.37L12 15.18l-3.68 2.42 1.43-4.37L6 10.5h4.5z" fill="white"/>
    </svg>
  );
}

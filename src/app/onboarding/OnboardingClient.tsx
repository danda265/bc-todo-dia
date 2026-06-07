"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Location = {
  gbpTitle: string;
  gbpAddress: string;
  gbpCategoria?: string;
  placeId?: string;
  rating?: number;
  reviewCount?: number;
};

type Props = {
  locations: Location[];
  hasYoutube: boolean;
};

export default function OnboardingClient({ locations, hasYoutube }: Props) {
  const router = useRouter();
  const [selecionando, setSelecionando] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  async function confirmar(index: number) {
    setSelecionando(index);
    setErro("");

    try {
      const res = await fetch("/api/google/business-connect/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationIndex: index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao confirmar.");
        setSelecionando(null);
        return;
      }
      router.push(data.redirect ?? "/dashboard/comerciante?onboarding=sucesso");
    } catch {
      setErro("Erro de rede. Tente novamente.");
      setSelecionando(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-[#023E58] mb-2">
            Qual é o seu restaurante?
          </h1>
          <p className="text-gray-500 text-sm">
            Encontramos {locations.length} negócios vinculados à sua conta Google.
            Selecione o seu restaurante — vamos importar tudo automaticamente.
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
            {erro}
          </div>
        )}

        {/* Cards de seleção */}
        <div className="space-y-3 mb-8">
          {locations.map((loc, i) => (
            <button
              key={i}
              onClick={() => confirmar(i)}
              disabled={selecionando !== null}
              className="w-full bg-white border-2 border-gray-100 hover:border-[#0077B6] rounded-2xl p-5 text-left transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-0.5 flex-shrink-0">
                  {selecionando === i ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : "🏪"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#023E58] group-hover:text-[#0077B6] text-lg leading-tight">
                    {loc.gbpTitle}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 truncate">{loc.gbpAddress}</div>
                  <div className="flex items-center gap-3 mt-2">
                    {loc.gbpCategoria && (
                      <span className="text-xs bg-blue-50 text-[#0077B6] px-2 py-0.5 rounded-full">
                        {loc.gbpCategoria}
                      </span>
                    )}
                    {loc.rating && (
                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        ⭐ {loc.rating.toFixed(1)}
                        <span className="font-normal text-gray-400">
                          ({loc.reviewCount?.toLocaleString("pt-BR")} avaliações)
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 self-center">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200 group-hover:border-[#0077B6] flex items-center justify-center text-[#0077B6] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* O que vamos importar */}
        <div className="bg-[#0077B6]/5 border border-[#0077B6]/20 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-[#023E58] mb-3">✨ O que vamos importar automaticamente</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            {[
              { icon: "📍", label: "Endereço e localização" },
              { icon: "⭐", label: "Avaliações do Google" },
              { icon: "📸", label: "Fotos do estabelecimento" },
              { icon: "🕐", label: "Horários de funcionamento" },
              { icon: "📞", label: "Telefone e site" },
              { icon: "✅", label: "Verificação automática" },
              ...(hasYoutube ? [{ icon: "▶️", label: "Canal do YouTube" }] : []),
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Link para voltar */}
        <div className="text-center">
          <a href="/dashboard/comerciante" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Pular por agora — configurar manualmente
          </a>
        </div>
      </div>
    </div>
  );
}

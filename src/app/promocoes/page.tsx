"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Promocao = {
  id: string;
  title: string;
  description: string;
  discount: string | null;
  target: string;
  endsAt: string;
  imageUrl: string | null;
  business: {
    id: string;
    name: string;
    slug: string;
    bairro: string;
    coverUrl: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
};

const TARGET_LABELS: Record<string, string> = { TODOS: "Para todos", MORADOR: "Moradores", TURISTA: "Turistas" };
const BAIRRO_LABELS: Record<string, string> = {
  CENTRO: "Centro", BARRA_SUL: "Barra Sul", INTERPRAIAS: "Interpraias",
  MUNICAO: "Municão", ARQUIPELAGO: "Arquipélago", CANTO_DO_MORCEGO: "Canto do Morcego",
  PRAIA_LARANJEIRAS: "Praia das Laranjeiras", PRAIA_DOS_AMORES: "Praia dos Amores",
  PIONEIROS: "Pioneiros", OUTRO: "Outro",
};

function tempoRestante(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Encerrada";
  const horas = Math.floor(diff / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);
  if (horas >= 24) return `${Math.floor(horas / 24)}d restantes`;
  if (horas > 0) return `${horas}h ${minutos}min restantes`;
  return `${minutos}min restantes`;
}

export default function PromocoesPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [aviso, setAviso] = useState("");
  const [filtroTarget, setFiltroTarget] = useState("");

  useEffect(() => {
    const url = `/api/promocoes${filtroTarget ? `?target=${filtroTarget}` : ""}`;
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setPromocoes(d.promocoes ?? []);
        setAviso(d.aviso ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtroTarget]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#F4A261] to-[#e07b3a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="text-white/70 text-sm hover:text-white mb-4 inline-block">← BC Todo Dia</Link>
          <h1 className="text-3xl font-bold mb-2">🏷️ Promoções de hoje</h1>
          <p className="text-white/90">Ofertas ativas agora em restaurantes de Balneário Camboriú</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Aviso legal */}
        {aviso && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
            ⚠️ {aviso}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: "", label: "Todos" },
            { value: "MORADOR", label: "Para moradores" },
            { value: "TURISTA", label: "Para turistas" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroTarget(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtroTarget === f.value
                  ? "bg-[#F4A261] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#F4A261]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Buscando promoções...</div>
        ) : promocoes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😔</div>
            <p className="text-gray-500 font-medium">Nenhuma promoção ativa agora</p>
            <p className="text-gray-400 text-sm mt-1">Volte mais tarde ou explore os restaurantes</p>
            <Link href="/restaurantes" className="mt-4 inline-block text-[#0077B6] text-sm font-medium">
              Ver restaurantes →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {promocoes.map((p) => {
              const restante = tempoRestante(p.endsAt);
              const urgente = new Date(p.endsAt).getTime() - Date.now() < 3600000 * 3;

              return (
                <Link
                  key={p.id}
                  href={`/restaurante/${p.business.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-[#F4A261] transition-all overflow-hidden group"
                >
                  {/* Foto do restaurante */}
                  <div className="h-36 bg-gradient-to-br from-[#0077B6] to-[#023E58] relative overflow-hidden">
                    {p.business.coverUrl ? (
                      <img src={p.business.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                    )}
                    {/* Badge de desconto */}
                    {p.discount && (
                      <div className="absolute top-3 right-3 bg-[#F4A261] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {p.discount}
                      </div>
                    )}
                    {/* Tempo restante */}
                    <div className={`absolute bottom-3 left-3 text-xs font-medium px-2 py-1 rounded-full ${urgente ? "bg-red-500 text-white" : "bg-black/50 text-white"}`}>
                      ⏱ {restante}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#0077B6]">{p.business.name}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{BAIRRO_LABELS[p.business.bairro] ?? p.business.bairro}</span>
                    </div>
                    <h3 className="font-semibold text-[#023E58] group-hover:text-[#0077B6] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>

                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.target === "MORADOR" ? "bg-blue-100 text-blue-700" :
                        p.target === "TURISTA" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {TARGET_LABELS[p.target]}
                      </span>
                      {p.business.whatsapp && (
                        <a
                          href={`https://wa.me/55${p.business.whatsapp.replace(/\D/g, "")}`}
                          onClick={e => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/restaurantes" className="text-[#0077B6] text-sm font-medium hover:underline">
            Ver todos os restaurantes →
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Verificacao = {
  id: string; name: string; slug: string; bairro: string;
  verificacaoStatus: string; verificacaoMetodo?: string;
  verificadoEm?: string; googleOwnerEmail?: string;
  googlePlaceId?: string; googleRating?: number;
  createdAt: string; updatedAt: string;
  owner: { name: string; email: string };
};

const STATUS_TABS = [
  { value: "PENDENTE_ADMIN", label: "Aguardando aprovação", icon: "⏳" },
  { value: "VERIFICADO_GOOGLE", label: "Verificados Google", icon: "🔵" },
  { value: "VERIFICADO_MANUAL", label: "Aprovados", icon: "✅" },
  { value: "REJEITADO", label: "Rejeitados", icon: "❌" },
];

function VerificacoesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFiltro = searchParams.get("status") ?? "PENDENTE_ADMIN";

  const [verificacoes, setVerificacoes] = useState<Verificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  function carregar() {
    setLoading(true);
    fetch(`/api/admin/verificacoes?status=${statusFiltro}`)
      .then(r => r.json())
      .then(d => { setVerificacoes(d.verificacoes ?? []); setLoading(false); });
  }

  useEffect(() => { carregar(); }, [statusFiltro]);

  async function agir(id: string, acao: "aprovar" | "rejeitar") {
    setProcessando(id);
    setMensagem("");
    const res = await fetch("/api/admin/verificacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id, acao }),
    });
    if (res.ok) {
      setVerificacoes(prev => prev.filter(v => v.id !== id));
      setMensagem(acao === "aprovar" ? "✅ Verificação aprovada!" : "❌ Solicitação rejeitada.");
    }
    setProcessando(null);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[#023E58] mb-6">✅ Verificações de Restaurantes</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => router.push(`/dashboard/admin/verificacoes?status=${tab.value}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFiltro === tab.value
                ? "bg-[#023E58] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {mensagem && (
        <div className={`rounded-xl p-3 mb-4 text-sm font-medium ${
          mensagem.includes("✅") ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {mensagem}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-8">Carregando...</div>
      ) : verificacoes.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-500">Nenhum registro com este status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verificacoes.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/restaurante/${v.slug}`} target="_blank"
                      className="font-semibold text-[#023E58] hover:text-[#0077B6] transition-colors">
                      {v.name}
                    </Link>
                    {v.googleRating && (
                      <span className="text-xs text-amber-600 font-semibold">⭐ {v.googleRating.toFixed(1)}</span>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <div>👤 {v.owner.name} — <span className="text-gray-400">{v.owner.email}</span></div>
                    {v.googleOwnerEmail && (
                      <div>🔑 Conta Google: <span className="font-medium text-gray-700">{v.googleOwnerEmail}</span></div>
                    )}
                    {v.googlePlaceId && (
                      <div>
                        📍 Place ID:{" "}
                        <a href={`https://maps.google.com/?cid=&q=${v.name}`} target="_blank"
                          className="text-[#0077B6] hover:underline font-mono text-xs">
                          {v.googlePlaceId}
                        </a>
                      </div>
                    )}
                    <div>📅 Solicitado em {new Date(v.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  </div>
                </div>

                {/* Ações (apenas para pendentes) */}
                {statusFiltro === "PENDENTE_ADMIN" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => agir(v.id, "aprovar")}
                      disabled={processando === v.id}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processando === v.id ? "..." : "✅ Aprovar"}
                    </button>
                    <button
                      onClick={() => agir(v.id, "rejeitar")}
                      disabled={processando === v.id}
                      className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {processando === v.id ? "..." : "❌ Rejeitar"}
                    </button>
                  </div>
                )}

                {/* Status badge (quando não é pendente) */}
                {statusFiltro !== "PENDENTE_ADMIN" && (
                  <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium ${
                    v.verificacaoStatus === "VERIFICADO_GOOGLE" || v.verificacaoStatus === "VERIFICADO_MANUAL"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {v.verificacaoStatus === "VERIFICADO_GOOGLE" ? "Verificado Google" :
                     v.verificacaoStatus === "VERIFICADO_MANUAL" ? "Aprovado manualmente" :
                     "Rejeitado"}
                    {v.verificadoEm && (
                      <div className="font-normal text-gray-400 mt-0.5">
                        {new Date(v.verificadoEm).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminVerificacoesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 py-8">Carregando...</div>}>
      <VerificacoesContent />
    </Suspense>
  );
}

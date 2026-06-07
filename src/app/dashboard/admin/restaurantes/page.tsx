"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Restaurante = {
  id: string; name: string; slug: string; status: string;
  verificacaoStatus: string; category: string; bairro: string;
  googleRating?: number; createdAt: string;
  owner: { name: string; email: string };
};

const STATUS_LABEL: Record<string, string> = {
  ATIVO: "Ativo", PENDENTE: "Pendente", SUSPENSO: "Suspenso",
};

const VERIF_LABEL: Record<string, { label: string; color: string }> = {
  NAO_SOLICITADA: { label: "Não solicitada", color: "text-gray-400" },
  PENDENTE_ADMIN: { label: "Aguardando admin", color: "text-amber-600" },
  VERIFICADO_GOOGLE: { label: "✅ Google", color: "text-green-600" },
  VERIFICADO_MANUAL: { label: "✅ Manual", color: "text-blue-600" },
  REJEITADO: { label: "Rejeitado", color: "text-red-500" },
};

function RestaurantesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFiltro = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";

  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [busca, setBusca] = useState(q);

  function carregar(p = 1) {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFiltro) params.set("status", statusFiltro);
    if (q) params.set("q", q);
    params.set("page", String(p));

    fetch(`/api/admin/restaurantes?${params}`)
      .then(r => r.json())
      .then(d => {
        setRestaurantes(d.restaurantes ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setPage(p);
        setLoading(false);
      });
  }

  useEffect(() => { carregar(1); }, [statusFiltro, q]);

  function filtrar() {
    const params = new URLSearchParams();
    if (statusFiltro) params.set("status", statusFiltro);
    if (busca) params.set("q", busca);
    router.push(`/dashboard/admin/restaurantes?${params}`);
  }

  async function mudarStatus(id: string, novoStatus: string) {
    setAtualizando(id);
    await fetch("/api/admin/restaurantes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: novoStatus }),
    });
    setRestaurantes(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r));
    setAtualizando(null);
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#023E58]">🏪 Restaurantes</h1>
          <p className="text-sm text-gray-500">{total} cadastros no total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === "Enter" && filtrar()}
          placeholder="Buscar por nome..."
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6] flex-1 min-w-48"
        />
        <select
          value={statusFiltro}
          onChange={e => router.push(`/dashboard/admin/restaurantes${e.target.value ? `?status=${e.target.value}` : ""}`)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6] bg-white"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="SUSPENSO">Suspensos</option>
        </select>
        <button onClick={filtrar}
          className="bg-[#0077B6] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#005f92] transition-colors">
          Buscar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : restaurantes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum restaurante encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nome", "Dono", "Status", "Verificação", "Google ⭐", "Cadastro", "Ações"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {restaurantes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/restaurante/${r.slug}`} target="_blank"
                        className="font-medium text-[#023E58] hover:text-[#0077B6] transition-colors">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <div>{r.owner.name}</div>
                      <div className="text-gray-400">{r.owner.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "ATIVO" ? "bg-green-100 text-green-700" :
                        r.status === "PENDENTE" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${VERIF_LABEL[r.verificacaoStatus]?.color ?? "text-gray-400"}`}>
                        {VERIF_LABEL[r.verificacaoStatus]?.label ?? r.verificacaoStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-600 text-xs font-semibold">
                      {r.googleRating ? `⭐ ${r.googleRating.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {r.status !== "ATIVO" && (
                          <button onClick={() => mudarStatus(r.id, "ATIVO")}
                            disabled={atualizando === r.id}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50">
                            Ativar
                          </button>
                        )}
                        {r.status !== "SUSPENSO" && (
                          <button onClick={() => mudarStatus(r.id, "SUSPENSO")}
                            disabled={atualizando === r.id}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50">
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => carregar(page - 1)} disabled={page <= 1}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Anterior
              </button>
              <button onClick={() => carregar(page + 1)} disabled={page >= totalPages}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminRestaurantesPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 py-8">Carregando...</div>}>
      <RestaurantesContent />
    </Suspense>
  );
}

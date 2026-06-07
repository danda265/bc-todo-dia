"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  total: number;
  ativos: number;
  pendentes: number;
  suspensos: number;
  verificadosGoogle: number;
  verificadosManual: number;
  pendenteVerificacao: number;
};

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [verificacoesPendentes, setVerificacoesPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/restaurantes?limit=0").then(r => r.json()),
      fetch("/api/admin/restaurantes?status=ATIVO&limit=0").then(r => r.json()),
      fetch("/api/admin/restaurantes?status=PENDENTE&limit=0").then(r => r.json()),
      fetch("/api/admin/restaurantes?status=SUSPENSO&limit=0").then(r => r.json()),
      fetch("/api/admin/verificacoes?status=PENDENTE_ADMIN").then(r => r.json()),
    ]).then(([all, ativos, pendentes, suspensos, verifs]) => {
      setStats({
        total: all.total ?? 0,
        ativos: ativos.total ?? 0,
        pendentes: pendentes.total ?? 0,
        suspensos: suspensos.total ?? 0,
        verificadosGoogle: 0, // calculado no servidor
        verificadosManual: 0,
        pendenteVerificacao: verifs.verificacoes?.length ?? 0,
      });
      setVerificacoesPendentes(verifs.verificacoes ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total restaurantes", value: stats?.total ?? "-", icon: "🏪", href: "/dashboard/admin/restaurantes", cor: "blue" },
    { label: "Ativos", value: stats?.ativos ?? "-", icon: "✅", href: "/dashboard/admin/restaurantes?status=ATIVO", cor: "green" },
    { label: "Pendentes", value: stats?.pendentes ?? "-", icon: "⏳", href: "/dashboard/admin/restaurantes?status=PENDENTE", cor: "amber" },
    { label: "Verificações pendentes", value: stats?.pendenteVerificacao ?? "-", icon: "🔍", href: "/dashboard/admin/verificacoes", cor: "red" },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#023E58] mb-2">Painel Admin</h1>
      <p className="text-gray-500 mb-8 text-sm">Gerencie restaurantes e aprovações de verificação</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#0077B6] hover:shadow-md transition-all group">
            <div className="text-2xl mb-3">{card.icon}</div>
            <div className={`text-3xl font-bold mb-1 ${
              card.cor === "green" ? "text-green-600" :
              card.cor === "amber" ? "text-amber-600" :
              card.cor === "red" ? "text-red-600" :
              "text-[#023E58]"
            }`}>
              {loading ? "..." : card.value}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-[#0077B6]">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Verificações pendentes */}
      {verificacoesPendentes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#023E58]">
              ⚠️ Verificações aguardando aprovação ({verificacoesPendentes.length})
            </h2>
            <Link href="/dashboard/admin/verificacoes"
              className="text-sm text-[#0077B6] hover:underline">
              Ver todas →
            </Link>
          </div>

          <div className="space-y-3">
            {verificacoesPendentes.slice(0, 5).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div>
                  <div className="font-medium text-[#023E58] text-sm">{v.name}</div>
                  <div className="text-xs text-gray-500">
                    {v.owner?.email} — {new Date(v.updatedAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Link href="/dashboard/admin/verificacoes"
                  className="text-xs bg-[#0077B6] text-white px-3 py-1.5 rounded-lg hover:bg-[#005f92] transition-colors">
                  Revisar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && verificacoesPendentes.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-green-700 font-medium">Nenhuma verificação pendente</p>
          <p className="text-sm text-green-600 mt-1">Todas as solicitações estão resolvidas.</p>
        </div>
      )}
    </div>
  );
}

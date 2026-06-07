"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Promocao = {
  id: string;
  title: string;
  description: string;
  discount: string | null;
  target: string;
  status: string;
  startsAt: string;
  endsAt: string;
  imageUrl: string | null;
  reativadoEm: string | null;
  reativacoesCount: number;
  businessId: string;
};

const STATUS_COLORS: Record<string, string> = {
  ATIVA: "bg-green-100 text-green-700",
  EXPIRADA: "bg-gray-100 text-gray-600",
  RASCUNHO: "bg-yellow-100 text-yellow-700",
  CANCELADA: "bg-red-100 text-red-600",
};

const TARGET_LABELS: Record<string, string> = {
  TODOS: "Todos",
  MORADOR: "Moradores",
  TURISTA: "Turistas",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PromocoesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reativarId, setReativarId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    discount: "",
    target: "TODOS",
    startsAt: "",
    endsAt: "",
  });
  const [reativarForm, setReativarForm] = useState({ startsAt: "", endsAt: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Buscar meu restaurante
  useEffect(() => {
    fetch("/api/restaurantes/meus")
      .then((r) => r.json())
      .then((d) => {
        if (d.restaurantes?.[0]?.id) {
          setBusinessId(d.restaurantes[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!businessId) return;
    carregarPromocoes();
  }, [businessId]);

  async function carregarPromocoes() {
    setLoading(true);
    const r = await fetch(`/api/restaurantes/${businessId}/promocoes`);
    const d = await r.json();
    setPromocoes(d.promocoes ?? []);
    setLoading(false);
  }

  async function salvarPromocao() {
    if (!businessId) return;
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch(`/api/restaurantes/${businessId}/promocoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error ?? "Erro ao salvar"); return; }
      setShowForm(false);
      setForm({ title: "", description: "", discount: "", target: "TODOS", startsAt: "", endsAt: "" });
      carregarPromocoes();
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  async function reativar(pid: string) {
    if (!businessId || !reativarForm.startsAt || !reativarForm.endsAt) return;
    setSalvando(true);
    setErro("");
    try {
      const r = await fetch(`/api/restaurantes/${businessId}/promocoes/${pid}/reativar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: new Date(reativarForm.startsAt).toISOString(),
          endsAt: new Date(reativarForm.endsAt).toISOString(),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error ?? "Erro ao reativar"); return; }
      setReativarId(null);
      setReativarForm({ startsAt: "", endsAt: "" });
      carregarPromocoes();
    } catch {
      setErro("Erro de conexão");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(pid: string) {
    if (!businessId || !confirm("Cancelar esta promoção?")) return;
    await fetch(`/api/restaurantes/${businessId}/promocoes/${pid}`, { method: "DELETE" });
    carregarPromocoes();
  }

  if (!businessId) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Você ainda não tem um restaurante cadastrado.</p>
      <a href="/dashboard/comerciante/restaurante" className="mt-4 inline-block bg-[#0077B6] text-white px-6 py-3 rounded-xl">
        Cadastrar restaurante
      </a>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#023E58]">🏷️ Promoções</h1>
          <p className="text-sm text-gray-500 mt-1">Promoções ativas aparecem automaticamente na aba pública. Quando expirarem, você pode reativá-las.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0077B6] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#005f92] transition-colors"
        >
          + Nova promoção
        </button>
      </div>

      {/* Aviso legal */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        ⚠️ <strong>Responsabilidade:</strong> Ao publicar uma promoção, o restaurante confirma que as condições, preços e descontos informados são reais e válidos no período indicado. O BC Todo Dia não se responsabiliza por divergências.
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{erro}</div>}

      {/* Formulário nova promoção */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-[#023E58] mb-4">Nova promoção</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Ex: 50% OFF no camarão toda terça!"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Descreva a promoção com todos os detalhes..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Desconto/Condição</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Ex: 50% OFF, R$20 de desconto, Leve 2 pague 1"
                value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Para quem?</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                <option value="TODOS">Todos</option>
                <option value="MORADOR">Moradores</option>
                <option value="TURISTA">Turistas</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
                <input type="datetime-local" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Término *</label>
                <input type="datetime-local" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={salvarPromocao} disabled={salvando}
              className="bg-[#0077B6] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors">
              {salvando ? "Salvando..." : "Publicar promoção"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de promoções */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Carregando...</div>
      ) : promocoes.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Nenhuma promoção cadastrada ainda.</div>
      ) : (
        <div className="space-y-4">
          {promocoes.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    <span className="text-xs text-gray-400">{TARGET_LABELS[p.target]}</span>
                    {p.reativacoesCount > 0 && <span className="text-xs text-blue-400">🔄 reativada {p.reativacoesCount}x</span>}
                  </div>
                  <h3 className="font-semibold text-[#023E58]">{p.title}</h3>
                  {p.discount && <span className="inline-block mt-1 bg-[#F4A261]/20 text-[#c3824e] text-xs font-bold px-2 py-0.5 rounded-full">{p.discount}</span>}
                  <p className="text-sm text-gray-500 mt-2">{p.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    📅 {fmtDate(p.startsAt)} → {fmtDate(p.endsAt)}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {(p.status === "EXPIRADA" || p.status === "RASCUNHO") && (
                    <button onClick={() => { setReativarId(p.id); setErro(""); }}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium whitespace-nowrap">
                      🔄 Reativar
                    </button>
                  )}
                  {p.status !== "CANCELADA" && (
                    <button onClick={() => cancelar(p.id)}
                      className="text-xs border border-red-100 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Modal inline de reativação */}
              {reativarId === p.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-[#023E58] mb-3">Novas datas para reativar:</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Início</label>
                      <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        value={reativarForm.startsAt} onChange={e => setReativarForm(f => ({ ...f, startsAt: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Término</label>
                      <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        value={reativarForm.endsAt} onChange={e => setReativarForm(f => ({ ...f, endsAt: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => reativar(p.id)} disabled={salvando}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                      {salvando ? "..." : "Confirmar reativação"}
                    </button>
                    <button onClick={() => setReativarId(null)}
                      className="border px-4 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

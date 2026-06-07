"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import GoogleImportModal from "@/components/integracao/GoogleImportModal";
import YoutubeConectar from "@/components/integracao/YoutubeConectar";
import VerificacaoBadge from "@/components/integracao/VerificacaoBadge";

const BAIRROS = [
  { value: "CENTRO", label: "Centro" }, { value: "BARRA_SUL", label: "Barra Sul" },
  { value: "INTERPRAIAS", label: "Interpraias" }, { value: "MUNICAO", label: "Municão" },
  { value: "ARQUIPELAGO", label: "Arquipélago" }, { value: "CANTO_DO_MORCEGO", label: "Canto do Morcego" },
  { value: "PRAIA_LARANJEIRAS", label: "Praia das Laranjeiras" }, { value: "PRAIA_DOS_AMORES", label: "Praia dos Amores" },
  { value: "PIONEIROS", label: "Pioneiros" }, { value: "OUTRO", label: "Outro" },
];

type Restaurante = { id: string; name: string; slug: string; bairro: string; description: string; address: string; phone?: string; whatsapp?: string; website?: string; instagram?: string; lat?: number; lng?: number; hours?: string; googlePlaceId?: string; googleRating?: number; googleReviewCount?: number; verificacaoStatus: string; verificadoEm?: string; youtubeChannelId?: string; youtubeChannelUrl?: string | null; status: string };

export default function RestaurantePage() {
  return (
    <Suspense fallback={<div className="text-gray-400 py-8 text-center text-sm">Carregando...</div>}>
      <RestauranteForm />
    </Suspense>
  );
}

function RestauranteForm() {
  const searchParams = useSearchParams();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [form, setForm] = useState<Partial<Restaurante>>({});

  // Verificar mensagem do callback OAuth
  const verificacao = searchParams.get("verificacao");

  useEffect(() => {
    fetch("/api/restaurantes/meus")
      .then(r => r.json())
      .then(d => {
        const r = d.restaurantes?.[0];
        if (r) { setRestaurante(r); setForm(r); }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (verificacao === "sucesso") setSucesso("✅ Restaurante verificado via Google! O badge aparecerá na sua página.");
    if (verificacao === "pendente_admin") setSucesso("⏳ Verificação enviada! Nossa equipe vai confirmar em até 48h.");
    if (verificacao === "cancelada") setErro("Verificação cancelada.");
  }, [verificacao]);

  async function salvar() {
    if (!restaurante) return;
    setSalvando(true); setErro(""); setSucesso("");
    const r = await fetch(`/api/restaurantes/${restaurante.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hours: form.hours ?? undefined,
      }),
    });
    const d = await r.json();
    if (!r.ok) setErro(d.error ?? "Erro ao salvar");
    else { setRestaurante(d.restaurante); setSucesso("Alterações salvas!"); }
    setSalvando(false);
  }

  async function iniciarVerificacao() {
    if (!restaurante) return;
    const r = await fetch(`/api/restaurantes/${restaurante.id}/verificar`, { method: "POST" });
    const d = await r.json();
    if (d.authUrl) window.location.href = d.authUrl;
    else if (d.error) setErro(d.error);
  }

  function onGoogleImport(dados: any) {
    if (!dados) return;
    setRestaurante(prev => prev ? { ...prev, ...dados } : dados);
    setForm(prev => ({ ...prev, ...dados }));
    setSucesso("Dados importados do Google! Revise e salve.");
    setShowGoogleModal(false);
  }

  const f = (key: keyof Restaurante) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (loading) return <div className="text-center py-16 text-gray-400">Carregando...</div>;

  if (!restaurante) return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#023E58] mb-6">🏪 Cadastrar Restaurante</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-[#0077B6] mb-2">💡 Dica: comece pelo Google</h2>
        <p className="text-sm text-gray-600">Se o seu restaurante já está no Google Maps, podemos importar as informações automaticamente.</p>
        <button onClick={() => setShowGoogleModal(true)}
          className="mt-3 flex items-center gap-2 bg-white border border-blue-200 text-[#0077B6] px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
          <GoogleIcon /> Importar do Google Maps
        </button>
      </div>
      {showGoogleModal && <GoogleImportModal businessId={null} onImport={onGoogleImport} onClose={() => setShowGoogleModal(false)} />}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#023E58]">🏪 Meu Restaurante</h1>
          <p className="text-sm text-gray-500">Edite as informações — os clientes veem tudo isso na sua página</p>
        </div>
        <div className="ml-auto">
          <VerificacaoBadge status={restaurante.verificacaoStatus} verificadoEm={restaurante.verificadoEm} />
        </div>
      </div>

      {sucesso && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">{sucesso}</div>}
      {erro && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{erro}</div>}

      {/* ── Seção Google ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-[#023E58] mb-4 flex items-center gap-2">
          <GoogleIcon /> Google Business
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Importar dados */}
          <button onClick={() => setShowGoogleModal(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm hover:border-[#0077B6] hover:text-[#0077B6] transition-colors">
            {restaurante.googlePlaceId ? "🔄 Reimportar do Google" : "📥 Importar do Google Maps"}
          </button>

          {/* Verificar propriedade */}
          {restaurante.verificacaoStatus !== "VERIFICADO_GOOGLE" && (
            <button onClick={iniciarVerificacao}
              className="flex items-center gap-2 bg-[#0077B6] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#005f92] transition-colors">
              <span>✅</span> Verificar que sou o dono
            </button>
          )}
        </div>

        {restaurante.googlePlaceId && (
          <div className="mt-4 bg-blue-50 rounded-xl p-3 text-sm text-[#023E58]">
            <div className="flex items-center gap-4">
              <span>📍 Google Place vinculado</span>
              {restaurante.googleRating && (
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  ⭐ {restaurante.googleRating.toFixed(1)}
                  <span className="font-normal text-gray-500">({restaurante.googleReviewCount?.toLocaleString()} avaliações)</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Explicação de verificação */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
          <strong>Como funciona a verificação?</strong> Você entra com a conta Google que gerencia o restaurante no Google Maps. Se aquela conta for owner ou manager do seu negócio no Google, o badge <em>Verificado via Google</em> aparece automaticamente na página pública. Caso contrário, nossa equipe revisa em até 48h.
        </div>
      </div>

      {/* ── YouTube ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <YoutubeConectar businessId={restaurante.id} channelUrl={restaurante.youtubeChannelUrl} onSave={(url) => setRestaurante(prev => prev ? { ...prev, youtubeChannelUrl: url } : prev)} />
      </div>

      {/* ── Instagram ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-[#023E58] mb-4 flex items-center gap-2">
          📷 Instagram
        </h2>
        <div className="flex gap-3">
          <span className="flex items-center text-gray-400 text-sm px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">@</span>
          <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6]"
            placeholder="seunomeaqui"
            value={form.instagram?.replace("@", "") ?? ""}
            onChange={e => setForm(prev => ({ ...prev, instagram: e.target.value }))} />
        </div>
        <p className="text-xs text-gray-400 mt-2">O perfil do Instagram aparece como link na página pública.</p>
      </div>

      {/* ── Informações básicas ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-[#023E58] mb-4">Informações básicas</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nome do restaurante</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.name ?? ""} onChange={f("name")} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.description ?? ""} onChange={f("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bairro</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.bairro ?? ""} onChange={f("bairro")}>
                {BAIRROS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Telefone</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.phone ?? ""} onChange={f("phone")} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">WhatsApp</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="47999999999" value={form.whatsapp ?? ""} onChange={f("whatsapp")} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Endereço completo</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.address ?? ""} onChange={f("address")} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Website</label>
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="https://..." value={form.website ?? ""} onChange={f("website")} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={salvar} disabled={salvando}
          className="bg-[#0077B6] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors">
          {salvando ? "Salvando..." : "💾 Salvar alterações"}
        </button>
        {restaurante.status === "ATIVO" && (
          <a href={`/restaurante/${restaurante.slug}`} target="_blank"
            className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
            👁️ Ver página pública
          </a>
        )}
      </div>

      {showGoogleModal && (
        <GoogleImportModal businessId={restaurante.id} onImport={onGoogleImport} onClose={() => setShowGoogleModal(false)} />
      )}
    </div>
  );
}

function GoogleIcon() {
  return <span className="text-base">🔍</span>;
}

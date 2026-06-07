"use client";
import { useState } from "react";

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
};

type ImportOptions = {
  nome: boolean;
  endereco: boolean;
  telefone: boolean;
  website: boolean;
  horarios: boolean;
  localizacao: boolean;
  fotos: boolean;
};

type Props = {
  businessId: string | null;
  onImport: (dados: any) => void;
  onClose: () => void;
};

export default function GoogleImportModal({ businessId, onImport, onClose }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [erro, setErro] = useState("");
  const [opcoes, setOpcoes] = useState<ImportOptions>({
    nome: true, endereco: true, telefone: true, website: true,
    horarios: true, localizacao: true, fotos: true,
  });

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true); setErro(""); setResults([]); setSelected(null);
    const r = await fetch(`/api/google/places?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (!r.ok) setErro(d.error ?? "Erro ao buscar");
    else setResults(d.results ?? []);
    setLoading(false);
  }

  async function importar() {
    if (!selected) return;
    setImporting(true); setErro("");

    if (businessId) {
      // Tem restaurante cadastrado: importar via API
      const r = await fetch(`/api/restaurantes/${businessId}/importar-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: selected.placeId, importar: opcoes }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error ?? "Erro ao importar"); setImporting(false); return; }
      onImport(d.restaurante);
    } else {
      // Pré-cadastro: retornar os dados para preencher o form
      onImport({
        name: opcoes.nome ? selected.name : undefined,
        address: opcoes.endereco ? selected.address : undefined,
        phone: opcoes.telefone ? selected.phone : undefined,
        website: opcoes.website ? selected.website : undefined,
        googlePlaceId: selected.placeId,
        googleRating: selected.rating,
        googleReviewCount: selected.reviewCount,
      });
    }
    setImporting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#023E58]">🔍 Importar do Google Maps</h2>
            <p className="text-sm text-gray-500 mt-0.5">Busque seu restaurante e importamos os dados automaticamente</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
        </div>

        <div className="p-6">
          {/* Busca */}
          <form onSubmit={buscar} className="flex gap-2 mb-4">
            <input
              autoFocus
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0077B6]"
              placeholder="Nome do restaurante em BC..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button type="submit" disabled={loading}
              className="bg-[#0077B6] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors">
              {loading ? "..." : "Buscar"}
            </button>
          </form>

          {erro && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{erro}</div>}

          {/* Resultados */}
          {!selected && results.length > 0 && (
            <div className="space-y-2">
              {results.map(r => (
                <button key={r.placeId} onClick={() => setSelected(r)}
                  className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-[#0077B6] hover:bg-blue-50 transition-all group">
                  <div className="font-medium text-[#023E58] group-hover:text-[#0077B6]">{r.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.address}</div>
                  {r.rating && (
                    <div className="text-xs text-amber-600 mt-1 font-medium">
                      ⭐ {r.rating} ({r.reviewCount?.toLocaleString()} avaliações)
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selecionado — escolher o que importar */}
          {selected && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[#023E58]">{selected.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{selected.address}</div>
                    {selected.rating && <div className="text-xs text-amber-600 mt-1">⭐ {selected.rating} · {selected.reviewCount?.toLocaleString()} avaliações</div>}
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm">Trocar</button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#023E58] mb-3">O que você quer importar?</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {(Object.entries({
                  nome: "Nome", endereco: "Endereço", telefone: "Telefone",
                  website: "Website", horarios: "Horários", localizacao: "Localização (mapa)",
                  fotos: "Fotos de capa",
                }) as [keyof ImportOptions, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={opcoes[key]}
                      onChange={e => setOpcoes(o => ({ ...o, [key]: e.target.checked }))}
                      className="rounded accent-[#0077B6]" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Você poderá editar qualquer informação depois. Dados importados não sobrescrevem campos que você já preencheu manualmente (exceto os que você marcar acima).
              </p>

              <div className="flex gap-3">
                <button onClick={importar} disabled={importing}
                  className="flex-1 bg-[#0077B6] text-white py-3 rounded-xl font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors">
                  {importing ? "Importando..." : "✅ Importar dados selecionados"}
                </button>
                <button onClick={() => setSelected(null)}
                  className="border px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
                  Voltar
                </button>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && q && (
            <div className="text-center py-6 text-gray-400 text-sm">Nenhum resultado. Tente com o nome exato do restaurante.</div>
          )}
        </div>
      </div>
    </div>
  );
}

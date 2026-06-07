"use client";
import { useState, useEffect } from "react";

type MenuCategory = { id: string; name: string; items: MenuItem[] };
type MenuItem = { id: string; name: string; description: string | null; price: number; imageUrl: string | null; tags: string | null; available: boolean; categoryId: string | null };

function formatPrice(p: number) { return p.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function CardapioPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<MenuCategory[]>([]);
  const [itensSemCat, setItensSemCat] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: "", description: "", price: "", categoryId: "", tags: "", available: true,
  });
  const [catForm, setCatForm] = useState({ name: "" });

  useEffect(() => {
    fetch("/api/restaurantes/meus").then(r => r.json()).then(d => {
      if (d.restaurantes?.[0]?.id) { setBusinessId(d.restaurantes[0].id); }
    });
  }, []);

  useEffect(() => { if (businessId) carregar(); }, [businessId]);

  async function carregar() {
    setLoading(true);
    const [catR, itemR] = await Promise.all([
      fetch(`/api/restaurantes/${businessId}/cardapio/categorias`).then(r => r.json()),
      fetch(`/api/restaurantes/${businessId}/cardapio/items`).then(r => r.json()),
    ]);
    setCategorias(catR.categorias ?? []);
    setItensSemCat((itemR.items ?? []).filter((it: any) => !it.categoryId));
    setLoading(false);
  }

  async function adicionarItem() {
    if (!businessId || !itemForm.name || !itemForm.price) { setErro("Nome e preço são obrigatórios"); return; }
    setSalvando(true); setErro("");
    const tags = itemForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const r = await fetch(`/api/restaurantes/${businessId}/cardapio/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price.replace(",", ".")),
        categoryId: itemForm.categoryId || null,
        tags,
        available: itemForm.available,
      }),
    });
    const d = await r.json();
    if (!r.ok) { setErro(d.error ?? "Erro ao adicionar"); }
    else {
      setShowItemForm(false);
      setItemForm({ name: "", description: "", price: "", categoryId: "", tags: "", available: true });
      carregar();
    }
    setSalvando(false);
  }

  async function adicionarCategoria() {
    if (!businessId || !catForm.name) { setErro("Nome da categoria obrigatório"); return; }
    setSalvando(true); setErro("");
    const r = await fetch(`/api/restaurantes/${businessId}/cardapio/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catForm.name }),
    });
    const d = await r.json();
    if (!r.ok) { setErro(d.error ?? "Erro"); }
    else { setShowCatForm(false); setCatForm({ name: "" }); carregar(); }
    setSalvando(false);
  }

  async function toggleDisponivel(itemId: string, available: boolean) {
    if (!businessId) return;
    await fetch(`/api/restaurantes/${businessId}/cardapio/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available }),
    });
    carregar();
  }

  async function deletarItem(itemId: string) {
    if (!businessId || !confirm("Remover item do cardápio?")) return;
    await fetch(`/api/restaurantes/${businessId}/cardapio/items/${itemId}`, { method: "DELETE" });
    carregar();
  }

  if (!businessId) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Cadastre seu restaurante primeiro.</p>
      <a href="/dashboard/comerciante/restaurante" className="mt-4 inline-block bg-[#0077B6] text-white px-6 py-3 rounded-xl">Cadastrar</a>
    </div>
  );

  const todasCategorias = categorias;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#023E58]">🍽️ Cardápio</h1>
          <p className="text-sm text-gray-500 mt-1">Os pratos aparecem nas buscas dos clientes. Adicione tags para facilitar encontrar seu restaurante.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatForm(true)} className="border border-[#0077B6] text-[#0077B6] px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-50 transition-colors">
            + Categoria
          </button>
          <button onClick={() => setShowItemForm(true)} className="bg-[#0077B6] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#005f92] transition-colors">
            + Prato
          </button>
        </div>
      </div>

      {erro && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{erro}</div>}

      {/* Form nova categoria */}
      {showCatForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-[#023E58] mb-3">Nova categoria</h3>
          <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3"
            placeholder="Ex: Entradas, Pratos Principais, Bebidas, Sobremesas..."
            value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={adicionarCategoria} disabled={salvando}
              className="bg-[#0077B6] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#005f92] disabled:opacity-50 transition-colors">
              {salvando ? "..." : "Criar"}
            </button>
            <button onClick={() => setShowCatForm(false)} className="border px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      {/* Form novo item */}
      {showItemForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-[#023E58] mb-4">Novo prato</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome do prato *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Ex: Camarão ao alho e óleo"
                value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Descrição</label>
              <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Ingredientes, modo de preparo, porção..."
                value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Preço (R$) *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="45,90"
                  value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  value={itemForm.categoryId} onChange={e => setItemForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Sem categoria</option>
                  {todasCategorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tags de busca (separadas por vírgula)</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                placeholder="camarao, frutos do mar, sem gluten, proteina"
                value={itemForm.tags} onChange={e => setItemForm(f => ({ ...f, tags: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Clientes buscam por estes termos para encontrar seu restaurante</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={itemForm.available}
                onChange={e => setItemForm(f => ({ ...f, available: e.target.checked }))}
                className="rounded" />
              <span className="text-sm text-gray-600">Disponível agora</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={adicionarItem} disabled={salvando}
              className="bg-[#0077B6] text-white px-5 py-2 rounded-xl text-sm hover:bg-[#005f92] disabled:opacity-50 transition-colors">
              {salvando ? "Salvando..." : "Adicionar prato"}
            </button>
            <button onClick={() => setShowItemForm(false)} className="border px-5 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Carregando cardápio...</div>
      ) : (
        <div>
          {/* Itens sem categoria */}
          {itensSemCat.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Sem categoria</h2>
              <div className="space-y-2">
                {itensSemCat.map(item => <ItemRow key={item.id} item={item} onToggle={toggleDisponivel} onDeletar={deletarItem} />)}
              </div>
            </div>
          )}

          {/* Por categoria */}
          {categorias.map(cat => (
            <div key={cat.id} className="mb-6">
              <h2 className="font-semibold text-[#023E58] mb-3 flex items-center gap-2">
                {cat.name}
                <span className="text-xs font-normal text-gray-400">{cat.items.length} itens</span>
              </h2>
              <div className="space-y-2">
                {cat.items.map(item => <ItemRow key={item.id} item={item} onToggle={toggleDisponivel} onDeletar={deletarItem} />)}
                {cat.items.length === 0 && <p className="text-sm text-gray-400">Nenhum item nesta categoria</p>}
              </div>
            </div>
          ))}

          {itensSemCat.length === 0 && categorias.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🍽️</div>
              <p>Cardápio vazio. Adicione pratos para aparecer nas buscas!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onToggle, onDeletar }: {
  item: MenuItem;
  onToggle: (id: string, available: boolean) => void;
  onDeletar: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl border p-3 ${!item.available ? "opacity-60 border-gray-100" : "border-gray-100 hover:border-blue-100"} transition-all`}>
      {item.imageUrl && <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#023E58] text-sm truncate">{item.name}</span>
          {!item.available && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Indisponível</span>}
        </div>
        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
        {item.tags && item.tags !== "[]" && (
          <div className="flex gap-1 mt-1">
            {JSON.parse(item.tags).slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-[#0077B6] px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-semibold text-[#0077B6] text-sm">
          {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
        <button onClick={() => onToggle(item.id, !item.available)}
          className={`text-xs px-2 py-1 rounded-lg transition-colors ${item.available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          {item.available ? "Ativo" : "Inativo"}
        </button>
        <button onClick={() => onDeletar(item.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">✕</button>
      </div>
    </div>
  );
}

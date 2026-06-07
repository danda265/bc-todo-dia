"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BAIRROS = [
  { value: "", label: "Não informado" },
  { value: "CENTRO", label: "Centro" },
  { value: "BARRA_SUL", label: "Barra Sul" },
  { value: "INTERPRAIAS", label: "Interpraias" },
  { value: "MUNICAO", label: "Municão" },
  { value: "ARQUIPELAGO", label: "Arquipélago" },
  { value: "CANTO_DO_MORCEGO", label: "Canto do Morcego" },
  { value: "PRAIA_LARANJEIRAS", label: "Praia das Laranjeiras" },
  { value: "PRAIA_DOS_AMORES", label: "Praia dos Amores" },
  { value: "PIONEIROS", label: "Pioneiros" },
  { value: "OUTRO", label: "Outro" },
];

const ROLE_LABELS: Record<string, string> = {
  COMERCIANTE: "Comerciante", MORADOR: "Morador", TURISTA: "Turista",
};

type UserProfile = {
  id: string; name: string | null; email: string; image: string | null;
  role: string; bairro: string | null; marketingOptIn: boolean;
  googleLinked: boolean; createdAt: string;
  _count: { reviews: number; favorites: number; businesses: number };
};

export default function PerfilPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Formulário básico
  const [form, setForm] = useState({ name: "", bairro: "", marketingOptIn: false });

  // Formulário de senha
  const [showSenha, setShowSenha] = useState(false);
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: "", novaSenha: "", confirmar: "" });
  const [errSenha, setErrSenha] = useState("");

  // Deletar conta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/entrar?redirect=/perfil"); return; }
    if (status === "authenticated") {
      fetch("/api/perfil")
        .then((r) => r.json())
        .then((d) => {
          setPerfil(d.user);
          setForm({
            name: d.user.name ?? "",
            bairro: d.user.bairro ?? "",
            marketingOptIn: d.user.marketingOptIn ?? false,
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function salvar() {
    setSalvando(true); setErro(""); setSucesso("");
    const r = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        bairro: form.bairro || null,
        marketingOptIn: form.marketingOptIn,
      }),
    });
    const d = await r.json();
    if (!r.ok) setErro(d.error ?? "Erro ao salvar");
    else {
      setSucesso("Perfil atualizado com sucesso!");
      setPerfil((prev) => prev ? { ...prev, ...d.user } : prev);
      await update(); // atualiza session do NextAuth
    }
    setSalvando(false);
  }

  async function trocarSenha() {
    setErrSenha("");
    if (senhaForm.novaSenha !== senhaForm.confirmar) {
      setErrSenha("As senhas não coincidem"); return;
    }
    if (senhaForm.novaSenha.length < 8) {
      setErrSenha("A nova senha deve ter pelo menos 8 caracteres"); return;
    }
    setSalvando(true);
    const r = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senhaAtual: senhaForm.senhaAtual,
        novaSenha: senhaForm.novaSenha,
      }),
    });
    const d = await r.json();
    if (!r.ok) setErrSenha(d.error ?? "Erro");
    else {
      setSucesso("Senha alterada com sucesso!");
      setSenhaForm({ senhaAtual: "", novaSenha: "", confirmar: "" });
      setShowSenha(false);
    }
    setSalvando(false);
  }

  async function deletarConta() {
    setDeletando(true);
    const r = await fetch("/api/perfil", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmacao: "DELETAR" }),
    });
    if (r.ok) {
      await signOut({ redirect: false });
      router.replace("/?conta=deletada");
    }
    setDeletando(false);
  }

  if (loading || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
  }

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#0077B6] font-bold">
            <span>🌊</span> BC Todo Dia
          </Link>
          <div className="flex gap-3">
            <Link href="/favoritos" className="text-sm text-gray-500 hover:text-[#0077B6]">❤️ Favoritos</Link>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-gray-400 hover:text-red-500">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar + resumo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
          {perfil.image ? (
            <img src={perfil.image} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-[#0077B6]/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#0077B6] flex items-center justify-center text-white text-3xl font-bold">
              {perfil.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#023E58]">{perfil.name ?? "Sem nome"}</h1>
            <p className="text-sm text-gray-500">{perfil.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-[#0077B6]/10 text-[#0077B6] px-2 py-0.5 rounded-full font-medium">
                {ROLE_LABELS[perfil.role] ?? perfil.role}
              </span>
              {perfil.googleLinked && (
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                  ✓ Google vinculado
                </span>
              )}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-400">
              <span>⭐ {perfil._count.reviews} avaliações</span>
              <span>❤️ {perfil._count.favorites} favoritos</span>
              {perfil._count.businesses > 0 && (
                <span>🏪 {perfil._count.businesses} negócio{perfil._count.businesses !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">✅ {sucesso}</div>
        )}
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">⚠️ {erro}</div>
        )}

        {/* Dados básicos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-[#023E58] mb-4">Dados pessoais</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">Nome</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6]"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">E-mail</label>
              <input
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                value={perfil.email}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado por segurança.</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block font-medium">Bairro</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6]"
                value={form.bairro}
                onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
              >
                {BAIRROS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm((f) => ({ ...f, marketingOptIn: !f.marketingOptIn }))}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.marketingOptIn ? "bg-[#0077B6]" : "bg-gray-300"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.marketingOptIn ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-sm text-gray-600">Receber novidades e promoções por e-mail</span>
            </label>
          </div>
          <button
            onClick={salvar}
            disabled={salvando}
            className="mt-5 bg-[#0077B6] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando..." : "💾 Salvar alterações"}
          </button>
        </div>

        {/* Trocar senha (só para usuários com senha) */}
        {!perfil.googleLinked && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#023E58]">Segurança — Senha</h2>
              <button
                onClick={() => setShowSenha((v) => !v)}
                className="text-sm text-[#0077B6] hover:underline"
              >
                {showSenha ? "Cancelar" : "Trocar senha"}
              </button>
            </div>
            {showSenha && (
              <div className="space-y-3">
                {errSenha && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">⚠️ {errSenha}</div>}
                {["senhaAtual", "novaSenha", "confirmar"].map((field) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 mb-1 block">
                      {field === "senhaAtual" ? "Senha atual" : field === "novaSenha" ? "Nova senha (mín. 8 chars)" : "Confirmar nova senha"}
                    </label>
                    <input
                      type="password"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6]"
                      value={senhaForm[field as keyof typeof senhaForm]}
                      onChange={(e) => setSenhaForm((f) => ({ ...f, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                <button
                  onClick={trocarSenha}
                  disabled={salvando}
                  className="bg-[#0077B6] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#005f92] disabled:opacity-50 transition-colors"
                >
                  {salvando ? "..." : "Salvar nova senha"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Links rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/favoritos"
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0077B6] transition-colors group text-center"
          >
            <div className="text-3xl mb-2">❤️</div>
            <div className="font-medium text-sm text-[#023E58] group-hover:text-[#0077B6]">Meus favoritos</div>
            <div className="text-xs text-gray-400">{perfil._count.favorites} lugar{perfil._count.favorites !== 1 ? "es" : ""} salvos</div>
          </Link>
          {perfil.role === "COMERCIANTE" && (
            <Link
              href="/dashboard/comerciante"
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0077B6] transition-colors group text-center"
            >
              <div className="text-3xl mb-2">🏪</div>
              <div className="font-medium text-sm text-[#023E58] group-hover:text-[#0077B6]">Dashboard</div>
              <div className="text-xs text-gray-400">Gerencie seu negócio</div>
            </Link>
          )}
        </div>

        {/* Zona de perigo — LGPD */}
        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <h2 className="font-semibold text-red-700 mb-2">⚠️ Excluir conta</h2>
          <p className="text-sm text-gray-500 mb-4">
            Remove permanentemente sua conta e todos os seus dados (avaliações, favoritos, histórico).
            Seus dados serão removidos em até 30 dias dos backups, conforme a{" "}
            <strong>LGPD Art. 18 VI</strong>.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="border border-red-200 text-red-600 px-5 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors"
          >
            Excluir minha conta
          </button>
        </div>

        {/* Modal de confirmação de exclusão */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="font-bold text-red-700 text-lg mb-2">⚠️ Confirmar exclusão</h3>
              <p className="text-sm text-gray-600 mb-4">
                Esta ação é <strong>irreversível</strong>. Todos os seus dados serão removidos:
                avaliações, favoritos, restaurante cadastrado (se houver) e histórico.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deletarConta}
                  disabled={deletando}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletando ? "Excluindo..." : "Sim, excluir tudo"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

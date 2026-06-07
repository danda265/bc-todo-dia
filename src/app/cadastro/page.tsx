"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "COMERCIANTE" | "MORADOR" | "TURISTA";

const ROLES: { value: Role; icon: string; titulo: string; desc: string; destaque?: boolean }[] = [
  {
    value: "COMERCIANTE",
    icon: "🏪",
    titulo: "Sou comerciante",
    desc: "Tenho um restaurante, bar ou negócio em BC",
    destaque: true,
  },
  {
    value: "MORADOR",
    icon: "🏠",
    titulo: "Sou morador",
    desc: "Moro em Balneário Camboriú",
  },
  {
    value: "TURISTA",
    icon: "🌊",
    titulo: "Sou turista",
    desc: "Estou visitando BC",
  },
];

const BAIRROS = [
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

export default function CadastroPage() {
  const router = useRouter();

  // Step 1: escolha de role — Step 2: dados pessoais
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);

  // Dados do formulário (step 2)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bairro, setBairro] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function escolherRole(r: Role) {
    setRole(r);
    setStep(2);
  }

  function voltarStep1() {
    setStep(1);
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!role) return;
    if (password !== confirmPassword) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!consentAccepted) {
      setErro("Você precisa aceitar os termos para continuar.");
      return;
    }

    setLoading(true);

    try {
      // 1. Criar conta
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          role,
          bairro: bairro || undefined,
          consentAccepted,
          marketingOptIn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      // 2. Login automático
      const login = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (login?.error) {
        // Conta criada mas login falhou — redireciona para /entrar
        router.push("/entrar?cadastro=sucesso");
        return;
      }

      // 3. Redirecionar conforme role
      if (role === "COMERCIANTE") {
        router.push("/dashboard/comerciante");
      } else {
        router.push("/?cadastro=sucesso");
      }
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E58] via-[#0077B6] to-[#339fdf] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">🌊</span>
            <span className="text-2xl font-bold">BC Todo Dia</span>
          </Link>
          <p className="text-white/70 text-sm mt-2">Balneário Camboriú o ano inteiro</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step 1 — Escolha de perfil */}
          {step === 1 && (
            <div className="p-8">
              <h1 className="text-xl font-bold text-[#023E58] mb-2 text-center">
                Criar conta grátis
              </h1>
              <p className="text-sm text-gray-500 text-center mb-6">
                Como você quer usar o BC Todo Dia?
              </p>

              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => escolherRole(r.value)}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                      r.destaque
                        ? "border-[#0077B6] bg-blue-50 hover:bg-blue-100"
                        : "border-gray-100 hover:border-[#0077B6]"
                    }`}
                  >
                    <span className="text-3xl flex-shrink-0">{r.icon}</span>
                    <div>
                      <div className="font-semibold text-[#023E58] flex items-center gap-2">
                        {r.titulo}
                        {r.destaque && (
                          <span className="text-xs bg-[#0077B6] text-white px-2 py-0.5 rounded-full">
                            popular
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{r.desc}</div>
                    </div>
                    <span className="ml-auto self-center text-gray-300">→</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                Já tem conta?{" "}
                <Link href="/entrar" className="text-[#0077B6] font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          )}

          {/* Step 2 — Dados pessoais */}
          {step === 2 && role && (
            <div className="p-8">
              {/* Header com role selecionada */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={voltarStep1}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
                >
                  ←
                </button>
                <div>
                  <h1 className="text-xl font-bold text-[#023E58]">Criar sua conta</h1>
                  <p className="text-xs text-gray-400">
                    Perfil: {ROLES.find(r => r.value === role)?.icon}{" "}
                    {ROLES.find(r => r.value === role)?.titulo}
                  </p>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/10 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/10 transition-all"
                  />
                </div>

                {/* Bairro (moradores e turistas) */}
                {role !== "COMERCIANTE" && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Bairro{" "}
                      <span className="text-gray-300">(opcional)</span>
                    </label>
                    <select
                      value={bairro}
                      onChange={e => setBairro(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/10 transition-all bg-white"
                    >
                      <option value="">Selecionar bairro...</option>
                      {BAIRROS.map(b => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Senha */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/10 transition-all"
                  />
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-[#0077B6] focus:ring-[#0077B6]/10"
                    }`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {/* Consentimento LGPD */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={e => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0077B6] focus:ring-[#0077B6]"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      Li e aceito os{" "}
                      <Link href="/termos" target="_blank" className="text-[#0077B6] hover:underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link href="/privacidade" target="_blank" className="text-[#0077B6] hover:underline">
                        Política de Privacidade
                      </Link>
                      . Autorizo o tratamento dos meus dados conforme descrito (LGPD).{" "}
                      <span className="text-red-400">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={e => setMarketingOptIn(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0077B6] focus:ring-[#0077B6]"
                    />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      Quero receber dicas, promoções e novidades do BC Todo Dia por email.{" "}
                      <span className="text-gray-400">(opcional)</span>
                    </span>
                  </label>
                </div>

                {/* Botão de envio */}
                <button
                  type="submit"
                  disabled={loading || !consentAccepted || !name || !email || !password || !confirmPassword}
                  className="w-full bg-[#0077B6] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#005f92] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
                >
                  {loading ? "Criando conta..." : "Criar conta grátis"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Já tem conta?{" "}
                <Link href="/entrar" className="text-[#0077B6] font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Volta para home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

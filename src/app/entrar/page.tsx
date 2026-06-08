"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Inner component — usa useSearchParams (precisa de Suspense) ──────────────

function EntrarForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const errorParam = searchParams.get("error");
  const cadastroOk = searchParams.get("cadastro") === "sucesso";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState("");

  // Redirecionar se já está logado
  useEffect(() => {
    if (session?.user) {
      const dest = callbackUrl || destino(session.user.role as string);
      router.replace(dest);
    }
  }, [session, router, callbackUrl]);

  useEffect(() => {
    if (errorParam === "CredentialsSignin") {
      setErro("Email ou senha incorretos. Verifique e tente novamente.");
    }
    if (cadastroOk) {
      setInfo("✅ Conta criada! Entre com seu email e senha.");
    }
  }, [errorParam, cadastroOk]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErro("");

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha incorretos. Verifique e tente novamente.");
      setLoading(false);
      return;
    }

    // Buscar role via session para redirecionar corretamente
    const meRes = await fetch("/api/auth/session");
    const meData = await meRes.json();
    const role = meData?.user?.role;
    router.replace(callbackUrl || destino(role));
  }

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023E58] via-[#0077B6] to-[#339fdf] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">🌊</span>
            <span className="text-2xl font-bold">BC Todo Dia</span>
          </Link>
          <p className="text-white/70 text-sm mt-2">Balneário Camboriú o ano inteiro</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-bold text-[#023E58] mb-6 text-center">Entrar na conta</h1>

          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-5 text-sm">
              {info}
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm">
              {erro}
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: callbackUrl || "/" })}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.5V5.43H1.83a8 8 0 0 0 0 7.14z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.44.45 3.34 1.35l2.5-2.5A8 8 0 0 0 1.83 5.43L4.5 7.5c.67-2 2.5-3.92 4.48-3.92z"/>
            </svg>
            Entrar com Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/10 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-500">Senha</label>
                <Link href="/recuperar-senha" className="text-xs text-[#0077B6] hover:underline">
                  Esqueci a senha
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-[#0077B6] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#005f92] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-[#0077B6] font-medium hover:underline">
              Cadastrar grátis
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Página exportada — obrigatório ter Suspense por causa do useSearchParams ─

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#023E58] via-[#0077B6] to-[#339fdf] flex items-center justify-center">
          <div className="text-white text-sm opacity-70">Carregando...</div>
        </div>
      }
    >
      <EntrarForm />
    </Suspense>
  );
}

// ─── Utilitário ───────────────────────────────────────────────────────────────

function destino(role?: string) {
  if (role === "COMERCIANTE") return "/dashboard/comerciante";
  return "/";
}

"use client";
import { useState } from "react";
import Link from "next/link";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setEnviado(true);
      } else {
        const data = await res.json();
        if (res.status === 429) {
          setErro("Muitas tentativas. Aguarde 1 hora.");
        } else {
          setErro(data.error || "Erro ao enviar email");
        }
      }
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verifique seu email</h1>
          <p className="text-gray-600 mb-6">
            Se este email estiver cadastrado, você receberá as instruções para criar uma nova senha em breve.
          </p>
          <p className="text-sm text-gray-500 mb-6">Não recebeu? Verifique a caixa de spam.</p>
          <Link href="/entrar" className="text-red-600 font-medium hover:underline">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu a senha?</h1>
          <p className="text-gray-500 text-sm">
            Digite seu email e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/entrar" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}

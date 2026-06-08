"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErroContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-red-600 mb-4">Erro de autenticação</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-red-800 break-all">
            error={error ?? "(nenhum)"}
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-2">URL completa de diagnóstico:</p>
        <p className="text-xs font-mono bg-gray-100 rounded p-2 break-all text-gray-700 mb-6">
          {typeof window !== "undefined" ? window.location.href : ""}
        </p>
        <Link
          href="/entrar"
          className="block text-center bg-[#0077B6] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#005f92] transition-colors"
        >
          Voltar para login
        </Link>
      </div>
    </div>
  );
}

export default function AuthErroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AuthErroContent />
    </Suspense>
  );
}

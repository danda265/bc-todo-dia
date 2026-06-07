"use client";

/**
 * NavbarUser — menu de usuário session-aware.
 * Drop-in em qualquer header. Mostra avatar/nome + dropdown quando logado,
 * ou links Entrar/Cadastrar quando não logado.
 */

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavbarUser() {
  const { data: session, status } = useSession();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [aberto]);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/entrar"
          className="text-sm text-[#0077B6] font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="text-sm bg-[#0077B6] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#005f92] transition-colors"
        >
          Cadastrar grátis
        </Link>
      </div>
    );
  }

  const isComerciante = session.user.role === "COMERCIANTE";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-8 h-8 rounded-full object-cover border-2 border-[#0077B6]/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#0077B6] flex items-center justify-center text-white text-sm font-semibold">
            {session.user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
          {session.user.name?.split(" ")[0]}
        </span>
        <span className={`text-xs text-gray-400 transition-transform ${aberto ? "rotate-180" : ""}`}>▾</span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-sm font-semibold text-[#023E58] truncate">
              {session.user.name}
            </div>
            <div className="text-xs text-gray-400 truncate">{session.user.email}</div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/perfil"
              onClick={() => setAberto(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>👤</span> Meu perfil
            </Link>
            <Link
              href="/favoritos"
              onClick={() => setAberto(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>❤️</span> Favoritos
            </Link>
            {isComerciante && (
              <Link
                href="/dashboard/comerciante"
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>🏪</span> Painel do comerciante
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { setAberto(false); signOut({ callbackUrl: "/" }); }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
            >
              <span>🚪</span> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const MENU = [
  { href: "/dashboard/admin", label: "Visão geral", icon: "📊" },
  { href: "/dashboard/admin/restaurantes", label: "Restaurantes", icon: "🏪" },
  { href: "/dashboard/admin/verificacoes", label: "Verificações", icon: "✅" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { window.location.href = "/entrar"; return; }

    // Verificar se é admin pela API (não expor lista de emails no client)
    fetch("/api/admin/verificacoes?status=PENDENTE_ADMIN&_check=1", { method: "HEAD" })
      .then(r => {
        if (r.status === 403 || r.status === 401) {
          window.location.href = "/";
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => { window.location.href = "/"; });
  }, [session, status]);

  if (status === "loading" || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-[#0077B6]">Verificando acesso...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#023E58] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span>🌊</span>
            <span className="font-bold">BC Todo Dia</span>
          </Link>
          <span className="text-white/30">|</span>
          <span className="text-sm text-white/70 font-medium">Painel Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/50 text-xs">{session?.user.email}</span>
          <Link href="/api/auth/signout" className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors text-xs">
            Sair
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-gray-200 py-6 hidden md:block">
          <nav className="space-y-1 px-3">
            {MENU.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-[#023E58] text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 mx-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/comerciante"
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-2">
              ← Painel comerciante
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full bg-white border-b overflow-x-auto">
          <nav className="flex px-2 py-2 gap-1">
            {MENU.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-[#023E58] text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>{item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

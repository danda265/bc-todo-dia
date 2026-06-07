"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

const MENU = [
  { href: "/dashboard/comerciante", label: "Visão geral", icon: "📊" },
  { href: "/dashboard/comerciante/restaurante", label: "Meu restaurante", icon: "🏪" },
  { href: "/dashboard/comerciante/cardapio", label: "Cardápio", icon: "🍽️" },
  { href: "/dashboard/comerciante/midias", label: "Fotos & Vídeos", icon: "📸" },
  { href: "/dashboard/comerciante/promocoes", label: "Promoções", icon: "🏷️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><span className="text-[#0077B6]">Carregando...</span></div>;
  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/entrar";
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#023E58] text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span>🌊</span>
          <span className="font-bold">BC Todo Dia</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/70">{session.user.name}</span>
          {/* Link admin — visível apenas para admins (verificado pelo próprio painel) */}
          <Link href="/dashboard/admin" className="text-white/50 hover:text-white/90 text-xs transition-colors hidden sm:block">
            Admin
          </Link>
          <Link href="/api/auth/signout" className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors">
            Sair
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 py-6 hidden md:block">
          <nav className="space-y-1 px-3">
            {MENU.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#0077B6] text-white"
                      : "text-gray-600 hover:bg-blue-50 hover:text-[#0077B6]"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full bg-white border-b overflow-x-auto">
          <nav className="flex px-2 py-2 gap-1">
            {MENU.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-[#0077B6] text-white" : "text-gray-600 hover:bg-blue-50"
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

import Link from "next/link";
import { CATEGORY_ICONS, CATEGORY_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, ROLE_LABELS } from "@/lib/constants";
import { BusinessCategory, UserRole } from "@prisma/client";
import NavbarUser from "@/components/ui/NavbarUser";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-ocean-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌊</span>
            <span className="font-bold text-[#0077B6] text-lg">BC Todo Dia</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/explorar" className="text-sm text-gray-600 hover:text-[#0077B6] font-medium px-3 py-2 hidden sm:block transition-colors">
              Explorar
            </Link>
            <Link href="/restaurantes" className="text-sm text-gray-600 hover:text-[#0077B6] font-medium px-3 py-2 hidden sm:block transition-colors">
              Restaurantes
            </Link>
            <Link href="/promocoes" className="text-sm text-[#c3824e] hover:text-[#F4A261] font-medium px-3 py-2 hidden sm:block transition-colors">
              🏷️ Promoções
            </Link>
            <NavbarUser />
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#023E58] via-[#0077B6] to-[#339fdf] text-white">
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm mb-6">
            <span>📍</span>
            <span>Balneário Camboriú, SC</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            BC o ano inteiro,{" "}
            <span className="text-[#F4A261]">não só no verão</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            A plataforma que conecta comércio local, moradores e turistas.
            Descubra experiências autênticas, apoie negócios locais e economize
            na baixa temporada.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/explorar"
              className="bg-white text-[#0077B6] font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-base"
            >
              Explorar negócios →
            </Link>
            <Link
              href="/cadastro?perfil=comerciante"
              className="bg-[#F4A261] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#c3824e] transition-colors shadow-lg text-base"
            >
              Cadastrar meu negócio
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "2M+", label: "turistas/ano" },
              { value: "139k", label: "moradores" },
              { value: "0", label: "plataformas assim" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#F4A261]">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quem é ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#023E58] mb-4">
            Uma plataforma, três perfis
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Cada perfil tem sua própria experiência, mas todos se beneficiam da mesma rede.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {(Object.values(UserRole) as UserRole[]).map((role) => (
              <div
                key={role}
                className="border border-blue-100 rounded-2xl p-8 hover:border-[#0077B6] hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-4">{ROLE_ICONS[role]}</div>
                <h3 className="text-xl font-bold text-[#023E58] mb-2">
                  {ROLE_LABELS[role]}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
                <Link
                  href={`/cadastro?perfil=${role.toLowerCase()}`}
                  className="text-[#0077B6] text-sm font-medium group-hover:text-[#023E58] transition-colors"
                >
                  Criar conta como {ROLE_LABELS[role].toLowerCase()} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categorias ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#023E58] mb-12">
            O que você encontra aqui
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.values(BusinessCategory) as BusinessCategory[]).map((cat) => (
              <Link
                key={cat}
                href={`/explorar?categoria=${cat}`}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:shadow-md hover:border-[#0077B6] border border-transparent transition-all text-center group"
              >
                <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                <span className="text-sm font-medium text-[#023E58] group-hover:text-[#0077B6] transition-colors">
                  {CATEGORY_LABELS[cat]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#023E58] mb-12">
            Como funciona
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🏪",
                title: "Comerciante cadastra",
                desc: "Negócio, horários, fotos e ofertas exclusivas para moradores e turistas",
              },
              {
                step: "02",
                icon: "🔍",
                title: "Morador e turista descobrem",
                desc: "Feed filtrado por bairro, categoria e o que está aberto agora",
              },
              {
                step: "03",
                icon: "❤️",
                title: "Todo mundo ganha",
                desc: "Comércio tem movimento o ano inteiro. Consumidor tem vantagens reais.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-mono text-[#0077B6] mb-2">{item.step}</div>
                <h3 className="text-lg font-bold text-[#023E58] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#023E58] to-[#0077B6] text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            BC precisa disso. Comece agora.
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Grátis para moradores e turistas. Planos acessíveis para comerciantes.
          </p>
          <Link
            href="/cadastro"
            className="inline-block bg-[#F4A261] text-white font-semibold px-10 py-4 rounded-xl hover:bg-[#c3824e] transition-colors shadow-xl text-lg"
          >
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-[#023E58] text-white/60 py-8 text-sm text-center">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2024 BC Todo Dia. Feito com ❤️ em Balneário Camboriú, SC.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

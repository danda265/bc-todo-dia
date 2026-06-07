import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato | BC Todo Dia",
  description: "Fale com a equipe do BC Todo Dia — suporte, parcerias e cadastro de negócios",
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#0077B6] font-bold">
            <span>🌊</span> BC Todo Dia
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#0077B6]">← Voltar</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#023E58] mb-3">Fale com a gente</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Tem dúvidas, quer cadastrar seu negócio ou quer uma parceria?
            Escolha o canal certo abaixo.
          </p>
        </div>

        {/* Cards de contato */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            {
              icon: "🏪",
              titulo: "Cadastrar meu negócio",
              desc: "Restaurante, loja, salão — cadastre grátis e apareça para moradores e turistas.",
              acao: { label: "Criar conta →", href: "/cadastro?perfil=comerciante" },
              cor: "bg-[#0077B6]/5 border-[#0077B6]/20 hover:border-[#0077B6]",
            },
            {
              icon: "💬",
              titulo: "Suporte via WhatsApp",
              desc: "Tem dúvida rápida? Fale diretamente pelo WhatsApp com nossa equipe.",
              acao: {
                label: "Abrir WhatsApp →",
                href: "https://wa.me/5547999999999?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20o%20BC%20Todo%20Dia",
                externo: true,
              },
              cor: "bg-green-50 border-green-200 hover:border-green-400",
            },
            {
              icon: "📧",
              titulo: "Enviar e-mail",
              desc: "Para assuntos mais detalhados, parcerias institucionais ou imprensa.",
              acao: {
                label: "contato@bctododia.com.br",
                href: "mailto:contato@bctododia.com.br",
                externo: true,
              },
              cor: "bg-amber-50 border-amber-200 hover:border-amber-400",
            },
          ].map((c) => (
            <div
              key={c.titulo}
              className={`rounded-2xl border p-6 transition-all ${c.cor}`}
            >
              <div className="text-4xl mb-3">{c.icon}</div>
              <h2 className="font-semibold text-[#023E58] mb-2">{c.titulo}</h2>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{c.desc}</p>
              {c.acao.externo ? (
                <a
                  href={c.acao.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#0077B6] hover:underline"
                >
                  {c.acao.label}
                </a>
              ) : (
                <Link href={c.acao.href} className="text-sm font-medium text-[#0077B6] hover:underline">
                  {c.acao.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Perguntas frequentes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-[#023E58] mb-6">Perguntas frequentes</h2>

          <div className="space-y-5">
            {[
              {
                q: "Quanto custa cadastrar meu restaurante?",
                a: "O cadastro básico é gratuito. Você pode criar seu perfil, adicionar cardápio, fotos e promoções sem pagar nada. Planos pagos com mais recursos estão em desenvolvimento.",
              },
              {
                q: "Como funciona a verificação pelo Google?",
                a: 'Você autoriza o BC Todo Dia a acessar sua conta Google Business Profile (antigo Google Meu Negócio). Se você for owner ou manager do estabelecimento no Google, o badge "Verificado via Google" aparece automaticamente. Todo o processo leva menos de 1 minuto.',
              },
              {
                q: "Posso cadastrar negócios que não sejam restaurantes?",
                a: "Sim! Embora a primeira categoria disponível seja Restaurantes, a plataforma suporta bares, lojas, salões de beleza, hospedagem, esportes e muito mais. Entre em contato para cadastro antecipado.",
              },
              {
                q: "Posso deletar minha conta e todos os dados?",
                a: "Sim, a qualquer momento. Acesse as configurações da sua conta e solicite a exclusão. Todos os dados são removidos em até 30 dias, conforme a LGPD (Lei 13.709/2018).",
              },
              {
                q: "Quem pode ver as promoções que cadastro?",
                a: "As promoções ficam visíveis para todos na página /promocoes. Você pode filtrar para moradores ou turistas, mas o controle fino de audiência está nos planos futuros.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                <h3 className="font-medium text-[#023E58] mb-2">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* DPO / privacidade */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            Para questões de privacidade de dados (LGPD), entre em contato com nosso DPO:{" "}
            <a href="mailto:privacidade@bctododia.com.br" className="text-[#0077B6] hover:underline">
              privacidade@bctododia.com.br
            </a>
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/termos" className="hover:text-gray-600 transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-gray-600 transition-colors">Privacidade</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

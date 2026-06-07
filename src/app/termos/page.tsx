import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | BC Todo Dia",
  description: "Termos de Uso da plataforma BC Todo Dia",
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar simples */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#0077B6] font-bold">
            <span>🌊</span> BC Todo Dia
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-[#0077B6]">← Voltar</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#023E58] mb-2">Termos de Uso</h1>
            <p className="text-sm text-gray-400">Versão 1.0 — vigente desde 01/06/2025</p>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao criar uma conta ou usar a plataforma BC Todo Dia, você declara ter lido, compreendido
                e concordado com estes Termos de Uso e com a nossa{" "}
                <Link href="/privacidade" className="text-[#0077B6] hover:underline">Política de Privacidade</Link>.
                Caso não concorde, não utilize a plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">2. Descrição do Serviço</h2>
              <p>
                O BC Todo Dia é uma plataforma que conecta comércios locais, moradores e turistas
                de Balneário Camboriú (SC), Brasil. Oferecemos funcionalidades de:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Cadastro e vitrine digital de estabelecimentos</li>
                <li>Publicação e descoberta de promoções</li>
                <li>Busca por tipo de produto ou serviço</li>
                <li>Integração com Google Business Profile e YouTube</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">3. Perfis de Usuário</h2>
              <p>A plataforma possui três perfis:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Comerciante:</strong> donos ou responsáveis por estabelecimentos comerciais em BC</li>
                <li><strong>Morador:</strong> residentes de Balneário Camboriú</li>
                <li><strong>Turista:</strong> visitantes da cidade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">4. Responsabilidades do Comerciante</h2>
              <p>O comerciante é <strong>inteiramente responsável</strong> por:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>A veracidade das informações do estabelecimento (nome, endereço, horários, telefone)</li>
                <li>Os preços, condições e validade de todas as promoções publicadas</li>
                <li>A conformidade com o Código de Defesa do Consumidor (Lei 8.078/90)</li>
                <li>Manter o cardápio atualizado e refletindo o que realmente é oferecido</li>
                <li>Não publicar conteúdo enganoso, ofensivo ou ilegal</li>
              </ul>
              <p className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>⚠️ Aviso legal:</strong> O BC Todo Dia não é responsável por promoções, preços
                ou informações publicadas pelos estabelecimentos. A relação contratual é exclusivamente
                entre o consumidor e o estabelecimento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">5. Conteúdo Proibido</h2>
              <p>É vedado publicar conteúdo que:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Seja falso, enganoso ou fraudulento</li>
                <li>Viole direitos de terceiros (propriedade intelectual, privacidade)</li>
                <li>Seja discriminatório, ofensivo ou ilegal</li>
                <li>Promova atividades ilegais</li>
                <li>Contenha spam ou publicidade não relacionada ao estabelecimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">6. Verificação de Estabelecimentos</h2>
              <p>
                A verificação de propriedade via Google Business Profile comprova que o usuário
                gerencia aquele negócio no Google, mas não implica endosso do BC Todo Dia quanto
                à qualidade dos produtos ou serviços. O badge de verificado indica apenas a
                autenticidade do perfil.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">7. Suspensão e Encerramento</h2>
              <p>
                O BC Todo Dia reserva-se o direito de suspender ou encerrar contas que violem
                estes termos, publicarem informações falsas ou praticarem atividades prejudiciais
                à plataforma ou a outros usuários.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">8. Limitação de Responsabilidade</h2>
              <p>
                A plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta.
                O BC Todo Dia não se responsabiliza por danos decorrentes do uso da plataforma,
                da confiança em informações de terceiros ou de interrupções do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">9. Alterações nos Termos</h2>
              <p>
                Podemos atualizar estes termos periodicamente. Você será notificado por email
                sobre mudanças significativas. O uso continuado da plataforma após as alterações
                implica aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">10. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato: {" "}
                <a href="mailto:contato@bctododia.com.br" className="text-[#0077B6] hover:underline">
                  contato@bctododia.com.br
                </a>
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
            <Link href="/privacidade" className="text-sm text-[#0077B6] hover:underline">
              📄 Política de Privacidade
            </Link>
            <Link href="/cadastro" className="text-sm text-gray-500 hover:underline">
              ← Voltar ao cadastro
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

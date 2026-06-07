import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | BC Todo Dia",
  description: "Como tratamos seus dados pessoais — BC Todo Dia (LGPD)",
};

export default function PrivacidadePage() {
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
            <h1 className="text-3xl font-bold text-[#023E58] mb-2">Política de Privacidade</h1>
            <p className="text-sm text-gray-400">Versão 1.0 — vigente desde 01/06/2025</p>
            <p className="text-sm text-gray-500 mt-2">
              Em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018)
            </p>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">1. Quem somos</h2>
              <p>
                O BC Todo Dia é operado por [Razão Social], com sede em Balneário Camboriú, SC.
                Para questões de privacidade, o Encarregado de Proteção de Dados (DPO) pode ser
                contactado em{" "}
                <a href="mailto:privacidade@bctododia.com.br" className="text-[#0077B6] hover:underline">
                  privacidade@bctododia.com.br
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">2. Dados que coletamos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200 font-semibold">Dado</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Finalidade</th>
                      <th className="text-left p-3 border border-gray-200 font-semibold">Base legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Nome e email", "Identificação e comunicação", "Execução de contrato (Art. 7, V)"],
                      ["Senha (hash bcrypt)", "Autenticação segura", "Execução de contrato (Art. 7, V)"],
                      ["Bairro", "Personalização de conteúdo", "Consentimento (Art. 7, I)"],
                      ["Tokens Google OAuth", "Integração com GBP e YouTube", "Consentimento (Art. 7, I)"],
                      ["Dados do perfil Google Business", "Exibir informações do estabelecimento", "Legítimo interesse (Art. 7, IX)"],
                      ["IP (último octeto mascarado)", "Segurança e rate limiting", "Legítimo interesse (Art. 7, IX)"],
                      ["Preferências de marketing", "Envio de comunicações (opt-in)", "Consentimento (Art. 7, I)"],
                    ].map(([dado, finalidade, base]) => (
                      <tr key={dado}>
                        <td className="p-3 border border-gray-200 font-medium">{dado}</td>
                        <td className="p-3 border border-gray-200">{finalidade}</td>
                        <td className="p-3 border border-gray-200 text-xs text-gray-500">{base}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">3. Dados que NÃO coletamos</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Conteúdo de comandos ou conversas (nunca armazenamos áudios)</li>
                <li>Dados de saúde ou biométricos</li>
                <li>Dados de crianças menores de 13 anos (proibimos o cadastro)</li>
                <li>Dados bancários ou de pagamento (não processamos pagamentos)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">4. Compartilhamento de dados</h2>
              <p>Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Google LLC (EUA)</strong>: para integração com Google Business Profile e YouTube. Base legal: Art. 33, I da LGPD (país com proteção adequada reconhecida)</li>
                <li><strong>Provedores de infraestrutura</strong> (hospedagem, banco de dados): sob obrigação contratual de confidencialidade</li>
                <li><strong>Autoridades competentes</strong>: quando exigido por lei</li>
              </ul>
              <p className="mt-3">
                <strong>Não vendemos, alugamos ou cedemos</strong> dados pessoais a terceiros para fins de marketing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">5. Seus direitos (Art. 18 da LGPD)</h2>
              <div className="space-y-2">
                {[
                  { icon: "📋", direito: "Confirmação e acesso", desc: "Saber quais dados temos sobre você" },
                  { icon: "✏️", direito: "Correção", desc: "Corrigir dados incompletos ou incorretos" },
                  { icon: "📦", direito: "Portabilidade", desc: "Receber seus dados em formato estruturado (JSON)" },
                  { icon: "🗑️", direito: "Eliminação", desc: "Solicitar a exclusão completa da conta e dados (exceto obrigações legais)" },
                  { icon: "🚫", direito: "Revogação de consentimento", desc: "Revogar qualquer autorização dada a qualquer momento" },
                  { icon: "ℹ️", direito: "Informação", desc: "Saber com quem compartilhamos seus dados" },
                ].map(item => (
                  <div key={item.direito} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="font-medium text-[#023E58]">{item.direito}</div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">
                Para exercer seus direitos, acesse as configurações da sua conta ou envie email para{" "}
                <a href="mailto:privacidade@bctododia.com.br" className="text-[#0077B6] hover:underline">
                  privacidade@bctododia.com.br
                </a>.
                Respondemos em até <strong>72 horas</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">6. Segurança dos dados</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Senhas armazenadas com bcrypt (work factor 12) — nunca em texto claro</li>
                <li>Comunicações protegidas por HTTPS/TLS</li>
                <li>Tokens OAuth protegidos via variáveis de ambiente criptografadas</li>
                <li>Rate limiting em todos os endpoints para prevenir ataques</li>
                <li>Logs sem dados pessoais identificáveis em produção</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">7. Retenção de dados</h2>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta,
                os dados são removidos em até <strong>30 dias</strong>, exceto os exigidos para
                cumprimento de obrigações legais (ex: registros fiscais por até 5 anos).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">8. Incidentes de segurança</h2>
              <p>
                Em caso de vazamento de dados que possa trazer risco aos titulares, notificaremos
                a ANPD em até <strong>72 horas</strong> e os usuários afetados em prazo razoável,
                conforme o Art. 48 da LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">9. Cookies</h2>
              <p>
                Usamos cookies apenas para autenticação (sessão segura, HttpOnly) e preferências
                do usuário. Não usamos cookies de rastreamento ou de publicidade de terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#023E58] mb-3">10. Contato e Reclamações</h2>
              <p>
                DPO / Encarregado de Dados:{" "}
                <a href="mailto:privacidade@bctododia.com.br" className="text-[#0077B6] hover:underline">
                  privacidade@bctododia.com.br
                </a>
              </p>
              <p className="mt-2">
                Você também pode peticionar diretamente à{" "}
                <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer"
                  className="text-[#0077B6] hover:underline">
                  ANPD (Autoridade Nacional de Proteção de Dados)
                </a>.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
            <Link href="/termos" className="text-sm text-[#0077B6] hover:underline">
              📄 Termos de Uso
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

/**
 * /onboarding
 * ────────────
 * Página de onboarding pós-OAuth Google.
 *
 * Cenários:
 *  A) ?step=escolher + cookie gbp_pending → múltiplos negócios, usuário escolhe
 *  B) ?erro=nenhum_negocio              → conta sem GBP → instrução manual
 *  C) ?erro=gbp_sem_acesso              → API de GBP não autorizou
 *  D) ?erro=negado                      → usuário cancelou o OAuth
 *  E) ?erro=...                         → erros genéricos
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OnboardingClient from "./OnboardingClient";
import crypto from "crypto";
import Link from "next/link";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function parsePendingCookie(cookieValue: string, secret: string) {
  try {
    const [b64, sig] = cookieValue.split(".");
    if (!b64 || !sig) return null;

    const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
    // Comparação segura (timing-safe) apenas se os tamanhos batem
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return null;
    }

    return JSON.parse(Buffer.from(b64, "base64url").toString());
  } catch {
    return null;
  }
}

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const step = params.step as string | undefined;
  const erro = params.erro as string | undefined;

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  // ── A) Múltiplos negócios — usuário escolhe ───────────────────────────────
  if (step === "escolher") {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get("gbp_pending")?.value;

    if (!cookieValue) {
      // Cookie expirado (10min), pedir para reconectar
      return <ErrorPage
        titulo="Sessão expirada"
        mensagem="A sessão de configuração expirou. Por favor, conecte o Google novamente."
        ctaHref="/api/google/business-connect"
        ctaLabel="Conectar Google novamente"
      />;
    }

    const secret = process.env.NEXTAUTH_SECRET ?? "dev";
    const pending = parsePendingCookie(cookieValue, secret);

    if (!pending || pending.userId !== session.user.id) {
      return <ErrorPage
        titulo="Dados inválidos"
        mensagem="Houve um problema com sua sessão. Por favor, tente novamente."
        ctaHref="/api/google/business-connect"
        ctaLabel="Tentar novamente"
      />;
    }

    return (
      <OnboardingClient
        locations={pending.locations}
        hasYoutube={!!(pending.youtubeChannelId)}
      />
    );
  }

  // ── B) Conta Google sem negócios no GBP ───────────────────────────────────
  if (erro === "nenhum_negocio") {
    return (
      <ErrorPage
        titulo="Restaurante não encontrado no Google"
        mensagem={
          <>
            <p>Não encontramos nenhum negócio vinculado à sua conta Google Business Profile.</p>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
              <p className="font-semibold text-amber-700 mb-2">Como resolver:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                <li>Acesse <a href="https://business.google.com" target="_blank" className="underline">business.google.com</a></li>
                <li>Cadastre ou reivindique seu restaurante</li>
                <li>Volte aqui e conecte o Google novamente</li>
              </ol>
            </div>
          </>
        }
        ctaHref="/api/google/business-connect"
        ctaLabel="Conectar Google novamente"
        secondaryHref="/dashboard/comerciante"
        secondaryLabel="Cadastrar manualmente"
      />
    );
  }

  // ── C) Sem acesso à API do GBP ────────────────────────────────────────────
  if (erro === "gbp_sem_acesso") {
    return (
      <ErrorPage
        titulo="Sem acesso ao Google Business"
        mensagem="Não conseguimos acessar o Google Business Profile da sua conta. Verifique se você autorizou todas as permissões solicitadas."
        ctaHref="/api/google/business-connect"
        ctaLabel="Tentar novamente"
        secondaryHref="/dashboard/comerciante"
        secondaryLabel="Configurar manualmente"
      />
    );
  }

  // ── D) Usuário cancelou o OAuth ───────────────────────────────────────────
  if (erro === "negado") {
    return (
      <ErrorPage
        titulo="Autorização cancelada"
        mensagem="Você cancelou a autorização do Google. Sem problema — você pode conectar quando quiser ou configurar tudo manualmente."
        ctaHref="/api/google/business-connect"
        ctaLabel="Tentar novamente"
        secondaryHref="/dashboard/comerciante"
        secondaryLabel="Configurar manualmente"
      />
    );
  }

  // ── E) Erro genérico ──────────────────────────────────────────────────────
  return (
    <ErrorPage
      titulo="Algo deu errado"
      mensagem={`Ocorreu um erro durante a conexão com o Google (${erro ?? "desconhecido"}). Por favor, tente novamente.`}
      ctaHref="/api/google/business-connect"
      ctaLabel="Tentar novamente"
      secondaryHref="/dashboard/comerciante"
      secondaryLabel="Ir para o painel"
    />
  );
}

// ─── Componente de erro reutilizável ─────────────────────────────────────────

function ErrorPage({
  titulo,
  mensagem,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  titulo: string;
  mensagem: React.ReactNode;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[#023E58] mb-4">{titulo}</h1>
        <div className="text-gray-600 text-sm mb-8">{mensagem}</div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={ctaHref}
            className="bg-[#0077B6] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#005f92] transition-colors"
          >
            {ctaLabel}
          </a>
          {secondaryHref && (
            <a
              href={secondaryHref}
              className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {secondaryLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

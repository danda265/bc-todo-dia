/**
 * GET /api/google/business-connect/callback
 * ──────────────────────────────────────────
 * Pipeline completo de auto-import após o Google autorizar:
 *
 *  1. Troca code por tokens (access + refresh)
 *  2. Salva tokens no User
 *  3. Lista todos os negócios que esta conta Google gerencia (GBP API)
 *  4. Enriquece com dados do Google Places (rating, fotos, horários)
 *  5. Detecta canal do YouTube vinculado à mesma conta Google
 *  6. Se 1 negócio  → cria/atualiza Business automaticamente, onboarding completo
 *  7. Se vários      → salva lista em cookie, redireciona para /onboarding (seleção)
 *  8. Se nenhum      → redireciona para /onboarding com erro explicativo
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listarNegociosGBP, detectarYouTube, criarOuAtualizarBusinessDeGBP } from "@/lib/google-auto-import";
import crypto from "crypto";

function buildRedirectUri() {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/google/business-connect/callback`;
}

function redirectDashboard(req: NextRequest, msg?: string) {
  const url = new URL("/dashboard/comerciante", req.url);
  if (msg) url.searchParams.set("onboarding", msg);
  return NextResponse.redirect(url);
}

function redirectOnboarding(req: NextRequest, search: URLSearchParams) {
  const url = new URL("/onboarding", req.url);
  search.forEach((v, k) => url.searchParams.set(k, v));
  return NextResponse.redirect(url);
}

function signedCookie(payload: object, secret: string): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // ── Usuário cancelou ou negou permissão ───────────────────────────────────
  if (errorParam === "access_denied") {
    return redirectOnboarding(req, new URLSearchParams({ erro: "negado" }));
  }

  if (!code || !returnedState) {
    return redirectOnboarding(req, new URLSearchParams({ erro: "parametros_invalidos" }));
  }

  // ── Verificar state anti-CSRF ─────────────────────────────────────────────
  const cookieState = req.cookies.get("gbp_oauth_state")?.value;
  if (!cookieState || cookieState !== returnedState) {
    return redirectOnboarding(req, new URLSearchParams({ erro: "state_invalido" }));
  }

  // Decodificar state para extrair userId
  let userId: string;
  try {
    const decoded = Buffer.from(returnedState, "base64url").toString();
    const parts = decoded.split(":");
    // formato: {uuid}:{userId}:{sig}
    userId = parts[1];
    if (!userId) throw new Error("userId vazio");

    // Verificar assinatura
    const statePayload = `${parts[0]}:${parts[1]}`;
    const secret = process.env.NEXTAUTH_SECRET ?? "dev";
    const expectedSig = crypto.createHmac("sha256", secret).update(statePayload).digest("hex").slice(0, 16);
    if (parts[2] !== expectedSig) throw new Error("sig inválida");
  } catch {
    return redirectOnboarding(req, new URLSearchParams({ erro: "state_invalido" }));
  }

  // ── Validar que a sessão bate com o userId do state ───────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id !== userId) {
    return redirectOnboarding(req, new URLSearchParams({ erro: "sessao_invalida" }));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  // ── 1. Trocar code por tokens ─────────────────────────────────────────────
  let accessToken: string;
  let refreshToken: string | null = null;
  let expiresAt: Date;
  let googleEmail: string;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: buildRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error("[BUSINESS-CONNECT] Token exchange failed:", err);
      return redirectOnboarding(req, new URLSearchParams({ erro: "token_falhou" }));
    }

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token ?? null;
    expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000);

    // Buscar email da conta Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userInfo = await userInfoRes.json();
    googleEmail = userInfo.email ?? "";
  } catch (err) {
    console.error("[BUSINESS-CONNECT] Token exchange error:", err);
    return redirectOnboarding(req, new URLSearchParams({ erro: "token_falhou" }));
  }

  // ── 2. Salvar tokens no User ──────────────────────────────────────────────
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleBizAccessToken: accessToken,
      googleBizRefreshToken: refreshToken,
      googleBizExpiresAt: expiresAt,
      googleBizEmail: googleEmail,
      googleBizConnectedAt: new Date(),
    },
  });

  // ── 3. Listar negócios no Google Business Profile ─────────────────────────
  let negocios;
  try {
    negocios = await listarNegociosGBP(accessToken);
  } catch (err: any) {
    console.error("[BUSINESS-CONNECT] GBP list error:", err.message);
    // Pode ser que a conta não tenha GBP — ainda assim marcar que conectou
    return redirectOnboarding(req, new URLSearchParams({ erro: "gbp_sem_acesso" }));
  }

  // ── 4. Detectar canal do YouTube ──────────────────────────────────────────
  const youtube = await detectarYouTube(accessToken);

  // ── 5. Roteamento conforme número de negócios encontrados ─────────────────
  if (negocios.length === 0) {
    // Nenhum negócio na conta — redirecionar para seleção manual
    const res = redirectOnboarding(req, new URLSearchParams({ erro: "nenhum_negocio" }));
    res.cookies.delete("gbp_oauth_state");
    return res;
  }

  if (negocios.length === 1) {
    // Fluxo feliz: 1 negócio → auto-import completo, zero cliques extras
    try {
      await criarOuAtualizarBusinessDeGBP(userId, negocios[0], youtube);
    } catch (err) {
      console.error("[BUSINESS-CONNECT] criarBusiness error:", err);
      // Não é fatal — redireciona para dashboard com aviso
    }

    const res = redirectDashboard(req, "sucesso");
    res.cookies.delete("gbp_oauth_state");
    return res;
  }

  // Múltiplos negócios → salvar em cookie e deixar usuário escolher
  const secret = process.env.NEXTAUTH_SECRET ?? "dev";
  const pendingPayload = {
    userId,
    youtubeChannelId: youtube?.channelId,
    youtubeChannelUrl: youtube?.channelUrl,
    locations: negocios.map((n) => ({
      gbpName: n.gbpName,
      gbpTitle: n.gbpTitle,
      gbpAddress: n.gbpAddress,
      gbpCategoria: n.gbpCategoria,
      placeId: n.placeId,
      rating: n.rating,
      reviewCount: n.reviewCount,
    })),
  };

  const cookieValue = signedCookie(pendingPayload, secret);
  const res = redirectOnboarding(req, new URLSearchParams({ step: "escolher" }));

  res.cookies.set("gbp_pending", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutos para escolher
  });
  res.cookies.delete("gbp_oauth_state");
  return res;
}

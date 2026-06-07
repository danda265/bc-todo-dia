/**
 * GET /api/google/business-connect
 * ─────────────────────────────────
 * Inicia o fluxo OAuth com todos os escopos necessários de uma vez:
 *   - openid email profile       → saber quem é
 *   - business.manage            → Google Business Profile
 *   - youtube.readonly           → canal do YouTube
 *
 * O cliente só clica em "Conectar com Google" — o app faz o resto.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

function buildRedirectUri() {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/google/business-connect/callback`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth não configurado" }, { status: 503 });
  }

  // Estado anti-CSRF: UUID aleatório + userId
  const stateToken = crypto.randomUUID();
  const statePayload = `${stateToken}:${session.user.id}`;

  // Assinar o estado com NEXTAUTH_SECRET para evitar manipulação
  const secret = process.env.NEXTAUTH_SECRET ?? "dev";
  const sig = crypto.createHmac("sha256", secret).update(statePayload).digest("hex").slice(0, 16);
  const state = Buffer.from(`${statePayload}:${sig}`).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: buildRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",    // para receber refresh_token
    prompt: "consent",         // forçar consent para garantir refresh_token mesmo se já autorizou antes
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  // Salvar state em cookie HttpOnly para verificar no callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("gbp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google/business-connect",
    maxAge: 600, // 10 minutos
  });

  return response;
}

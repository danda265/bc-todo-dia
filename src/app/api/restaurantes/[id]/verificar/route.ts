// POST /api/restaurantes/[id]/verificar — Inicia fluxo de verificação de propriedade
// GET  /api/restaurantes/[id]/verificar — Status atual de verificação
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarDono } from "@/lib/auth-helpers";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Scopes necessários para verificar se é manager no Google Business Profile
const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/business.manage",
].join(" ");

// GET — status da verificação
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  const biz = await prisma.business.findUnique({
    where: { id },
    select: {
      verificacaoStatus: true,
      verificacaoMetodo: true,
      verificadoEm: true,
      googleOwnerEmail: true,
      googlePlaceId: true,
    },
  });

  return NextResponse.json({ verificacao: biz });
}

// POST — iniciar OAuth de verificação via Google Business Profile
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { erro } = await verificarDono(id);
  if (erro) return erro;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      error: "Google OAuth não configurado. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env",
    }, { status: 503 });
  }

  // Marcar como verificação pendente
  await prisma.business.update({
    where: { id },
    data: { verificacaoStatus: "PENDENTE_ADMIN" },
  });

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/google/callback`;

  // State contém o businessId para usar no callback
  const state = Buffer.from(JSON.stringify({ businessId: id })).toString("base64url");

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.json({ authUrl: authUrl.toString() });
}

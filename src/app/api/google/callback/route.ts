// GET /api/google/callback — Callback do OAuth de verificação Google Business
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { verificarProprietarioGBP } from "@/lib/google-places";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = `${process.env.NEXTAUTH_URL}/dashboard/comerciante/restaurante`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${redirectBase}?verificacao=cancelada`);
  }

  // Decodificar state
  let businessId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    businessId = decoded.businessId;
  } catch {
    return NextResponse.redirect(`${redirectBase}?verificacao=erro`);
  }

  // Verificar que o usuário logado é dono do negócio
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(`/entrar`);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, googlePlaceId: true, name: true },
  });

  if (!business || business.ownerId !== user.id) {
    return NextResponse.redirect(`${redirectBase}?verificacao=erro`);
  }

  // Trocar code por access_token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${redirectBase}?verificacao=erro&msg=token_invalido`);
  }

  // Buscar email da conta Google que autorizou
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  const ownerEmail = profile.email;

  // Verificar se é manager/owner no Google Business Profile
  let verificado = false;
  let metodo = "PENDENTE_ADMIN";

  if (business.googlePlaceId) {
    try {
      const resultado = await verificarProprietarioGBP(tokenData.access_token, business.googlePlaceId);
      if (resultado.verificado) {
        verificado = true;
        metodo = "GOOGLE_OAUTH";
      }
    } catch {
      // GBP API pode falhar; cairá em verificação manual
    }
  } else {
    // Sem Place ID vinculado: se conseguiu fazer OAuth com conta Google Business,
    // vai para verificação manual (admin aprova)
    metodo = "PENDENTE_ADMIN";
  }

  // Salvar resultado
  await prisma.business.update({
    where: { id: businessId },
    data: {
      verificacaoStatus: verificado ? "VERIFICADO_GOOGLE" : "PENDENTE_ADMIN",
      verificacaoMetodo: metodo,
      verificadoEm: verificado ? new Date() : null,
      googleOwnerEmail: ownerEmail,
    },
  });

  const status = verificado ? "sucesso" : "pendente_admin";
  return NextResponse.redirect(`${redirectBase}?verificacao=${status}`);
}

// Endpoint de diagnóstico temporário — remover após resolver o problema
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "✅ definido" : "❌ AUSENTE",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ definido" : "❌ AUSENTE",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ definido" : "❌ AUSENTE",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✅ definido" : "❌ AUSENTE",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✅ definido" : "❌ AUSENTE",
      // Mostrar apenas os primeiros caracteres para verificar formato
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL?.substring(0, 40) ?? "N/A",
    },
  };

  // Testar conexão com banco
  try {
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    results.db = {
      status: "✅ conectado",
      users: userCount,
      accounts: accountCount,
    };
  } catch (e: unknown) {
    const error = e as Error;
    results.db = {
      status: "❌ ERRO",
      message: error.message,
      name: error.name,
    };
  }

  // Testar se o schema está atualizado (tabela PasswordResetToken)
  try {
    await prisma.passwordResetToken.count();
    results.schema = "✅ schema completo";
  } catch (e: unknown) {
    const error = e as Error;
    results.schema = `❌ schema desatualizado: ${error.message}`;
  }

  return NextResponse.json(results);
}

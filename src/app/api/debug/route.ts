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
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL?.substring(0, 50) ?? "N/A",
      DATABASE_URL_HOST: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "N/A",
    },
  };

  // Testar conexão com banco
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, password: true },
    });
    const accountCount = await prisma.account.count();
    results.db = {
      status: "✅ conectado",
      userCount: users.length,
      accounts: accountCount,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        hasPassword: !!u.password,
      })),
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

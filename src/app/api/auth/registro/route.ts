import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole, Bairro } from "@prisma/client";
import { z } from "zod";

// ─── Rate limit: máx 5 registros / hora / IP ─────────────────────────────────
// Impede criação em massa de contas falsas para fraudar avaliações
const registroRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRegistroRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hora
  const max = 5;
  const entry = registroRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    registroRateMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

const registroSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole),
  bairro: z.nativeEnum(Bairro).optional(),
  consentAccepted: z.boolean().refine((v) => v === true, {
    message: "Você precisa aceitar os termos para continuar",
  }),
  marketingOptIn: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  // Rate limit por IP — bloqueia criação de contas em massa
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRegistroRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas de cadastro. Tente novamente em 1 hora." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    const body = await req.json();
    const data = registroSchema.parse(body);

    // Verificar se email já existe
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: data.role,
        bairro: data.bairro,
        consentAcceptedAt: new Date(),
        consentVersion: "1.0",
        marketingOptIn: data.marketingOptIn,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[REGISTRO]", error);
    return NextResponse.json(
      { error: "Erro interno ao criar conta" },
      { status: 500 }
    );
  }
}

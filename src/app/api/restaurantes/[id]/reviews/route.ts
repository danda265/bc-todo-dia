/**
 * GET  /api/restaurantes/[id]/reviews — lista pública de avaliações
 * POST /api/restaurantes/[id]/reviews — envia avaliação (requer auth)
 *
 * Segurança:
 *  - Rate limit: 3 reviews / hora por IP (in-memory, dev; Redis em prod)
 *  - 1 review por usuário por restaurante (unique constraint no DB)
 *  - Validação Zod: rating 1–5 (int), comment 0 | 10–1000 chars
 *  - Email do avaliador NUNCA retornado no GET
 *  - providerUsed registrado para auditoria anti-falso
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";

// ─── Rate limit simples (in-memory) ──────────────────────────────────────────
// Em produção substituir por Redis + sliding window
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hora
  const maxReviews = 3;

  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  if (entry.count >= maxReviews) return false;
  entry.count++;
  return true;
}

// ─── GET — lista pública ──────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = 10;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { businessId: id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            // email NUNCA exposto — LGPD
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.review.count({ where: { businessId: id } }),
  ]);

  // Calcular média e distribuição de estrelas
  const stats = await prisma.review.groupBy({
    by: ["rating"],
    where: { businessId: id },
    _count: true,
  });

  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let somaRating = 0;
  stats.forEach((s: { rating: number; _count: number }) => {
    distribuicao[s.rating] = s._count;
    somaRating += s.rating * s._count;
  });
  const media = total > 0 ? somaRating / total : null;

  return NextResponse.json({
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / take),
    media: media ? Math.round(media * 10) / 10 : null,
    distribuicao,
  });
}

// ─── Schema de validação ──────────────────────────────────────────────────────
const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .max(1000, "Comentário muito longo (máx 1000 caracteres)")
    .refine((v) => !v || v.trim().length >= 10, {
      message: "Comentário deve ter pelo menos 10 caracteres",
    })
    .optional()
    .nullable(),
});

// ─── POST — enviar avaliação ──────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: businessId } = await params;

  // Autenticação obrigatória
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Você precisa entrar com sua conta Google para avaliar" },
      { status: 401 }
    );
  }

  // Rate limit por IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Limite de avaliações excedido. Tente novamente em 1 hora." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  // Negócio deve existir e estar ativo
  const business = await prisma.business.findFirst({
    where: { id: businessId, status: "ATIVO" },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
  }

  // Validação do body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { rating, comment } = result.data;

  // Verificar se usuário já avaliou (unique constraint já garante no DB,
  // mas retornar mensagem amigável antes de tentar inserir)
  const jaAvaliou = await prisma.review.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
    select: { id: true },
  });

  if (jaAvaliou) {
    return NextResponse.json(
      { error: "Você já avaliou este restaurante. Edite ou delete sua avaliação existente." },
      { status: 409 }
    );
  }

  // Verificar qual provider o usuário usou (para badge anti-fake)
  const account = await prisma.account.findFirst({
    where: { userId: user.id, provider: "google" },
    select: { id: true },
  });
  const providerUsed = account ? "google" : "credentials";

  // Criar review
  const review = await prisma.review.create({
    data: {
      businessId,
      userId: user.id,
      rating,
      comment: comment?.trim() || null,
      providerUsed,
    },
    include: {
      user: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}

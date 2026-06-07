import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

/** Verifica se o usuário autenticado é dono do negócio */
export async function verificarDono(businessId: string) {
  const user = await getSessionUser();
  if (!user) return { erro: NextResponse.json({ error: "Não autenticado" }, { status: 401 }), user: null, business: null };

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, slug: true, name: true, status: true },
  });

  if (!business) return { erro: NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 }), user, business: null };
  if (business.ownerId !== user.id) return { erro: NextResponse.json({ error: "Sem permissão" }, { status: 403 }), user, business: null };

  return { erro: null, user, business };
}

/** Requer que o usuário seja COMERCIANTE */
export async function requerComerciante() {
  const user = await getSessionUser();
  if (!user) return { erro: NextResponse.json({ error: "Não autenticado" }, { status: 401 }), user: null };
  if (user.role !== UserRole.COMERCIANTE) return { erro: NextResponse.json({ error: "Apenas comerciantes podem acessar este recurso" }, { status: 403 }), user: null };
  return { erro: null, user };
}

/**
 * Requer que o usuário seja admin.
 * Admins são identificados pelo email na variável ADMIN_EMAILS (separados por vírgula).
 * Ex: ADMIN_EMAILS="admin@bc.com,suporte@bc.com"
 */
export async function requerAdmin() {
  const user = await getSessionUser();
  if (!user) return { erro: NextResponse.json({ error: "Não autenticado" }, { status: 401 }), user: null };

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) {
    return { erro: NextResponse.json({ error: "Acesso negado" }, { status: 403 }), user: null };
  }

  return { erro: null, user };
}

/** Verifica se um email é admin (para uso no client) */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/**
 * proxy.ts  (Next.js 16 — substitui middleware.ts)
 * ──────────────────────────────────────────────────
 * Proteção de rotas via NextAuth JWT.
 * Roda no Edge Runtime — sem acesso ao Prisma ou Node APIs.
 *
 * Regras:
 *  /dashboard/comerciante/** → requer sessão + role COMERCIANTE
 *  /dashboard/**             → requer sessão (qualquer role)
 *  /onboarding               → requer sessão
 *  /api/restaurantes/**      → requer sessão (401 JSON para requests de API)
 *  /api/google/**            → requer sessão (401 JSON)
 *  Demais rotas              → públicas
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Rota de comerciante mas usuário tem outra role
    if (
      pathname.startsWith("/dashboard/comerciante") &&
      token?.role !== "COMERCIANTE"
    ) {
      // Redirecionar para home com aviso
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Retorna true se o usuário pode acessar a rota
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Rotas de API protegidas → retornar false retorna JSON 401
        if (
          pathname.startsWith("/api/restaurantes") ||
          pathname.startsWith("/api/google/business-connect") ||
          pathname.startsWith("/api/admin")
        ) {
          return !!token;
        }

        // Páginas protegidas
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/onboarding") ||
          pathname === "/favoritos" ||
          pathname === "/perfil"
        ) {
          return !!token;
        }

        // Tudo mais é público
        return true;
      },
    },
    pages: {
      signIn: "/entrar",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/favoritos",
    "/perfil",
    "/api/restaurantes/:path*",
    "/api/google/business-connect/:path*",
    "/api/admin/:path*",
  ],
};

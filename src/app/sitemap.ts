import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // sempre dinâmico, nunca gera no build

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXTAUTH_URL ?? "https://bctododia.com.br";

  // Páginas estáticas
  const estaticas: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/restaurantes`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/explorar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/promocoes`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE}/contato`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/termos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacidade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Restaurantes ativos — com fallback vazio se banco não disponível no build
  let restauranteUrls: MetadataRoute.Sitemap = [];
  try {
    const restaurantes = await prisma.business.findMany({
      where: { status: "ATIVO" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    restauranteUrls = restaurantes.map((r) => ({
      url: `${BASE}/restaurante/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Banco indisponível durante build — retornar só páginas estáticas
  }

  return [...estaticas, ...restauranteUrls];
}

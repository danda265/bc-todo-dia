import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = process.env.NEXTAUTH_URL ?? "https://bctododia.com.br";

  // Restaurantes ativos
  const restaurantes = await prisma.business.findMany({
    where: { status: "ATIVO" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const restauranteUrls = restaurantes.map((r) => ({
    url: `${BASE}/restaurante/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

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

  return [...estaticas, ...restauranteUrls];
}

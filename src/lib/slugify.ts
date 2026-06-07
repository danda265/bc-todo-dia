import slugifyLib from "slugify";

export function makeSlug(name: string): string {
  return slugifyLib(name, {
    lower: true,
    strict: true,
    locale: "pt",
    trim: true,
  });
}

export async function uniqueSlug(name: string, prisma: any, excludeId?: string): Promise<string> {
  const base = makeSlug(name);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

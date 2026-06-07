// Upload de arquivos — armazenamento local em /public/uploads (dev)
// Em produção: trocar por Vercel Blob, Cloudinary, ou S3
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_FOTO_MB = 5;
export const MAX_VIDEO_MB = 50;
export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const TIPOS_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];

export async function salvarArquivo(
  file: File,
  tipo: "foto" | "video",
  businessSlug: string
): Promise<{ url: string; erro?: string }> {
  const maxMb = tipo === "foto" ? MAX_FOTO_MB : MAX_VIDEO_MB;
  const tiposPermitidos = tipo === "foto" ? TIPOS_FOTO : TIPOS_VIDEO;

  if (!tiposPermitidos.includes(file.type)) {
    return { url: "", erro: `Tipo de arquivo inválido. Permitidos: ${tiposPermitidos.join(", ")}` };
  }

  if (file.size > maxMb * 1024 * 1024) {
    return { url: "", erro: `Arquivo muito grande. Máximo: ${maxMb}MB` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? (tipo === "foto" ? "jpg" : "mp4");
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", businessSlug, tipo === "foto" ? "fotos" : "videos");

  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { url: `/uploads/${businessSlug}/${tipo === "foto" ? "fotos" : "videos"}/${filename}` };
}

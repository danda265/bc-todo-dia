"use client";
import { useState, useEffect, useRef } from "react";

type Media = { id: string; url: string; type: string; caption: string | null; isCover: boolean };

export default function MidiasPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string>("");
  const [medias, setMedias] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState("");
  const fotoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/restaurantes/meus")
      .then(r => r.json())
      .then(d => {
        if (d.restaurantes?.[0]) {
          setBusinessId(d.restaurantes[0].id);
          setBusinessSlug(d.restaurantes[0].slug);
          carregar(d.restaurantes[0].id);
        }
      });
  }, []);

  async function carregar(id: string) {
    const r = await fetch(`/api/restaurantes/${id}/midias`);
    const d = await r.json();
    setMedias(d.medias ?? []);
  }

  async function upload(file: File, tipo: "foto" | "video", isCover = false) {
    if (!businessId) return;
    setUploading(true);
    setErro("");
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("isCover", String(isCover));
    const r = await fetch(`/api/restaurantes/${businessId}/midias`, { method: "POST", body: fd });
    const d = await r.json();
    if (!r.ok) { setErro(d.error ?? "Erro no upload"); }
    else { carregar(businessId); }
    setUploading(false);
  }

  async function deletar(mediaId: string) {
    if (!businessId || !confirm("Deletar esta mídia?")) return;
    await fetch(`/api/restaurantes/${businessId}/midias/${mediaId}`, { method: "DELETE" });
    carregar(businessId);
  }

  async function definirCapa(mediaId: string) {
    if (!businessId) return;
    await fetch(`/api/restaurantes/${businessId}/midias/${mediaId}`, { method: "PATCH" });
    carregar(businessId);
  }

  const fotos = medias.filter(m => m.type === "FOTO");
  const videos = medias.filter(m => m.type === "VIDEO");

  if (!businessId) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Você ainda não tem um restaurante cadastrado.</p>
      <a href="/dashboard/comerciante/restaurante" className="mt-4 inline-block bg-[#0077B6] text-white px-6 py-3 rounded-xl">
        Cadastrar restaurante
      </a>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#023E58] mb-2">📸 Fotos & Vídeos</h1>
      <p className="text-sm text-gray-500 mb-6">Máximo 20 mídias por restaurante. Fotos: até 5MB. Vídeos: até 50MB.</p>

      {erro && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{erro}</div>}

      {/* Upload */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => e.target.files?.[0] && upload(e.target.files[0], "foto")} />
          <button onClick={() => fotoRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-[#0077B6]/30 rounded-2xl py-8 hover:border-[#0077B6] hover:bg-blue-50 transition-all text-center disabled:opacity-50">
            <div className="text-3xl mb-2">📷</div>
            <div className="text-sm font-medium text-[#0077B6]">{uploading ? "Enviando..." : "Adicionar foto"}</div>
            <div className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · até 5MB</div>
          </button>
        </div>
        <div>
          <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
            onChange={e => e.target.files?.[0] && upload(e.target.files[0], "video")} />
          <button onClick={() => videoRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-[#F4A261]/40 rounded-2xl py-8 hover:border-[#F4A261] hover:bg-orange-50 transition-all text-center disabled:opacity-50">
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-sm font-medium text-[#c3824e]">{uploading ? "Enviando..." : "Adicionar vídeo"}</div>
            <div className="text-xs text-gray-400 mt-1">MP4, WebM · até 50MB</div>
          </button>
        </div>
      </div>

      {/* Galeria de fotos */}
      {fotos.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-[#023E58] mb-3">Fotos ({fotos.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {fotos.map((f) => (
              <div key={f.id} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                <img src={f.url} alt="" className="w-full h-full object-cover" />
                {f.isCover && (
                  <div className="absolute top-2 left-2 bg-[#F4A261] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Capa
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {!f.isCover && (
                    <button onClick={() => definirCapa(f.id)}
                      className="text-xs bg-[#F4A261] text-white px-3 py-1 rounded-full hover:bg-[#c3824e] transition-colors">
                      Definir capa
                    </button>
                  )}
                  <button onClick={() => deletar(f.id)}
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors">
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vídeos */}
      {videos.length > 0 && (
        <div>
          <h2 className="font-semibold text-[#023E58] mb-3">Vídeos ({videos.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {videos.map((v) => (
              <div key={v.id} className="rounded-2xl overflow-hidden border border-gray-100 bg-black relative group">
                <video src={v.url} controls className="w-full aspect-video" preload="metadata" />
                <button onClick={() => deletar(v.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600">
                  Deletar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {medias.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          Nenhuma mídia ainda. Adicione fotos do seu restaurante!
        </div>
      )}
    </div>
  );
}

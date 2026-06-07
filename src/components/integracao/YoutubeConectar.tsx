"use client";
import { useState } from "react";

type YoutubeVideo = { id: string; title: string; thumbnail: string; url: string; publishedAt: string };

type Props = {
  businessId: string;
  channelUrl?: string | null;
  onSave?: (url: string | null) => void;
};

export default function YoutubeConectar({ businessId, channelUrl, onSave }: Props) {
  const [url, setUrl] = useState(channelUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [synced, setSynced] = useState(!!channelUrl);

  async function conectar() {
    if (!url.trim()) { setErro("Informe a URL do canal"); return; }
    setLoading(true); setErro(""); setSucesso("");
    const r = await fetch(`/api/restaurantes/${businessId}/youtube`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelUrl: url }),
    });
    const d = await r.json();
    if (!r.ok) setErro(d.error ?? "Erro ao conectar");
    else {
      setVideos(d.videos ?? []);
      setSynced(true);
      setSucesso(`✅ Canal conectado! ${d.total} vídeo(s) sincronizados.`);
      onSave?.(url);
    }
    setLoading(false);
  }

  async function desconectar() {
    if (!confirm("Desconectar o canal do YouTube?")) return;
    await fetch(`/api/restaurantes/${businessId}/youtube`, { method: "DELETE" });
    setUrl(""); setSynced(false); setVideos([]); setSucesso("Canal desconectado.");
    onSave?.(null);
  }

  return (
    <div>
      <h2 className="font-semibold text-[#023E58] mb-4 flex items-center gap-2">
        <span className="text-red-600">▶</span> YouTube
      </h2>

      {sucesso && <div className="text-green-700 text-xs mb-3">{sucesso}</div>}
      {erro && <div className="text-red-600 text-xs mb-3">{erro}</div>}

      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0077B6]"
          placeholder="https://youtube.com/@seucanal ou ID do canal"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={loading}
        />
        <button onClick={conectar} disabled={loading || !url.trim()}
          className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap">
          {loading ? "..." : synced ? "🔄 Sync" : "Conectar"}
        </button>
        {synced && (
          <button onClick={desconectar} className="border border-red-200 text-red-500 px-3 py-2 rounded-xl text-xs hover:bg-red-50">
            Remover
          </button>
        )}
      </div>

      {!process.env.NEXT_PUBLIC_HAS_YOUTUBE_KEY && (
        <p className="text-xs text-amber-600 mt-2">⚠️ Configure YOUTUBE_API_KEY no .env para ativar esta integração</p>
      )}

      {/* Preview dos vídeos sincronizados */}
      {videos.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">{videos.length} vídeos sincronizados:</div>
          <div className="grid grid-cols-3 gap-2">
            {videos.slice(0, 3).map(v => (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer"
                className="rounded-lg overflow-hidden border border-gray-100 hover:border-red-300 transition-colors">
                <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover" />
                <div className="p-1.5 text-xs text-gray-600 line-clamp-1">{v.title}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

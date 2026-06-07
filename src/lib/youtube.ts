// YouTube Data API v3 — puxar vídeos de canais públicos
// Não requer OAuth para canais públicos — apenas API key

const YT_API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY ?? "";

export type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string; // URL da thumbnail
  publishedAt: string;
  url: string;
  duration?: string;
};

export type YoutubeChannel = {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount?: string;
  videoCount?: string;
  customUrl?: string;
};

// Extrair Channel ID de uma URL do YouTube
export function extractChannelId(input: string): string | null {
  // Formatos aceitos:
  // https://www.youtube.com/@handle
  // https://www.youtube.com/channel/UCxxxxxxx
  // https://www.youtube.com/c/NomeDoCanal
  // https://www.youtube.com/user/NomeDoCanal
  // UCxxxxxxx (direto)

  const patterns = [
    /youtube\.com\/channel\/(UC[\w-]+)/,
    /youtube\.com\/@([\w.-]+)/,
    /youtube\.com\/c\/([\w.-]+)/,
    /youtube\.com\/user\/([\w.-]+)/,
    /^(UC[\w-]{22})$/, // Channel ID direto
  ];

  for (const pattern of patterns) {
    const match = input.trim().match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Resolver @handle ou nome para Channel ID
export async function resolveChannelId(input: string): Promise<string | null> {
  if (!KEY) return null;

  const raw = extractChannelId(input);
  if (raw?.startsWith("UC")) return raw;

  // Buscar pelo handle ou nome
  const handle = raw ?? input.replace(/^@/, "").trim();
  const url = `${YT_API}/channels?forHandle=@${handle}&part=id&key=${KEY}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  const data = await res.json();
  if (data.items?.[0]?.id) return data.items[0].id;

  // Tentar via search
  const searchUrl = `${YT_API}/search?q=${encodeURIComponent(handle)}&type=channel&part=id&maxResults=1&key=${KEY}`;
  const sRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
  const sData = await sRes.json();
  return sData.items?.[0]?.id?.channelId ?? null;
}

// Buscar informações do canal
export async function getChannelInfo(channelId: string): Promise<YoutubeChannel | null> {
  if (!KEY) return null;

  const url = `${YT_API}/channels?id=${channelId}&part=snippet,statistics&key=${KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();

  const ch = data.items?.[0];
  if (!ch) return null;

  return {
    channelId,
    title: ch.snippet.title,
    description: ch.snippet.description,
    thumbnail: ch.snippet.thumbnails?.medium?.url ?? ch.snippet.thumbnails?.default?.url,
    subscriberCount: ch.statistics?.subscriberCount,
    videoCount: ch.statistics?.videoCount,
    customUrl: ch.snippet.customUrl,
  };
}

// Buscar vídeos mais recentes do canal
export async function getChannelVideos(channelId: string, maxResults = 12): Promise<YoutubeVideo[]> {
  if (!KEY) return [];

  // Buscar uploads playlist
  const chUrl = `${YT_API}/channels?id=${channelId}&part=contentDetails&key=${KEY}`;
  const chRes = await fetch(chUrl, { next: { revalidate: 3600 } });
  const chData = await chRes.json();

  const uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Buscar vídeos da playlist
  const plUrl = `${YT_API}/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=${maxResults}&key=${KEY}`;
  const plRes = await fetch(plUrl, { next: { revalidate: 3600 } });
  const plData = await plRes.json();

  return (plData.items ?? []).map((item: any) => {
    const snippet = item.snippet;
    const videoId = snippet.resourceId?.videoId;
    return {
      id: videoId,
      title: snippet.title,
      description: snippet.description?.slice(0, 200) ?? "",
      thumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? "",
      publishedAt: snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }).filter((v: YoutubeVideo) => v.id && v.title !== "Deleted video" && v.title !== "Private video");
}

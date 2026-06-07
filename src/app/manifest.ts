import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BC Todo Dia",
    short_name: "BC Todo Dia",
    description: "Restaurantes, promoções e o melhor de Balneário Camboriú",
    start_url: "/",
    display: "standalone",
    background_color: "#023E58",
    theme_color: "#0077B6",
    orientation: "portrait",
    categories: ["food", "lifestyle", "travel"],
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    shortcuts: [
      {
        name: "Restaurantes",
        url: "/restaurantes",
        description: "Ver restaurantes em BC",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Promoções",
        url: "/promocoes",
        description: "Ofertas ativas agora",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}

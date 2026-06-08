import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | BC Todo Dia",
    default: "BC Todo Dia — Balneário Camboriú o ano inteiro",
  },
  description:
    "A plataforma que conecta comércio local, moradores e turistas em Balneário Camboriú — não só na alta temporada.",
  keywords: ["Balneário Camboriú", "comércio local", "turismo", "ofertas", "BC"],
  openGraph: {
    title: "BC Todo Dia",
    description: "Balneário Camboriú o ano inteiro",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        <Providers>
          {children}
          <footer className="mt-auto border-t border-gray-100 bg-white py-4 px-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} BC Todo Dia — Desenvolvido por{" "}
            <span className="font-medium text-gray-500">Anderson Rodrigo Costa</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

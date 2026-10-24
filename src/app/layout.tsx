import type { Metadata, Viewport } from "next";
import { EB_Garamond, Geist_Mono, Source_Sans_3 } from "next/font/google";
import { Shell } from "@/components/Shell";
import { ProvedorDados } from "@/lib/store";
import "./globals.css";

// Serifada clássica para títulos; sans humanista para dados, tabelas e formulários.
const titulo = EB_Garamond({ variable: "--font-titulo", subsets: ["latin"], weight: ["500", "600", "700"] });
const texto = Source_Sans_3({ variable: "--font-texto", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgroSentinela — gestão inteligente de insumos",
  description: "Transforma registros de estoque da propriedade rural em alertas priorizados e justificados. AGROHACK 2026/2 · Equipe 3 Hacketeers.",
};

export const viewport: Viewport = { themeColor: "#2b4220" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${titulo.variable} ${texto.variable} ${geistMono.variable} antialiased`}>
        <ProvedorDados>
          <Shell>{children}</Shell>
        </ProvedorDados>
      </body>
    </html>
  );
}

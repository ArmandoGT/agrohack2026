import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Shell } from "@/components/Shell";
import { ProvedorDados } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgroSentinela — gestão inteligente de insumos",
  description: "Transforma registros de estoque da propriedade rural em alertas priorizados e justificados. AGROHACK 2026/2 · Equipe 3 Hacketeers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProvedorDados>
          <Shell>{children}</Shell>
        </ProvedorDados>
      </body>
    </html>
  );
}

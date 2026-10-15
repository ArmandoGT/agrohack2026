import type { Metadata } from "next";
import { Oswald, DM_Sans } from "next/font/google";
import { Apresentacao } from "./Apresentacao";

// Fontes servidas pelo próprio app: a apresentação funciona sem internet (plano B).
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "AgroSentinela — Pitch AGROHACK 2026/2",
  description: "Apresentação de 5 minutos da equipe 3 Hacketeers.",
};

export default function PaginaPitch() {
  return (
    <div className={`${oswald.variable} ${dmSans.variable}`}>
      <Apresentacao />
    </div>
  );
}

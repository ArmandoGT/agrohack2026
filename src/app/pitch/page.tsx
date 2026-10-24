import type { Metadata } from "next";
import { Apresentacao } from "./Apresentacao";

// As fontes (EB Garamond e Source Sans 3) vêm do layout do app via next/font, servidas pelo
// próprio app: a apresentação funciona sem internet (plano B).

export const metadata: Metadata = {
  title: "AgroSentinela — Pitch AGROHACK 2026/2",
  description: "Apresentação de 5 minutos da equipe 3 Hacketeers.",
};

export default function PaginaPitch() {
  return <Apresentacao />;
}

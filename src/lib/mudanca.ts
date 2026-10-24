// Diff de alertas entre duas análises: o que surgiu, o que foi resolvido e o que mudou de nível.
// Usado pelo loop de reanálise (store.tsx) e pelo teste da demonstração.

import type { Alerta, Analise, Nivel } from "./engine/types";

export interface Mudanca {
  descricao: string;
  novos: Alerta[];
  resolvidos: Alerta[];
  mudaramNivel: { antes: Nivel; depois: Alerta }[];
}

const chaveAlerta = (a: Alerta) => `${a.detector}|${a.produtoKey}|${a.evidencias.lote ?? a.evidencias.data ?? ""}`;

export function comparar(antes: Analise, depois: Analise, descricao: string): Mudanca {
  const mapaAntes = new Map(antes.alertas.map((a) => [chaveAlerta(a), a]));
  const mapaDepois = new Map(depois.alertas.map((a) => [chaveAlerta(a), a]));
  return {
    descricao,
    novos: depois.alertas.filter((a) => !mapaAntes.has(chaveAlerta(a))),
    resolvidos: antes.alertas.filter((a) => !mapaDepois.has(chaveAlerta(a))),
    mudaramNivel: depois.alertas
      .filter((a) => mapaAntes.has(chaveAlerta(a)) && mapaAntes.get(chaveAlerta(a))!.nivel !== a.nivel)
      .map((a) => ({ antes: mapaAntes.get(chaveAlerta(a))!.nivel, depois: a })),
  };
}

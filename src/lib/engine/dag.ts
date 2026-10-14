// Orquestrador do pipeline de análise como grafo acíclico (DAG).
// Cada nó declara de quem depende; a execução segue a ordem topológica
// e registra tempo e resumo de cada etapa (exibidos na tela "Como funciona").

import type { DagExecucao } from "./types";

export interface No<S> {
  id: string;
  rotulo: string;
  dependeDe: string[];
  executar: (estado: S) => string; // devolve um resumo legível do que produziu
}

export function ordemTopologica<S>(nos: No<S>[]): No<S>[] {
  const porId = new Map(nos.map((n) => [n.id, n]));
  const grauEntrada = new Map(nos.map((n) => [n.id, n.dependeDe.length]));
  for (const n of nos) for (const d of n.dependeDe) if (!porId.has(d)) throw new Error(`Nó ${n.id} depende de ${d}, que não existe`);
  const fila = nos.filter((n) => n.dependeDe.length === 0);
  const ordem: No<S>[] = [];
  while (fila.length) {
    const n = fila.shift()!;
    ordem.push(n);
    for (const m of nos) {
      if (!m.dependeDe.includes(n.id)) continue;
      grauEntrada.set(m.id, grauEntrada.get(m.id)! - 1);
      if (grauEntrada.get(m.id) === 0) fila.push(m);
    }
  }
  if (ordem.length !== nos.length) throw new Error("O pipeline tem um ciclo");
  return ordem;
}

export function executarDag<S>(nos: No<S>[], estado: S): DagExecucao[] {
  return ordemTopologica(nos).map((n) => {
    const t0 = performance.now();
    const saida = n.executar(estado);
    return { id: n.id, rotulo: n.rotulo, dependeDe: n.dependeDe, ms: performance.now() - t0, saida };
  });
}

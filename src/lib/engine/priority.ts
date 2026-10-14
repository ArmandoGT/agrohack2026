// Nó "score de prioridade" do DAG.
// score = base do nível + urgência (dias até o problema) + impacto financeiro - penalidade de baixa confiança

import type { Alerta, Confianca, Nivel, ProdutoAnalise } from "./types";

const BASE: Record<Nivel, number> = { critico: 70, atencao: 40, monitorar: 15 };

export function calcularScore(nivel: Nivel, dias: number | null, impacto: number | null, confianca: Confianca): number {
  let s = BASE[nivel];
  if (dias !== null) s += dias <= 0 ? 22 : dias <= 7 ? 18 : dias <= 15 ? 12 : dias <= 30 ? 6 : 0;
  if (impacto !== null && impacto > 0) s += Math.min(10, Math.log10(impacto + 1) * 2.2);
  if (confianca === "baixa") s -= 8;
  else if (confianca === "media") s -= 3;
  return Math.max(0, Math.min(100, Math.round(s)));
}

/** Confiança da estimativa a partir da quantidade de histórico disponível. */
export function confiancaHistorico(p: ProdutoAnalise): { confianca: Confianca; motivo: string } {
  if (p.saidasNaJanela >= 8 && p.diasHistorico >= 90)
    return { confianca: "alta", motivo: `${p.saidasNaJanela} retiradas na janela usada e ${p.diasHistorico} dias de histórico` };
  if (p.saidasNaJanela >= 4)
    return { confianca: "media", motivo: `${p.saidasNaJanela} retiradas na janela usada (${p.janelaTaxa})` };
  return { confianca: "baixa", motivo: `apenas ${p.saidasNaJanela} retirada(s) em ${p.janelaTaxa}; a estimativa é incerta` };
}

type NovoAlerta = Omit<Alerta, "id" | "score" | "produtoKey" | "produto" | "categoria"> & { produto?: ProdutoAnalise };

let seq = 0;
export function criarAlerta(p: ProdutoAnalise | { key: string; nome: string; categoria: string }, a: Omit<NovoAlerta, "produto">): Alerta {
  return {
    id: `${a.detector}:${p.key}:${seq++}`,
    produtoKey: p.key,
    produto: p.nome,
    categoria: p.categoria,
    score: calcularScore(a.nivel, a.diasAteProblema, a.impactoFinanceiro, a.confianca),
    ...a,
  };
}

export function ordenarAlertas(alertas: Alerta[]): Alerta[] {
  const ordem: Record<Nivel, number> = { critico: 0, atencao: 1, monitorar: 2 };
  return [...alertas].sort((a, b) => ordem[a.nivel] - ordem[b.nivel] || b.score - a.score);
}

// ---- formatação usada nas mensagens ----
export const fmtNum = (n: number, casas = 1) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: n >= 100 ? 0 : casas, minimumFractionDigits: 0 });
export const fmtR$ = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const fmtPreco = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtQtd = (n: number, u: string) => `${fmtNum(n)} ${u}`;

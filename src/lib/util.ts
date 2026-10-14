import type { Alerta, Analise, Nivel } from "./engine/types";

const ORDEM: Nivel[] = ["critico", "atencao", "monitorar"];

export function alertasDoProduto(a: Analise, key: string): Alerta[] {
  return a.alertas.filter((x) => x.produtoKey === key || String(x.evidencias.chaves ?? "").split(" | ").includes(key));
}

export function piorNivel(alertas: Alerta[]): Nivel | "ok" {
  return ORDEM.find((n) => alertas.some((a) => a.nivel === n)) ?? "ok";
}

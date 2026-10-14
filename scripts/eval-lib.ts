// Loop de avaliação: compara os alertas do motor com o gabarito das anomalias plantadas.

import { readFileSync } from "node:fs";
import { analisar } from "../src/lib/engine";
import type { Alerta, Analise, DetectorId } from "../src/lib/engine/types";
import { lerCsv } from "../src/lib/import";

export interface Gabarito {
  dataReferencia: string;
  gabarito: { detector: DetectorId; produtos: string[]; descricao: string }[];
  aceitaveis: { detector: DetectorId; produtos: string[] }[];
}

export interface LinhaRelatorio {
  detector: DetectorId;
  esperados: number;
  acertos: number;
  perdidos: string[];
  falsosPositivos: string[];
  recall: number;
  precisao: number;
}

export function carregar(csv = "data/simulado.csv", gt = "data/ground_truth.json") {
  const { movimentacoes, rejeitadas } = lerCsv(readFileSync(csv, "utf8"));
  const gabarito = JSON.parse(readFileSync(gt, "utf8")) as Gabarito;
  return { movimentacoes, rejeitadas, gabarito };
}

export function avaliar(analise: Analise, g: Gabarito): { linhas: LinhaRelatorio[]; recall: number; precisao: number } {
  const detectores = [...new Set([...g.gabarito.map((x) => x.detector), ...analise.alertas.map((a) => a.detector)])];
  const linhas: LinhaRelatorio[] = [];
  let tp = 0, esperadosTot = 0, fpTot = 0;
  for (const d of detectores) {
    const alertas = analise.alertas.filter((a) => a.detector === d);
    const esperados = g.gabarito.filter((x) => x.detector === d);
    const perdidos: string[] = [];
    let acertos = 0;
    for (const e of esperados) {
      if (alertas.some((a) => e.produtos.includes(a.produtoKey))) acertos++;
      else perdidos.push(e.descricao);
    }
    const validos = new Set([...esperados, ...g.aceitaveis.filter((x) => x.detector === d)].flatMap((x) => x.produtos));
    const fp = [...new Set(alertas.filter((a: Alerta) => !validos.has(a.produtoKey)).map((a) => `${a.produto} [${a.nivel}]`))];
    tp += acertos;
    esperadosTot += esperados.length;
    fpTot += fp.length;
    linhas.push({
      detector: d,
      esperados: esperados.length,
      acertos,
      perdidos,
      falsosPositivos: fp,
      recall: esperados.length ? acertos / esperados.length : 1,
      precisao: acertos + fp.length ? acertos / (acertos + fp.length) : 1,
    });
  }
  return { linhas, recall: esperadosTot ? tp / esperadosTot : 1, precisao: tp + fpTot ? tp / (tp + fpTot) : 1 };
}

export function rodar() {
  const { movimentacoes, rejeitadas, gabarito } = carregar();
  const analise = analisar(movimentacoes, { dataReferencia: gabarito.dataReferencia });
  return { analise, rejeitadas, ...avaliar(analise, gabarito) };
}

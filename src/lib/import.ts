// Leitura de arquivos CSV/XLSX -> movimentações normalizadas.

import Papa from "papaparse";
import { normalizarLinhas, type ResultadoImportacao } from "./engine/normalize";

export function lerCsv(texto: string): ResultadoImportacao {
  const r = Papa.parse<Record<string, unknown>>(texto.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return normalizarLinhas(r.data);
}

// Limite de tamanho: uma base de estoque real tem poucos MB, e o leitor de planilhas
// é a parte mais exposta a arquivos maliciosos (ver SECURITY.md).
export const TAMANHO_MAXIMO_MB = 15;

export async function lerArquivo(arquivo: File): Promise<ResultadoImportacao> {
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    throw new Error(`O arquivo tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB; o limite é ${TAMANHO_MAXIMO_MB} MB.`);
  }
  if (/\.(xlsx|xls)$/i.test(arquivo.name)) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await arquivo.arrayBuffer(), { type: "array", cellDates: true });
    const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: null });
    return normalizarLinhas(linhas);
  }
  return lerCsv(await arquivo.text());
}

const CABECALHO = ["produto", "categoria", "unidade", "quantidade", "estoque_minimo", "tipo", "data", "preco_aquisicao", "lote", "validade", "fornecedor", "destino", "responsavel"];

export function paraCsv(movs: import("./engine/types").Movimentacao[]): string {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linhas = movs.map((m) =>
    [m.produto, m.categoria, m.unidade, m.quantidade, m.estoqueMinimo, m.tipo, m.data, m.preco, m.lote, m.validade, m.fornecedor, m.destino, m.responsavel]
      .map(esc)
      .join(";"),
  );
  return [CABECALHO.join(";"), ...linhas].join("\n");
}

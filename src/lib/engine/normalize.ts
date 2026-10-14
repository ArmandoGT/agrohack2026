// Nó 1 e 2 do DAG: ingestão e normalização.
// Regra de ouro: campo ausente vira `null`, nunca zero.

import type { Movimentacao, TipoMov } from "./types";

export function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Normaliza nomes para comparação: sem acento, minúsculo, espaços simples. */
export function normalizarNome(s: string): string {
  return semAcento(String(s ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9%.,\-/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chaveCabecalho(s: string): string {
  return semAcento(String(s)).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const ALIASES: Record<keyof Omit<Movimentacao, "id" | "simulado">, string[]> = {
  produto: ["produto", "item", "insumo", "descricao", "nome_produto", "nome", "material"],
  categoria: ["categoria", "grupo", "tipo_produto", "classe", "familia"],
  unidade: ["unidade", "und", "un", "unid", "medida", "unidade_medida"],
  quantidade: ["quantidade", "qtd", "qtde", "quant", "qtd_movimentada"],
  estoqueMinimo: ["estoque_minimo", "minimo", "est_min", "estoque_min", "qtd_minima"],
  tipo: ["tipo", "tipo_movimentacao", "movimentacao", "operacao", "mov", "tipo_mov", "entrada_saida"],
  data: ["data", "data_movimentacao", "dt", "data_mov", "dia"],
  preco: ["preco", "preco_aquisicao", "valor_unitario", "preco_unitario", "custo", "custo_unitario", "preco_de_aquisicao"],
  lote: ["lote", "numero_lote", "n_lote"],
  validade: ["validade", "data_validade", "vencimento", "data_vencimento", "val"],
  fornecedor: ["fornecedor", "fornecedora", "vendedor"],
  destino: ["destino", "destino_retirada", "destino_da_retirada", "aplicacao", "local", "talhao", "setor"],
  responsavel: ["responsavel", "operador", "usuario", "funcionario", "colaborador"],
};

/** Descobre qual coluna do arquivo corresponde a cada campo (mapeamento flexível). */
export function mapearColunas(cabecalhos: string[]): Partial<Record<keyof typeof ALIASES, string>> {
  const mapa: Partial<Record<keyof typeof ALIASES, string>> = {};
  const usados = new Set<string>();
  for (const campo of Object.keys(ALIASES) as (keyof typeof ALIASES)[]) {
    for (const h of cabecalhos) {
      if (usados.has(h)) continue;
      if (ALIASES[campo].includes(chaveCabecalho(h))) {
        mapa[campo] = h;
        usados.add(h);
        break;
      }
    }
  }
  return mapa;
}

/** Aceita "1.234,56", "1234.56", "R$ 12,50". Retorna null se vazio/inválido. */
export function parseNumero(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim().replace(/R\$|\s/gi, "");
  if (s === "" || s === "-") return null;
  const temPonto = s.includes(".");
  const temVirgula = s.includes(",");
  if (temPonto && temVirgula) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (temVirgula) {
    s = s.replace(",", ".");
  } else if (temPonto && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Aceita dd/mm/aaaa, aaaa-mm-dd, dd-mm-aaaa, serial do Excel ou Date. */
export function parseData(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${ano}-${pad(+m[2])}-${pad(+m[1])}`;
  }
  return null;
}

export function parseTipo(v: unknown): TipoMov | null {
  const s = normalizarNome(String(v ?? ""));
  if (/^(e|entrada|compra|in|recebimento|ent)/.test(s)) return "entrada";
  if (/^(s|saida|retirada|consumo|out|baixa|uso|requisicao)/.test(s)) return "saida";
  return null;
}

/** Família de unidade + fator de conversão para a unidade base da família. */
export function unidadeBase(u: string): { base: string; fator: number } {
  const s = normalizarNome(u).replace(/\./g, "");
  const tabela: Record<string, [string, number]> = {
    kg: ["kg", 1], kgs: ["kg", 1], quilo: ["kg", 1], quilos: ["kg", 1], kilo: ["kg", 1],
    g: ["kg", 0.001], gr: ["kg", 0.001], grama: ["kg", 0.001], gramas: ["kg", 0.001],
    t: ["kg", 1000], ton: ["kg", 1000], tonelada: ["kg", 1000], toneladas: ["kg", 1000],
    l: ["L", 1], lt: ["L", 1], lts: ["L", 1], litro: ["L", 1], litros: ["L", 1],
    ml: ["L", 0.001], mililitro: ["L", 0.001],
    un: ["un", 1], und: ["un", 1], unid: ["un", 1], unidade: ["un", 1], unidades: ["un", 1],
    pc: ["un", 1], pca: ["un", 1], peca: ["un", 1], pecas: ["un", 1],
    m: ["m", 1], metro: ["m", 1], metros: ["m", 1],
    sc: ["sc", 1], saco: ["sc", 1], sacos: ["sc", 1],
    par: ["par", 1], pares: ["par", 1],
  };
  const hit = tabela[s];
  return hit ? { base: hit[0], fator: hit[1] } : { base: s || "un", fator: 1 };
}

/** Fator para converter uma quantidade de `de` para `para`; null se forem de famílias diferentes (ex.: kg × L). */
export function fatorConversao(de: string, para: string): number | null {
  const a = unidadeBase(de);
  const b = unidadeBase(para);
  return a.base === b.base ? a.fator / b.fator : null;
}

export interface ResultadoImportacao {
  movimentacoes: Movimentacao[];
  rejeitadas: { linha: number; motivo: string }[];
  mapa: ReturnType<typeof mapearColunas>;
}

/** Converte linhas cruas (CSV/XLSX) em movimentações normalizadas. */
export function normalizarLinhas(linhas: Record<string, unknown>[]): ResultadoImportacao {
  const cab = linhas.length ? Object.keys(linhas[0]) : [];
  const mapa = mapearColunas(cab);
  const get = (l: Record<string, unknown>, campo: keyof typeof mapa) => (mapa[campo] ? l[mapa[campo]!] : undefined);
  const txt = (v: unknown) => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim());
  const movimentacoes: Movimentacao[] = [];
  const rejeitadas: ResultadoImportacao["rejeitadas"] = [];

  linhas.forEach((l, i) => {
    const produto = txt(get(l, "produto"));
    const quantidade = parseNumero(get(l, "quantidade"));
    const tipo = parseTipo(get(l, "tipo"));
    const data = parseData(get(l, "data"));
    if (!produto) return rejeitadas.push({ linha: i + 2, motivo: "produto vazio" });
    if (quantidade === null) return rejeitadas.push({ linha: i + 2, motivo: "quantidade inválida" });
    if (!tipo) return rejeitadas.push({ linha: i + 2, motivo: "tipo (entrada/saída) não reconhecido" });
    if (!data) return rejeitadas.push({ linha: i + 2, motivo: "data inválida" });
    movimentacoes.push({
      id: txt(l["id"]) ?? `r${i + 1}`,
      produto,
      categoria: txt(get(l, "categoria")) ?? "Sem categoria",
      unidade: txt(get(l, "unidade")) ?? "un",
      quantidade: Math.abs(quantidade),
      estoqueMinimo: parseNumero(get(l, "estoqueMinimo")),
      tipo,
      data,
      preco: parseNumero(get(l, "preco")),
      lote: txt(get(l, "lote")),
      validade: parseData(get(l, "validade")),
      fornecedor: txt(get(l, "fornecedor")),
      destino: txt(get(l, "destino")),
      responsavel: txt(get(l, "responsavel")),
      simulado: String(l["simulado"] ?? "").toLowerCase() === "true" || undefined,
    });
  });
  return { movimentacoes, rejeitadas, mapa };
}

// ---- datas ----
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
export function somarDias(d: string, n: number): string {
  const t = new Date(Date.parse(d + "T00:00:00Z") + n * 86400000);
  return t.toISOString().slice(0, 10);
}
export function formatarData(d: string | null): string {
  if (!d) return "—";
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

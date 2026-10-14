// Persistência: navegador (padrão) ou Supabase (quando configurado por variáveis de ambiente).
// Só a chave pública (anon) é usada no front; nenhuma credencial fica no repositório.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Movimentacao } from "./engine/types";

export interface Snapshot {
  movimentacoes: Movimentacao[];
  fusoes: Record<string, string>;
  origem: string;
}

const CHAVE = "agrosentinela:v1";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let sb: SupabaseClient | null = null;
export const usaSupabase = Boolean(url && anon);
function cliente() {
  if (!sb && url && anon) sb = createClient(url, anon);
  return sb;
}

// ---- navegador ----
export function lerLocal(): Snapshot | null {
  try {
    const s = localStorage.getItem(CHAVE);
    return s ? (JSON.parse(s) as Snapshot) : null;
  } catch {
    return null;
  }
}
export function salvarLocal(s: Snapshot) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(s));
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
}

// ---- Supabase ----
type Linha = {
  id: string; produto: string; categoria: string; unidade: string; quantidade: number; estoque_minimo: number | null;
  tipo: "entrada" | "saida"; data: string; preco: number | null; lote: string | null; validade: string | null;
  fornecedor: string | null; destino: string | null; responsavel: string | null; simulado: boolean | null;
};
const paraLinha = (m: Movimentacao): Linha => ({
  id: m.id, produto: m.produto, categoria: m.categoria, unidade: m.unidade, quantidade: m.quantidade, estoque_minimo: m.estoqueMinimo,
  tipo: m.tipo, data: m.data, preco: m.preco, lote: m.lote, validade: m.validade, fornecedor: m.fornecedor,
  destino: m.destino, responsavel: m.responsavel, simulado: m.simulado ?? false,
});
const deLinha = (l: Linha): Movimentacao => ({
  id: l.id, produto: l.produto, categoria: l.categoria, unidade: l.unidade, quantidade: Number(l.quantidade),
  estoqueMinimo: l.estoque_minimo === null ? null : Number(l.estoque_minimo), tipo: l.tipo, data: l.data,
  preco: l.preco === null ? null : Number(l.preco), lote: l.lote, validade: l.validade, fornecedor: l.fornecedor,
  destino: l.destino, responsavel: l.responsavel, simulado: l.simulado ?? undefined,
});

export async function lerRemoto(): Promise<Snapshot | null> {
  const c = cliente();
  if (!c) return null;
  const todas: Linha[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await c.from("movimentacoes").select("*").order("data").range(de, de + 999);
    if (error) throw error;
    todas.push(...(data as Linha[]));
    if (!data || data.length < 1000) break;
  }
  const { data: f } = await c.from("fusoes").select("*");
  if (!todas.length) return null;
  return {
    movimentacoes: todas.map(deLinha),
    fusoes: Object.fromEntries((f ?? []).map((x: { origem: string; destino: string }) => [x.origem, x.destino])),
    origem: todas[0].simulado ? "simulado" : "banco de dados",
  };
}

export async function inserirRemoto(movs: Movimentacao[]) {
  const c = cliente();
  if (!c) return;
  for (let i = 0; i < movs.length; i += 500) {
    const { error } = await c.from("movimentacoes").upsert(movs.slice(i, i + 500).map(paraLinha));
    if (error) throw error;
  }
}
export async function substituirRemoto(movs: Movimentacao[]) {
  const c = cliente();
  if (!c) return;
  await c.from("movimentacoes").delete().neq("id", "");
  await inserirRemoto(movs);
}
export async function removerRemoto(id: string) {
  await cliente()?.from("movimentacoes").delete().eq("id", id);
}
export async function salvarFusoesRemoto(fusoes: Record<string, string>) {
  const c = cliente();
  if (!c) return;
  await c.from("fusoes").delete().neq("origem", "");
  const linhas = Object.entries(fusoes).map(([origem, destino]) => ({ origem, destino }));
  if (linhas.length) await c.from("fusoes").insert(linhas);
}

// Nós 4 e 5 do DAG: saldo por produto/lote (FEFO) e série de consumo diária.

import { diasEntre, fatorConversao, normalizarNome, unidadeBase } from "./normalize";
import type { LoteSaldo, Movimentacao, ProdutoAnalise } from "./types";

function maisFrequente(valores: string[]): string {
  const c = new Map<string, number>();
  for (const v of valores) c.set(v, (c.get(v) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** Escolhe a taxa de consumo mais recente que tenha dados suficientes. */
export function taxaConsumo(consumo: number[], saidasPorDia: number[]) {
  const n = consumo.length;
  const janela = (d: number) => {
    const ini = Math.max(0, n - d);
    let soma = 0;
    let saidas = 0;
    for (let i = ini; i < n; i++) {
      soma += consumo[i];
      saidas += saidasPorDia[i];
    }
    return { soma, saidas, dias: n - ini };
  };
  for (const d of [30, 90]) {
    const w = janela(d);
    if (w.saidas >= 3 && n >= d) return { taxa: w.soma / w.dias, rotulo: `últimos ${d} dias`, saidas: w.saidas };
  }
  const w = janela(n);
  return { taxa: w.dias ? w.soma / w.dias : 0, rotulo: `todo o histórico (${w.dias} dias)`, saidas: w.saidas };
}

export function montarProduto(key: string, movs: Movimentacao[], dataRef: string): ProdutoAnalise {
  const ordenadas = movs
    .filter((m) => m.data <= dataRef)
    .sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === "entrada" ? -1 : 1));
  const familia = maisFrequente(ordenadas.map((m) => unidadeBase(m.unidade).base));
  const unidade = maisFrequente(ordenadas.filter((m) => unidadeBase(m.unidade).base === familia).map((m) => m.unidade.trim())) || familia;
  const inicio = ordenadas[0]?.data ?? dataRef;
  const nDias = Math.max(1, diasEntre(inicio, dataRef) + 1);
  const consumoDiario = new Array(nDias).fill(0);
  const saidasPorDia = new Array(nDias).fill(0);
  const lotes: LoteSaldo[] = [];
  let saldo = 0;
  let estoqueMinimo: number | null = null;
  let precoReferencia: number | null = null;
  let unidadesIgnoradas = 0;
  let totalSaidas = 0;
  let totalEntradas = 0;
  let ultimaSaida: string | null = null;
  let ultimaEntrada: string | null = null;

  // FEFO: baixa primeiro o lote válido que vence antes. Lote já vencido na data da retirada
  // não é usado na lavoura; só recebe a baixa se não houver lote válido (retirada para descarte).
  const fefo = (data: string) => {
    const comSaldo = lotes
      .filter((l) => l.quantidade > 1e-9)
      .sort((a, b) => (a.validade ?? "9999").localeCompare(b.validade ?? "9999") || a.dataEntrada.localeCompare(b.dataEntrada));
    const vencido = (l: LoteSaldo) => l.validade !== null && l.validade < data;
    return [...comSaldo.filter((l) => !vencido(l)), ...comSaldo.filter(vencido)];
  };

  for (const m of ordenadas) {
    const fator = fatorConversao(m.unidade, unidade);
    if (fator === null) {
      unidadesIgnoradas++; // não somar unidades diferentes sem tratamento
      continue;
    }
    const u = { fator };
    const qtd = m.quantidade * u.fator;
    if (m.estoqueMinimo !== null) estoqueMinimo = m.estoqueMinimo * u.fator;
    if (m.tipo === "entrada") {
      totalEntradas++;
      ultimaEntrada = m.data;
      saldo += qtd;
      const preco = m.preco !== null ? m.preco / u.fator : null;
      if (preco !== null) precoReferencia = preco;
      const id = m.lote ?? `sem-lote-${m.data}`;
      const existente = lotes.find((l) => l.lote === id && l.validade === m.validade);
      if (existente) existente.quantidade += qtd;
      else lotes.push({ lote: id, quantidade: qtd, validade: m.validade, preco, dataEntrada: m.data, fornecedor: m.fornecedor });
    } else {
      totalSaidas++;
      ultimaSaida = m.data;
      saldo -= qtd;
      const dia = diasEntre(inicio, m.data);
      consumoDiario[dia] += qtd;
      saidasPorDia[dia] += 1;
      let resta = qtd;
      const alvo = m.lote ? lotes.find((l) => l.lote === m.lote && l.quantidade > 0) : undefined;
      for (const l of alvo ? [alvo, ...fefo(m.data).filter((x) => x !== alvo)] : fefo(m.data)) {
        if (resta <= 0) break;
        const usa = Math.min(l.quantidade, resta);
        l.quantidade -= usa;
        resta -= usa;
      }
    }
  }

  const { taxa, rotulo, saidas } = taxaConsumo(consumoDiario, saidasPorDia);
  const lotesAtivos = lotes.filter((l) => l.quantidade > 1e-6);
  const saldoVencido = lotesAtivos.filter((l) => l.validade !== null && l.validade < dataRef).reduce((s, l) => s + l.quantidade, 0);
  // Saldo negativo é erro de registro (tratado em qualidade dos dados) e fica como está.
  const saldoUtilizavel = saldo > 0 ? Math.max(0, saldo - saldoVencido) : saldo;
  let valorEstoque: number | null = null;
  let valorEstimado = false;
  for (const l of lotesAtivos) {
    const p = l.preco ?? precoReferencia;
    if (p === null) continue; // preço ausente não vira zero: fica fora e o valor é marcado como estimado
    if (l.preco === null) valorEstimado = true;
    valorEstoque = (valorEstoque ?? 0) + l.quantidade * p;
  }
  if (valorEstoque !== null && lotesAtivos.some((l) => l.preco === null && precoReferencia === null)) valorEstimado = true;

  const nome = maisFrequente(movs.map((m) => m.produto.trim()));
  return {
    key,
    nome,
    grafias: [...new Set(movs.map((m) => m.produto.trim()))],
    categoria: maisFrequente(movs.map((m) => m.categoria)),
    unidade,
    familia,
    estoqueMinimo,
    saldo,
    saldoVencido,
    saldoUtilizavel,
    lotes: lotesAtivos,
    consumoDiario,
    inicio,
    consumoMedioDia: taxa,
    janelaTaxa: rotulo,
    saidasNaJanela: saidas,
    totalSaidas,
    totalEntradas,
    diasHistorico: nDias,
    coberturaDias: taxa > 0 ? Math.max(0, saldoUtilizavel) / taxa : null,
    ultimaSaida,
    ultimaEntrada,
    precoReferencia,
    valorEstoque,
    valorEstimado,
    classeABC: null,
    movimentacoes: ordenadas,
    unidadesIgnoradas,
  };
}

/** Curva ABC pelo valor imobilizado: A = 80% do valor, B = próximos 15%, C = resto. */
export function classificarABC(produtos: ProdutoAnalise[]) {
  const comValor = produtos.filter((p) => (p.valorEstoque ?? 0) > 0).sort((a, b) => b.valorEstoque! - a.valorEstoque!);
  const total = comValor.reduce((s, p) => s + p.valorEstoque!, 0);
  let acc = 0;
  for (const p of comValor) {
    const antes = acc / total;
    acc += p.valorEstoque!;
    p.classeABC = antes < 0.8 ? "A" : antes < 0.95 ? "B" : "C";
  }
}

export const categoriaPerecivel = (cat: string) => /defensiv|biolog|semente|inocul|herbic|fungic|inseti/.test(normalizarNome(cat));

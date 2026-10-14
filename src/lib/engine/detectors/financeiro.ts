// Detectores financeiros: variação de preço e alto valor parado.

import { diasEntre, fatorConversao, formatarData } from "../normalize";
import { criarAlerta, fmtNum, fmtPreco, fmtR$ } from "../priority";
import type { Alerta } from "../types";
import { mediana, type Contexto } from "./contexto";

export function variacaoPreco(ctx: Contexto): Alerta[] {
  const { p, cfg, dataRef } = ctx;
  const compras = p.movimentacoes
    .filter((m) => m.tipo === "entrada" && m.preco !== null && fatorConversao(m.unidade, p.unidade) !== null)
    .map((m) => ({ m, preco: m.preco! / fatorConversao(m.unidade, p.unidade)!, qtd: m.quantidade * fatorConversao(m.unidade, p.unidade)! }));
  for (let i = compras.length - 1; i >= 2; i--) {
    const c = compras[i];
    if (diasEntre(c.m.data, dataRef) > 180) break;
    const anteriores = compras.slice(0, i).filter((x) => diasEntre(x.m.data, c.m.data) <= 365);
    if (anteriores.length < 2) continue;
    const ref = mediana(anteriores.map((x) => x.preco));
    if (ref <= 0) continue;
    const variacao = ((c.preco - ref) / ref) * 100;
    if (Math.abs(variacao) < cfg.variacaoPrecoPct) continue;
    const alta = variacao > 0;
    return [
      criarAlerta(p, {
        detector: "variacao_preco",
        nivel: alta ? "atencao" : "monitorar",
        titulo: alta ? "Preço acima do habitual" : "Preço abaixo do habitual",
        mensagem: `Compra de ${formatarData(c.m.data)} a ${fmtPreco(c.preco)}/${p.unidade}${c.m.fornecedor ? ` (${c.m.fornecedor})` : ""} está ${fmtNum(Math.abs(variacao), 0)}% ${alta ? "acima" : "abaixo"} da mediana das ${anteriores.length} compras anteriores (${fmtPreco(ref)}/${p.unidade}).`,
        metodo: `preço unitário comparado com a mediana das compras dos 12 meses anteriores; alerta quando a diferença ≥ ${cfg.variacaoPrecoPct}%.`,
        acao: alta ? "Cotar com outros fornecedores antes da próxima compra e conferir a nota." : "Oportunidade: avaliar antecipar compras com este fornecedor.",
        confianca: anteriores.length >= 4 ? "alta" : "media",
        confiancaMotivo: `${anteriores.length} compras anteriores como referência`,
        diasAteProblema: null,
        impactoFinanceiro: Math.abs(c.preco - ref) * c.qtd,
        evidencias: { data: c.m.data, preco: c.preco, mediana: ref, variacaoPct: variacao, fornecedor: c.m.fornecedor },
      }),
    ];
  }
  return [];
}

export function altoValorParado(ctx: Contexto): Alerta[] {
  const { p, cfg, dataRef, valorTotal } = ctx;
  if (!p.valorEstoque || (p.classeABC !== "A" && p.classeABC !== "B")) return [];
  const referencia = p.ultimaSaida ?? p.movimentacoes.find((m) => m.tipo === "entrada")?.data ?? null;
  if (!referencia) return [];
  const diasSemSaida = diasEntre(referencia, dataRef);
  const consumo90 = p.consumoDiario.slice(-90).reduce((s, x) => s + x, 0);
  const baixaMovimentacao = consumo90 < p.saldo * 0.1;
  if (diasSemSaida < cfg.diasParado && !(baixaMovimentacao && diasSemSaida >= 45)) return [];
  const pct = (p.valorEstoque / valorTotal) * 100;
  return [
    criarAlerta(p, {
      detector: "alto_valor_parado",
      nivel: p.classeABC === "A" ? "atencao" : "monitorar",
      titulo: "Dinheiro parado no estoque",
      mensagem: `${fmtR$(p.valorEstoque)}${p.valorEstimado ? " (estimado)" : ""} parados neste item (${fmtNum(pct, 1)}% do valor do estoque, curva ${p.classeABC}). ${p.ultimaSaida ? `Última retirada há ${diasSemSaida} dias` : `Sem nenhuma retirada desde a compra, há ${diasSemSaida} dias`}; nos últimos 90 dias saiu ${fmtNum((consumo90 / Math.max(p.saldo, 1e-9)) * 100, 0)}% do saldo.`,
      metodo: `itens das curvas A/B (maior valor imobilizado) sem retirada há ≥ ${cfg.diasParado} dias, ou com menos de 10% do saldo usado em 90 dias.`,
      acao: "Avaliar remanejamento, venda ou devolução e evitar recompra até o item girar.",
      confianca: "alta",
      confiancaMotivo: "baseado nas datas e valores registrados",
      diasAteProblema: null,
      impactoFinanceiro: p.valorEstoque,
      evidencias: { valorEstoque: p.valorEstoque, diasSemSaida, consumo90, classe: p.classeABC },
    }),
  ];
}

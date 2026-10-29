// Detectores de nível de estoque: crítico, ruptura prevista e excesso.

import { formatarData, somarDias } from "../normalize";
import { confiancaHistorico, criarAlerta, fmtNum, fmtQtd, fmtR$ } from "../priority";
import type { Alerta } from "../types";
import type { Contexto } from "./contexto";

/** Frase anexada às mensagens quando parte do saldo físico está vencida e foi descontada. */
export const notaVencido = (p: Contexto["p"]) =>
  p.saldoVencido > 1e-6 ? ` Não conta ${fmtQtd(p.saldoVencido, p.unidade)} em lote vencido (saldo físico: ${fmtQtd(p.saldo, p.unidade)}).` : "";

export function estoqueCritico(ctx: Contexto): Alerta[] {
  const { p, cfg } = ctx;
  if (p.estoqueMinimo === null || p.saldoUtilizavel > p.estoqueMinimo) return [];
  const { confianca, motivo } = confiancaHistorico(p);
  const taxa = p.consumoMedioDia;
  const dias = p.saldoUtilizavel <= 0 ? 0 : p.coberturaDias;
  const sugerida = Math.max(0, p.estoqueMinimo - p.saldoUtilizavel) + taxa * cfg.leadTimeDias * 2;
  const nivel = p.saldoUtilizavel <= 0 || (dias !== null && dias <= cfg.leadTimeDias * 2) ? "critico" : "atencao";
  const duracao =
    p.saldoUtilizavel <= 0
      ? "O produto está em falta."
      : dias !== null
        ? `Mantendo o consumo médio dos ${p.janelaTaxa} (${fmtQtd(taxa, p.unidade)}/dia), o saldo atual poderá ser suficiente por aproximadamente ${fmtNum(dias, 0)} dias.`
        : "Não há retiradas recentes para estimar a duração.";
  return [
    criarAlerta(p, {
      detector: "estoque_critico",
      nivel,
      titulo: p.saldoUtilizavel <= 0 ? "Estoque zerado" : "Estoque crítico",
      mensagem:
        p.saldoUtilizavel <= 0
          ? `O saldo utilizável está zerado (mínimo definido: ${fmtQtd(p.estoqueMinimo, p.unidade)}). ${duracao}${notaVencido(p)}`
          : `Saldo utilizável de ${fmtQtd(p.saldoUtilizavel, p.unidade)} está abaixo do mínimo de ${fmtQtd(p.estoqueMinimo, p.unidade)}. ${duracao}${notaVencido(p)}`,
      metodo: "saldo utilizável (sem lotes vencidos) ≤ estoque mínimo informado nos registros; duração = saldo ÷ consumo médio diário da janela mais recente com pelo menos 3 retiradas.",
      acao:
        taxa > 0 && p.precoReferencia !== null
          ? `Comprar cerca de ${fmtQtd(sugerida, p.unidade)} (repõe o mínimo + ${cfg.leadTimeDias * 2} dias de uso), estimado em ${fmtR$(sugerida * p.precoReferencia)}.`
          : `Programar compra para repor ao menos ${fmtQtd(Math.max(0, p.estoqueMinimo - p.saldoUtilizavel), p.unidade)}.`,
      confianca,
      confiancaMotivo: motivo,
      diasAteProblema: dias === null ? null : Math.round(dias),
      impactoFinanceiro: p.precoReferencia !== null ? sugerida * p.precoReferencia : null,
      evidencias: { saldo: p.saldo, saldoUtilizavel: p.saldoUtilizavel, saldoVencido: p.saldoVencido, estoqueMinimo: p.estoqueMinimo, consumoDia: taxa, coberturaDias: dias },
    }),
  ];
}

export function rupturaPrevista(ctx: Contexto): Alerta[] {
  const { p, cfg, dataRef } = ctx;
  const minimo = p.estoqueMinimo ?? 0;
  if (p.saldoUtilizavel <= minimo || p.consumoMedioDia <= 0) return [];
  const diasMinimo = (p.saldoUtilizavel - minimo) / p.consumoMedioDia;
  if (diasMinimo > cfg.leadTimeDias) return [];
  const { confianca, motivo } = confiancaHistorico(p);
  const diasZerar = p.saldoUtilizavel / p.consumoMedioDia;
  return [
    criarAlerta(p, {
      detector: "ruptura_prevista",
      nivel: diasMinimo <= 7 ? "critico" : "atencao",
      titulo: "Vai faltar em breve",
      mensagem: `No ritmo dos ${p.janelaTaxa} (${fmtQtd(p.consumoMedioDia, p.unidade)}/dia), o saldo de ${fmtQtd(p.saldoUtilizavel, p.unidade)} atinge o mínimo em ~${fmtNum(diasMinimo, 0)} dias (${formatarData(somarDias(dataRef, Math.floor(diasMinimo)))}) e zera em ~${fmtNum(diasZerar, 0)} dias. O prazo típico de compra é de ${cfg.leadTimeDias} dias.${notaVencido(p)}`,
      metodo: `dias até o mínimo = (saldo utilizável − mínimo) ÷ consumo médio diário; alerta quando ≤ ${cfg.leadTimeDias} dias (prazo de compra).`,
      acao: "Fazer o pedido agora para chegar antes de atingir o estoque mínimo.",
      confianca,
      confiancaMotivo: motivo,
      diasAteProblema: Math.round(diasMinimo),
      impactoFinanceiro: p.precoReferencia !== null ? p.consumoMedioDia * cfg.leadTimeDias * 2 * p.precoReferencia : null,
      evidencias: { saldo: p.saldo, saldoUtilizavel: p.saldoUtilizavel, saldoVencido: p.saldoVencido, estoqueMinimo: p.estoqueMinimo, consumoDia: p.consumoMedioDia, diasAteMinimo: diasMinimo },
    }),
  ];
}

export function excessoEstoque(ctx: Contexto): Alerta[] {
  const { p, cfg } = ctx;
  if (p.coberturaDias === null || p.coberturaDias <= cfg.coberturaExcessoDias || p.saldoUtilizavel <= 0) return [];
  const { confianca, motivo } = confiancaHistorico(p);
  const excedente = p.saldoUtilizavel - p.consumoMedioDia * 90; // acima de 3 meses de uso
  const valorExcedente = p.precoReferencia !== null ? excedente * p.precoReferencia : null;
  return [
    criarAlerta(p, {
      detector: "excesso_estoque",
      nivel: p.coberturaDias > 365 || p.classeABC === "A" ? "atencao" : "monitorar",
      titulo: "Estoque em excesso",
      mensagem: `O saldo utilizável de ${fmtQtd(p.saldoUtilizavel, p.unidade)} cobre ~${fmtNum(p.coberturaDias, 0)} dias (${fmtNum(p.coberturaDias / 30, 0)} meses) de consumo.${notaVencido(p)}${valorExcedente !== null ? ` Cerca de ${fmtR$(valorExcedente)} estão acima do necessário para 3 meses.` : ""}`,
      metodo: `cobertura = saldo utilizável ÷ consumo médio diário; excesso quando > ${cfg.coberturaExcessoDias} dias.`,
      acao: "Suspender novas compras deste item e rever a quantidade dos próximos pedidos.",
      confianca,
      confiancaMotivo: motivo,
      diasAteProblema: null,
      impactoFinanceiro: valorExcedente,
      evidencias: { saldo: p.saldo, saldoUtilizavel: p.saldoUtilizavel, saldoVencido: p.saldoVencido, consumoDia: p.consumoMedioDia, coberturaDias: p.coberturaDias },
    }),
  ];
}

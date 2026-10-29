// Detector de risco de vencimento por lote, considerando o consumo previsto (FEFO).

import { diasEntre, formatarData } from "../normalize";
import { confiancaHistorico, criarAlerta, fmtQtd, fmtR$ } from "../priority";
import type { Alerta } from "../types";
import type { Contexto } from "./contexto";

export function riscoVencimento(ctx: Contexto): Alerta[] {
  const { p, cfg, dataRef } = ctx;
  const lotes = p.lotes.filter((l) => l.validade).sort((a, b) => a.validade!.localeCompare(b.validade!));
  const { confianca, motivo } = confiancaHistorico(p);
  const alertas: Alerta[] = [];
  let consumidoAntes = 0; // lotes que vencem antes são usados primeiro (FEFO)
  for (const l of lotes) {
    const dias = diasEntre(dataRef, l.validade!);
    const preco = l.preco ?? p.precoReferencia;
    if (dias < 0) {
      alertas.push(
        criarAlerta(p, {
          detector: "risco_vencimento",
          nivel: "critico",
          titulo: "Produto vencido em estoque",
          mensagem: `Lote ${l.lote} venceu em ${formatarData(l.validade)} e ainda tem ${fmtQtd(l.quantidade, p.unidade)} registrados${preco !== null ? ` (${fmtR$(l.quantidade * preco)})` : ""}.`,
          metodo: "validade do lote anterior à data de referência com saldo positivo.",
          acao: "Separar o lote, verificar descarte correto/devolução e corrigir o saldo.",
          confianca: "alta",
          confiancaMotivo: "validade informada no registro de entrada",
          diasAteProblema: 0,
          impactoFinanceiro: preco !== null ? l.quantidade * preco : null,
          evidencias: { lote: l.lote, validade: l.validade, quantidade: l.quantidade },
        }),
      );
      continue;
    }
    if (dias > cfg.horizonteVencimentoDias) break;
    const capacidade = p.consumoMedioDia * dias;
    const usado = Math.min(l.quantidade, Math.max(0, capacidade - consumidoAntes));
    const sobra = l.quantidade - usado;
    consumidoAntes += usado; // só o que se espera usar deste lote consome a capacidade dos dias
    if (sobra <= l.quantidade * 0.05) continue;
    alertas.push(
      criarAlerta(p, {
        detector: "risco_vencimento",
        nivel: dias <= 30 ? "critico" : dias <= 90 ? "atencao" : "monitorar",
        titulo: "Pode vencer antes do uso",
        mensagem:
          `Lote ${l.lote} (${fmtQtd(l.quantidade, p.unidade)}) vence em ${formatarData(l.validade)}, daqui a ${dias} dias. ` +
          (p.consumoMedioDia > 0
            ? `No ritmo atual (${fmtQtd(p.consumoMedioDia, p.unidade)}/dia) devem ser usados ~${fmtQtd(usado, p.unidade)}; sobram ~${fmtQtd(sobra, p.unidade)}`
            : `Não há retiradas registradas deste produto, então todo o lote pode vencer`) +
          `${preco !== null ? ` (${fmtR$(sobra * preco)})` : ""}.`,
        metodo: "sobra = quantidade do lote − consumo previsto até a validade (consumo médio × dias), usando primeiro os lotes que vencem antes (FEFO).",
        acao: "Usar este lote primeiro, remanejar para outra área ou negociar troca/devolução com o fornecedor.",
        confianca,
        confiancaMotivo: motivo,
        diasAteProblema: dias,
        impactoFinanceiro: preco !== null ? sobra * preco : null,
        evidencias: { lote: l.lote, validade: l.validade, quantidade: l.quantidade, sobraPrevista: sobra, consumoDia: p.consumoMedioDia },
      }),
    );
  }
  return alertas;
}


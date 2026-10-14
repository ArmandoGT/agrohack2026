// Detectores de comportamento de consumo: crescimento progressivo e retiradas fora do padrão.

import { diasEntre, fatorConversao, formatarData } from "../normalize";
import { confiancaHistorico, criarAlerta, fmtNum, fmtQtd } from "../priority";
import type { Alerta, Config, Movimentacao, ProdutoAnalise } from "../types";
import { mediana, type Contexto } from "./contexto";

interface SaidaAvaliada {
  m: Movimentacao;
  q: number;
  anomala: boolean;
  mediana: number;
  z: number;
  maiorAnterior: number;
  base: number;
}

/**
 * Compara cada retirada com a linha de base local (retiradas dos 90 dias anteriores,
 * ou todo o histórico se houver poucas). Uma retirada é atípica quando, ao mesmo tempo:
 * z-score robusto ≥ limiar, quantidade ≥ N× a mediana e 50% acima da maior retirada anterior.
 */
export function avaliarSaidas(p: ProdutoAnalise, cfg: Config): SaidaAvaliada[] {
  const saidas = p.movimentacoes
    .filter((m) => m.tipo === "saida" && fatorConversao(m.unidade, p.unidade) !== null)
    .map((m) => ({ m, q: m.quantidade * fatorConversao(m.unidade, p.unidade)! }));
  if (saidas.length < 6) return saidas.map((s) => ({ ...s, anomala: false, mediana: 0, z: 0, maiorAnterior: 0, base: 0 }));
  return saidas.map((s) => {
    const locais = saidas.filter((x) => x !== s && diasEntre(x.m.data, s.m.data) >= 0 && diasEntre(x.m.data, s.m.data) <= 90);
    const outras = (locais.length >= 5 ? locais : saidas.filter((x) => x !== s)).map((x) => x.q);
    const med = mediana(outras);
    const mad = Math.max(mediana(outras.map((q) => Math.abs(q - med))) * 1.4826, med * 0.1);
    const z = mad > 0 ? (s.q - med) / mad : 0;
    const maiorAnterior = Math.max(0, ...outras);
    const anomala = z >= cfg.anomaliaZ && s.q >= med * cfg.anomaliaMultiplo && s.q >= maiorAnterior * 1.5;
    return { ...s, anomala, mediana: med, z, maiorAnterior, base: outras.length };
  });
}

export function consumoCrescente(ctx: Contexto): Alerta[] {
  const { p, cfg, dataRef } = ctx;
  if (p.diasHistorico < 120) return [];
  // Retiradas atípicas ficam fora da curva: um pico isolado não é tendência.
  const recentes = avaliarSaidas(p, cfg).filter((s) => !s.anomala && diasEntre(s.m.data, dataRef) < 120);
  if (recentes.length < 12) return []; // poucas retiradas = variação é ruído
  const blocos = [0, 0, 0, 0];
  for (const s of recentes) blocos[3 - Math.floor(diasEntre(s.m.data, dataRef) / 30)] += s.q;
  const [b0, b1, b2, b3] = blocos;
  if (b0 <= 0) return [];
  const progressivo = b1 >= b0 * 0.9 && b2 >= b1 * 0.9 && b3 >= b2 * 0.9 && b2 >= b0 * 1.2 && b3 > b1;
  if (!progressivo || b3 < b0 * cfg.crescimentoMinimo) return [];
  const pct = (b3 / b0 - 1) * 100;
  const { confianca, motivo } = confiancaHistorico(p);
  return [
    criarAlerta(p, {
      detector: "consumo_crescente",
      nivel: pct >= 50 ? "atencao" : "monitorar",
      titulo: "Consumo em alta",
      mensagem: `O consumo mensal vem subindo: ${blocos.map((b) => fmtNum(b, 0)).join(" → ")} ${p.unidade} nos últimos 4 meses (+${fmtNum(pct, 0)}%). Médias antigas subestimam o uso atual.`,
      metodo: `soma das retiradas (sem as atípicas) em 4 blocos de 30 dias; alerta quando cada bloco ≥ 90% do anterior, o 3º ≥ 1,2× o 1º e o último ≥ ${cfg.crescimentoMinimo}× o primeiro.`,
      acao: "Verificar se o aumento é esperado (safra, nova área) e ajustar o volume das próximas compras.",
      confianca,
      confiancaMotivo: motivo,
      diasAteProblema: p.coberturaDias !== null && p.coberturaDias < 60 ? Math.round(p.coberturaDias) : null,
      impactoFinanceiro: null,
      evidencias: { mes1: b0, mes2: b1, mes3: b2, mes4: b3, aumentoPct: pct },
    }),
  ];
}

export function retiradaAnomala(ctx: Contexto): Alerta[] {
  const { p, cfg, dataRef } = ctx;
  const alertas: Alerta[] = [];
  for (const s of avaliarSaidas(p, cfg)) {
    const idade = diasEntre(s.m.data, dataRef);
    if (!s.anomala || idade > 180) continue;
    const quem = [s.m.destino && `destino: ${s.m.destino}`, s.m.responsavel && `responsável: ${s.m.responsavel}`].filter(Boolean).join("; ");
    alertas.push(
      criarAlerta(p, {
        detector: "retirada_anomala",
        nivel: idade <= 60 ? "atencao" : "monitorar",
        titulo: "Retirada fora do padrão",
        mensagem: `Retirada de ${fmtQtd(s.q, p.unidade)} em ${formatarData(s.m.data)}${quem ? ` (${quem})` : ""} é ${fmtNum(s.q / s.mediana, 1)}× a retirada típica de ${fmtQtd(s.mediana, p.unidade)} e supera a maior retirada anterior (${fmtQtd(s.maiorAnterior, p.unidade)}).`,
        metodo: `comparada com ${s.base} retiradas anteriores (preferindo os 90 dias antes): z-score robusto (mediana/MAD) ≥ ${cfg.anomaliaZ}, ≥ ${cfg.anomaliaMultiplo}× a mediana e ≥ 1,5× a maior retirada anterior.`,
        acao: "Confirmar com o responsável se foi uso extraordinário, erro de digitação ou desvio.",
        confianca: s.base >= 10 ? "alta" : "media",
        confiancaMotivo: `comparada com ${s.base} retiradas do mesmo produto`,
        diasAteProblema: null,
        impactoFinanceiro: p.precoReferencia !== null ? (s.q - s.mediana) * p.precoReferencia : null,
        evidencias: { data: s.m.data, quantidade: s.q, mediana: s.mediana, zScore: Math.round(s.z * 10) / 10, destino: s.m.destino, responsavel: s.m.responsavel },
      }),
    );
  }
  return alertas.sort((a, b) => String(b.evidencias.data).localeCompare(String(a.evidencias.data))).slice(0, 3);
}

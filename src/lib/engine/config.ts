import type { Config } from "./types";

/**
 * Limiares padrão. Cada valor está explicado em docs/criterios-alertas.md
 * e foi calibrado pelo loop de avaliação (npm run eval).
 */
export const CONFIG_PADRAO: Config = {
  leadTimeDias: 15, // tempo típico entre pedido e chegada do insumo
  coberturaExcessoDias: 180, // estoque para mais de 6 meses = excesso
  horizonteVencimentoDias: 180, // olhar lotes que vencem nos próximos 6 meses
  diasParado: 90, // sem saída há 3 meses
  variacaoPrecoPct: 25, // diferença para a mediana das compras anteriores
  anomaliaZ: 3.5, // z-score robusto (mediana/MAD)
  anomaliaMultiplo: 3, // e pelo menos 3x a retirada típica
  crescimentoMinimo: 1.5, // consumo do último mês >= 1,5x o de 3 meses atrás
  similaridadeDuplicado: 0.88,
  fusoes: {},
};

export function comConfig(parcial?: Partial<Config>): Config {
  return { ...CONFIG_PADRAO, ...parcial, fusoes: { ...CONFIG_PADRAO.fusoes, ...(parcial?.fusoes ?? {}) } };
}

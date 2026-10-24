// Nó "Previsão de consumo (modelo)": suavização exponencial de Holt com tendência amortecida,
// ajustada ao histórico semanal de cada produto e testada contra a média simples (backtest).
// Não altera nenhum alerta: os detectores continuam usando a média de `taxaConsumo`.

import { diasEntre, fatorConversao, somarDias } from "./normalize";
import { taxaConsumo } from "./stock";
import type { PrevisaoConsumo, ProdutoAnalise } from "./types";

export const PREVISAO = {
  horizonteSemanas: 12, // quanto o modelo projeta para frente
  semanasTeste: 4, // semanas escondidas em cada rodada do backtest (~30 dias)
  rodadasTeste: 3, // origens do backtest: corta em -4, -8 e -12 semanas
  minTreino: 12, // semanas mínimas para ajustar o modelo
  minSemanasComConsumo: 6,
  folga: 0.05, // o modelo só substitui a média se errar pelo menos 5% menos que ela
};

const ALFAS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const BETAS = [0.05, 0.1, 0.2, 0.3];
const PHIS = [0.8, 0.9, 0.98];

export interface Parametros {
  alfa: number;
  beta: number;
  phi: number;
}

interface Ajuste extends Parametros {
  nivel: number;
  tendencia: number;
  residuos: number[]; // erros de 1 semana à frente (real − previsto)
}

/** Soma o consumo diário em semanas completas que terminam no último dia da série. */
export function semanal(consumoDiario: number[]): number[] {
  const k = Math.floor(consumoDiario.length / 7);
  const ini = consumoDiario.length - 7 * k;
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    let s = 0;
    for (let d = ini + 7 * i; d < ini + 7 * (i + 1); d++) s += consumoDiario[d];
    out.push(s);
  }
  return out;
}

/** Holt amortecido com parâmetros fixos: devolve o estado final e os erros de 1 passo. */
export function holt(y: number[], { alfa, beta, phi }: Parametros): Ajuste {
  const aquec = Math.min(4, y.length);
  let nivel = y.slice(0, aquec).reduce((a, b) => a + b, 0) / Math.max(1, aquec);
  let tendencia = 0;
  const residuos: number[] = [];
  for (let t = aquec; t < y.length; t++) {
    const previsto = Math.max(0, nivel + phi * tendencia);
    residuos.push(y[t] - previsto);
    const novoNivel = alfa * y[t] + (1 - alfa) * (nivel + phi * tendencia);
    tendencia = beta * (novoNivel - nivel) + (1 - beta) * phi * tendencia;
    nivel = novoNivel;
  }
  return { alfa, beta, phi, nivel, tendencia, residuos };
}

/** "Aprendizado": escolhe α, β e φ que minimizam o erro quadrático de 1 semana à frente. */
export function ajustar(y: number[]): Ajuste {
  let melhor: Ajuste | null = null;
  let menor = Infinity;
  for (const alfa of ALFAS)
    for (const beta of BETAS)
      for (const phi of PHIS) {
        const a = holt(y, { alfa, beta, phi });
        const sse = a.residuos.reduce((s, e) => s + e * e, 0);
        if (sse < menor - 1e-12) {
          menor = sse;
          melhor = a;
        }
      }
  return melhor!;
}

/** Previsão para as próximas h semanas (nunca negativa). */
export function prever(a: Ajuste, h: number): number[] {
  const out: number[] = [];
  let soma = 0;
  for (let i = 1; i <= h; i++) {
    soma += a.phi ** i;
    out.push(Math.max(0, a.nivel + soma * a.tendencia));
  }
  return out;
}

function quantil(xs: number[], q: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const i = Math.floor(pos);
  return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (pos - i);
}

/** Faixa de 80% do consumo acumulado: quantis 10% e 90% dos erros de 1 passo, abertos por √h.
 * (Testamos abrir por h: a faixa cobriu 96% das rodadas, larga demais para uma faixa de 80%.) */
function faixaAcumulada(central: number[], residuos: number[]) {
  const q10 = quantil(residuos, 0.1);
  const q90 = quantil(residuos, 0.9);
  let acc = 0;
  return central.map((c, i) => {
    acc += c;
    const r = Math.sqrt(i + 1);
    return { centro: acc, baixo: Math.max(0, acc + q10 * r), alto: Math.max(acc, acc + q90 * r) };
  });
}

/** Dia em que o consumo acumulado (distribuído igualmente na semana) alcança o saldo. */
function diaQueZera(saldo: number, semanas: number[]): number | null {
  if (saldo <= 0) return 0;
  let acc = 0;
  for (let s = 0; s < semanas.length; s++) {
    const porDia = semanas[s] / 7;
    if (porDia > 0 && acc + semanas[s] >= saldo) return s * 7 + Math.ceil((saldo - acc) / porDia);
    acc += semanas[s];
  }
  return null; // não zera dentro do horizonte
}

/** Converte a faixa acumulada de volta em consumo por semana, para achar os dias até zerar. */
const porSemana = (acum: number[]) => acum.map((v, i) => v - (i ? acum[i - 1] : 0));

function saidasPorDia(p: ProdutoAnalise, n: number) {
  const out = new Array(n).fill(0);
  for (const m of p.movimentacoes) {
    if (m.tipo !== "saida" || fatorConversao(m.unidade, p.unidade) === null) continue;
    const d = diasEntre(p.inicio, m.data);
    if (d >= 0 && d < n) out[d]++;
  }
  return out;
}

export function preverConsumo(p: ProdutoAnalise, dataRef: string): PrevisaoConsumo {
  const cfg = PREVISAO;
  const y = semanal(p.consumoDiario);
  const comConsumo = y.filter((v) => v > 0).length;
  const curto = (motivo: string): PrevisaoConsumo => ({ status: "curto", motivo, projecao: [], diasAteZerar: null, backtest: null, parametros: null, tendenciaSemanal: null });
  if (y.length < cfg.minTreino + cfg.semanasTeste) return curto(`histórico de ${y.length} semana(s); o modelo precisa de ${cfg.minTreino + cfg.semanasTeste}`);
  if (comConsumo < cfg.minSemanasComConsumo) return curto(`só ${comConsumo} semana(s) com consumo; o modelo precisa de ${cfg.minSemanasComConsumo}`);

  // Backtest: esconde as últimas 4 semanas (em até 3 rodadas), ajusta sem elas e compara com a média de 30 dias.
  const n = p.consumoDiario.length;
  const saidas = saidasPorDia(p, n);
  let errModelo = 0, errMedia = 0, real = 0, dentro = 0, rodadas = 0;
  for (let r = 1; r <= cfg.rodadasTeste; r++) {
    const corte = y.length - r * cfg.semanasTeste;
    if (corte < cfg.minTreino) break;
    const fimDia = n - (y.length - corte) * 7; // dia (exclusivo) em que o treino termina
    const ajuste = ajustar(y.slice(0, corte));
    const prev = prever(ajuste, cfg.semanasTeste);
    const media = taxaConsumo(p.consumoDiario.slice(0, fimDia), saidas.slice(0, fimDia)).taxa * 7;
    const reais = y.slice(corte, corte + cfg.semanasTeste);
    for (let i = 0; i < reais.length; i++) {
      errModelo += Math.abs(reais[i] - prev[i]);
      errMedia += Math.abs(reais[i] - media);
      real += reais[i];
    }
    const faixa = faixaAcumulada(prev, ajuste.residuos).at(-1)!;
    const totalReal = reais.reduce((a, b) => a + b, 0);
    if (totalReal >= faixa.baixo - 1e-9 && totalReal <= faixa.alto + 1e-9) dentro++;
    rodadas++;
  }
  const semanasTestadas = rodadas * cfg.semanasTeste;
  const backtest = {
    rodadas,
    semanasTestadas,
    erroModelo: errModelo / semanasTestadas,
    erroMedia: errMedia / semanasTestadas,
    wapeModelo: real > 0 ? errModelo / real : null,
    wapeMedia: real > 0 ? errMedia / real : null,
    faixaAcertou: dentro,
  };

  const final = ajustar(y);
  const parametros = { alfa: final.alfa, beta: final.beta, phi: final.phi };
  if (!(backtest.erroModelo < backtest.erroMedia * (1 - cfg.folga)))
    return { status: "media", motivo: "o modelo não errou ao menos 5% menos que a média simples no teste; o app continua com a média", projecao: [], diasAteZerar: null, backtest, parametros, tendenciaSemanal: final.tendencia };

  const central = prever(final, cfg.horizonteSemanas);
  const faixa = faixaAcumulada(central, final.residuos);
  const projecao = faixa.map((f, i) => ({ data: somarDias(dataRef, 7 * (i + 1)), ...f }));
  return {
    status: "modelo",
    motivo: "o modelo errou ao menos 5% menos que a média simples no teste",
    projecao,
    diasAteZerar: {
      centro: diaQueZera(p.saldo, central),
      otimista: diaQueZera(p.saldo, porSemana(faixa.map((f) => f.baixo))),
      pessimista: diaQueZera(p.saldo, porSemana(faixa.map((f) => f.alto))),
    },
    backtest,
    parametros,
    tendenciaSemanal: final.tendencia,
  };
}

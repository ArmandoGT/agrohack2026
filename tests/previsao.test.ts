import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { analisar } from "../src/lib/engine";
import { ajustar, prever, semanal } from "../src/lib/engine/previsao";
import type { Movimentacao } from "../src/lib/engine/types";
import { lerCsv } from "../src/lib/import";

let id = 0;
const mov = (m: Partial<Movimentacao>): Movimentacao => ({
  id: String(id++), produto: "Diesel", categoria: "Combustíveis", unidade: "L", quantidade: 10, estoqueMinimo: null,
  tipo: "saida", data: "2026-01-01", preco: null, lote: null, validade: null, fornecedor: null, destino: null, responsavel: null, ...m,
});
const dia = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString().slice(0, 10);

/** Uma entrada grande no dia 0 e uma retirada por dia com a quantidade dada. */
function base(dias: number, qtd: (d: number) => number, entrada = 1e5) {
  const movs = [mov({ tipo: "entrada", quantidade: entrada, data: dia(0) })];
  for (let d = 1; d < dias; d++) movs.push(mov({ quantidade: qtd(d), data: dia(d) }));
  return analisar(movs).produtos[0];
}

// Ruído determinístico, para o teste não depender de sorte.
const ruido = (d: number) => Math.sin(d * 12.9898) * 43758.5453 % 1;

describe("previsão de consumo (Holt amortecido)", () => {
  it("PR-01: soma o consumo diário em semanas completas que terminam no último dia", () => {
    expect(semanal([1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2])).toEqual([7, 14]);
  });

  it("PR-02: numa série com tendência, aprende a alta e projeta acima do último valor", () => {
    const y = Array.from({ length: 30 }, (_, i) => 100 + 10 * i);
    const a = ajustar(y);
    expect(a.tendencia).toBeGreaterThan(5);
    expect(prever(a, 1)[0]).toBeGreaterThan(y.at(-1)!);
  });

  it("PR-03: consumo crescente — o modelo vence a média no teste e prevê que zera antes", () => {
    const p = base(200, (d) => 5 + 0.15 * d, 6000);
    const v = p.previsao!;
    expect(v.status).toBe("modelo");
    expect(v.backtest!.erroModelo).toBeLessThan(v.backtest!.erroMedia * 0.95);
    expect(v.diasAteZerar!.centro!).toBeLessThan(p.coberturaDias!);
  });

  it("PR-04: a faixa contém a previsão central e se alarga com o horizonte", () => {
    const v = base(200, (d) => 5 + 0.15 * d + 4 * ruido(d), 1e5).previsao!;
    expect(v.projecao.length).toBe(12);
    for (const f of v.projecao) {
      expect(f.baixo).toBeLessThanOrEqual(f.centro + 1e-9);
      expect(f.alto).toBeGreaterThanOrEqual(f.centro - 1e-9);
    }
    const larg = v.projecao.map((f) => f.alto - f.baixo);
    expect(larg.at(-1)!).toBeGreaterThan(larg[0]);
  });

  it("PR-05: consumo estável — a decisão é coerente com o teste e a previsão fica perto do ritmo real", () => {
    const p = base(200, (d) => 10 + 3 * ruido(d));
    const v = p.previsao!;
    expect(["modelo", "media"]).toContain(v.status);
    const b = v.backtest!;
    expect(v.status === "modelo").toBe(b.erroModelo < b.erroMedia * 0.95);
    if (v.status === "modelo") expect(v.projecao[0].centro).toBeGreaterThan(60);
  });

  it("PR-E1: histórico curto não gera previsão", () => {
    const v = base(60, () => 10).previsao!;
    expect(v.status).toBe("curto");
    expect(v.projecao).toEqual([]);
    expect(v.motivo).toMatch(/semana/);
  });

  it("PR-E2: produto sem consumo não gera previsão", () => {
    const p = analisar([mov({ tipo: "entrada", quantidade: 100, data: dia(0) }), mov({ tipo: "entrada", quantidade: 5, data: dia(200) })]).produtos[0];
    expect(p.previsao!.status).toBe("curto");
  });

  it("PR-06: o modelo não altera nenhum alerta (o nó de previsão é só informativo)", async () => {
    const { movimentacoes } = lerCsv(readFileSync("data/simulado.csv", "utf8"));
    const comModelo = analisar(movimentacoes).alertas;
    vi.resetModules();
    vi.doMock("../src/lib/engine/previsao", () => ({
      preverConsumo: () => ({ status: "curto", motivo: "desligado", projecao: [], diasAteZerar: null, backtest: null, parametros: null, tendenciaSemanal: null }),
    }));
    const semModelo = (await import("../src/lib/engine")).analisar(movimentacoes).alertas;
    vi.doUnmock("../src/lib/engine/previsao");
    // O id leva um contador do módulo, que recomeça ao reimportar; o resto do alerta tem que ser idêntico.
    const semId = (as: typeof comModelo) => as.map((a) => ({ ...a, id: "" }));
    expect(semId(semModelo)).toEqual(semId(comModelo));
  });
});

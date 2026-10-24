// Trava a demonstração da reanálise descrita no README (seção 6), no roteiro do vídeo e no pitch:
// uma retirada de 170 L de glifosato na data de referência da base simulada deve gerar
// exatamente um aviso "Novo · Atenção · Herbicida glifosato · Vai faltar em breve".
// Varredura de 23/10/2026: o aviso sai igual de 120 a 225 L; 170 L fica longe dos dois limites.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analisar } from "../src/lib/engine";
import type { Movimentacao } from "../src/lib/engine/types";
import { lerCsv } from "../src/lib/import";
import { comparar } from "../src/lib/mudanca";

const RETIRADA_DEMO_L = 170;

describe("demonstração da reanálise (base simulada)", () => {
  const { movimentacoes } = lerCsv(readFileSync("data/simulado.csv", "utf8"));
  const antes = analisar(movimentacoes);
  const glifosato = antes.produtos.find((p) => p.nome === "Herbicida glifosato")!;

  // Mesmos campos que o formulário de Registrar preenche ao escolher o produto.
  const retirada = (quantidade: number): Movimentacao => ({
    id: "udemo", produto: glifosato.nome, categoria: glifosato.categoria, unidade: glifosato.unidade, quantidade,
    estoqueMinimo: glifosato.estoqueMinimo, tipo: "saida", data: antes.dataReferencia,
    preco: null, lote: null, validade: null, fornecedor: null, destino: null, responsavel: null,
  });
  const aviso = (quantidade: number) => {
    const m = comparar(antes, analisar([...movimentacoes, retirada(quantidade)]), "demo");
    return {
      novos: m.novos.map((a) => `${a.nivel} · ${a.produto} · ${a.detector}`),
      resolvidos: m.resolvidos.length,
      mudaramNivel: m.mudaramNivel.length,
    };
  };

  it(`${RETIRADA_DEMO_L} L geram só "Novo · Atenção · Vai faltar em breve"`, () => {
    expect(glifosato.unidade).toBe("L");
    expect(aviso(RETIRADA_DEMO_L)).toEqual({ novos: ["atencao · Herbicida glifosato · ruptura_prevista"], resolvidos: 0, mudaramNivel: 0 });
  });

  it("a quantidade da demo tem folga dos dois lados (130 L e 210 L dão o mesmo aviso)", () => {
    expect(aviso(130)).toEqual(aviso(RETIRADA_DEMO_L));
    expect(aviso(210)).toEqual(aviso(RETIRADA_DEMO_L));
  });
});

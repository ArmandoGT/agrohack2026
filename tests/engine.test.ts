import { describe, expect, it } from "vitest";
import { analisar } from "../src/lib/engine";
import { ordemTopologica } from "../src/lib/engine/dag";
import { gruposDuplicados, similaridade } from "../src/lib/engine/entities";
import { fatorConversao, normalizarLinhas, parseData, parseNumero } from "../src/lib/engine/normalize";
import type { Movimentacao } from "../src/lib/engine/types";
import { rodar } from "../scripts/eval-lib";

let id = 0;
const mov = (m: Partial<Movimentacao>): Movimentacao => ({
  id: String(id++), produto: "Ureia", categoria: "Fertilizantes", unidade: "kg", quantidade: 10, estoqueMinimo: null,
  tipo: "saida", data: "2026-10-01", preco: null, lote: null, validade: null, fornecedor: null, destino: null, responsavel: null, ...m,
});
const dia = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString().slice(0, 10);

describe("normalização", () => {
  it("lê números no formato brasileiro e internacional", () => {
    expect(parseNumero("1.234,56")).toBe(1234.56);
    expect(parseNumero("R$ 12,50")).toBe(12.5);
    expect(parseNumero("1234.5")).toBe(1234.5);
    expect(parseNumero("1.000")).toBe(1000);
  });
  it("campo vazio vira null, nunca zero", () => {
    expect(parseNumero("")).toBeNull();
    expect(parseNumero(null)).toBeNull();
    const { movimentacoes } = normalizarLinhas([{ produto: "X", quantidade: "5", tipo: "entrada", data: "01/02/2026", preco: "" }]);
    expect(movimentacoes[0].preco).toBeNull();
    expect(movimentacoes[0].validade).toBeNull();
  });
  it("lê datas em vários formatos", () => {
    expect(parseData("05/03/2026")).toBe("2026-03-05");
    expect(parseData("2026-03-05")).toBe("2026-03-05");
    expect(parseData(46086)).toBe("2026-03-05"); // serial do Excel
  });
  it("mapeia cabeçalhos com nomes diferentes", () => {
    const { movimentacoes, rejeitadas } = normalizarLinhas([
      { Insumo: "MAP", Qtde: "100", Operação: "Compra", "Data Movimentação": "10/01/2026", "Preço Unitário": "4,50", Vencimento: "10/01/2027" },
      { Insumo: "MAP", Qtde: "abc", Operação: "Saída", "Data Movimentação": "11/01/2026" },
    ]);
    expect(movimentacoes[0]).toMatchObject({ produto: "MAP", quantidade: 100, tipo: "entrada", preco: 4.5, validade: "2027-01-10" });
    expect(rejeitadas).toHaveLength(1);
  });
  it("aceita os cabeçalhos com o vocabulário do edital", () => {
    const linha = (tipo: string, extra: Record<string, string> = {}) => ({
      Produto: "Glifosato", Categoria: "Defensivos", Unidade: "L", Quantidade: "20", "Estoque mínimo": "50",
      "Tipo de movimentação": tipo, Data: "10/01/2026", "Preço de aquisição (R$)": "32,90", Lote: "G1",
      Validade: "10/01/2027", Fornecedor: "Agro Sul", "Destino da retirada": "Talhão 3", Responsável: "João", ...extra,
    });
    const { movimentacoes, rejeitadas, mapa } = normalizarLinhas([linha("Entrada"), linha("Saída"), linha("Saldo inicial"), linha("Estorno")]);
    expect(mapa).toMatchObject({ tipo: "Tipo de movimentação", preco: "Preço de aquisição (R$)", destino: "Destino da retirada", estoqueMinimo: "Estoque mínimo" });
    expect(movimentacoes.map((m) => m.tipo)).toEqual(["entrada", "saida", "entrada"]);
    expect(movimentacoes[0]).toMatchObject({ preco: 32.9, estoqueMinimo: 50, destino: "Talhão 3", validade: "2027-01-10" });
    // tipo desconhecido é rejeitado com motivo, e não adivinhado pela letra inicial
    expect(rejeitadas).toEqual([{ linha: 5, motivo: "tipo (entrada/saída) não reconhecido" }]);
  });
  it("não usa coluna de preço total como preço unitário", () => {
    const { mapa } = normalizarLinhas([{ Produto: "MAP", Quantidade: "10", Tipo: "Entrada", Data: "10/01/2026", "Preço total (R$)": "450" }]);
    expect(mapa.preco).toBeUndefined();
  });
  it("converte unidades da mesma família e recusa famílias diferentes", () => {
    expect(fatorConversao("t", "kg")).toBe(1000);
    expect(fatorConversao("ml", "L")).toBe(0.001);
    expect(fatorConversao("kg", "L")).toBeNull();
  });
});

describe("grafo de entidades (cadastros duplicados)", () => {
  it("reconhece sigla e variações de grafia", () => {
    expect(similaridade("KCl", "Cloreto de potássio (KCl)")).toBeGreaterThanOrEqual(0.88);
    expect(similaridade("Óleo hidráulico", "Oleo Hidraulico 68")).toBeGreaterThanOrEqual(0.88);
  });
  it("não confunde fórmulas diferentes", () => {
    expect(similaridade("NPK 04-14-08", "NPK 10-10-10")).toBe(0);
    expect(similaridade("Filtro de óleo", "Filtro de ar")).toBeLessThan(0.88);
  });
  it("agrupa componentes conexos apenas na mesma categoria e unidade", () => {
    const g = gruposDuplicados(
      [
        { key: "kcl", nome: "KCl", categoria: "Fertilizantes", unidadeBase: "kg" },
        { key: "cloreto", nome: "Cloreto de potássio", categoria: "Fertilizantes", unidadeBase: "kg" },
        { key: "filtro-irr", nome: "Filtro", categoria: "Materiais de Irrigação", unidadeBase: "un" },
        { key: "filtro-epi", nome: "Filtro", categoria: "EPI", unidadeBase: "un" },
      ],
      0.88,
    );
    expect(g).toHaveLength(1);
    expect(g[0].chaves.sort()).toEqual(["cloreto", "kcl"]);
  });
});

describe("DAG do pipeline", () => {
  it("executa em ordem topológica e detecta ciclos", () => {
    const n = (id: string, dependeDe: string[]) => ({ id, rotulo: id, dependeDe, executar: () => "" });
    expect(ordemTopologica([n("c", ["b"]), n("a", []), n("b", ["a"])]).map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(() => ordemTopologica([n("a", ["b"]), n("b", ["a"])])).toThrow(/ciclo/);
  });
});

describe("detectores", () => {
  it("estoque crítico com estimativa de duração (exemplo do edital)", () => {
    const movs = [mov({ tipo: "entrada", quantidade: 1000, estoqueMinimo: 400, data: dia(0), preco: 3 })];
    for (let d = 1; d <= 60; d++) movs.push(mov({ quantidade: 15, data: dia(d) }));
    // saldo = 1000 - 900 = 100 kg; consumo 15 kg/dia -> ~7 dias
    const a = analisar(movs).alertas.find((x) => x.detector === "estoque_critico")!;
    expect(a.nivel).toBe("critico");
    expect(a.diasAteProblema).toBe(7);
    expect(a.mensagem).toMatch(/aproximadamente 7 dias/);
  });

  it("não soma unidades diferentes sem tratamento", () => {
    const r = analisar([
      mov({ tipo: "entrada", quantidade: 100, unidade: "L", data: dia(0) }),
      mov({ tipo: "entrada", quantidade: 100, unidade: "L", data: dia(1) }),
      mov({ tipo: "saida", quantidade: 50, unidade: "kg", data: dia(2) }),
    ]);
    expect(r.produtos[0].saldo).toBe(200);
    expect(r.alertas.some((a) => a.detector === "qualidade_dados")).toBe(true);
  });

  it("vencimento considera o consumo previsto até a validade (FEFO)", () => {
    const movs = [mov({ tipo: "entrada", quantidade: 100, data: dia(0), validade: dia(130), lote: "A", preco: 10 })];
    for (let d = 1; d <= 100; d += 1) movs.push(mov({ quantidade: 0.5, data: dia(d) }));
    // saldo 50; usa ~0,5/dia por 30 dias = 15 -> sobram ~35 que vencem
    const a = analisar(movs).alertas.find((x) => x.detector === "risco_vencimento")!;
    expect(a).toBeDefined();
    expect(a.evidencias.sobraPrevista as number).toBeCloseTo(35, 0);
  });

  it("lote vencido fica fora do saldo utilizável e o FEFO não dá baixa nele", () => {
    const movs = [
      mov({ tipo: "entrada", quantidade: 100, data: dia(0), lote: "V", validade: dia(10), preco: 3, estoqueMinimo: 50 }),
      mov({ tipo: "entrada", quantidade: 100, data: dia(0), lote: "N", validade: dia(300), preco: 3 }),
    ];
    for (let d = 20; d <= 80; d++) movs.push(mov({ quantidade: 1, data: dia(d) }));
    const r = analisar(movs);
    const p = r.produtos[0];
    // as 61 retiradas, todas depois do vencimento de V, saem do lote N
    expect(p.lotes.find((l) => l.lote === "V")!.quantidade).toBe(100);
    expect(p.lotes.find((l) => l.lote === "N")!.quantidade).toBe(39);
    expect(p.saldo).toBe(139);
    expect(p.saldoVencido).toBe(100);
    expect(p.saldoUtilizavel).toBe(39);
    expect(p.coberturaDias).toBeCloseTo(39, 0); // 1 kg/dia
    // o saldo físico (139) passa do mínimo, mas o utilizável (39) não: tem de alertar
    const a = r.alertas.find((x) => x.detector === "estoque_critico")!;
    expect(a).toBeDefined();
    expect(a.mensagem).toMatch(/Não conta 100 kg em lote vencido/);
  });

  it("sobra no vencimento com vários lotes não é superestimada", () => {
    // lote C sem validade consome o histórico; A e B chegam na data de referência
    const movs = [mov({ tipo: "entrada", quantidade: 200, data: dia(0), lote: "C" })];
    for (let d = 1; d <= 100; d++) movs.push(mov({ quantidade: 1, data: dia(d), lote: "C" }));
    movs.push(mov({ tipo: "entrada", quantidade: 30, data: dia(100), lote: "A", validade: dia(120), preco: 10 }));
    movs.push(mov({ tipo: "entrada", quantidade: 100, data: dia(100), lote: "B", validade: dia(140), preco: 10 }));
    const venc = analisar(movs).alertas.filter((x) => x.detector === "risco_vencimento");
    const sobra = (lote: string) => venc.find((a) => a.evidencias.lote === lote)!.evidencias.sobraPrevista as number;
    // 1 kg/dia: A usa 20 em 20 dias e sobram 10; B usa os 20 dias seguintes e sobram 80 (antes saía 90)
    expect(sobra("A")).toBeCloseTo(10, 5);
    expect(sobra("B")).toBeCloseTo(80, 5);
  });

  it("estimativa com pouco histórico comunica baixa confiança", () => {
    const r = analisar([
      mov({ tipo: "entrada", quantidade: 30, estoqueMinimo: 20, data: dia(0) }),
      mov({ quantidade: 15, data: dia(5) }),
    ]);
    const a = r.alertas.find((x) => x.detector === "estoque_critico")!;
    expect(a.confianca).toBe("baixa");
  });

  it("retirada muito acima do normal vira alerta, variação comum não", () => {
    const movs = [mov({ tipo: "entrada", quantidade: 5000, data: dia(0) })];
    for (let d = 1; d <= 80; d += 4) movs.push(mov({ quantidade: 20 + (d % 3), data: dia(d) }));
    expect(analisar(movs).alertas.some((a) => a.detector === "retirada_anomala")).toBe(false);
    movs.push(mov({ quantidade: 200, data: dia(82), destino: "Talhão 9" }));
    const a = analisar(movs).alertas.find((x) => x.detector === "retirada_anomala")!;
    expect(a.mensagem).toMatch(/Talhão 9/);
  });

  it("fusão confirmada pelo usuário une os produtos e refaz a análise", () => {
    const movs = [
      mov({ produto: "KCl", tipo: "entrada", quantidade: 100, data: dia(0) }),
      mov({ produto: "Cloreto de potássio", tipo: "entrada", quantidade: 100, data: dia(0) }),
    ];
    expect(analisar(movs).grupos).toHaveLength(1);
    const fundido = analisar(movs, { fusoes: { kcl: "cloreto de potassio" } });
    expect(fundido.produtos).toHaveLength(1);
    expect(fundido.produtos[0].saldo).toBe(200);
  });
});

describe("loop de avaliação", () => {
  it("encontra as anomalias plantadas na base simulada", () => {
    const { recall, precisao } = rodar();
    expect(recall).toBeGreaterThanOrEqual(0.9);
    expect(precisao).toBeGreaterThanOrEqual(0.85);
  });
});

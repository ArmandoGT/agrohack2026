// Ponto de entrada do motor: analisar(movimentações) -> alertas priorizados e justificados.

import { comConfig } from "./config";
import { executarDag, type No } from "./dag";
import { consumoCrescente, retiradaAnomala } from "./detectors/consumo";
import type { Contexto } from "./detectors/contexto";
import { estoqueCritico, excessoEstoque, rupturaPrevista } from "./detectors/estoque";
import { altoValorParado, variacaoPreco } from "./detectors/financeiro";
import { cadastroDuplicado, qualidadeDados } from "./detectors/qualidade";
import { riscoVencimento } from "./detectors/validade";
import { chaveProduto, gruposDuplicados } from "./entities";
import { normalizarNome } from "./normalize";
import { preverConsumo } from "./previsao";
import { ordenarAlertas } from "./priority";
import { classificarABC, montarProduto } from "./stock";
import type { Alerta, Analise, Config, DetectorId, GrupoDuplicado, Movimentacao, ProdutoAnalise } from "./types";

export * from "./types";
export { CONFIG_PADRAO } from "./config";

interface Estado {
  entrada: Movimentacao[];
  cfg: Config;
  dataRef: string;
  porChave: Map<string, Movimentacao[]>;
  produtos: Map<string, ProdutoAnalise>;
  grupos: GrupoDuplicado[];
  valorTotal: number;
  alertas: Alerta[];
}

type Detector = (ctx: Contexto) => Alerta[];
const DETECTORES_POR_PRODUTO: [DetectorId, string, Detector][] = [
  ["estoque_critico", "Estoque crítico", estoqueCritico],
  ["ruptura_prevista", "Ruptura prevista", rupturaPrevista],
  ["consumo_crescente", "Consumo crescente", consumoCrescente],
  ["retirada_anomala", "Retirada fora do padrão", retiradaAnomala],
  ["risco_vencimento", "Risco de vencimento", riscoVencimento],
  ["excesso_estoque", "Excesso de estoque", excessoEstoque],
  ["variacao_preco", "Variação de preço", variacaoPreco],
  ["alto_valor_parado", "Alto valor parado", altoValorParado],
  ["qualidade_dados", "Qualidade dos dados", qualidadeDados],
];

function construirPipeline(): No<Estado>[] {
  const nos: No<Estado>[] = [
    {
      id: "normalizacao",
      rotulo: "Normalização",
      dependeDe: [],
      executar: (s) => {
        s.dataRef = s.cfg.dataReferencia ?? s.entrada.reduce((max, m) => (m.data > max ? m.data : max), "0000-00-00");
        return `${s.entrada.length} movimentações; data de referência ${s.dataRef}`;
      },
    },
    {
      id: "entidades",
      rotulo: "Resolução de entidades",
      dependeDe: ["normalizacao"],
      executar: (s) => {
        for (const m of s.entrada) {
          const k = chaveProduto(m.produto, s.cfg.fusoes);
          s.porChave.set(k, [...(s.porChave.get(k) ?? []), m]);
        }
        return `${s.porChave.size} produtos distintos`;
      },
    },
    {
      id: "saldos",
      rotulo: "Saldo por lote (FEFO) e série de consumo",
      dependeDe: ["entidades"],
      executar: (s) => {
        for (const [k, movs] of s.porChave) s.produtos.set(k, montarProduto(k, movs, s.dataRef));
        const lista = [...s.produtos.values()];
        classificarABC(lista);
        s.valorTotal = lista.reduce((t, p) => t + (p.valorEstoque ?? 0), 0);
        return `${lista.reduce((t, p) => t + p.lotes.length, 0)} lotes ativos; valor em estoque R$ ${s.valorTotal.toFixed(2)}`;
      },
    },
    {
      id: "grafo_duplicados",
      rotulo: "Grafo de nomes parecidos",
      dependeDe: ["saldos"],
      executar: (s) => {
        const nos = [...s.produtos.values()].map((p) => ({ key: p.key, nome: p.nome, categoria: p.categoria, unidadeBase: p.familia }));
        s.grupos = gruposDuplicados(nos, s.cfg.similaridadeDuplicado);
        s.alertas.push(...cadastroDuplicado(s.grupos, s.produtos));
        return `${s.grupos.length} grupo(s) de possível duplicidade`;
      },
    },
  ];
  nos.push({
    id: "previsao",
    rotulo: "Previsão (modelo)",
    dependeDe: ["saldos"],
    executar: (s) => {
      for (const p of s.produtos.values()) p.previsao = preverConsumo(p, s.dataRef);
      const lista = [...s.produtos.values()];
      const conta = (st: string) => lista.filter((p) => p.previsao?.status === st).length;
      return `modelo venceu a média em ${conta("modelo")} produto(s); média em ${conta("media")}; histórico curto em ${conta("curto")}`;
    },
  });
  for (const [id, rotulo, det] of DETECTORES_POR_PRODUTO) {
    nos.push({
      id,
      rotulo,
      dependeDe: ["saldos"],
      executar: (s) => {
        const antes = s.alertas.length;
        for (const p of s.produtos.values()) s.alertas.push(...det({ p, cfg: s.cfg, dataRef: s.dataRef, valorTotal: s.valorTotal }));
        return `${s.alertas.length - antes} alerta(s)`;
      },
    });
  }
  nos.push({
    id: "prioridade",
    rotulo: "Score de prioridade",
    dependeDe: ["grafo_duplicados", ...DETECTORES_POR_PRODUTO.map(([id]) => id)],
    executar: (s) => {
      s.alertas = ordenarAlertas(s.alertas);
      return `${s.alertas.length} alertas ordenados`;
    },
  });
  return nos;
}

export function analisar(movimentacoes: Movimentacao[], parcial?: Partial<Config>): Analise {
  const estado: Estado = {
    entrada: movimentacoes,
    cfg: comConfig(parcial),
    dataRef: "",
    porChave: new Map(),
    produtos: new Map(),
    grupos: [],
    valorTotal: 0,
    alertas: [],
  };
  const dag = executarDag(construirPipeline(), estado);
  const produtos = [...estado.produtos.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const comAlerta = new Set(estado.alertas.filter((a) => a.nivel !== "monitorar").map((a) => a.produtoKey));
  const conta = (n: string) => estado.alertas.filter((a) => a.nivel === n).length;
  // Valor em risco: maior impacto por produto entre vencimento, excesso e parado (sem contar duas vezes).
  const riscoPorProduto = new Map<string, number>();
  for (const a of estado.alertas) {
    if (!["risco_vencimento", "alto_valor_parado", "excesso_estoque"].includes(a.detector)) continue;
    riscoPorProduto.set(a.produtoKey, Math.max(riscoPorProduto.get(a.produtoKey) ?? 0, a.impactoFinanceiro ?? 0));
  }
  const valorEmRisco = [...riscoPorProduto.values()].reduce((s, v) => s + v, 0);
  return {
    dataReferencia: estado.dataRef,
    produtos,
    alertas: estado.alertas,
    grupos: estado.grupos,
    resumo: {
      totalProdutos: produtos.length,
      totalMovimentacoes: movimentacoes.length,
      criticos: conta("critico"),
      atencao: conta("atencao"),
      monitorar: conta("monitorar"),
      produtosOk: produtos.filter((p) => !comAlerta.has(p.key)).length,
      valorTotalEstoque: estado.valorTotal,
      valorEmRisco,
    },
    dag,
  };
}

export { normalizarNome };

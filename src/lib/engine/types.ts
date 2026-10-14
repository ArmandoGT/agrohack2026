// Tipos centrais do motor de análise AgroSentinela.

export type TipoMov = "entrada" | "saida";

/** Um registro de movimentação, já normalizado. Campos ausentes são `null` (nunca zero). */
export interface Movimentacao {
  id: string;
  produto: string; // nome como veio no registro
  categoria: string;
  unidade: string; // unidade original
  quantidade: number; // na unidade original
  estoqueMinimo: number | null;
  tipo: TipoMov;
  data: string; // YYYY-MM-DD
  preco: number | null; // preço unitário de aquisição
  lote: string | null;
  validade: string | null; // YYYY-MM-DD
  fornecedor: string | null;
  destino: string | null;
  responsavel: string | null;
  simulado?: boolean;
}

export type Nivel = "critico" | "atencao" | "monitorar";
export type Confianca = "alta" | "media" | "baixa";

export type DetectorId =
  | "estoque_critico"
  | "ruptura_prevista"
  | "consumo_crescente"
  | "retirada_anomala"
  | "risco_vencimento"
  | "excesso_estoque"
  | "variacao_preco"
  | "alto_valor_parado"
  | "cadastro_duplicado"
  | "qualidade_dados";

export interface Alerta {
  id: string;
  detector: DetectorId;
  produtoKey: string;
  produto: string;
  categoria: string;
  nivel: Nivel;
  titulo: string;
  /** Por quê: frase em linguagem simples para o gestor. */
  mensagem: string;
  /** Como calculamos: critério técnico usado. */
  metodo: string;
  acao: string;
  confianca: Confianca;
  confiancaMotivo: string;
  diasAteProblema: number | null;
  impactoFinanceiro: number | null;
  score: number;
  evidencias: Record<string, string | number | null>;
}

export interface LoteSaldo {
  lote: string;
  quantidade: number; // na unidade base do produto
  validade: string | null;
  preco: number | null;
  dataEntrada: string;
  fornecedor: string | null;
}

export interface ProdutoAnalise {
  key: string;
  nome: string; // grafia mais frequente
  grafias: string[];
  categoria: string;
  unidade: string; // unidade de exibição (a mais usada nos registros); todas as quantidades estão nela
  familia: string; // família de unidade (kg, L, un...) usada para comparar produtos
  estoqueMinimo: number | null;
  saldo: number;
  lotes: LoteSaldo[];
  /** Consumo diário (saídas) indexado a partir de `inicio`. */
  consumoDiario: number[];
  inicio: string;
  consumoMedioDia: number; // taxa usada nas projeções
  janelaTaxa: string; // ex.: "últimos 30 dias"
  saidasNaJanela: number;
  totalSaidas: number;
  totalEntradas: number;
  diasHistorico: number;
  coberturaDias: number | null; // saldo / consumo médio
  ultimaSaida: string | null;
  ultimaEntrada: string | null;
  precoReferencia: number | null; // último preço conhecido
  valorEstoque: number | null; // null = desconhecido (sem preço)
  valorEstimado: boolean; // true quando algum lote usou preço de outro lote
  classeABC: "A" | "B" | "C" | null;
  movimentacoes: Movimentacao[];
  unidadesIgnoradas: number; // movimentações com unidade incompatível
}

export interface Config {
  dataReferencia?: string; // padrão: data mais recente nos registros
  leadTimeDias: number;
  coberturaExcessoDias: number;
  horizonteVencimentoDias: number;
  diasParado: number;
  variacaoPrecoPct: number;
  anomaliaZ: number;
  anomaliaMultiplo: number;
  crescimentoMinimo: number;
  similaridadeDuplicado: number;
  /** Fusões confirmadas pelo usuário: chave de origem -> chave canônica. */
  fusoes: Record<string, string>;
}

export interface Analise {
  dataReferencia: string;
  produtos: ProdutoAnalise[];
  alertas: Alerta[];
  grupos: GrupoDuplicado[];
  resumo: {
    totalProdutos: number;
    totalMovimentacoes: number;
    criticos: number;
    atencao: number;
    monitorar: number;
    produtosOk: number;
    valorTotalEstoque: number;
    valorEmRisco: number;
  };
  dag: DagExecucao[];
}

export interface GrupoDuplicado {
  chaves: string[];
  nomes: string[];
  categoria: string;
  similaridade: number;
}

export interface DagExecucao {
  id: string;
  rotulo: string;
  dependeDe: string[];
  ms: number;
  saida: string;
}

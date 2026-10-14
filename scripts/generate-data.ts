// Gera a base SIMULADA (claramente identificada) com anomalias plantadas
// e o gabarito usado pelo loop de avaliação (npm run eval).
// Uso: npm run gerar-dados

import { mkdirSync, writeFileSync } from "node:fs";
import { normalizarNome, somarDias } from "../src/lib/engine/normalize";
import type { DetectorId } from "../src/lib/engine/types";

const DATA_REF = "2026-10-10";
const N = 375; // dias de histórico
const INICIO = somarDias(DATA_REF, -N);

// RNG determinístico (mulberry32): mesma semente = mesma base.
let seed = Number(process.env.SEED ?? 20261029);
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const U = (a: number, b: number) => a + rnd() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

interface Linha {
  produto: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  estoque_minimo: number | null;
  tipo: "entrada" | "saida";
  data: string;
  preco_aquisicao: number | null;
  lote: string | null;
  validade: string | null;
  fornecedor: string | null;
  destino: string | null;
  responsavel: string | null;
}

interface Produto {
  nome: string;
  categoria: string;
  unidade: string;
  taxa: number; // consumo médio por dia
  preco: number;
  intervalo: [number, number]; // dias entre retiradas
  inteiro?: boolean;
  validadeDias?: [number, number]; // perecível
  fornecedores: string[];
  destinos: string[];
}

const RESP = ["Carlos Souza", "Marta Lima", "João Pereira", "Ana Costa", "Paulo Nunes"];
const TALHOES = ["Talhão 1", "Talhão 2", "Talhão 3", "Talhão 4", "Talhão 5"];
const MAQ = ["Trator JD 6110", "Pulverizador Uniport", "Colheitadeira", "Plantadeira 9 linhas", "Caminhonete"];
const PIVO = ["Pivô central", "Gotejamento café", "Horta"];
const EQUIPE = ["Equipe de campo", "Oficina", "Almoxarifado"];

const P = (nome: string, categoria: string, unidade: string, taxa: number, preco: number, intervalo: [number, number], extra: Partial<Produto> = {}): Produto => ({
  nome, categoria, unidade, taxa, preco, intervalo,
  fornecedores: extra.fornecedores ?? ["AgroRondônia Insumos", "Cooperativa Vale do Jamari"],
  destinos: extra.destinos ?? TALHOES,
  ...extra,
});
const PEREC: [number, number] = [420, 720];

const CATALOGO: Produto[] = [
  P("Ureia", "Fertilizantes", "kg", 120, 3.1, [3, 7]),
  P("Cloreto de potássio (KCl)", "Fertilizantes", "kg", 90, 3.4, [4, 8]),
  P("MAP", "Fertilizantes", "kg", 70, 4.6, [4, 9]),
  P("NPK 04-14-08", "Fertilizantes", "kg", 110, 3.2, [3, 7]),
  P("NPK 10-10-10", "Fertilizantes", "kg", 60, 3.0, [4, 8]),
  P("NPK 04-30-16", "Fertilizantes", "kg", 80, 4.1, [4, 8]),
  P("Sulfato de amônio", "Fertilizantes", "kg", 50, 2.2, [5, 9]),
  P("FTE BR-12", "Fertilizantes", "kg", 8, 6.5, [6, 12]),
  P("Calcário dolomítico", "Corretivos", "t", 0.6, 210, [5, 12]),
  P("Gesso agrícola", "Corretivos", "t", 0.4, 180, [6, 12]),
  P("Semente de soja", "Sementes", "sc", 1.2, 380, [3, 8], { validadeDias: [300, 400] }),
  P("Semente de feijão", "Sementes", "sc", 0.5, 290, [5, 10], { validadeDias: [300, 400] }),
  P("Semente de braquiária", "Sementes", "kg", 4, 28, [5, 12], { validadeDias: [400, 600] }),
  P("Herbicida glifosato", "Defensivos e biológicos", "L", 6, 32, [3, 7], { validadeDias: PEREC, destinos: TALHOES }),
  P("Fungicida azoxistrobina", "Defensivos e biológicos", "L", 1.5, 145, [4, 9], { validadeDias: PEREC }),
  P("Inseticida lambda-cialotrina", "Defensivos e biológicos", "L", 1.1, 98, [4, 9], { validadeDias: PEREC }),
  P("Adjuvante óleo mineral", "Defensivos e biológicos", "L", 2, 24, [4, 9], { validadeDias: PEREC }),
  P("Trichoderma", "Defensivos e biológicos", "kg", 0.6, 85, [5, 12], { validadeDias: [200, 260] }),
  P("Azospirillum", "Defensivos e biológicos", "L", 0.4, 60, [5, 12], { validadeDias: [200, 260] }),
  P("Inoculante para soja", "Defensivos e biológicos", "L", 0.5, 55, [4, 10], { validadeDias: [200, 260] }),
  P("Óleo diesel S10", "Combustíveis e lubrificantes", "L", 95, 6.2, [1, 3], { destinos: MAQ, fornecedores: ["Posto Ariquemes Diesel", "Distribuidora Norte"] }),
  P("Óleo de motor 15W40", "Combustíveis e lubrificantes", "L", 1.2, 28, [5, 10], { destinos: MAQ }),
  P("Óleo hidráulico", "Combustíveis e lubrificantes", "L", 1.4, 22, [5, 10], { destinos: MAQ }),
  P("Graxa", "Combustíveis e lubrificantes", "kg", 0.5, 38, [3, 7], { destinos: MAQ }),
  P("Filtro de óleo", "Peças e manutenção", "un", 0.12, 65, [10, 20], { inteiro: true, destinos: MAQ, fornecedores: ["Peças Agrícolas RO"] }),
  P("Filtro de ar", "Peças e manutenção", "un", 0.08, 120, [12, 25], { inteiro: true, destinos: MAQ, fornecedores: ["Peças Agrícolas RO"] }),
  P("Correia", "Peças e manutenção", "un", 0.07, 140, [12, 25], { inteiro: true, destinos: MAQ, fornecedores: ["Peças Agrícolas RO"] }),
  P("Rolamento", "Peças e manutenção", "un", 0.1, 85, [10, 20], { inteiro: true, destinos: MAQ, fornecedores: ["Peças Agrícolas RO"] }),
  P("Bico de pulverização", "Peças e manutenção", "un", 0.4, 18, [8, 15], { inteiro: true, destinos: ["Pulverizador Uniport"], fornecedores: ["Peças Agrícolas RO"] }),
  P("Disco de corte", "Peças e manutenção", "un", 0.06, 210, [15, 30], { inteiro: true, destinos: MAQ, fornecedores: ["Peças Agrícolas RO"] }),
  P("Eletrodo", "Peças e manutenção", "kg", 0.15, 42, [10, 20], { destinos: ["Oficina"], fornecedores: ["Ferragens Jamari"] }),
  P("Tubo PVC 50mm", "Materiais de Irrigação", "m", 1.5, 14, [8, 15], { destinos: PIVO, fornecedores: ["Irriga Norte"] }),
  P("Mangueira de gotejamento", "Materiais de Irrigação", "m", 12, 1.8, [6, 12], { destinos: PIVO, fornecedores: ["Irriga Norte"] }),
  P("Conector de irrigação", "Materiais de Irrigação", "un", 1.2, 3.5, [6, 12], { inteiro: true, destinos: PIVO, fornecedores: ["Irriga Norte"] }),
  P("Luva nitrílica", "EPI e materiais diversos", "par", 1.5, 9, [4, 9], { inteiro: true, destinos: EQUIPE, fornecedores: ["EPI Center"] }),
  P("Respirador PFF2", "EPI e materiais diversos", "un", 0.8, 14, [5, 10], { inteiro: true, destinos: EQUIPE, fornecedores: ["EPI Center"] }),
  P("Óculos de proteção", "EPI e materiais diversos", "un", 0.15, 22, [10, 20], { inteiro: true, destinos: EQUIPE, fornecedores: ["EPI Center"] }),
  P("Bota de PVC", "EPI e materiais diversos", "par", 0.06, 75, [15, 30], { inteiro: true, destinos: EQUIPE, fornecedores: ["EPI Center"] }),
  P("Saco de ráfia", "EPI e materiais diversos", "un", 6, 1.6, [4, 9], { inteiro: true, destinos: EQUIPE, fornecedores: ["Ferragens Jamari"] }),
  P("Adubo foliar", "Fertilizantes", "L", 2.5, 34, [5, 10]),
  P("Semente de milho híbrido", "Sementes", "sc", 0, 920, [30, 30], { validadeDias: [250, 250] }),
];

type Ajuste = {
  taxaFn?: (dia: number) => number; // taxa em função do dia
  corteDia?: number; // a partir deste dia não há reposição automática
  saldoFinalDias?: number; // saldo final desejado (em dias da taxa final)
  minDias?: number;
};

const linhas: Linha[] = [];
let loteSeq = 1;

function arred(p: Produto, q: number) {
  return p.inteiro ? Math.max(1, Math.round(q)) : Math.round(q * 100) / 100;
}

function entrada(p: Produto, dia: number, qtd: number, min: number, precoMult = 1, extra: Partial<Linha> = {}) {
  const data = somarDias(INICIO, dia);
  const mes = dia / 30;
  linhas.push({
    produto: p.nome, categoria: p.categoria, unidade: p.unidade, quantidade: arred(p, qtd), estoque_minimo: arred(p, min),
    tipo: "entrada", data,
    preco_aquisicao: Math.round(p.preco * (1 + 0.004 * mes) * U(0.97, 1.03) * precoMult * 100) / 100,
    lote: `L${String(loteSeq++).padStart(4, "0")}`,
    validade: p.validadeDias ? somarDias(data, Math.round(U(...p.validadeDias))) : null,
    fornecedor: pick(p.fornecedores), destino: null, responsavel: pick(RESP),
    ...extra,
  });
}

/** Simula um produto: retiradas no ritmo da taxa e reposição quando o saldo cobre < 45 dias. */
function simular(p: Produto, a: Ajuste = {}) {
  const taxa = a.taxaFn ?? (() => p.taxa);
  const taxaFinal = taxa(N);
  const min = taxaFinal * (a.minDias ?? U(10, 15));
  // 1) agenda de retiradas (independente do saldo)
  const saidas: { dia: number; q: number }[] = [];
  for (let d = Math.round(U(1, p.intervalo[1])); d <= N; ) {
    const k = Math.round(U(...p.intervalo));
    saidas.push({ dia: d, q: arred(p, taxa(d) * k * U(0.8, 1.2)) });
    d += k;
  }
  // 2) compras: estoque inicial + reposição pelo ponto de pedido.
  // Com saldo final desejado, cada compra é limitada ao que ainda será consumido + o alvo.
  let saldo = 0;
  const alvo = a.saldoFinalDias !== undefined ? taxaFinal * a.saldoFinalDias : null;
  const necessidade = (dia: number) => saidas.filter((x) => x.dia >= dia).reduce((t, x) => t + x.q, 0) + (alvo ?? 0);
  const comprar = (dia: number, q: number) => {
    const normal = q;
    if (alvo !== null) q = Math.min(q, necessidade(dia) - saldo);
    if (q <= 0 || (alvo !== null && normal !== Infinity && q < normal * 0.2)) return;
    entrada(p, dia, q, min);
    saldo += arred(p, q);
  };
  comprar(0, taxa(0) * U(60, 90));
  const corte = a.corteDia ?? Infinity;
  let corteFeito = false;
  for (const s of saidas) {
    if (alvo !== null && s.dia >= corte && !corteFeito) {
      corteFeito = true;
      comprar(s.dia, Infinity); // completa exatamente o necessário para terminar no alvo
    } else if (s.dia < corte && saldo - s.q < taxa(s.dia) * 45) {
      comprar(s.dia, taxa(s.dia) * U(60, 90));
    }
    const q = Math.min(s.q, saldo);
    if (q <= 0) continue;
    saldo -= q;
    linhas.push({
      produto: p.nome, categoria: p.categoria, unidade: p.unidade, quantidade: arred(p, q), estoque_minimo: arred(p, min),
      tipo: "saida", data: somarDias(INICIO, s.dia), preco_aquisicao: null, lote: null, validade: null,
      fornecedor: null, destino: pick(p.destinos), responsavel: pick(RESP),
    });
  }
  return { min, saldo };
}

const porNome = (n: string) => CATALOGO.find((p) => p.nome === n)!;
const gabarito: { detector: DetectorId; produtos: string[]; descricao: string }[] = [];
const aceitaveis: { detector: DetectorId; produtos: string[] }[] = [];
const gab = (detector: DetectorId, nomes: string[], descricao: string) => gabarito.push({ detector, produtos: nomes.map(normalizarNome), descricao });
const ok = (detector: DetectorId, nomes: string[]) => aceitaveis.push({ detector, produtos: nomes.map(normalizarNome) });

const especiais = new Set<string>();
const esp = (n: string) => (especiais.add(n), porNome(n));

// A) Diesel: consumo crescente nos últimos 4 meses + estoque crítico (~8 dias)
simular(esp("Óleo diesel S10"), {
  taxaFn: (d) => (d < N - 120 ? 95 : 95 + ((d - (N - 120)) / 120) * 150),
  corteDia: N - 35, saldoFinalDias: 8, minDias: 15,
});
gab("consumo_crescente", ["Óleo diesel S10"], "Consumo de diesel cresce ~150% em 4 meses");
gab("estoque_critico", ["Óleo diesel S10"], "Diesel abaixo do mínimo, dura ~8 dias");
ok("ruptura_prevista", ["Óleo diesel S10"]);

// B) Ureia: estoque crítico + grafias diferentes
simular(esp("Ureia"), { corteDia: N - 50, saldoFinalDias: 5, minDias: 12 });
gab("estoque_critico", ["Ureia"], "Ureia com saldo para ~5 dias");

// C) Graxa: ainda acima do mínimo, mas atinge o mínimo em ~9 dias
simular(esp("Graxa"), { corteDia: N - 40, saldoFinalDias: 19, minDias: 10 });
gab("ruptura_prevista", ["Graxa"], "Graxa atinge o mínimo em ~9 dias");

// D) Glifosato: uma retirada 8x maior há 20 dias
{
  const p = esp("Herbicida glifosato");
  simular(p);
  entrada(p, N - 22, p.taxa * 60, p.taxa * 12);
  linhas.push({
    produto: p.nome, categoria: p.categoria, unidade: p.unidade, quantidade: Math.round(p.taxa * 5 * 8), estoque_minimo: Math.round(p.taxa * 12),
    tipo: "saida", data: somarDias(INICIO, N - 20), preco_aquisicao: null, lote: null, validade: null,
    fornecedor: null, destino: "Talhão 7 (arrendado)", responsavel: "Rafael Dias (temporário)",
  });
  gab("retirada_anomala", ["Herbicida glifosato"], "Retirada de ~240 L (8x o normal) no Talhão 7");
  ok("ruptura_prevista", ["Herbicida glifosato"]);
  ok("estoque_critico", ["Herbicida glifosato"]);
}

// E) Inoculante: lote grande vencendo em 20 dias
{
  const p = esp("Inoculante para soja");
  simular(p);
  entrada(p, N - 30, 45, p.taxa * 12, 1, { validade: somarDias(DATA_REF, 20), lote: "INOC-2026-09" });
  gab("risco_vencimento", ["Inoculante para soja"], "45 L de inoculante vencem em 20 dias");
  ok("excesso_estoque", ["Inoculante para soja"]);
}

// F) Fungicida: lote vence em 75 dias com o triplo do uso previsto
{
  const p = esp("Fungicida azoxistrobina");
  simular(p);
  entrada(p, N - 60, p.taxa * 75 * 3, p.taxa * 12, 1, { validade: somarDias(DATA_REF, 75), lote: "FUNG-2026-08" });
  gab("risco_vencimento", ["Fungicida azoxistrobina"], "Lote de fungicida vence em 75 dias com sobra");
  ok("excesso_estoque", ["Fungicida azoxistrobina"]);
  ok("alto_valor_parado", ["Fungicida azoxistrobina"]);
}

// G) Trichoderma: lote vencido há 10 dias ainda com saldo
{
  const p = esp("Trichoderma");
  simular(p);
  entrada(p, N - 60, 60, p.taxa * 12, 1, { validade: somarDias(DATA_REF, -10), lote: "TRICHO-2026-08" });
  gab("risco_vencimento", ["Trichoderma"], "Lote de Trichoderma vencido em estoque");
  ok("excesso_estoque", ["Trichoderma"]);
}

// H) Calcário: compra de 300 dias de consumo há 60 dias
{
  const p = esp("Calcário dolomítico");
  simular(p);
  entrada(p, N - 60, p.taxa * 300, p.taxa * 12);
  gab("excesso_estoque", ["Calcário dolomítico"], "Calcário com cobertura de ~1 ano");
  ok("alto_valor_parado", ["Calcário dolomítico"]);
}

// I) Duplicidades: "KCl" e "Oleo Hidraulico 68" lançados com outro nome; grafias de sulfato
{
  const kcl = esp("Cloreto de potássio (KCl)");
  simular(kcl);
  const alias = { ...kcl, nome: "KCl" };
  for (let d = N - 80; d < N; d += 9) {
    linhas.push({ produto: "KCl", categoria: kcl.categoria, unidade: "kg", quantidade: 400, estoque_minimo: null, tipo: "saida",
      data: somarDias(INICIO, d), preco_aquisicao: null, lote: null, validade: null, fornecedor: null, destino: pick(TALHOES), responsavel: pick(RESP) });
  }
  entrada(alias, N - 85, 4000, 0);
  gab("cadastro_duplicado", ["Cloreto de potássio (KCl)", "KCl"], "KCl lançado também como 'KCl'");
  ok("ruptura_prevista", ["KCl"]); // efeito da duplicidade: some depois da unificação
  ok("estoque_critico", ["KCl"]);

  const oh = esp("Óleo hidráulico");
  simular(oh);
  entrada({ ...oh, nome: "Oleo Hidraulico 68" }, N - 70, 40, 0);
  for (let d = N - 65; d < N; d += 12)
    linhas.push({ produto: "Oleo Hidraulico 68", categoria: oh.categoria, unidade: "L", quantidade: 5, estoque_minimo: null, tipo: "saida",
      data: somarDias(INICIO, d), preco_aquisicao: null, lote: null, validade: null, fornecedor: null, destino: pick(MAQ), responsavel: pick(RESP) });
  gab("cadastro_duplicado", ["Óleo hidráulico", "Oleo Hidraulico 68"], "Óleo hidráulico com dois cadastros");

  const sa = esp("Sulfato de amônio");
  simular(sa);
  gab("cadastro_duplicado", ["Sulfato de amônio"], "Sulfato de amônio escrito de 3 formas");
}

// J) MAP: última compra 40% mais cara
{
  const p = esp("MAP");
  simular(p);
  entrada(p, N - 25, p.taxa * 40, p.taxa * 12, 1.4, { fornecedor: "Fertil Express (novo)" });
  gab("variacao_preco", ["MAP"], "Compra de MAP 40% acima da mediana");
  ok("excesso_estoque", ["MAP"]);
}

// K) Milho híbrido: R$ 55 mil parados há 150 dias
{
  const p = esp("Semente de milho híbrido");
  entrada(p, N - 150, 60, 5);
  gab("alto_valor_parado", ["Semente de milho híbrido"], "60 sacos de milho híbrido sem uso há 150 dias");
  ok("risco_vencimento", ["Semente de milho híbrido"]); // parado e com validade em ~100 dias: alerta legítimo
}

// L) Qualidade: unidades misturadas, saldo negativo, entradas sem preço
{
  const af = esp("Adubo foliar");
  simular(af);
  for (let d = N - 90; d < N; d += 30)
    linhas.push({ produto: af.nome, categoria: af.categoria, unidade: "kg", quantidade: 20, estoque_minimo: null, tipo: "saida",
      data: somarDias(INICIO, d), preco_aquisicao: null, lote: null, validade: null, fornecedor: null, destino: pick(TALHOES), responsavel: pick(RESP) });
  gab("qualidade_dados", ["Adubo foliar"], "Adubo foliar lançado em L e em kg");

  const om = esp("Óleo de motor 15W40");
  simular(om);
  for (let d = N - 40; d < N; d += 4)
    linhas.push({ produto: om.nome, categoria: om.categoria, unidade: "L", quantidade: 25, estoque_minimo: null, tipo: "saida",
      data: somarDias(INICIO, d), preco_aquisicao: null, lote: null, validade: null, fornecedor: null, destino: pick(MAQ), responsavel: pick(RESP) });
  gab("qualidade_dados", ["Óleo de motor 15W40"], "Saídas de óleo de motor maiores que as entradas");
  ok("estoque_critico", ["Óleo de motor 15W40"]);
  ok("ruptura_prevista", ["Óleo de motor 15W40"]);
  ok("consumo_crescente", ["Óleo de motor 15W40"]);
  ok("retirada_anomala", ["Óleo de motor 15W40"]);

  const bico = esp("Bico de pulverização");
  simular(bico);
  entrada(bico, N - 30, 20, 3, 1, { preco_aquisicao: null });
  gab("qualidade_dados", ["Bico de pulverização"], "Entrada de bicos sem preço");
}

// Demais produtos: comportamento normal (não devem gerar alertas relevantes)
for (const p of CATALOGO) if (!especiais.has(p.nome)) simular(p);

// Grafias diferentes do mesmo nome (acento/maiúsculas)
for (const l of linhas) {
  if (l.produto === "Sulfato de amônio" && rnd() < 0.3) l.produto = pick(["SULFATO DE AMÔNIO", "Sulfato de Amonio"]);
  if (l.produto === "Ureia" && rnd() < 0.15) l.produto = "UREIA";
}
ok("cadastro_duplicado", ["Ureia"]);

linhas.sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === "entrada" ? -1 : 1));

// CSV no formato brasileiro: ";" e vírgula decimal, datas dd/mm/aaaa
const br = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
const dt = (d: string | null) => (d ? d.split("-").reverse().join("/") : "");
const cab = "id;produto;categoria;unidade;quantidade;estoque_minimo;tipo;data;preco_aquisicao;lote;validade;fornecedor;destino;responsavel;simulado";
const csv = [cab, ...linhas.map((l, i) =>
  [`S${i + 1}`, l.produto, l.categoria, l.unidade, br(l.quantidade), br(l.estoque_minimo), l.tipo, dt(l.data), br(l.preco_aquisicao),
    l.lote ?? "", dt(l.validade), l.fornecedor ?? "", l.destino ?? "", l.responsavel ?? "", "true"].join(";"))].join("\n");

const OUT = process.env.OUT_DIR ?? "data";
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/simulado.csv`, "﻿" + csv);
writeFileSync(`${OUT}/ground_truth.json`, JSON.stringify({ aviso: "DADOS SIMULADOS — gabarito das anomalias plantadas", dataReferencia: DATA_REF, gabarito, aceitaveis }, null, 2));
if (!process.env.OUT_DIR) {
  mkdirSync("public/data", { recursive: true });
  writeFileSync("public/data/simulado.csv", "﻿" + csv);
}
console.log(`SIMULADO: ${linhas.length} movimentações, ${CATALOGO.length} produtos, ${gabarito.length} anomalias plantadas -> data/simulado.csv`);

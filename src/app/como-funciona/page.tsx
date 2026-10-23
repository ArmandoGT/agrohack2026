"use client";

import Link from "next/link";
import { IconeSeta } from "@/components/icones";
import { btnSec, campo, Card, Titulo } from "@/components/ui";
import { CONFIG_PADRAO } from "@/lib/engine/config";
import type { DagExecucao } from "@/lib/engine/types";
import { useDados } from "@/lib/store";

const c = CONFIG_PADRAO;

const PERGUNTAS: [string, string, string][] = [
  ["O que está acabando e precisa ser comprado?", "Estoque crítico + Vai faltar em breve", "/"],
  ["Quais produtos podem vencer antes de serem utilizados?", "Vencimento por lote, com consumo previsto (FEFO)", "/"],
  ["Quanto está sendo consumido de cada produto?", "Gráfico semanal e consumo médio na ficha do produto", "/produtos"],
  ["Existem movimentações ou consumos fora do padrão?", "Retirada fora do padrão + Consumo em alta", "/"],
  ["Por quanto tempo o estoque atual será suficiente?", "Cobertura em dias, data prevista e projeção no gráfico", "/produtos"],
  ["Quais produtos representam maior valor armazenado?", "Curva ABC, Dinheiro parado e Excesso", "/financeiro"],
  ["Quais itens merecem atenção imediata?", "Score de prioridade e níveis Crítico / Atenção / Monitorar", "/"],
];

const CRITERIOS: [string, string][] = [
  ["Estoque crítico", "Saldo ≤ estoque mínimo informado. Duração = saldo ÷ consumo médio diário da janela mais recente com pelo menos 3 retiradas (30 dias → 90 dias → histórico)."],
  ["Vai faltar em breve", `Saldo acima do mínimo, mas (saldo − mínimo) ÷ consumo diário ≤ ${c.leadTimeDias} dias (prazo típico de compra).`],
  ["Consumo em alta", `Retiradas (sem as atípicas) em 4 blocos de 30 dias: cada bloco ≥ 90% do anterior e o último ≥ ${c.crescimentoMinimo}× o primeiro. Exige 12+ retiradas.`],
  ["Retirada fora do padrão", `Comparada às retiradas dos 90 dias anteriores: z-score robusto (mediana/MAD) ≥ ${c.anomaliaZ}, ≥ ${c.anomaliaMultiplo}× a mediana e ≥ 1,5× a maior retirada anterior.`],
  ["Vencimento", `Lotes que vencem em até ${c.horizonteVencimentoDias} dias: sobra = quantidade − consumo previsto até a validade, usando primeiro os lotes que vencem antes (FEFO). Lote já vencido com saldo = crítico.`],
  ["Excesso de estoque", `Cobertura > ${c.coberturaExcessoDias} dias. Mostra o valor acima de 3 meses de uso.`],
  ["Variação de preço", `Preço unitário da compra vs. mediana das compras dos 12 meses anteriores; diferença ≥ ${c.variacaoPrecoPct}%.`],
  ["Dinheiro parado", `Itens das curvas A/B sem retirada há ≥ ${c.diasParado} dias, ou com menos de 10% do saldo usado em 90 dias.`],
  ["Cadastro duplicado", `Grafo de nomes: siglas expandidas (KCl → cloreto de potássio), acentos removidos, Jaro-Winkler e contenção de termos ≥ ${c.similaridadeDuplicado * 100}%, mesma categoria e unidade. Fórmulas diferentes (NPK 04-14-08 × 10-10-10) nunca são unidas.`],
  ["Qualidade dos dados", "Saldo negativo, unidades incompatíveis (kg × L), entradas sem preço e lotes perecíveis sem validade."],
  ["Prioridade (0–100)", "Base do nível (crítico 70, atenção 40, monitorar 15) + urgência (dias até o problema) + impacto financeiro (escala log) − penalidade por baixa confiança."],
];

const LIMITES = [
  "Projeções supõem que o consumo recente se mantém; não modelam sazonalidade de safra (ex.: sementes no plantio).",
  "Com poucas retiradas, a confiança é marcada como baixa e a estimativa deve ser lida como indicativa.",
  "Sem lote informado nas saídas, assumimos que o lote que vence primeiro é usado primeiro (FEFO).",
  "Preço ou validade ausentes não viram zero: ficam como “não informado” e o valor é marcado como estimado.",
  "Unidades da mesma família são convertidas (t→kg, mL→L); famílias diferentes não são somadas.",
  "O estoque mínimo vem dos próprios registros; o sistema não define mínimos sozinho.",
];

function Dag({ nos }: { nos: DagExecucao[] }) {
  const nivel = new Map<string, number>();
  for (const n of nos) nivel.set(n.id, n.dependeDe.length ? Math.max(...n.dependeDe.map((d) => nivel.get(d)! + 1)) : 0);
  const colunas = Math.max(...nivel.values()) + 1;
  const porColuna = Array.from({ length: colunas }, (_, i) => nos.filter((n) => nivel.get(n.id) === i));
  const W = 172, H = 46, GX = 34, GY = 10;
  const alturaMax = Math.max(...porColuna.map((c) => c.length)) * (H + GY);
  const pos = new Map<string, { x: number; y: number }>();
  porColuna.forEach((col, i) => {
    const off = (alturaMax - col.length * (H + GY)) / 2;
    col.forEach((n, j) => pos.set(n.id, { x: i * (W + GX), y: off + j * (H + GY) }));
  });
  const largura = colunas * (W + GX) - GX;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${largura} ${alturaMax}`} width={largura} height={alturaMax} role="img" aria-label="Diagrama do pipeline de análise">
        {nos.flatMap((n) =>
          n.dependeDe.map((d) => {
            const a = pos.get(d)!, b = pos.get(n.id)!;
            const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2;
            return <path key={d + n.id} d={`M${x1},${y1} C${x1 + GX / 2},${y1} ${x2 - GX / 2},${y2} ${x2},${y2}`} fill="none" stroke="var(--ouro)" strokeWidth={1.5} />;
          }),
        )}
        {nos.map((n) => {
          const p = pos.get(n.id)!;
          const det = nivel.get(n.id) === 3 && n.id !== "grafo_duplicados";
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`}>
              <rect width={W} height={H} rx={8} fill={det ? "var(--brand-soft)" : "var(--surface)"} stroke={det ? "var(--brand)" : "var(--border-strong)"} />
              <text x={10} y={18} fontSize={12} fontWeight={600} fill="var(--text)" fontFamily="var(--font-texto)">{n.rotulo.length > 24 ? n.rotulo.slice(0, 23) + "…" : n.rotulo}</text>
              <text x={10} y={35} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-texto)">{(n.saida.length > 26 ? n.saida.slice(0, 25) + "…" : n.saida)} · {n.ms.toFixed(1)} ms</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ComoFunciona() {
  const { analise, dataReferencia, definirDataReferencia } = useDados();
  return (
    <>
      <Titulo titulo="Como funciona" subtitulo="Os critérios, o caminho dos dados e os limites da solução, explicados para quem vai decidir." />

      <Card>
        <h2 className="text-xl font-semibold md:text-2xl">As 7 perguntas do desafio e onde são respondidas</h2>
        <ol className="mt-2 divide-y divide-border text-base">
          {PERGUNTAS.map(([q, r, href], i) => (
            <li key={q} className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 py-3 md:grid-cols-[2rem_1fr_auto] md:items-baseline">
              <span className="font-serif text-2xl leading-none font-semibold text-carmim">{i + 1}</span>
              <span className="font-semibold">{q}</span>
              <Link href={href} className="col-start-2 inline-flex items-center gap-1 text-brand underline decoration-ouro/60 underline-offset-4 md:col-start-3">
                {r}
                <IconeSeta className="h-4 w-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="mt-5">
        <h2 className="text-xl font-semibold md:text-2xl">Pipeline de análise (grafo acíclico)</h2>
        <p className="mt-0.5 mb-3 text-sm text-muted">Cada caixa é uma etapa. Os detectores (em verde) rodam em paralelo sobre os saldos e alimentam o score de prioridade. Tempos reais desta execução.</p>
        <Dag nos={analise.dag} />
      </Card>

      <Card className="mt-5">
        <h2 className="text-xl font-semibold md:text-2xl">Critérios de cada alerta</h2>
        <dl className="mt-2 divide-y divide-border text-base">
          {CRITERIOS.map(([t, d]) => (
            <div key={t} className="grid gap-1 py-3 sm:grid-cols-[210px_1fr]">
              <dt className="font-semibold">{t}</dt>
              <dd className="text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Limites que assumimos</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base text-muted marker:text-ouro">{LIMITES.map((l) => <li key={l}>{l}</li>)}</ul>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Data de referência (o “hoje” da análise)</h2>
          <p className="mt-1 text-base text-muted">Por padrão é a data mais recente dos registros, para analisar bases históricas como se fosse o dia do último lançamento.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input type="date" className={`${campo} w-auto`} value={dataReferencia ?? analise.dataReferencia} onChange={(e) => definirDataReferencia(e.target.value || null)} aria-label="Data de referência" />
            <button className={btnSec} onClick={() => definirDataReferencia(null)}>Automática</button>
          </div>
        </Card>
      </div>
    </>
  );
}

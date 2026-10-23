"use client";

import Link from "next/link";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertaCard, Card, fmtNum, fmtR$, Kpi, Secao, Titulo } from "@/components/ui";

const eixo = { fill: "var(--muted)", fontFamily: "var(--font-texto)" };
const dica = { contentStyle: { background: "var(--surface)", border: "1px solid var(--ouro)", borderRadius: 8, fontFamily: "var(--font-texto)" } };
import { useDados } from "@/lib/store";

export default function Financeiro() {
  const { analise } = useDados();
  const total = analise.resumo.valorTotalEstoque;
  const ordenados = analise.produtos.filter((p) => (p.valorEstoque ?? 0) > 0).sort((a, b) => b.valorEstoque! - a.valorEstoque!);
  let acc = 0;
  const pareto = ordenados.slice(0, 15).map((p) => {
    acc += p.valorEstoque!;
    return { nome: p.nome.length > 18 ? p.nome.slice(0, 17) + "…" : p.nome, valor: Math.round(p.valorEstoque!), acumulado: Math.round((acc / total) * 1000) / 10 };
  });
  const porCategoria = Object.entries(
    analise.produtos.reduce<Record<string, number>>((m, p) => ((m[p.categoria] = (m[p.categoria] ?? 0) + (p.valorEstoque ?? 0)), m), {}),
  ).sort((a, b) => b[1] - a[1]);
  const classeA = ordenados.filter((p) => p.classeABC === "A");
  const alertas = analise.alertas.filter((a) => ["alto_valor_parado", "excesso_estoque", "variacao_preco"].includes(a.detector));

  return (
    <>
      <Titulo titulo="Financeiro" subtitulo="Onde está o dinheiro do estoque, o que está parado ou foi comprado em excesso, e compras com preço fora do padrão." />
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Valor em estoque" valor={fmtR$(total)} />
        <Kpi rotulo="Curva A" valor={`${classeA.length} itens`} detalhe={`concentram 80% do valor (${fmtNum((classeA.length / Math.max(1, ordenados.length)) * 100, 0)}% dos itens)`} />
        <Kpi rotulo="Em risco" valor={fmtR$(analise.resumo.valorEmRisco)} detalhe="vencimento, excesso, parado" tom="atencao" />
        <Kpi rotulo="Alertas financeiros" valor={alertas.length} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="text-xl font-semibold">Curva ABC: os 15 itens de maior valor</h2>
          <p className="mt-0.5 text-sm text-muted">Barras verdes: valor parado em cada item. Linha azul: % acumulado do valor total do estoque.</p>
          <div className="mt-3 h-80" role="img" aria-label="Gráfico de Pareto do valor em estoque">
            <ResponsiveContainer>
              <ComposedChart data={pareto} margin={{ left: 36, right: 8, top: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="nome" angle={-40} textAnchor="end" interval={0} tick={{ ...eixo, fontSize: 12 }} />
                <YAxis yAxisId="v" tick={{ ...eixo, fontSize: 13 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
                <YAxis yAxisId="p" orientation="right" domain={[0, 100]} tick={{ ...eixo, fontSize: 13 }} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip {...dica} formatter={(v: number, n) => (n === "acumulado" ? `${v}%` : fmtR$(v))} />
                <Bar yAxisId="v" dataKey="valor" name="valor" fill="var(--brand)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="p" dataKey="acumulado" name="acumulado" stroke="var(--monitorar)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl font-semibold">Valor por categoria</h2>
          <ul className="space-y-3">
            {porCategoria.map(([c, v]) => (
              <li key={c}>
                <div className="flex justify-between gap-2 text-base">
                  <span>{c}</span>
                  <span className="tabular font-semibold whitespace-nowrap">{fmtR$(v)}</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full border border-border bg-surface-2">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(v / total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6">
        <Secao className="mb-3">Alertas financeiros</Secao>
        <div className="grid gap-4 lg:grid-cols-2">
          {alertas.map((a) => <AlertaCard key={a.id} a={a} />)}
        </div>
        {!alertas.length && <p className="text-base text-muted">Nenhum alerta financeiro. <Link className="font-semibold text-brand underline underline-offset-4" href="/">Ver painel</Link></p>}
      </section>
    </>
  );
}

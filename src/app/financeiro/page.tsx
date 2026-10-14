"use client";

import Link from "next/link";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertaCard, Card, fmtNum, fmtR$, Kpi, Titulo } from "@/components/ui";
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
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Valor em estoque" valor={fmtR$(total)} />
        <Kpi rotulo="Curva A" valor={`${classeA.length} itens`} detalhe={`concentram 80% do valor (${fmtNum((classeA.length / Math.max(1, ordenados.length)) * 100, 0)}% dos itens)`} />
        <Kpi rotulo="Em risco" valor={fmtR$(analise.resumo.valorEmRisco)} detalhe="vencimento, excesso, parado" tom="atencao" />
        <Kpi rotulo="Alertas financeiros" valor={alertas.length} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="font-semibold">Curva ABC: os 15 itens de maior valor</h2>
          <p className="text-xs text-muted">Barras: valor parado em cada item. Linha: % acumulado do valor total do estoque.</p>
          <div className="mt-3 h-80" role="img" aria-label="Gráfico de Pareto do valor em estoque">
            <ResponsiveContainer>
              <ComposedChart data={pareto} margin={{ left: 8, right: 8, top: 8, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="nome" angle={-40} textAnchor="end" interval={0} fontSize={10} />
                <YAxis yAxisId="v" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={44} />
                <YAxis yAxisId="p" orientation="right" domain={[0, 100]} fontSize={11} tickFormatter={(v) => `${v}%`} width={40} />
                <Tooltip formatter={(v: number, n) => (n === "acumulado" ? `${v}%` : fmtR$(v))} />
                <Bar yAxisId="v" dataKey="valor" name="valor" fill="var(--brand)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="p" dataKey="acumulado" name="acumulado" stroke="var(--atencao)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Valor por categoria</h2>
          <ul className="space-y-2">
            {porCategoria.map(([c, v]) => (
              <li key={c}>
                <div className="flex justify-between text-sm">
                  <span>{c}</span>
                  <span className="tabular font-medium">{fmtR$(v)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(v / total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Alertas financeiros</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {alertas.map((a) => <AlertaCard key={a.id} a={a} />)}
        </div>
        {!alertas.length && <p className="text-sm text-muted">Nenhum alerta financeiro. <Link className="text-brand underline" href="/">Ver painel</Link></p>}
      </section>
    </>
  );
}

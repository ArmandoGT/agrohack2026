"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Fleurao, IconeVoltar } from "@/components/icones";
import { AlertaCard, BadgeNivel, Card, fmtData, fmtNum, fmtR$, Kpi, Secao } from "@/components/ui";
import { diasEntre, fatorConversao, somarDias } from "@/lib/engine/normalize";
import type { ProdutoAnalise } from "@/lib/engine/types";
import { useDados } from "@/lib/store";
import { alertasDoProduto, piorNivel } from "@/lib/util";

function series(p: ProdutoAnalise, dataRef: string) {
  const n = diasEntre(p.inicio, dataRef) + 1;
  const delta = new Array(n).fill(0);
  for (const m of p.movimentacoes) {
    const f = fatorConversao(m.unidade, p.unidade);
    if (f === null) continue;
    const d = diasEntre(p.inicio, m.data);
    if (d >= 0 && d < n) delta[d] += (m.tipo === "entrada" ? 1 : -1) * m.quantidade * f;
  }
  const saldo: { data: string; saldo?: number; projecao?: number }[] = [];
  let s = 0;
  for (let d = 0; d < n; d++) {
    s += delta[d];
    if (d % 3 === 0 || d === n - 1) saldo.push({ data: somarDias(p.inicio, d), saldo: Math.round(s * 100) / 100 });
  }
  // Projeção: mantido o consumo médio recente, até zerar (máx. 90 dias)
  if (p.consumoMedioDia > 0 && s > 0) {
    saldo[saldo.length - 1].projecao = saldo[saldo.length - 1].saldo;
    const fim = Math.min(90, Math.ceil(s / p.consumoMedioDia));
    for (let d = 3; d <= fim; d += 3) saldo.push({ data: somarDias(dataRef, d), projecao: Math.max(0, Math.round((s - p.consumoMedioDia * d) * 100) / 100) });
  }
  const semanas: { semana: string; consumo: number }[] = [];
  const c = p.consumoDiario;
  for (let fim = c.length; fim > 0 && semanas.length < 52; fim -= 7) {
    semanas.unshift({ semana: somarDias(p.inicio, Math.max(0, fim - 7)), consumo: Math.round(c.slice(Math.max(0, fim - 7), fim).reduce((a, b) => a + b, 0) * 100) / 100 });
  }
  return { saldo, semanas };
}

const curta = (d: string) => d.slice(8, 10) + "/" + d.slice(5, 7);

// Gráficos limpos: eixos em sans, cor de tinta suave, dica no tom do marfim.
const eixo = { fontSize: 13, fill: "var(--muted)", fontFamily: "var(--font-texto)" };
const dica = { contentStyle: { background: "var(--surface)", border: "1px solid var(--ouro)", borderRadius: 8, fontFamily: "var(--font-texto)" } };

export default function ProdutoDetalhe() {
  const { key } = useParams<{ key: string }>();
  const chave = decodeURIComponent(key);
  const { analise } = useDados();
  const p = analise.produtos.find((x) => x.key === chave);
  const dados = useMemo(() => (p ? series(p, analise.dataReferencia) : null), [p, analise.dataReferencia]);
  if (!p || !dados) return <p className="text-base">Produto não encontrado. <Link href="/produtos" className="text-brand underline underline-offset-4">Voltar</Link></p>;
  const alertas = alertasDoProduto(analise, p.key);
  const nivel = piorNivel(alertas);
  const zera = p.consumoMedioDia > 0 && p.saldo > 0 ? somarDias(analise.dataReferencia, Math.floor(p.saldo / p.consumoMedioDia)) : null;

  return (
    <>
      <Link href="/produtos" className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded px-1 text-base font-semibold text-brand hover:underline">
        <IconeVoltar className="h-5 w-5" />
        Voltar para Produtos
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="capitular text-3xl leading-tight font-semibold md:text-4xl">{p.nome}</h1>
        <BadgeNivel nivel={nivel} />
      </div>
      <p className="mt-1 text-base text-muted">{p.categoria} · curva {p.classeABC ?? "—"}</p>
      {p.grafias.length > 1 && <p className="mt-1 text-sm text-muted">Também registrado como: {p.grafias.join(", ")}</p>}
      <Fleurao className="mt-4 mb-6" />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi rotulo="Saldo" valor={`${fmtNum(p.saldo)} ${p.unidade}`} tom={p.estoqueMinimo !== null && p.saldo <= p.estoqueMinimo ? "critico" : undefined} />
        <Kpi rotulo="Estoque mínimo" valor={p.estoqueMinimo === null ? "—" : `${fmtNum(p.estoqueMinimo)} ${p.unidade}`} />
        <Kpi rotulo="Consumo médio" valor={`${fmtNum(p.consumoMedioDia, 2)}/dia`} detalhe={p.janelaTaxa} />
        <Kpi rotulo="Dura até" valor={zera ? fmtData(zera) : "—"} detalhe={p.coberturaDias !== null ? `~${fmtNum(p.coberturaDias, 0)} dias` : "sem consumo recente"} />
        <Kpi rotulo="Valor em estoque" valor={fmtR$(p.valorEstoque)} detalhe={p.valorEstimado ? "estimado (entradas sem preço)" : undefined} />
        <Kpi rotulo="Última retirada" valor={fmtData(p.ultimaSaida)} detalhe={p.ultimaSaida ? `há ${diasEntre(p.ultimaSaida, analise.dataReferencia)} dias` : undefined} />
      </section>

      {alertas.length > 0 && (
        <section className="mt-6">
          <Secao className="mb-3">Alertas deste produto</Secao>
          <div className="grid gap-4 lg:grid-cols-2">
            {alertas.map((a) => (
              <AlertaCard key={a.id} a={a} mostrarProduto={false} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Saldo ao longo do tempo</h2>
          <p className="mt-0.5 text-sm text-muted">Linha verde: saldo. Linha azul tracejada: projeção mantendo o consumo médio ({p.janelaTaxa}). Linha vermelha: estoque mínimo.</p>
          <div className="mt-3 h-64" role="img" aria-label={`Gráfico do saldo de ${p.nome}`}>
            <ResponsiveContainer>
              <LineChart data={dados.saldo} margin={{ left: 0, right: 8, top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="data" tickFormatter={curta} tick={eixo} minTickGap={30} />
                <YAxis tick={eixo} width={56} />
                <Tooltip {...dica} labelFormatter={(d) => fmtData(String(d))} formatter={(v: number) => `${fmtNum(v)} ${p.unidade}`} />
                {p.estoqueMinimo !== null && <ReferenceLine y={p.estoqueMinimo} stroke="var(--critico)" strokeDasharray="4 4" />}
                <ReferenceLine x={analise.dataReferencia} stroke="var(--muted)" label={{ value: "hoje", fontSize: 12, fill: "var(--muted)", position: "top" }} />
                <Line type="stepAfter" dataKey="saldo" name="Saldo" stroke="var(--brand)" dot={false} strokeWidth={2} />
                <Line type="linear" dataKey="projecao" name="Projeção" stroke="var(--monitorar)" strokeDasharray="6 4" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Consumo por semana</h2>
          <p className="mt-0.5 text-sm text-muted">Soma das retiradas em cada semana ({p.unidade}). Mostra períodos de maior e menor uso.</p>
          <div className="mt-3 h-64" role="img" aria-label={`Gráfico do consumo semanal de ${p.nome}`}>
            <ResponsiveContainer>
              <BarChart data={dados.semanas} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="semana" tickFormatter={curta} tick={eixo} minTickGap={30} />
                <YAxis tick={eixo} width={56} />
                <Tooltip {...dica} labelFormatter={(d) => `Semana de ${fmtData(String(d))}`} formatter={(v: number) => `${fmtNum(v)} ${p.unidade}`} />
                <Bar dataKey="consumo" name="Consumo" fill="var(--brand)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Lotes em estoque</h2>
          <p className="mb-3 text-sm text-muted">Ordem de uso: vence primeiro, sai primeiro.</p>
          <div className="overflow-x-auto">
          <table className="tabela w-full text-base [&_td]:px-2 [&_th]:px-2">
            <thead className="text-left text-sm font-semibold text-muted">
              <tr><th className="py-1.5">Lote</th><th className="text-right">Qtd</th><th>Validade</th><th className="text-right">Preço</th></tr>
            </thead>
            <tbody>
              {[...p.lotes].sort((a, b) => (a.validade ?? "9").localeCompare(b.validade ?? "9")).map((l) => {
                const dias = l.validade ? diasEntre(analise.dataReferencia, l.validade) : null;
                return (
                  <tr key={l.lote + l.dataEntrada} className="border-t border-border">
                    <td className="py-2">{l.lote}<div className="text-sm text-muted">{l.fornecedor ?? ""}</div></td>
                    <td className="tabular text-right">{fmtNum(l.quantidade)} {p.unidade}</td>
                    <td className={dias !== null && dias < 0 ? "font-semibold text-critico" : dias !== null && dias <= 90 ? "text-atencao" : ""}>
                      {l.validade ? `${fmtData(l.validade)} (${dias! < 0 ? "vencido" : `${dias} d`})` : <span className="text-muted">não informada</span>}
                    </td>
                    <td className="tabular text-right">{l.preco === null ? <span className="text-muted">não informado</span> : l.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {!p.lotes.length && <p className="mt-2 text-base text-muted">Nenhum lote com saldo.</p>}
        </Card>
        <Card>
          <h2 className="mb-3 text-xl font-semibold">Últimas movimentações</h2>
          <div className="max-h-80 overflow-auto">
            <table className="tabela w-full text-base [&_td]:px-2 [&_th]:px-2">
              <thead className="sticky top-0 bg-surface text-left text-sm font-semibold text-muted">
                <tr><th className="py-1.5">Data</th><th>Tipo</th><th className="text-right">Qtd</th><th>Destino / fornecedor</th></tr>
              </thead>
              <tbody>
                {[...p.movimentacoes].reverse().slice(0, 40).map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="py-2 tabular">{fmtData(m.data)}</td>
                    <td className={m.tipo === "entrada" ? "font-semibold text-ok" : ""}>{m.tipo === "entrada" ? "Entrada" : "Saída"}</td>
                    <td className="tabular text-right">{fmtNum(m.quantidade)} {m.unidade}</td>
                    <td className="truncate text-sm text-muted">{m.tipo === "entrada" ? m.fornecedor : [m.destino, m.responsavel].filter(Boolean).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
}

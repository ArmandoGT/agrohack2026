"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Fleurao, IconeVoltar } from "@/components/icones";
import { AlertaCard, BadgeNivel, Card, fmtData, fmtNum, fmtR$, Kpi, Secao } from "@/components/ui";
import { diasEntre, fatorConversao, somarDias } from "@/lib/engine/normalize";
import type { PrevisaoConsumo, ProdutoAnalise } from "@/lib/engine/types";
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
  const saldo: { data: string; saldo?: number; projecao?: number; modelo?: number; faixa?: [number, number] }[] = [];
  let s = 0;
  for (let d = 0; d < n; d++) {
    s += delta[d];
    if (d % 3 === 0 || d === n - 1) saldo.push({ data: somarDias(p.inicio, d), saldo: Math.round(s * 100) / 100 });
  }
  // Projeção a partir do saldo utilizável (lote vencido não vai para a lavoura): consumo médio recente, até zerar (máx. 90 dias)
  if (p.saldoVencido > 0) s = Math.max(0, s - p.saldoVencido);
  if (p.consumoMedioDia > 0 && s > 0) {
    saldo[saldo.length - 1].projecao = Math.round(s * 100) / 100;
    const fim = Math.min(90, Math.ceil(s / p.consumoMedioDia));
    for (let d = 3; d <= fim; d += 3) saldo.push({ data: somarDias(dataRef, d), projecao: Math.max(0, Math.round((s - p.consumoMedioDia * d) * 100) / 100) });
  }
  // Previsão do modelo (só quando ele venceu a média no teste), com a faixa de 80%, até zerar.
  const v = p.previsao;
  if (v?.status === "modelo" && s > 0) {
    const r = (x: number) => Math.max(0, Math.round(x * 100) / 100);
    const pontos = [{ data: dataRef, modelo: s, faixa: [s, s] as [number, number] }];
    for (const f of v.projecao) {
      pontos.push({ data: f.data, modelo: r(s - f.centro), faixa: [r(s - f.alto), r(s - f.baixo)] });
      if (s - f.baixo <= 0) break;
    }
    for (const pt of pontos) {
      const existente = saldo.find((x) => x.data === pt.data);
      if (existente) Object.assign(existente, { modelo: pt.modelo, faixa: pt.faixa });
      else saldo.push(pt);
    }
    saldo.sort((a, b) => a.data.localeCompare(b.data));
  }
  const semanas: { semana: string; consumo: number }[] = [];
  const c = p.consumoDiario;
  for (let fim = c.length; fim > 0 && semanas.length < 52; fim -= 7) {
    semanas.unshift({ semana: somarDias(p.inicio, Math.max(0, fim - 7)), consumo: Math.round(c.slice(Math.max(0, fim - 7), fim).reduce((a, b) => a + b, 0) * 100) / 100 });
  }
  return { saldo, semanas };
}

const curta = (d: string) => d.slice(8, 10) + "/" + d.slice(5, 7);
const pct = (x: number | null) => (x === null ? "—" : `${fmtNum(x * 100, 0)}%`);

/** Resumo do modelo de previsão em linguagem simples, com a prova do teste ao lado. */
function PrevisaoModelo({ v, dataRef, unidade }: { v: PrevisaoConsumo; dataRef: string; unidade: string }) {
  const b = v.backtest;
  const teste = b && (
    <p className="mt-2 text-sm text-muted">
      Teste: escondemos as últimas 4 semanas ({b.rodadas} {b.rodadas === 1 ? "vez" : "vezes"}) e comparamos com o consumo real. Erro do modelo:{" "}
      <strong className="text-text">{pct(b.wapeModelo)}</strong>; erro da média simples: <strong className="text-text">{pct(b.wapeMedia)}</strong>. A faixa de 80% acertou{" "}
      {b.faixaAcertou} de {b.rodadas}.
      {v.status === "modelo" && b.faixaAcertou * 2 < b.rodadas && " Neste produto o consumo real saiu da faixa na maioria dos testes: leia as datas com cautela."}
    </p>
  );
  const z = v.diasAteZerar;
  const quando = (d: number | null) => (d === null ? "depois de 12 semanas" : fmtData(somarDias(dataRef, d)));
  return (
    <Card className="mt-3">
      <h2 className="text-xl font-semibold">Previsão do modelo</h2>
      {v.status === "modelo" && z && (
        <>
          <p className="mt-1 text-base">
            {z.centro === null ? (
              <>
                No ritmo que o modelo aprendeu, o saldo <strong>dura mais de 12 semanas</strong>.
              </>
            ) : (
              <>
                O saldo deve zerar por volta de <strong>{fmtData(somarDias(dataRef, z.centro))}</strong> (~{z.centro} dias), entre {quando(z.pessimista)} e {quando(z.otimista)}.
              </>
            )}{" "}
            {v.tendenciaSemanal !== null && Math.abs(v.tendenciaSemanal) >= 0.005 && (
              <span className="text-muted">
                Tendência: consumo {v.tendenciaSemanal > 0 ? "subindo" : "caindo"} ~{fmtNum(Math.abs(v.tendenciaSemanal))} {unidade} por semana.
              </span>
            )}
          </p>
          {teste}
        </>
      )}
      {v.status === "media" && (
        <>
          <p className="mt-1 text-base">
            Para este produto, o modelo <strong>não foi claramente melhor que a média simples</strong> no teste (precisa errar pelo menos 5% menos). Por isso o app continua usando a média.
          </p>
          {teste}
        </>
      )}
      {v.status === "curto" && <p className="mt-1 text-base text-muted">Sem previsão do modelo: {v.motivo}.</p>}
    </Card>
  );
}

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
  const zera = p.consumoMedioDia > 0 && p.saldoUtilizavel > 0 ? somarDias(analise.dataReferencia, Math.floor(p.saldoUtilizavel / p.consumoMedioDia)) : null;

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
        <Kpi
          rotulo={p.saldoVencido > 0 ? "Saldo utilizável" : "Saldo"}
          valor={`${fmtNum(p.saldoUtilizavel)} ${p.unidade}`}
          detalhe={p.saldoVencido > 0 ? `+ ${fmtNum(p.saldoVencido)} ${p.unidade} vencidos (físico ${fmtNum(p.saldo)})` : undefined}
          tom={p.estoqueMinimo !== null && p.saldoUtilizavel <= p.estoqueMinimo ? "critico" : undefined}
        />
        <Kpi rotulo="Estoque mínimo" valor={p.estoqueMinimo === null ? "—" : `${fmtNum(p.estoqueMinimo)} ${p.unidade}`} />
        <Kpi rotulo="Consumo médio" valor={`${fmtNum(p.consumoMedioDia, 2)}/dia`} detalhe={p.janelaTaxa} />
        <Kpi rotulo="Dura até" valor={zera ? fmtData(zera) : "—"} detalhe={p.coberturaDias !== null ? `~${fmtNum(p.coberturaDias, 0)} dias` : "sem consumo recente"} />
        <Kpi rotulo="Valor em estoque" valor={fmtR$(p.valorEstoque)} detalhe={p.valorEstimado ? "estimado (entradas sem preço)" : undefined} />
        <Kpi rotulo="Última retirada" valor={fmtData(p.ultimaSaida)} detalhe={p.ultimaSaida ? `há ${diasEntre(p.ultimaSaida, analise.dataReferencia)} dias` : undefined} />
      </section>
      {p.previsao && <PrevisaoModelo v={p.previsao} dataRef={analise.dataReferencia} unidade={p.unidade} />}

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
          <p className="mt-0.5 text-sm text-muted">Linha verde: saldo. Linha azul tracejada: projeção mantendo o consumo médio ({p.janelaTaxa}).{p.previsao?.status === "modelo" && " Linha dourada: previsão do modelo, com a faixa de 80% sombreada."} Linha vermelha: estoque mínimo.</p>
          <div className="mt-3 h-64" role="img" aria-label={`Gráfico do saldo de ${p.nome}`}>
            <ResponsiveContainer>
              <ComposedChart data={dados.saldo} margin={{ left: 0, right: 8, top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="data" tickFormatter={curta} tick={eixo} minTickGap={30} />
                <YAxis tick={eixo} width={56} />
                <Tooltip {...dica} labelFormatter={(d) => fmtData(String(d))} formatter={(v: number | number[]) => (Array.isArray(v) ? `${fmtNum(v[0])} a ${fmtNum(v[1])} ${p.unidade}` : `${fmtNum(v)} ${p.unidade}`)} />
                {p.estoqueMinimo !== null && <ReferenceLine y={p.estoqueMinimo} stroke="var(--critico)" strokeDasharray="4 4" />}
                <ReferenceLine x={analise.dataReferencia} stroke="var(--muted)" label={{ value: "hoje", fontSize: 12, fill: "var(--muted)", position: "top" }} />
                <Line type="stepAfter" dataKey="saldo" name="Saldo" stroke="var(--brand)" dot={false} strokeWidth={2} />
                <Area type="linear" dataKey="faixa" name="Faixa do modelo (80%)" stroke="none" fill="var(--ouro-claro)" fillOpacity={0.35} connectNulls />
                <Line type="linear" dataKey="projecao" name="Projeção pela média" stroke="var(--monitorar)" strokeDasharray="6 4" dot={false} strokeWidth={2} connectNulls />
                <Line type="linear" dataKey="modelo" name="Previsão do modelo" stroke="var(--ouro-escuro)" dot={false} strokeWidth={2.5} connectNulls />
              </ComposedChart>
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

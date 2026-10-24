"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconeBusca, IconeCritico, IconeOk, IconeRegistrar } from "@/components/icones";
import { AlertaCard, btnPrim, campo, DETECTOR, fmtData, fmtR$, Kpi, Moldura, NIVEL, Secao, Titulo } from "@/components/ui";
import type { DetectorId, Nivel } from "@/lib/engine/types";
import { useDados } from "@/lib/store";

export default function Painel() {
  const { analise } = useDados();
  const { resumo, alertas } = analise;
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [detector, setDetector] = useState<DetectorId | "">("");
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");

  const categorias = useMemo(() => [...new Set(analise.produtos.map((p) => p.categoria))].sort(), [analise.produtos]);
  const filtrados = alertas.filter(
    (a) =>
      (nivel === "todos" || a.nivel === nivel) &&
      (!detector || a.detector === detector) &&
      (!categoria || a.categoria === categoria) &&
      (!busca || a.produto.toLowerCase().includes(busca.toLowerCase())),
  );
  const urgentes = alertas.filter((a) => a.nivel === "critico");

  const alternar = (n: Nivel) => setNivel(nivel === n ? "todos" : n);

  return (
    <>
      <Titulo titulo="Painel do dia" subtitulo={`O que merece atenção no estoque em ${fmtData(analise.dataReferencia)}, do mais urgente para o menos urgente.`}>
        <Link href="/movimentacoes" className={`${btnPrim} w-full sm:w-auto`}>
          <IconeRegistrar className="h-5 w-5" />
          Registrar entrada ou saída
        </Link>
      </Titulo>

      {urgentes.length > 0 && (
        <section className="mb-6" aria-label="Resumo para o gestor">
          <Moldura preenchimento="var(--critico-soft)">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-critico md:text-2xl">
              <IconeCritico className="h-6 w-6 shrink-0" />
              Resumo para o gestor
            </h2>
            <p className="mt-1 text-base leading-relaxed md:text-lg">
              {urgentes.length === 1 ? "Há 1 situação" : `Há ${urgentes.length} situações`} que exigem ação imediata:{" "}
              {urgentes
                .slice(0, 4)
                .map((a) => `${a.produto} (${a.titulo.toLowerCase()})`)
                .join("; ")}
              {urgentes.length > 4 ? " e outras." : "."}
            </p>
          </Moldura>
        </section>
      )}

      <section aria-label="Resumo">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi arco rotulo="Críticos" valor={resumo.criticos} detalhe="agir hoje" tom="critico" onClick={() => alternar("critico")} ativo={nivel === "critico"} />
          <Kpi arco rotulo="Atenção" valor={resumo.atencao} detalhe="agir nesta semana" tom="atencao" onClick={() => alternar("atencao")} ativo={nivel === "atencao"} />
          <Kpi arco rotulo="Monitorar" valor={resumo.monitorar} detalhe="acompanhar" tom="monitorar" onClick={() => alternar("monitorar")} ativo={nivel === "monitorar"} />
          <Kpi arco rotulo="Produtos OK" valor={`${resumo.produtosOk}/${resumo.totalProdutos}`} detalhe="sem alerta relevante" tom="ok" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Kpi rotulo="Valor em estoque" valor={fmtR$(resumo.valorTotalEstoque)} detalhe="pelo preço de compra" />
          <Kpi rotulo="Valor em risco" valor={fmtR$(resumo.valorEmRisco)} detalhe="vencimento, excesso, parado" />
        </div>
      </section>

      <section className="mt-8" aria-label="Alertas">
        <Secao className="mb-3">Alertas</Secao>
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por nível">
          {(["todos", "critico", "atencao", "monitorar"] as const).map((n) => {
            const qtd = n === "todos" ? alertas.length : alertas.filter((a) => a.nivel === n).length;
            const sel = nivel === n;
            const Icone = n === "todos" ? null : NIVEL[n].Icone;
            return (
              <button
                key={n}
                role="tab"
                aria-selected={sel}
                onClick={() => setNivel(n)}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-base font-semibold ${
                  sel ? "border-brand bg-brand text-white" : `border-border-strong bg-surface hover:bg-surface-2 ${n === "todos" ? "text-text" : NIVEL[n].texto}`
                }`}
              >
                {Icone && <Icone className="h-4 w-4" />}
                {n === "todos" ? "Todos" : NIVEL[n].rotulo}
                <span className="tabular">({qtd})</span>
              </button>
            );
          })}
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr]">
          <select className={`${campo} w-full`} value={detector} onChange={(e) => setDetector(e.target.value as DetectorId | "")} aria-label="Tipo de alerta">
            <option value="">Todos os tipos</option>
            {Object.entries(DETECTOR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className={`${campo} w-full`} value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="relative sm:col-span-2 lg:col-span-1">
            <IconeBusca className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted" />
            <input className={`${campo} w-full pl-10`} placeholder="Buscar produto…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filtrados.map((a) => (
            <AlertaCard key={a.id} a={a} />
          ))}
        </div>
        {!filtrados.length && (
          <p className="flex items-center justify-center gap-2 rounded-lg border border-ok/30 bg-ok-soft p-6 text-center text-lg text-ok">
            <IconeOk className="h-6 w-6" />
            Nenhum alerta com esses filtros.
          </p>
        )}
      </section>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AlertaCard, campo, DETECTOR, fmtData, fmtR$, Kpi, NIVEL, Titulo } from "@/components/ui";
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

  return (
    <>
      <Titulo titulo="Painel do dia" subtitulo={`O que merece atenção no estoque em ${fmtData(analise.dataReferencia)}, do mais urgente para o menos urgente.`} />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6" aria-label="Resumo">
        <Kpi rotulo="Críticos" valor={resumo.criticos} detalhe="agir hoje" tom="critico" />
        <Kpi rotulo="Atenção" valor={resumo.atencao} detalhe="agir nesta semana" tom="atencao" />
        <Kpi rotulo="Monitorar" valor={resumo.monitorar} detalhe="acompanhar" tom="monitorar" />
        <Kpi rotulo="Produtos OK" valor={`${resumo.produtosOk}/${resumo.totalProdutos}`} detalhe="sem alerta relevante" tom="ok" />
        <Kpi rotulo="Valor em estoque" valor={fmtR$(resumo.valorTotalEstoque)} detalhe="pelo preço de compra" />
        <Kpi rotulo="Valor em risco" valor={fmtR$(resumo.valorEmRisco)} detalhe="vencimento, excesso, parado" />
      </section>

      {urgentes.length > 0 && (
        <section className="mt-5 rounded-xl border border-critico/30 bg-critico-soft p-4">
          <h2 className="text-sm font-bold text-critico">Resumo para o gestor</h2>
          <p className="mt-1 text-sm">
            {urgentes.length === 1 ? "Há 1 situação" : `Há ${urgentes.length} situações`} que exigem ação imediata:{" "}
            {urgentes
              .slice(0, 4)
              .map((a) => `${a.produto} (${a.titulo.toLowerCase()})`)
              .join("; ")}
            {urgentes.length > 4 ? " e outras." : "."}
          </p>
        </section>
      )}

      <section className="mt-6" aria-label="Alertas">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-1" role="tablist">
            {(["todos", "critico", "atencao", "monitorar"] as const).map((n) => {
              const qtd = n === "todos" ? alertas.length : alertas.filter((a) => a.nivel === n).length;
              return (
                <button
                  key={n}
                  role="tab"
                  aria-selected={nivel === n}
                  onClick={() => setNivel(n)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${nivel === n ? "bg-brand text-white" : "hover:bg-surface-2"}`}
                >
                  {n === "todos" ? "Todos" : NIVEL[n].rotulo} ({qtd})
                </button>
              );
            })}
          </div>
          <select className={`${campo} w-auto`} value={detector} onChange={(e) => setDetector(e.target.value as DetectorId | "")} aria-label="Tipo de alerta">
            <option value="">Todos os tipos</option>
            {Object.entries(DETECTOR).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className={`${campo} w-auto`} value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className={`${campo} w-48`} placeholder="Buscar produto…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {filtrados.map((a) => (
            <AlertaCard key={a.id} a={a} />
          ))}
        </div>
        {!filtrados.length && <p className="rounded-xl bg-ok-soft p-6 text-center text-ok">Nenhum alerta com esses filtros. 🌱</p>}
      </section>
    </>
  );
}

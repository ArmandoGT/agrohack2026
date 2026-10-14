"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeNivel, campo, fmtNum, fmtR$, Titulo } from "@/components/ui";
import type { ProdutoAnalise } from "@/lib/engine/types";
import { useDados } from "@/lib/store";
import { alertasDoProduto, piorNivel } from "@/lib/util";

type Ordem = "status" | "nome" | "cobertura" | "valor";
const PESO = { critico: 0, atencao: 1, monitorar: 2, ok: 3 };

function Cobertura({ p }: { p: ProdutoAnalise }) {
  if (p.coberturaDias === null) return <span className="text-muted">sem consumo</span>;
  const d = p.coberturaDias;
  const cor = d <= 15 ? "bg-critico" : d <= 30 ? "bg-atencao" : d > 180 ? "bg-monitorar" : "bg-ok";
  return (
    <div className="flex items-center gap-2" title={`Cobertura: ${fmtNum(d, 0)} dias`}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${cor}`} style={{ width: `${Math.min(100, (d / 180) * 100)}%` }} />
      </div>
      <span className="tabular text-xs">{d > 999 ? "999+" : fmtNum(d, 0)} d</span>
    </div>
  );
}

export default function Produtos() {
  const { analise } = useDados();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("status");
  const linhas = useMemo(() => {
    const l = analise.produtos
      .filter((p) => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase()))
      .map((p) => ({ p, nivel: piorNivel(alertasDoProduto(analise, p.key)) }));
    return l.sort((a, b) =>
      ordem === "nome" ? a.p.nome.localeCompare(b.p.nome, "pt-BR")
      : ordem === "cobertura" ? (a.p.coberturaDias ?? 1e9) - (b.p.coberturaDias ?? 1e9)
      : ordem === "valor" ? (b.p.valorEstoque ?? 0) - (a.p.valorEstoque ?? 0)
      : PESO[a.nivel] - PESO[b.nivel] || a.p.nome.localeCompare(b.p.nome, "pt-BR"),
    );
  }, [analise, busca, ordem]);

  return (
    <>
      <Titulo titulo="Produtos" subtitulo={`${analise.produtos.length} produtos. Cobertura = por quantos dias o saldo dura no ritmo de consumo recente.`}>
        <div className="flex gap-2">
          <input className={`${campo} w-56`} placeholder="Buscar produto ou categoria…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
          <select className={`${campo} w-auto`} value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por">
            <option value="status">Ordenar por situação</option>
            <option value="cobertura">Menor cobertura</option>
            <option value="valor">Maior valor</option>
            <option value="nome">Nome</option>
          </select>
        </div>
      </Titulo>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Situação</th>
              <th className="px-3 py-2">Produto</th>
              <th className="px-3 py-2 text-right">Saldo</th>
              <th className="px-3 py-2 text-right">Mínimo</th>
              <th className="px-3 py-2 text-right">Consumo/dia</th>
              <th className="px-3 py-2">Cobertura</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-center">ABC</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ p, nivel }) => (
              <tr key={p.key} className="border-t border-border hover:bg-surface-2/60">
                <td className="px-3 py-2">
                  <BadgeNivel nivel={nivel} />
                </td>
                <td className="px-3 py-2">
                  <Link href={`/produtos/${encodeURIComponent(p.key)}`} className="font-medium text-brand hover:underline">
                    {p.nome}
                  </Link>
                  <div className="text-xs text-muted">{p.categoria}</div>
                </td>
                <td className="tabular px-3 py-2 text-right">
                  {fmtNum(p.saldo)} {p.unidade}
                </td>
                <td className="tabular px-3 py-2 text-right text-muted">{p.estoqueMinimo === null ? "—" : `${fmtNum(p.estoqueMinimo)} ${p.unidade}`}</td>
                <td className="tabular px-3 py-2 text-right">{fmtNum(p.consumoMedioDia, 2)}</td>
                <td className="px-3 py-2">
                  <Cobertura p={p} />
                </td>
                <td className="tabular px-3 py-2 text-right">
                  {fmtR$(p.valorEstoque)}
                  {p.valorEstimado && <span title="Valor estimado: há entradas sem preço"> *</span>}
                </td>
                <td className="px-3 py-2 text-center font-semibold">{p.classeABC ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">* valor estimado: há entradas sem preço (o preço ausente não é tratado como zero).</p>
    </>
  );
}

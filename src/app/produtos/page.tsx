"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconeBusca } from "@/components/icones";
import { BadgeNivel, campo, fmtNum, fmtR$, NIVEL, Titulo } from "@/components/ui";
import type { ProdutoAnalise } from "@/lib/engine/types";
import { useDados } from "@/lib/store";
import { alertasDoProduto, piorNivel } from "@/lib/util";

type Ordem = "status" | "nome" | "cobertura" | "valor";
const PESO = { critico: 0, atencao: 1, monitorar: 2, ok: 3 };

function Cobertura({ p }: { p: ProdutoAnalise }) {
  if (p.coberturaDias === null) return <span className="text-sm text-muted">sem consumo</span>;
  const d = p.coberturaDias;
  const cor = d <= 15 ? "bg-critico" : d <= 30 ? "bg-atencao" : d > 180 ? "bg-monitorar" : "bg-ok";
  return (
    <div className="flex items-center gap-2" title={`Cobertura: ${fmtNum(d, 0)} dias`}>
      <div className="h-2.5 w-20 overflow-hidden rounded-full border border-border bg-surface-2">
        <div className={`h-full ${cor}`} style={{ width: `${Math.min(100, (d / 180) * 100)}%` }} />
      </div>
      <span className="tabular text-sm whitespace-nowrap">{d > 999 ? "999+" : fmtNum(d, 0)} dias</span>
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
        <div className="grid w-full gap-2 sm:flex sm:w-auto">
          <div className="relative">
            <IconeBusca className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted" />
            <input className={`${campo} w-full pl-10 sm:w-64`} placeholder="Buscar produto ou categoria…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
          </div>
          <select className={`${campo} w-full sm:w-auto`} value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por">
            <option value="status">Ordenar por situação</option>
            <option value="cobertura">Menor cobertura</option>
            <option value="valor">Maior valor</option>
            <option value="nome">Nome</option>
          </select>
        </div>
      </Titulo>

      {/* Celular: um cartão por produto */}
      <ul className="space-y-3 md:hidden">
        {linhas.map(({ p, nivel }) => (
          <li key={p.key}>
            <Link
              href={`/produtos/${encodeURIComponent(p.key)}`}
              className={`block rounded-lg border border-border border-l-[6px] ${NIVEL[nivel].borda} bg-surface p-4 active:bg-surface-2`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-brand">{p.nome}</div>
                  <div className="text-sm text-muted">{p.categoria} · curva {p.classeABC ?? "—"}</div>
                </div>
                <BadgeNivel nivel={nivel} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <dt className="text-sm text-muted">Saldo</dt>
                  <dd className="tabular text-xl font-bold">
                    {fmtNum(p.saldo)} <span className="text-base font-semibold">{p.unidade}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Valor</dt>
                  <dd className="tabular text-xl font-bold">
                    {fmtR$(p.valorEstoque)}
                    {p.valorEstimado && <span title="Valor estimado: há entradas sem preço"> *</span>}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm text-muted">Cobertura</dt>
                  <dd>
                    <Cobertura p={p} />
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>

      {/* Computador: tabela */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="tabela w-full min-w-[760px] text-base">
          <thead className="bg-surface-2 text-left text-sm font-semibold text-muted">
            <tr>
              <th className="px-3 py-2.5">Situação</th>
              <th className="px-3 py-2.5">Produto</th>
              <th className="px-3 py-2.5 text-right">Saldo</th>
              <th className="px-3 py-2.5 text-right">Mínimo</th>
              <th className="px-3 py-2.5 text-right">Consumo/dia</th>
              <th className="px-3 py-2.5">Cobertura</th>
              <th className="px-3 py-2.5 text-right">Valor</th>
              <th className="px-3 py-2.5 text-center">ABC</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ p, nivel }) => (
              <tr key={p.key} className="border-t border-border hover:bg-surface-2/60">
                <td className="px-3 py-2.5">
                  <BadgeNivel nivel={nivel} />
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/produtos/${encodeURIComponent(p.key)}`} className="font-semibold text-brand underline decoration-ouro/60 underline-offset-4 hover:decoration-brand">
                    {p.nome}
                  </Link>
                  <div className="text-sm text-muted">{p.categoria}</div>
                </td>
                <td className="tabular px-3 py-2.5 text-right font-semibold">
                  {fmtNum(p.saldo)} {p.unidade}
                </td>
                <td className="tabular px-3 py-2.5 text-right text-muted">{p.estoqueMinimo === null ? "—" : `${fmtNum(p.estoqueMinimo)} ${p.unidade}`}</td>
                <td className="tabular px-3 py-2.5 text-right">{fmtNum(p.consumoMedioDia, 2)}</td>
                <td className="px-3 py-2.5">
                  <Cobertura p={p} />
                </td>
                <td className="tabular px-3 py-2.5 text-right">
                  {fmtR$(p.valorEstoque)}
                  {p.valorEstimado && <span title="Valor estimado: há entradas sem preço"> *</span>}
                </td>
                <td className="px-3 py-2.5 text-center font-semibold">{p.classeABC ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">* valor estimado: há entradas sem preço (o preço ausente não é tratado como zero).</p>
    </>
  );
}

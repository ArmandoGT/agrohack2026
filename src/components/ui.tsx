"use client";

import Link from "next/link";
import { useState } from "react";
import type { Alerta, Confianca, DetectorId, Nivel } from "@/lib/engine/types";

export const NIVEL: Record<Nivel | "ok", { rotulo: string; texto: string; fundo: string; borda: string; ponto: string }> = {
  critico: { rotulo: "Crítico", texto: "text-critico", fundo: "bg-critico-soft", borda: "border-l-critico", ponto: "bg-critico" },
  atencao: { rotulo: "Atenção", texto: "text-atencao", fundo: "bg-atencao-soft", borda: "border-l-atencao", ponto: "bg-atencao" },
  monitorar: { rotulo: "Monitorar", texto: "text-monitorar", fundo: "bg-monitorar-soft", borda: "border-l-monitorar", ponto: "bg-monitorar" },
  ok: { rotulo: "OK", texto: "text-ok", fundo: "bg-ok-soft", borda: "border-l-ok", ponto: "bg-ok" },
};

export const DETECTOR: Record<DetectorId, string> = {
  estoque_critico: "Estoque crítico",
  ruptura_prevista: "Vai faltar em breve",
  consumo_crescente: "Consumo em alta",
  retirada_anomala: "Retirada fora do padrão",
  risco_vencimento: "Vencimento",
  excesso_estoque: "Excesso de estoque",
  variacao_preco: "Variação de preço",
  alto_valor_parado: "Dinheiro parado",
  cadastro_duplicado: "Cadastro duplicado",
  qualidade_dados: "Qualidade dos dados",
};

const CONF: Record<Confianca, string> = { alta: "Confiança alta", media: "Confiança média", baixa: "Confiança baixa" };

export const fmtNum = (n: number | null | undefined, casas = 1) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : casas });
export const fmtR$ = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const fmtData = (d: string | null | undefined) => (d ? d.split("-").reverse().join("/") : "—");

export function BadgeNivel({ nivel }: { nivel: Nivel | "ok" }) {
  const n = NIVEL[nivel];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${n.fundo} ${n.texto}`}>
      <span className={`h-2 w-2 rounded-full ${n.ponto}`} aria-hidden />
      {n.rotulo}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Kpi({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: React.ReactNode; detalhe?: string; tom?: Nivel | "ok" }) {
  return (
    <Card className={tom ? `border-l-4 ${NIVEL[tom].borda}` : ""}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{rotulo}</div>
      <div className={`tabular mt-1 text-2xl font-bold ${tom ? NIVEL[tom].texto : ""}`}>{valor}</div>
      {detalhe && <div className="mt-0.5 text-xs text-muted">{detalhe}</div>}
    </Card>
  );
}

export function AlertaCard({ a, mostrarProduto = true }: { a: Alerta; mostrarProduto?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const n = NIVEL[a.nivel];
  return (
    <article className={`rounded-xl border border-border border-l-4 ${n.borda} bg-surface p-4 shadow-sm`}>
      <div className="flex flex-wrap items-center gap-2">
        <BadgeNivel nivel={a.nivel} />
        <span className="text-xs font-medium text-muted">{DETECTOR[a.detector]}</span>
        <span className="ml-auto text-xs text-muted tabular" title="Prioridade de 0 a 100">
          prioridade {a.score}
        </span>
      </div>
      <h3 className="mt-2 text-base font-semibold">
        {mostrarProduto && (
          <>
            <Link href={`/produtos/${encodeURIComponent(a.produtoKey)}`} className="text-brand hover:underline">
              {a.produto}
            </Link>
            <span className="text-muted"> · </span>
          </>
        )}
        {a.titulo}
      </h3>
      <p className="mt-1 text-sm leading-relaxed">{a.mensagem}</p>
      <p className="mt-2 text-sm">
        <span className="font-semibold text-brand-strong">O que fazer: </span>
        {a.acao}
      </p>
      <button
        onClick={() => setAberto(!aberto)}
        className="mt-2 text-xs font-medium text-muted underline-offset-2 hover:underline"
        aria-expanded={aberto}
      >
        {aberto ? "Ocultar" : "Como calculamos?"} · {CONF[a.confianca]}
      </button>
      {aberto && (
        <dl className="mt-2 space-y-1 rounded-lg bg-surface-2 p-3 text-xs">
          <div>
            <dt className="inline font-semibold">Critério: </dt>
            <dd className="inline">{a.metodo}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">{CONF[a.confianca]}: </dt>
            <dd className="inline">{a.confiancaMotivo}</dd>
          </div>
          {a.impactoFinanceiro !== null && (
            <div>
              <dt className="inline font-semibold">Impacto financeiro estimado: </dt>
              <dd className="inline">{fmtR$(a.impactoFinanceiro)}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

export function Titulo({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

export const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
export const btnPrim = `${btn} bg-brand text-white hover:bg-brand-strong`;
export const btnSec = `${btn} border border-border bg-surface hover:bg-surface-2`;
export const campo = "rounded-lg border border-border bg-surface px-3 py-2 text-sm";

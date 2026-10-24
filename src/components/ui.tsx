"use client";

import Link from "next/link";
import { useState } from "react";
import type { Alerta, Confianca, DetectorId, Nivel } from "@/lib/engine/types";
import { Fleurao, IconeAtencao, IconeCritico, IconeMonitorar, IconeOk } from "./icones";

type InfoNivel = {
  rotulo: string;
  texto: string;
  fundo: string;
  borda: string;
  ponto: string;
  Icone: (p: { className?: string }) => React.ReactElement;
};

export const NIVEL: Record<Nivel | "ok", InfoNivel> = {
  critico: { rotulo: "Crítico", texto: "text-critico", fundo: "bg-critico-soft", borda: "border-l-critico", ponto: "bg-critico", Icone: IconeCritico },
  atencao: { rotulo: "Atenção", texto: "text-atencao", fundo: "bg-atencao-soft", borda: "border-l-atencao", ponto: "bg-atencao", Icone: IconeAtencao },
  monitorar: { rotulo: "Monitorar", texto: "text-monitorar", fundo: "bg-monitorar-soft", borda: "border-l-monitorar", ponto: "bg-monitorar", Icone: IconeMonitorar },
  ok: { rotulo: "OK", texto: "text-ok", fundo: "bg-ok-soft", borda: "border-l-ok", ponto: "bg-ok", Icone: IconeOk },
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

/** Selo de nível: cor + ícone de forma própria + texto, para não depender só da cor. */
export function BadgeNivel({ nivel }: { nivel: Nivel | "ok" }) {
  const n = NIVEL[nivel];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap ${n.fundo} ${n.texto}`}>
      <n.Icone className="h-4 w-4" />
      {n.rotulo}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgb(43_33_22/0.06)] md:p-5 ${className}`}>{children}</div>;
}

/**
 * Moldura de destaque com topo em arco ogival e filete de ouro, como os painéis
 * de retábulo de Siena. O arco é um SVG que acompanha a largura do card.
 */
export function Moldura({
  children,
  className = "",
  corpo = "",
  preenchimento = "var(--surface)",
}: {
  children: React.ReactNode;
  className?: string;
  corpo?: string;
  /** Cor de fundo do card (CSS), usada também no arco. */
  preenchimento?: string;
}) {
  return (
    <div className={`relative flex flex-col ${className}`}>
      <svg viewBox="0 0 200 32" preserveAspectRatio="none" className="block h-7 w-full overflow-visible md:h-10" aria-hidden>
        <path d="M0 32V26C0 15 62 7 100 0.5C138 7 200 15 200 26V32" fill={preenchimento} stroke="var(--ouro)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg viewBox="0 0 12 12" className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 text-ouro" fill="currentColor" aria-hidden>
        <circle cx="6" cy="2.6" r="2.2" />
        <circle cx="2.8" cy="7.4" r="2.2" />
        <circle cx="9.2" cy="7.4" r="2.2" />
      </svg>
      <div className={`-mt-px flex-1 rounded-b-lg border-x border-b border-ouro px-4 pb-4 md:px-5 md:pb-5 ${corpo}`} style={{ background: preenchimento }}>
        {children}
      </div>
    </div>
  );
}

export function Kpi({
  rotulo,
  valor,
  detalhe,
  tom,
  arco = false,
  onClick,
  ativo,
}: {
  rotulo: string;
  valor: React.ReactNode;
  detalhe?: string;
  tom?: Nivel | "ok";
  arco?: boolean;
  onClick?: () => void;
  ativo?: boolean;
}) {
  const n = tom ? NIVEL[tom] : null;
  const conteudo = (
    <>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${n ? n.texto : "text-muted"}`}>
        {n && <n.Icone className="h-4 w-4 shrink-0" />}
        {rotulo}
      </div>
      <div className={`tabular mt-1 text-3xl leading-tight font-bold break-words md:text-[2rem] ${n ? n.texto : "text-text"}`}>{valor}</div>
      {detalhe && <div className="mt-0.5 text-sm text-muted">{detalhe}</div>}
    </>
  );
  const corpo = onClick ? (
    <button onClick={onClick} aria-pressed={ativo} className="flex w-full flex-col items-start text-left">
      {conteudo}
    </button>
  ) : (
    conteudo
  );
  if (arco) {
    return (
      <Moldura
        className={onClick ? "transition-transform hover:-translate-y-0.5" : ""}
        corpo="flex flex-col"
        preenchimento={ativo ? (tom ? `var(--${tom}-soft)` : "var(--surface-2)") : undefined}
      >
        {corpo}
        {n && (
          <div className="mt-auto pt-3" aria-hidden>
            <div className={`h-1 rounded-full ${n.ponto}`} />
          </div>
        )}
      </Moldura>
    );
  }
  return <Card className={n ? `border-l-[6px] ${n.borda}` : ""}>{corpo}</Card>;
}

export function AlertaCard({ a, mostrarProduto = true }: { a: Alerta; mostrarProduto?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const n = NIVEL[a.nivel];
  return (
    <article className={`flex flex-col rounded-lg border border-border border-l-[6px] ${n.borda} bg-surface p-4 shadow-[0_1px_2px_rgb(43_33_22/0.06)] md:p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        <BadgeNivel nivel={a.nivel} />
        <span className="text-sm font-medium text-muted">{DETECTOR[a.detector]}</span>
        <span className="tabular ml-auto rounded-md border border-border px-2 py-0.5 text-sm text-muted" title="Prioridade de 0 a 100">
          Prioridade <strong className="text-text">{a.score}</strong>
        </span>
      </div>
      <h3 className="mt-2 text-lg leading-snug font-semibold">
        {mostrarProduto && (
          <>
            <Link href={`/produtos/${encodeURIComponent(a.produtoKey)}`} className="text-brand underline decoration-ouro/60 underline-offset-4 hover:decoration-brand">
              {a.produto}
            </Link>
            <span className="text-muted"> · </span>
          </>
        )}
        {a.titulo}
      </h3>
      <p className="mt-1 text-base leading-relaxed">{a.mensagem}</p>
      <p className="mt-3 rounded-md border-l-2 border-ouro bg-brand-soft/60 px-3 py-2 text-base">
        <span className="font-semibold text-brand-strong">O que fazer: </span>
        {a.acao}
      </p>
      <button
        onClick={() => setAberto(!aberto)}
        className="mt-2 -ml-1 inline-flex min-h-11 items-center self-start rounded px-1 text-sm font-medium text-muted underline underline-offset-4 hover:text-text"
        aria-expanded={aberto}
      >
        {aberto ? "Ocultar detalhes" : "Como calculamos?"} · {CONF[a.confianca]}
      </button>
      {aberto && (
        <dl className="space-y-1 rounded-md bg-surface-2 p-3 text-sm">
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
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="capitular text-3xl leading-tight font-semibold text-text md:text-4xl">{titulo}</h1>
          {subtitulo && <p className="mt-1 max-w-3xl text-base text-muted">{subtitulo}</p>}
        </div>
        {children}
      </div>
      <Fleurao className="mt-4" />
    </div>
  );
}

/** Título de seção dentro da página (serifado, menor que o da página). */
export function Secao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl leading-snug font-semibold text-text md:text-2xl ${className}`}>{children}</h2>;
}

export const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrim = `${btn} bg-brand text-white shadow-[inset_0_0_0_1px_rgb(216_185_101/0.6),0_1px_2px_rgb(43_33_22/0.15)] hover:bg-brand-strong`;
export const btnSec = `${btn} border border-border-strong bg-surface text-text hover:bg-surface-2`;
export const campo = "min-h-11 rounded-lg border border-border-strong bg-surface px-3 py-2 text-base font-normal text-text placeholder:text-muted focus:border-ultramar";

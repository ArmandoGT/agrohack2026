"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDados } from "@/lib/store";
import {
  Emblema,
  IconeAtencao,
  IconeCadastros,
  IconeComoFunciona,
  IconeFechar,
  IconeFinanceiro,
  IconeImportar,
  IconeMais,
  IconePainel,
  IconeProdutos,
  IconeRegistrar,
} from "./icones";
import { MudancaAviso } from "./MudancaAviso";
import { fmtData } from "./ui";

type Item = { href: string; rotulo: string; curto: string; Icone: (p: { className?: string }) => React.ReactElement };

// Poucos itens no menu principal; o resto fica em "Mais", como nos apps de campo.
const PRINCIPAIS: Item[] = [
  { href: "/", rotulo: "Painel do dia", curto: "Painel", Icone: IconePainel },
  { href: "/produtos", rotulo: "Produtos", curto: "Produtos", Icone: IconeProdutos },
  { href: "/movimentacoes", rotulo: "Registrar entrada ou saída", curto: "Registrar", Icone: IconeRegistrar },
  { href: "/financeiro", rotulo: "Financeiro", curto: "Financeiro", Icone: IconeFinanceiro },
];
const SECUNDARIOS: Item[] = [
  { href: "/cadastros", rotulo: "Cadastros duplicados", curto: "Duplicados", Icone: IconeCadastros },
  { href: "/importar", rotulo: "Importar planilha", curto: "Importar", Icone: IconeImportar },
  { href: "/como-funciona", rotulo: "Como funciona", curto: "Como funciona", Icone: IconeComoFunciona },
];

function Marca({ claro = true }: { claro?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Emblema className="h-11 w-9 shrink-0" />
      <span className="leading-tight">
        <span className={`block font-serif text-2xl font-semibold ${claro ? "text-white" : "text-text"}`}>AgroSentinela</span>
        <span className={`block text-sm ${claro ? "text-[#e5e7cd]" : "text-muted"}`}>gestão de insumos</span>
      </span>
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const { pronto, origem, analise, erro } = useDados();
  const [mais, setMais] = useState(false);
  const ativo = (h: string) => (h === "/" ? caminho === "/" : caminho.startsWith(h));
  const emSecundario = SECUNDARIOS.some((l) => ativo(l.href));

  // A apresentação do pitch ocupa a tela inteira, sem menu nem barra de status.
  if (caminho.startsWith("/pitch")) return <>{children}</>;

  const itemLateral = (l: Item) => (
    <Link
      key={l.href}
      href={l.href}
      aria-current={ativo(l.href) ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-lg border-l-4 px-3 py-2 text-base ${
        ativo(l.href) ? "border-ouro-claro bg-surface font-semibold text-brand-strong" : "border-transparent text-white hover:bg-white/10"
      }`}
    >
      <l.Icone className="h-6 w-6 shrink-0" />
      {l.rotulo}
    </Link>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Menu lateral (computador e tablet) */}
      <aside className="hidden border-r-4 border-double border-ouro-claro bg-brand-strong text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="px-4 pt-5 pb-4">
          <Marca />
        </div>
        <div className="mx-4 mb-3 h-px bg-linear-to-r from-ouro-claro/80 to-transparent" aria-hidden />
        <nav className="flex-1 space-y-1 overflow-y-auto px-2" aria-label="Principal">
          {PRINCIPAIS.map(itemLateral)}
          <div className="px-3 pt-4 pb-1 text-sm font-semibold text-[#e5e7cd]">Mais ferramentas</div>
          {SECUNDARIOS.map(itemLateral)}
        </nav>
        <div className="px-4 py-4 text-sm text-[#e5e7cd]">
          AGROHACK 2026/2 · IFRO Ariquemes
          <br />
          Equipe 3 Hacketeers
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Topo no celular: só a marca */}
        <div className="flex items-center border-b-4 border-double border-ouro-claro bg-brand-strong px-4 py-3 md:hidden">
          <Marca />
        </div>

        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-surface/80 px-4 py-2 text-sm text-muted md:px-8">
          <span>
            Dados de: <strong className="text-text">{origem}</strong>
          </span>
          {origem === "simulado" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-atencao-soft px-2 py-0.5 font-semibold text-atencao">
              <IconeAtencao className="h-4 w-4" />
              DADOS SIMULADOS<span className="hidden font-normal sm:inline"> — base oficial ainda não carregada</span>
            </span>
          )}
          {pronto && (
            <span className="md:ml-auto">
              Análise em <strong className="text-text">{fmtData(analise.dataReferencia)}</strong> · {analise.resumo.totalMovimentacoes} registros
            </span>
          )}
        </header>
        {erro && <div className="border-b border-critico/30 bg-critico-soft px-4 py-2 text-base text-critico md:px-8">{erro}</div>}

        <div className="relative">
          {/* Ornamento de margem, só em telas largas e fora do texto */}
          <div className="margem-iluminada pointer-events-none absolute inset-y-0 right-3 hidden w-7 2xl:block" aria-hidden />
          <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pb-10">
            {pronto ? children : <p className="text-base text-muted">Carregando e analisando registros…</p>}
          </main>
        </div>
      </div>

      {/* Barra inferior (celular): 4 ações principais + "Mais" */}
      {mais && (
        <div className="fixed inset-0 z-40 bg-text/30 md:hidden" onClick={() => setMais(false)} aria-hidden />
      )}
      {mais && (
        <div id="menu-mais" className="fixed inset-x-0 bottom-[4.5rem] z-50 rounded-t-2xl border-t-4 border-double border-ouro bg-surface p-3 shadow-2xl md:hidden">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="font-serif text-xl font-semibold">Mais ferramentas</span>
            <button onClick={() => setMais(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-2" aria-label="Fechar">
              <IconeFechar />
            </button>
          </div>
          <nav aria-label="Mais ferramentas" className="space-y-1">
            {SECUNDARIOS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMais(false)}
                aria-current={ativo(l.href) ? "page" : undefined}
                className={`flex min-h-13 items-center gap-3 rounded-lg px-3 text-base ${ativo(l.href) ? "bg-brand-soft font-semibold text-brand-strong" : "hover:bg-surface-2"}`}
              >
                <l.Icone className="h-6 w-6 text-brand" />
                {l.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-[4.5rem] grid-cols-5 border-t-4 border-double border-ouro-claro bg-brand-strong pb-[env(safe-area-inset-bottom)] text-white md:hidden"
        aria-label="Principal"
      >
        {PRINCIPAIS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMais(false)}
            aria-current={ativo(l.href) ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold ${ativo(l.href) ? "bg-surface text-brand-strong" : "text-white"}`}
          >
            <l.Icone className="h-6 w-6" />
            {l.curto}
          </Link>
        ))}
        <button
          onClick={() => setMais(!mais)}
          aria-expanded={mais}
          aria-controls="menu-mais"
          className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold ${emSecundario || mais ? "bg-surface text-brand-strong" : "text-white"}`}
        >
          <IconeMais className="h-6 w-6" />
          Mais
        </button>
      </nav>
      <MudancaAviso />
    </div>
  );
}

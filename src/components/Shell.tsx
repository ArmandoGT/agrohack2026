"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDados } from "@/lib/store";
import { MudancaAviso } from "./MudancaAviso";
import { fmtData } from "./ui";

const LINKS = [
  { href: "/", rotulo: "Painel do dia" },
  { href: "/produtos", rotulo: "Produtos" },
  { href: "/movimentacoes", rotulo: "Registrar movimentação" },
  { href: "/financeiro", rotulo: "Financeiro" },
  { href: "/cadastros", rotulo: "Cadastros duplicados" },
  { href: "/importar", rotulo: "Importar dados" },
  { href: "/como-funciona", rotulo: "Como funciona" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const { pronto, origem, analise, erro } = useDados();
  const [menu, setMenu] = useState(false);
  const ativo = (h: string) => (h === "/" ? caminho === "/" : caminho.startsWith(h));

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-border bg-brand-strong text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/" className="block">
            <div className="text-lg font-bold tracking-tight">AgroSentinela</div>
            <div className="text-xs text-white/70">gestão inteligente de insumos</div>
          </Link>
          <button className="rounded-md border border-white/30 px-3 py-1 text-sm md:hidden" onClick={() => setMenu(!menu)} aria-expanded={menu}>
            Menu
          </button>
        </div>
        <nav className={`${menu ? "block" : "hidden"} px-2 pb-3 md:block`} aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenu(false)}
              className={`block rounded-lg px-3 py-2 text-sm ${ativo(l.href) ? "bg-white/15 font-semibold" : "text-white/85 hover:bg-white/10"}`}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <div className="hidden px-4 pt-4 text-xs text-white/60 md:block">
          AGROHACK 2026/2 · IFRO Ariquemes
          <br />
          Equipe 3 Hacketeers
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-xs text-muted md:px-8">
          <span>
            Dados de: <strong className="text-text">{origem}</strong>
          </span>
          {origem === "simulado" && (
            <span className="rounded bg-atencao-soft px-2 py-0.5 font-semibold text-atencao">DADOS SIMULADOS — base oficial ainda não carregada</span>
          )}
          {pronto && (
            <span className="ml-auto">
              Análise em <strong className="text-text">{fmtData(analise.dataReferencia)}</strong> · {analise.resumo.totalMovimentacoes} registros
            </span>
          )}
        </header>
        {erro && <div className="bg-critico-soft px-4 py-2 text-sm text-critico md:px-8">{erro}</div>}
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{pronto ? children : <p className="text-muted">Carregando e analisando registros…</p>}</main>
      </div>
      <MudancaAviso />
    </div>
  );
}

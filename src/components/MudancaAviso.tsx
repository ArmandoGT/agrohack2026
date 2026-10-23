"use client";

import Link from "next/link";
import { useDados } from "@/lib/store";
import { IconeFechar } from "./icones";
import { BadgeNivel, DETECTOR } from "./ui";

/** Mostra o que mudou nos alertas depois de cada registro/fusão (loop de reanálise). */
export function MudancaAviso() {
  const { mudanca, limparMudanca } = useDados();
  if (!mudanca) return null;
  const { novos, resolvidos, mudaramNivel } = mudanca;
  const nada = !novos.length && !resolvidos.length && !mudaramNivel.length;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[5.25rem] z-50 mx-auto max-w-lg rounded-lg border border-ouro border-t-4 border-t-brand bg-surface p-4 shadow-2xl md:right-6 md:bottom-6 md:left-auto">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="font-serif text-lg font-semibold text-brand-strong">Reanálise concluída</div>
          <div className="text-base font-semibold">{mudanca.descricao}</div>
        </div>
        <button onClick={limparMudanca} className="-mt-1 -mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-text" aria-label="Fechar">
          <IconeFechar />
        </button>
      </div>
      <ul className="mt-2 max-h-60 space-y-2 overflow-auto text-base">
        {nada && <li className="text-muted">Nenhum alerta mudou.</li>}
        {novos.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-critico">Novo</span>
            <BadgeNivel nivel={a.nivel} />
            <Link href={`/produtos/${encodeURIComponent(a.produtoKey)}`} onClick={limparMudanca} className="truncate text-brand underline underline-offset-4">
              {a.produto} · {DETECTOR[a.detector]}
            </Link>
          </li>
        ))}
        {mudaramNivel.map(({ antes, depois }) => (
          <li key={depois.id} className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-atencao">Mudou</span>
            <BadgeNivel nivel={antes} /> → <BadgeNivel nivel={depois.nivel} />
            <span className="truncate">{depois.produto}</span>
          </li>
        ))}
        {resolvidos.map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-muted">
            <span className="font-semibold text-ok">Resolvido</span>
            <span className="truncate line-through">
              {a.produto} · {DETECTOR[a.detector]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

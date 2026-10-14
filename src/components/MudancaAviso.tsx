"use client";

import Link from "next/link";
import { useDados } from "@/lib/store";
import { BadgeNivel, DETECTOR } from "./ui";

/** Mostra o que mudou nos alertas depois de cada registro/fusão (loop de reanálise). */
export function MudancaAviso() {
  const { mudanca, limparMudanca } = useDados();
  if (!mudanca) return null;
  const { novos, resolvidos, mudaramNivel } = mudanca;
  const nada = !novos.length && !resolvidos.length && !mudaramNivel.length;
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-xl border border-border bg-surface p-4 shadow-xl md:right-6 md:left-auto">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand">Reanálise concluída</div>
          <div className="text-sm font-semibold">{mudanca.descricao}</div>
        </div>
        <button onClick={limparMudanca} className="text-sm text-muted hover:text-text" aria-label="Fechar">
          ✕
        </button>
      </div>
      <ul className="mt-2 max-h-60 space-y-1.5 overflow-auto text-sm">
        {nada && <li className="text-muted">Nenhum alerta mudou.</li>}
        {novos.map((a) => (
          <li key={a.id} className="flex items-center gap-2">
            <span className="font-semibold text-critico">Novo</span>
            <BadgeNivel nivel={a.nivel} />
            <Link href={`/produtos/${encodeURIComponent(a.produtoKey)}`} onClick={limparMudanca} className="truncate hover:underline">
              {a.produto} · {DETECTOR[a.detector]}
            </Link>
          </li>
        ))}
        {mudaramNivel.map(({ antes, depois }) => (
          <li key={depois.id} className="flex items-center gap-2">
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

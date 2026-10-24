"use client";

import { useState } from "react";
import { IconeOk } from "@/components/icones";
import { btnPrim, btnSec, Card, fmtNum, Secao, Titulo } from "@/components/ui";
import { useDados } from "@/lib/store";

export default function Cadastros() {
  const { analise, fusoes, fundir, desfazerFusao } = useDados();
  const [destinos, setDestinos] = useState<Record<number, string>>({});
  const nomePorChave = new Map(analise.produtos.map((p) => [p.key, p]));

  return (
    <>
      <Titulo
        titulo="Cadastros duplicados"
        subtitulo="Produtos lançados com nomes diferentes dividem saldo e consumo, e isso distorce os alertas. O sistema monta um grafo de nomes parecidos (mesma categoria e unidade) e sugere grupos. Você confirma, e a análise é refeita."
      />
      {!analise.grupos.length && (
        <p className="flex items-center gap-2 rounded-lg border border-ok/30 bg-ok-soft p-5 text-lg text-ok">
          <IconeOk className="h-6 w-6 shrink-0" />
          Nenhum grupo suspeito encontrado.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {analise.grupos.map((g, i) => {
          const membros = g.chaves.map((k) => nomePorChave.get(k)!).filter(Boolean);
          const padrao = [...membros].sort((a, b) => b.movimentacoes.length - a.movimentacoes.length)[0]?.key;
          const destino = destinos[i] ?? padrao;
          return (
            <Card key={g.chaves.join()}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h2 className="text-xl font-semibold">Possível mesmo produto</h2>
                <span className="text-sm text-muted">similaridade {fmtNum(g.similaridade * 100, 0)}% · {g.categoria}</span>
              </div>
              <fieldset className="mt-3 space-y-2">
                <legend className="mb-1 text-base font-semibold">Escolha o nome que vai ficar:</legend>
                {membros.map((m) => (
                  <label key={m.key} className={`flex min-h-12 cursor-pointer flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border p-3 text-base hover:bg-surface-2 ${destino === m.key ? "border-brand bg-brand-soft/50" : "border-border-strong"}`}>
                    <input type="radio" className="h-5 w-5 accent-brand" name={`g${i}`} checked={destino === m.key} onChange={() => setDestinos({ ...destinos, [i]: m.key })} />
                    <span className="flex-1 font-semibold">{m.nome}</span>
                    <span className="tabular w-full pl-8 text-sm text-muted sm:w-auto sm:pl-0">
                      {m.movimentacoes.length} registros · saldo {fmtNum(m.saldo)} {m.unidade}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="mt-4 flex gap-2">
                <button className={`${btnPrim} w-full sm:w-auto`} onClick={() => fundir(g.chaves, destino)}>Unificar e reanalisar</button>
              </div>
            </Card>
          );
        })}
      </div>

      {Object.keys(fusoes).length > 0 && (
        <section className="mt-6">
          <Secao className="mb-3">Unificações confirmadas</Secao>
          <Card>
            <ul className="space-y-2 text-base">
              {Object.entries(fusoes).map(([o, d]) => (
                <li key={o} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
                  <span>
                    “{o}” → <strong>{nomePorChave.get(d)?.nome ?? d}</strong>
                  </span>
                  <button className={btnSec} onClick={() => desfazerFusao(o)}>Desfazer</button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </>
  );
}

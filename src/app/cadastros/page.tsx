"use client";

import { useState } from "react";
import { btnPrim, btnSec, Card, fmtNum, Titulo } from "@/components/ui";
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
      {!analise.grupos.length && <Card><p className="text-sm text-muted">Nenhum grupo suspeito encontrado. 👍</p></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {analise.grupos.map((g, i) => {
          const membros = g.chaves.map((k) => nomePorChave.get(k)!).filter(Boolean);
          const padrao = [...membros].sort((a, b) => b.movimentacoes.length - a.movimentacoes.length)[0]?.key;
          const destino = destinos[i] ?? padrao;
          return (
            <Card key={g.chaves.join()}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Possível mesmo produto</h2>
                <span className="text-xs text-muted">similaridade {fmtNum(g.similaridade * 100, 0)}% · {g.categoria}</span>
              </div>
              <fieldset className="mt-3 space-y-2">
                <legend className="text-xs text-muted">Escolha o nome que vai ficar:</legend>
                {membros.map((m) => (
                  <label key={m.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-2 text-sm hover:bg-surface-2">
                    <input type="radio" name={`g${i}`} checked={destino === m.key} onChange={() => setDestinos({ ...destinos, [i]: m.key })} />
                    <span className="flex-1 font-medium">{m.nome}</span>
                    <span className="tabular text-xs text-muted">
                      {m.movimentacoes.length} registros · saldo {fmtNum(m.saldo)} {m.unidade}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="mt-3 flex gap-2">
                <button className={btnPrim} onClick={() => fundir(g.chaves, destino)}>Unificar e reanalisar</button>
              </div>
            </Card>
          );
        })}
      </div>

      {Object.keys(fusoes).length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Unificações confirmadas</h2>
          <Card>
            <ul className="space-y-2 text-sm">
              {Object.entries(fusoes).map(([o, d]) => (
                <li key={o} className="flex items-center justify-between gap-2">
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

"use client";

import { useState } from "react";
import { btnPrim, btnSec, Card, fmtData, Titulo } from "@/components/ui";
import type { ResultadoImportacao } from "@/lib/engine/normalize";
import { lerArquivo, paraCsv } from "@/lib/import";
import { useDados } from "@/lib/store";

const CAMPOS: [string, string][] = [
  ["produto", "Produto *"], ["categoria", "Categoria"], ["unidade", "Unidade"], ["quantidade", "Quantidade *"],
  ["estoqueMinimo", "Estoque mínimo"], ["tipo", "Tipo (entrada/saída) *"], ["data", "Data *"], ["preco", "Preço de aquisição"],
  ["lote", "Lote"], ["validade", "Validade"], ["fornecedor", "Fornecedor"], ["destino", "Destino da retirada"], ["responsavel", "Responsável"],
];

export default function Importar() {
  const { substituir, carregarSimulado, movimentacoes, origem } = useDados();
  const [res, setRes] = useState<(ResultadoImportacao & { nome: string }) | null>(null);
  const [lendo, setLendo] = useState(false);
  const [ok, setOk] = useState("");

  const ler = async (f: File | undefined) => {
    if (!f) return;
    setLendo(true);
    setOk("");
    try {
      setRes({ ...(await lerArquivo(f)), nome: f.name });
    } finally {
      setLendo(false);
    }
  };

  const baixar = (conteudo: string, nome: string) => {
    const url = URL.createObjectURL(new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: nome });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Titulo titulo="Importar dados" subtitulo="Aceita CSV (separado por ; ou ,) e planilhas Excel. As colunas são reconhecidas pelo nome, mesmo com variações (ex.: “Qtde”, “Insumo”, “Vencimento”)." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center hover:bg-surface-2">
            <span className="text-base font-semibold">Escolha o arquivo da base</span>
            <span className="text-sm text-muted">.csv, .xlsx ou .xls</span>
            <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="sr-only" onChange={(e) => ler(e.target.files?.[0])} />
          </label>
          {lendo && <p className="mt-3 text-sm text-muted">Lendo…</p>}
          {res && (
            <div className="mt-4 space-y-3">
              <p className="text-sm">
                <strong>{res.nome}</strong>: {res.movimentacoes.length} registros válidos
                {res.rejeitadas.length > 0 && <span className="text-critico">, {res.rejeitadas.length} rejeitados</span>}.
                {res.movimentacoes.length > 0 && (
                  <> Período: {fmtData(res.movimentacoes.reduce((m, x) => (x.data < m ? x.data : m), "9999"))} a {fmtData(res.movimentacoes.reduce((m, x) => (x.data > m ? x.data : m), ""))}.</>
                )}
              </p>
              <div>
                <h3 className="text-sm font-semibold">Colunas reconhecidas</h3>
                <ul className="mt-1 grid gap-1 text-xs sm:grid-cols-2">
                  {CAMPOS.map(([k, rotulo]) => {
                    const col = res.mapa[k as keyof typeof res.mapa];
                    return (
                      <li key={k} className={col ? "" : "text-muted"}>
                        {col ? "✔" : "—"} {rotulo}: {col ? <code className="rounded bg-surface-2 px-1">{col}</code> : "não encontrada"}
                      </li>
                    );
                  })}
                </ul>
              </div>
              {res.rejeitadas.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-critico">Ver linhas rejeitadas</summary>
                  <ul className="mt-1 max-h-40 overflow-auto">
                    {res.rejeitadas.slice(0, 200).map((r) => <li key={r.linha}>Linha {r.linha}: {r.motivo}</li>)}
                  </ul>
                </details>
              )}
              <button
                className={btnPrim}
                disabled={!res.movimentacoes.length}
                onClick={() => {
                  substituir(res.movimentacoes, res.nome);
                  setOk(`Base “${res.nome}” carregada e analisada.`);
                  setRes(null);
                }}
              >
                Usar esta base e analisar
              </button>
            </div>
          )}
          {ok && <p className="mt-3 rounded-lg bg-ok-soft p-3 text-sm text-ok">{ok}</p>}
        </Card>
        <Card>
          <h2 className="font-semibold">Base atual</h2>
          <p className="mt-1 text-sm text-muted">{movimentacoes.length} registros · origem: {origem}</p>
          <div className="mt-3 flex flex-col gap-2">
            <button className={btnSec} onClick={() => carregarSimulado()}>Recarregar base simulada</button>
            <button className={btnSec} onClick={() => baixar(paraCsv(movimentacoes), "agrosentinela-registros.csv")}>Exportar registros atuais (CSV)</button>
            <button className={btnSec} onClick={() => baixar(paraCsv([]), "modelo-importacao.csv")}>Baixar modelo vazio</button>
          </div>
          <p className="mt-4 text-xs text-muted">
            Regras: campos vazios ficam como “não informado” (nunca zero); unidades diferentes do mesmo produto são convertidas quando possível
            (t→kg, mL→L) e, se forem incompatíveis (kg × L), ficam fora das contas e geram um alerta.
          </p>
        </Card>
      </div>
    </>
  );
}

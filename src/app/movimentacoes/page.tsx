"use client";

import { useState } from "react";
import { btnPrim, btnSec, campo, Card, fmtData, fmtNum, Titulo } from "@/components/ui";
import { parseNumero } from "@/lib/engine/normalize";
import type { TipoMov } from "@/lib/engine/types";
import { useDados } from "@/lib/store";

const vazio = { produto: "", categoria: "", unidade: "", quantidade: "", estoqueMinimo: "", preco: "", lote: "", validade: "", fornecedor: "", destino: "", responsavel: "" };

export default function Movimentacoes() {
  const { analise, adicionar, remover, movimentacoes } = useDados();
  const [tipo, setTipo] = useState<TipoMov>("saida");
  const [data, setData] = useState(analise.dataReferencia);
  const [f, setF] = useState(vazio);
  const [erro, setErro] = useState("");
  const set = (k: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const escolherProduto = (nome: string) => {
    const p = analise.produtos.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
    setF({ ...f, produto: nome, ...(p ? { categoria: p.categoria, unidade: p.unidade, estoqueMinimo: p.estoqueMinimo === null ? "" : String(p.estoqueMinimo) } : {}) });
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = parseNumero(f.quantidade);
    if (!f.produto.trim() || !f.unidade.trim()) return setErro("Informe produto e unidade.");
    if (qtd === null || qtd <= 0) return setErro("Informe uma quantidade maior que zero.");
    if (!data) return setErro("Informe a data.");
    setErro("");
    adicionar({
      produto: f.produto.trim(),
      categoria: f.categoria.trim() || "Sem categoria",
      unidade: f.unidade.trim(),
      quantidade: qtd,
      estoqueMinimo: parseNumero(f.estoqueMinimo),
      tipo,
      data,
      preco: tipo === "entrada" ? parseNumero(f.preco) : null,
      lote: f.lote.trim() || null,
      validade: tipo === "entrada" && f.validade ? f.validade : null,
      fornecedor: tipo === "entrada" ? f.fornecedor.trim() || null : null,
      destino: tipo === "saida" ? f.destino.trim() || null : null,
      responsavel: f.responsavel.trim() || null,
    });
    setF({ ...vazio, produto: f.produto, categoria: f.categoria, unidade: f.unidade, estoqueMinimo: f.estoqueMinimo });
  };

  const recentes = [...movimentacoes].filter((m) => m.id.startsWith("u")).reverse();

  return (
    <>
      <Titulo titulo="Registrar movimentação" subtitulo="Cada registro dispara uma nova análise completa. O aviso no canto mostra quais alertas surgiram, mudaram ou foram resolvidos." />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 flex rounded-lg border border-border p-1" role="radiogroup" aria-label="Tipo">
              {(["saida", "entrada"] as const).map((t) => (
                <button type="button" key={t} role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold ${tipo === t ? "bg-brand text-white" : "hover:bg-surface-2"}`}>
                  {t === "saida" ? "Saída / retirada" : "Entrada / compra"}
                </button>
              ))}
            </div>
            <label className="sm:col-span-2 text-sm">
              Produto
              <input className={`${campo} w-full`} list="produtos" value={f.produto} onChange={(e) => escolherProduto(e.target.value)} placeholder="Comece a digitar…" required />
              <datalist id="produtos">{analise.produtos.map((p) => <option key={p.key} value={p.nome} />)}</datalist>
            </label>
            <label className="text-sm">Quantidade<input className={`${campo} w-full`} inputMode="decimal" value={f.quantidade} onChange={set("quantidade")} required /></label>
            <label className="text-sm">Unidade<input className={`${campo} w-full`} value={f.unidade} onChange={set("unidade")} placeholder="kg, L, un, sc, t…" required /></label>
            <label className="text-sm">Data<input type="date" className={`${campo} w-full`} value={data} onChange={(e) => setData(e.target.value)} required /></label>
            <label className="text-sm">Categoria<input className={`${campo} w-full`} value={f.categoria} onChange={set("categoria")} /></label>
            {tipo === "saida" ? (
              <>
                <label className="text-sm">Destino (talhão, máquina…)<input className={`${campo} w-full`} value={f.destino} onChange={set("destino")} /></label>
                <label className="text-sm">Responsável<input className={`${campo} w-full`} value={f.responsavel} onChange={set("responsavel")} /></label>
                <label className="text-sm">Lote (opcional)<input className={`${campo} w-full`} value={f.lote} onChange={set("lote")} /></label>
              </>
            ) : (
              <>
                <label className="text-sm">Preço unitário (R$)<input className={`${campo} w-full`} inputMode="decimal" value={f.preco} onChange={set("preco")} placeholder="deixe vazio se não souber" /></label>
                <label className="text-sm">Fornecedor<input className={`${campo} w-full`} value={f.fornecedor} onChange={set("fornecedor")} /></label>
                <label className="text-sm">Lote<input className={`${campo} w-full`} value={f.lote} onChange={set("lote")} /></label>
                <label className="text-sm">Validade<input type="date" className={`${campo} w-full`} value={f.validade} onChange={set("validade")} /></label>
                <label className="text-sm">Estoque mínimo<input className={`${campo} w-full`} inputMode="decimal" value={f.estoqueMinimo} onChange={set("estoqueMinimo")} /></label>
              </>
            )}
            {erro && <p className="sm:col-span-2 text-sm text-critico">{erro}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <button className={btnPrim}>Salvar e reanalisar</button>
              <button type="button" className={btnSec} onClick={() => setF(vazio)}>Limpar</button>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Registrados nesta sessão</h2>
          {!recentes.length && <p className="text-sm text-muted">Nenhum ainda. Experimente registrar uma retirada grande e veja o alerta aparecer.</p>}
          <ul className="space-y-2 text-sm">
            {recentes.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2 border-t border-border pt-2">
                <div>
                  <div className="font-medium">{m.produto}</div>
                  <div className="text-xs text-muted">
                    {m.tipo === "entrada" ? "Entrada" : "Saída"} · {fmtNum(m.quantidade)} {m.unidade} · {fmtData(m.data)}
                  </div>
                </div>
                <button onClick={() => remover(m.id)} className="text-xs text-critico hover:underline">Desfazer</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

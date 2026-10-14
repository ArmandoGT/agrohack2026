"use client";

// Estado da aplicação: registros + fusões -> analisar() (reanálise a cada mudança).
// Guarda também o "diff" de alertas da última mudança, mostrado ao usuário (loop de reanálise).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { analisar } from "./engine";
import type { Alerta, Analise, Movimentacao, Nivel } from "./engine/types";
import { lerCsv } from "./import";
import * as db from "./persistencia";

export interface Mudanca {
  descricao: string;
  novos: Alerta[];
  resolvidos: Alerta[];
  mudaramNivel: { antes: Nivel; depois: Alerta }[];
}

interface Ctx {
  pronto: boolean;
  erro: string | null;
  movimentacoes: Movimentacao[];
  fusoes: Record<string, string>;
  origem: string;
  dataReferencia: string | null;
  analise: Analise;
  mudanca: Mudanca | null;
  limparMudanca: () => void;
  adicionar: (m: Omit<Movimentacao, "id">) => void;
  remover: (id: string) => void;
  substituir: (movs: Movimentacao[], origem: string) => void;
  fundir: (origens: string[], destino: string) => void;
  desfazerFusao: (origem: string) => void;
  definirDataReferencia: (d: string | null) => void;
  carregarSimulado: () => Promise<void>;
}

const Contexto = createContext<Ctx | null>(null);
const chaveAlerta = (a: Alerta) => `${a.detector}|${a.produtoKey}|${a.evidencias.lote ?? a.evidencias.data ?? ""}`;

function comparar(antes: Analise, depois: Analise, descricao: string): Mudanca {
  const mapaAntes = new Map(antes.alertas.map((a) => [chaveAlerta(a), a]));
  const mapaDepois = new Map(depois.alertas.map((a) => [chaveAlerta(a), a]));
  return {
    descricao,
    novos: depois.alertas.filter((a) => !mapaAntes.has(chaveAlerta(a))),
    resolvidos: antes.alertas.filter((a) => !mapaDepois.has(chaveAlerta(a))),
    mudaramNivel: depois.alertas
      .filter((a) => mapaAntes.has(chaveAlerta(a)) && mapaAntes.get(chaveAlerta(a))!.nivel !== a.nivel)
      .map((a) => ({ antes: mapaAntes.get(chaveAlerta(a))!.nivel, depois: a })),
  };
}

export function ProvedorDados({ children }: { children: React.ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [movimentacoes, setMovs] = useState<Movimentacao[]>([]);
  const [fusoes, setFusoes] = useState<Record<string, string>>({});
  const [origem, setOrigem] = useState("simulado");
  const [dataReferencia, setDataRef] = useState<string | null>(null);
  const [mudanca, setMudanca] = useState<Mudanca | null>(null);
  const descricaoPendente = useRef<string | null>(null);
  const anterior = useRef<Analise | null>(null);

  const analise = useMemo(
    () => analisar(movimentacoes, { fusoes, ...(dataReferencia ? { dataReferencia } : {}) }),
    [movimentacoes, fusoes, dataReferencia],
  );

  // Loop de reanálise: toda mudança gera um diff de alertas para o usuário.
  useEffect(() => {
    if (anterior.current && descricaoPendente.current) setMudanca(comparar(anterior.current, analise, descricaoPendente.current));
    descricaoPendente.current = null;
    anterior.current = analise;
  }, [analise]);

  const carregarSimulado = useCallback(async () => {
    const texto = await fetch("/data/simulado.csv").then((r) => r.text());
    const { movimentacoes: movs } = lerCsv(texto);
    setMovs(movs);
    setFusoes({});
    setOrigem("simulado");
    setMudanca(null);
    if (db.usaSupabase) await db.substituirRemoto(movs).catch((e) => setErro(String(e.message ?? e)));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = db.usaSupabase ? await db.lerRemoto() : db.lerLocal();
        if (snap?.movimentacoes.length) {
          setMovs(snap.movimentacoes);
          setFusoes(snap.fusoes ?? {});
          setOrigem(snap.origem);
        } else await carregarSimulado();
      } catch (e) {
        setErro(`Não foi possível carregar os dados: ${(e as Error).message}`);
        await carregarSimulado();
      } finally {
        setPronto(true);
      }
    })();
  }, [carregarSimulado]);

  useEffect(() => {
    if (pronto && !db.usaSupabase) db.salvarLocal({ movimentacoes, fusoes, origem });
  }, [pronto, movimentacoes, fusoes, origem]);

  const adicionar = useCallback((m: Omit<Movimentacao, "id">) => {
    const nova = { ...m, id: `u${Date.now().toString(36)}` };
    descricaoPendente.current = `${m.tipo === "entrada" ? "Entrada" : "Retirada"} de ${m.quantidade} ${m.unidade} de ${m.produto}`;
    setMovs((x) => [...x, nova]);
    if (db.usaSupabase) db.inserirRemoto([nova]).catch((e) => setErro(String(e.message ?? e)));
  }, []);

  const remover = useCallback((id: string) => {
    descricaoPendente.current = "Registro removido";
    setMovs((x) => x.filter((m) => m.id !== id));
    if (db.usaSupabase) db.removerRemoto(id);
  }, []);

  const substituir = useCallback((movs: Movimentacao[], novaOrigem: string) => {
    setMovs(movs);
    setFusoes({});
    setOrigem(novaOrigem);
    setMudanca(null);
    if (db.usaSupabase) db.substituirRemoto(movs).catch((e) => setErro(String(e.message ?? e)));
  }, []);

  const atualizarFusoes = useCallback((f: Record<string, string>, descricao: string) => {
    descricaoPendente.current = descricao;
    setFusoes(f);
    if (db.usaSupabase) db.salvarFusoesRemoto(f);
  }, []);

  const fundir = useCallback(
    (origens: string[], destino: string) => {
      const f = { ...fusoes };
      for (const o of origens) if (o !== destino) f[o] = destino;
      for (const [k, v] of Object.entries(f)) if (origens.includes(v)) f[k] = destino; // mantém o grafo de fusões sem cadeias
      atualizarFusoes(f, `Cadastros unificados em “${destino}”`);
    },
    [fusoes, atualizarFusoes],
  );

  const desfazerFusao = useCallback(
    (o: string) => {
      const f = { ...fusoes };
      delete f[o];
      atualizarFusoes(f, `Unificação de “${o}” desfeita`);
    },
    [fusoes, atualizarFusoes],
  );

  const valor: Ctx = {
    pronto, erro, movimentacoes, fusoes, origem, dataReferencia, analise, mudanca,
    limparMudanca: () => setMudanca(null),
    adicionar, remover, substituir, fundir, desfazerFusao,
    definirDataReferencia: (d) => {
      descricaoPendente.current = d ? `Data de referência alterada para ${d}` : "Data de referência automática";
      setDataRef(d);
    },
    carregarSimulado,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDados() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useDados fora do ProvedorDados");
  return c;
}

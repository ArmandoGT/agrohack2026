// Nó 3 do DAG: resolução de entidades (Graph Engineering).
// Cada nome de produto é um nó; nomes muito parecidos (mesma categoria e
// unidade compatível) ganham uma aresta. Componentes conexos (union-find)
// formam os grupos de "produtos cadastrados de formas diferentes".

import { normalizarNome } from "./normalize";
import type { GrupoDuplicado } from "./types";

/** Siglas e sinônimos comuns no campo. Expandidos antes de comparar. */
const SINONIMOS: Record<string, string> = {
  kcl: "cloreto potassio",
  map: "fosfato monoamonico",
  dap: "fosfato diamonico",
  "s-10": "s10",
  "s 10": "s10",
  epi: "equipamento protecao",
  pvc: "pvc",
};
const STOP = new Set(["de", "da", "do", "das", "dos", "para", "p/", "com", "agricola", "tipo", "e", "a", "o"]);

export function chaveProduto(nome: string, fusoes: Record<string, string> = {}): string {
  const k = normalizarNome(nome);
  return fusoes[k] ?? k;
}

export function formaCanonica(nome: string): string[] {
  let s = normalizarNome(nome).replace(/[()[\]]/g, " ");
  for (const [de, para] of Object.entries(SINONIMOS)) {
    s = s.replace(new RegExp(`(^|\\s)${de.replace(/[-/]/g, "\\$&")}(?=\\s|$)`, "g"), `$1${para}`);
  }
  return s
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") && !/\d/.test(t) ? t.slice(0, -1) : t))
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .sort();
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const janela = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const ma = new Array(a.length).fill(false);
  const mb = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = Math.max(0, i - janela); j < Math.min(b.length, i + janela + 1); j++) {
      if (mb[j] || a[i] !== b[j]) continue;
      ma[i] = mb[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  for (let i = 0, k = 0; i < a.length; i++) {
    if (!ma[i]) continue;
    while (!mb[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  let prefixo = 0;
  while (prefixo < 4 && a[prefixo] === b[prefixo]) prefixo++;
  return jaro + prefixo * 0.1 * (1 - jaro);
}

const temNumero = (t: string) => /\d/.test(t);

/** Similaridade entre dois nomes de produto (0 a 1). */
export function similaridade(a: string, b: string): number {
  const ta = formaCanonica(a);
  const tb = formaCanonica(b);
  if (!ta.length || !tb.length) return 0;
  const sa = ta.join(" ");
  const sb = tb.join(" ");
  if (sa === sb) return 1;
  // Fórmulas diferentes (NPK 04-14-08 x NPK 10-10-10) nunca são o mesmo produto.
  const na = ta.filter(temNumero).filter((t) => !t.endsWith("%"));
  const nb = tb.filter(temNumero).filter((t) => !t.endsWith("%"));
  if (na.length && nb.length && na.join() !== nb.join()) return 0;
  // Um nome contém o outro, mudando só número/% ou uma palavra descritiva.
  const [menor, maior] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const contido = menor.every((t) => maior.includes(t));
  const extras = maior.filter((t) => !menor.includes(t));
  if (contido && menor.some((t) => t.length >= 4) && extras.length <= 1) return 0.92;
  // Compara só a parte textual (sem números), letra a letra.
  const txtA = ta.filter((t) => !temNumero(t)).join(" ");
  const txtB = tb.filter((t) => !temNumero(t)).join(" ");
  return jaroWinkler(txtA || sa, txtB || sb);
}

class UnionFind {
  private pai = new Map<string, string>();
  find(x: string): string {
    if (!this.pai.has(x)) this.pai.set(x, x);
    const p = this.pai.get(x)!;
    if (p === x) return x;
    const r = this.find(p);
    this.pai.set(x, r);
    return r;
  }
  union(a: string, b: string) {
    this.pai.set(this.find(a), this.find(b));
  }
}

export interface NoProduto {
  key: string;
  nome: string;
  categoria: string;
  unidadeBase: string;
}

/** Monta o grafo de similaridade e devolve os componentes conexos com 2+ nós. */
export function gruposDuplicados(nos: NoProduto[], limiar: number): GrupoDuplicado[] {
  const uf = new UnionFind();
  const arestas: [string, string, number][] = [];
  for (let i = 0; i < nos.length; i++) {
    for (let j = i + 1; j < nos.length; j++) {
      const a = nos[i];
      const b = nos[j];
      if (normalizarNome(a.categoria) !== normalizarNome(b.categoria)) continue;
      if (a.unidadeBase !== b.unidadeBase) continue;
      const s = similaridade(a.nome, b.nome);
      if (s >= limiar) {
        uf.union(a.key, b.key);
        arestas.push([a.key, b.key, s]);
      }
    }
  }
  const comp = new Map<string, NoProduto[]>();
  for (const n of nos) {
    const r = uf.find(n.key);
    comp.set(r, [...(comp.get(r) ?? []), n]);
  }
  const grupos: GrupoDuplicado[] = [];
  for (const membros of comp.values()) {
    if (membros.length < 2) continue;
    const chaves = new Set(membros.map((m) => m.key));
    const sims = arestas.filter(([a]) => chaves.has(a)).map(([, , s]) => s);
    grupos.push({
      chaves: membros.map((m) => m.key),
      nomes: membros.map((m) => m.nome),
      categoria: membros[0].categoria,
      similaridade: sims.length ? Math.max(...sims) : limiar,
    });
  }
  return grupos;
}

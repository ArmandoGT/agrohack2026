// npm run eval:robustez — repete o loop de avaliação com 10 sementes diferentes do gerador,
// para não "decorar" uma única base simulada (evita overfitting dos limiares).

import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analisar } from "../src/lib/engine";
import { avaliar, carregar } from "./eval-lib";

const SEMENTES = Array.from({ length: 10 }, (_, i) => i + 1);
const dir = mkdtempSync(join(tmpdir(), "agrosentinela-"));
const fps = new Map<string, number>();
const perdas = new Map<string, number>();
let somaR = 0, somaP = 0, piorR = 1, piorP = 1;

for (const s of SEMENTES) {
  execSync("npx tsx scripts/generate-data.ts", { env: { ...process.env, SEED: String(s), OUT_DIR: dir }, stdio: "ignore" });
  const { movimentacoes, gabarito } = carregar(join(dir, "simulado.csv"), join(dir, "ground_truth.json"));
  const r = avaliar(analisar(movimentacoes, { dataReferencia: gabarito.dataReferencia }), gabarito);
  somaR += r.recall; somaP += r.precisao;
  piorR = Math.min(piorR, r.recall); piorP = Math.min(piorP, r.precisao);
  for (const l of r.linhas) {
    for (const f of l.falsosPositivos) fps.set(`${l.detector}: ${f}`, (fps.get(`${l.detector}: ${f}`) ?? 0) + 1);
    for (const f of l.perdidos) perdas.set(`${l.detector}: ${f}`, (perdas.get(`${l.detector}: ${f}`) ?? 0) + 1);
  }
  console.log(`semente ${s}: recall ${(r.recall * 100).toFixed(0)}% · precisão ${(r.precisao * 100).toFixed(0)}%`);
}
rmSync(dir, { recursive: true, force: true });
const n = SEMENTES.length;
console.log(`\nMÉDIA recall ${((somaR / n) * 100).toFixed(1)}% (pior ${(piorR * 100).toFixed(0)}%) · precisão ${((somaP / n) * 100).toFixed(1)}% (pior ${(piorP * 100).toFixed(0)}%)`);
if (perdas.size) console.log("\nNão encontrados:\n" + [...perdas].map(([k, v]) => `  ${v}x ${k}`).join("\n"));
if (fps.size) console.log("\nFalsos positivos:\n" + [...fps].map(([k, v]) => `  ${v}x ${k}`).join("\n"));

// npm run eval:previsao — backtest do modelo de previsão contra a média simples,
// em todos os produtos da base simulada e em 10 sementes do gerador. Grava docs/eval-previsao.md.

import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analisar } from "../src/lib/engine";
import { PREVISAO } from "../src/lib/engine/previsao";
import { carregar } from "./eval-lib";

const pct = (x: number) => `${(x * 100).toFixed(1).replace(".", ",")}%`;
const SEMENTES = Array.from({ length: 10 }, (_, i) => i + 1);
const dir = mkdtempSync(join(tmpdir(), "agrosentinela-prev-"));
let erroModelo = 0, erroMedia = 0, real = 0, rodadas = 0, dentro = 0;
let mod = 0, med = 0, curto = 0, erroMostrado = 0, erroMediaMostrado = 0;
const linhas: string[] = [];

for (const s of SEMENTES) {
  execSync("npx tsx scripts/generate-data.ts", { env: { ...process.env, SEED: String(s), OUT_DIR: dir }, stdio: "ignore" });
  const { movimentacoes, gabarito } = carregar(join(dir, "simulado.csv"), join(dir, "ground_truth.json"));
  const a = analisar(movimentacoes, { dataReferencia: gabarito.dataReferencia });
  let em = 0, eM = 0, r = 0, venceu = 0, testados = 0;
  for (const p of a.produtos) {
    const v = p.previsao!;
    if (v.status === "curto") { curto++; continue; }
    if (v.status === "modelo") mod++;
    else med++;
    const b = v.backtest!;
    const somaReal = (b.wapeModelo !== null ? (b.erroModelo * b.semanasTestadas) / b.wapeModelo : 0);
    em += b.erroModelo * b.semanasTestadas; eM += b.erroMedia * b.semanasTestadas; r += somaReal;
    rodadas += b.rodadas; dentro += b.faixaAcertou; testados++;
    if (b.erroModelo < b.erroMedia) venceu++;
    if (v.status === "modelo") { erroMostrado += b.erroModelo * b.semanasTestadas; erroMediaMostrado += b.erroMedia * b.semanasTestadas; }
  }
  erroModelo += em; erroMedia += eM; real += r;
  const linha = `| ${s} | ${testados} | ${pct(em / r)} | ${pct(eM / r)} | ${venceu}/${testados} |`;
  linhas.push(linha);
  console.log(`semente ${s}: WAPE modelo ${((em / r) * 100).toFixed(1)}% · média ${((eM / r) * 100).toFixed(1)}% · modelo erra menos em ${venceu}/${testados}`);
}
rmSync(dir, { recursive: true, force: true });

const resumo = {
  wapeModelo: erroModelo / real,
  wapeMedia: erroMedia / real,
  reducao: 1 - erroModelo / erroMedia,
  cobertura: dentro / rodadas,
  reducaoMostrados: 1 - erroMostrado / erroMediaMostrado,
};
console.log(`\nTotal: WAPE modelo ${pct(resumo.wapeModelo)} · média ${pct(resumo.wapeMedia)} · redução ${pct(resumo.reducao)}`);
console.log(`Faixa de 80%: o consumo real caiu dentro em ${pct(resumo.cobertura)} das ${rodadas} rodadas`);
console.log(`Produtos: modelo mostrado ${mod} · média mantida ${med} · histórico curto ${curto}`);

writeFileSync(
  "docs/eval-previsao.md",
  `# Backtest do modelo de previsão de consumo

Gerado por \`npm run eval:previsao\`. Para cada produto, escondemos as últimas ${PREVISAO.semanasTeste} semanas (em até ${PREVISAO.rodadasTeste} rodadas: cortes em −4, −8 e −12 semanas), ajustamos o modelo só com o que vem antes e comparamos a previsão com o consumo real dessas semanas. A referência é a regra que o app já usa: a média dos últimos 30 dias antes do corte.

**WAPE** = erro absoluto somado ÷ consumo real somado (quanto menor, melhor).

| Semente | Produtos testados | WAPE do modelo | WAPE da média | Modelo erra menos em |
|---|---|---|---|---|
${linhas.join("\n")}

## Resultado nas 10 bases

- **WAPE do modelo: ${pct(resumo.wapeModelo)}**; da média de 30 dias: ${pct(resumo.wapeMedia)}. O modelo erra **${pct(resumo.reducao)} menos** no total.
- Nos produtos em que o app mostra o modelo (os que venceram a média com folga de ${PREVISAO.folga * 100}% no próprio teste), o erro cai ${pct(resumo.reducaoMostrados)}. Esse número é otimista, porque é medido no mesmo teste usado para escolher esses produtos; o número justo é o do total acima.
- **Faixa de 80%:** o consumo real das semanas escondidas caiu dentro da faixa em ${pct(resumo.cobertura)} das ${rodadas} rodadas.
- Decisão por produto: modelo mostrado em ${mod}, média mantida em ${med}, histórico curto (sem previsão) em ${curto}.

## O que este número prova, e o que não prova

A base é **simulada e gerada por nós**. O backtest mostra que o método funciona e que o app escolhe com honestidade entre o modelo e a média. Ele não prova que o modelo acerta numa fazenda real. Por isso o mesmo script roda na base oficial assim que ela for divulgada, e nenhum alerta depende do modelo: os detectores continuam usando a média, que é fácil de explicar.
`,
);
console.log("\nRelatório gravado em docs/eval-previsao.md");

// npm run eval — roda o motor sobre a base simulada e mede precisão/recall por detector.
// Gera docs/eval-report.md (evidência para o critério "Validação e testes").

import { writeFileSync } from "node:fs";
import { rodar } from "./eval-lib";

const META_RECALL = 0.9;
const META_PRECISAO = 0.85;

const { analise, rejeitadas, linhas, recall, precisao } = rodar();
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

const md = [
  "# Relatório do loop de avaliação (dados SIMULADOS)",
  "",
  `Gerado em ${new Date().toISOString().slice(0, 16).replace("T", " ")} · data de referência ${analise.dataReferencia} · ${analise.resumo.totalMovimentacoes} movimentações · ${analise.resumo.totalProdutos} produtos · ${rejeitadas.length} linhas rejeitadas`,
  "",
  `**Recall geral: ${pct(recall)}** (meta ${pct(META_RECALL)}) · **Precisão geral: ${pct(precisao)}** (meta ${pct(META_PRECISAO)})`,
  "",
  "| Detector | Plantadas | Encontradas | Recall | Precisão | Falsos positivos | Não encontradas |",
  "|---|---|---|---|---|---|---|",
  ...linhas.map((l) => `| ${l.detector} | ${l.esperados} | ${l.acertos} | ${pct(l.recall)} | ${pct(l.precisao)} | ${l.falsosPositivos.join(", ") || "—"} | ${l.perdidos.join("; ") || "—"} |`),
  "",
  `Alertas gerados: ${analise.alertas.length} (${analise.resumo.criticos} críticos, ${analise.resumo.atencao} de atenção, ${analise.resumo.monitorar} para monitorar).`,
  "",
  "## Etapas do DAG",
  "",
  "| Nó | Depende de | Tempo | Saída |",
  "|---|---|---|---|",
  ...analise.dag.map((n) => `| ${n.rotulo} | ${n.dependeDe.join(", ") || "—"} | ${n.ms.toFixed(1)} ms | ${n.saida} |`),
].join("\n");

writeFileSync("docs/eval-report.md", md + "\n");
console.log(md);
const passou = recall >= META_RECALL && precisao >= META_PRECISAO;
console.log(passou ? "\n✅ Metas atingidas" : "\n❌ Abaixo da meta — ajuste limiares/regras e rode de novo");
process.exit(passou ? 0 : 1);

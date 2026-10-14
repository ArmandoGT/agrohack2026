// Detectores de cadastro: duplicidades (grafo de entidades) e qualidade dos dados.

import { normalizarNome } from "../normalize";
import { criarAlerta, fmtNum, fmtQtd } from "../priority";
import { categoriaPerecivel } from "../stock";
import type { Alerta, GrupoDuplicado, Nivel, ProdutoAnalise } from "../types";
import type { Contexto } from "./contexto";

export function qualidadeDados(ctx: Contexto): Alerta[] {
  const { p } = ctx;
  const problemas: { nivel: Nivel; texto: string }[] = [];
  if (p.saldo < -1e-6)
    problemas.push({ nivel: "critico", texto: `as saídas superam as entradas em ${fmtQtd(-p.saldo, p.unidade)} (falta lançamento de entrada ou saldo inicial)` });
  if (p.unidadesIgnoradas > 0)
    problemas.push({ nivel: "atencao", texto: `${p.unidadesIgnoradas} movimentação(ões) em unidade incompatível com ${p.unidade} foram deixadas fora das contas para não somar unidades diferentes` });
  const semPreco = p.movimentacoes.filter((m) => m.tipo === "entrada" && m.preco === null).length;
  if (semPreco > 0)
    problemas.push({ nivel: "monitorar", texto: `${semPreco} entrada(s) sem preço; o valor do estoque usa o último preço conhecido e é marcado como estimado (preço ausente não é tratado como zero)` });
  const semValidade = p.lotes.filter((l) => !l.validade).length;
  if (categoriaPerecivel(p.categoria) && semValidade > 0)
    problemas.push({ nivel: "monitorar", texto: `${semValidade} lote(s) de produto perecível sem validade informada; não é possível avaliar o risco de vencimento` });
  if (!problemas.length) return [];
  const ordem: Nivel[] = ["critico", "atencao", "monitorar"];
  const nivel = ordem.find((n) => problemas.some((x) => x.nivel === n))!;
  return [
    criarAlerta(p, {
      detector: "qualidade_dados",
      nivel,
      titulo: "Registros inconsistentes",
      mensagem: `Revise os registros: ${problemas.map((x) => x.texto).join("; ")}.`,
      metodo: "verificação de saldo negativo, unidades incompatíveis, preço e validade ausentes.",
      acao: "Corrigir os lançamentos para que as análises deste produto sejam confiáveis.",
      confianca: "alta",
      confiancaMotivo: "verificação direta dos registros",
      diasAteProblema: null,
      impactoFinanceiro: null,
      evidencias: { saldo: p.saldo, unidadesIgnoradas: p.unidadesIgnoradas, entradasSemPreco: semPreco, lotesSemValidade: semValidade },
    }),
  ];
}

export function cadastroDuplicado(grupos: GrupoDuplicado[], produtos: Map<string, ProdutoAnalise>): Alerta[] {
  const alertas: Alerta[] = [];
  for (const g of grupos) {
    const membros = g.chaves.map((k) => produtos.get(k)!).filter(Boolean);
    const principal = [...membros].sort((a, b) => b.movimentacoes.length - a.movimentacoes.length)[0];
    const saldoSomado = membros.reduce((s, m) => s + m.saldo, 0);
    alertas.push(
      criarAlerta(principal, {
        detector: "cadastro_duplicado",
        nivel: "atencao",
        titulo: "Mesmo produto com nomes diferentes",
        mensagem: `${membros.map((m) => `“${m.nome}” (saldo ${fmtQtd(m.saldo, m.unidade)})`).join(", ")} parecem ser o mesmo produto (similaridade ${fmtNum(g.similaridade * 100, 0)}%). Separados, saldo e consumo ficam distorcidos; juntos somam ${fmtQtd(saldoSomado, principal.unidade)}.`,
        metodo: "grafo de similaridade entre nomes (mesma categoria e unidade): siglas expandidas, acentos removidos, Jaro-Winkler e contenção de termos; componentes conexos formam o grupo.",
        acao: "Confirmar a unificação na tela Cadastros. A análise é refeita automaticamente.",
        confianca: g.similaridade >= 0.95 ? "alta" : "media",
        confiancaMotivo: `similaridade de ${fmtNum(g.similaridade * 100, 0)}% entre os nomes`,
        diasAteProblema: null,
        impactoFinanceiro: null,
        evidencias: { chaves: g.chaves.join(" | "), nomes: g.nomes.join(" | ") },
      }),
    );
  }
  for (const p of produtos.values()) {
    if (p.grafias.length < 2) continue;
    // Fusões confirmadas pelo usuário (nomes realmente diferentes) já foram resolvidas: não repetir aviso.
    if (new Set(p.grafias.map(normalizarNome)).size > 1) continue;
    alertas.push(
      criarAlerta(p, {
        detector: "cadastro_duplicado",
        nivel: "monitorar",
        titulo: "Grafias diferentes unificadas",
        mensagem: `O produto aparece escrito de ${p.grafias.length} formas (${p.grafias.map((g) => `“${g}”`).join(", ")}). Elas foram unificadas automaticamente por diferirem só em acento, maiúsculas ou espaços.`,
        metodo: "nomes iguais após remover acentos, maiúsculas e espaços extras.",
        acao: "Padronizar o nome no cadastro para evitar novas variações.",
        confianca: "alta",
        confiancaMotivo: "diferença apenas de digitação",
        diasAteProblema: null,
        impactoFinanceiro: null,
        evidencias: { grafias: p.grafias.join(" | ") },
      }),
    );
  }
  return alertas;
}

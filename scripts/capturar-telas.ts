// npm run capturar-telas — gera as imagens da seção "Telas" do README em docs/img/.
// npm run capturar-telas -- pitch — gera as telas da apresentação em public/pitch/ e grava em
//   src/app/pitch/focos.json o tamanho de cada tela e as paradas do zoom dos slides (em px CSS).
// Requer o app rodando (npm run build && npm start) e o Microsoft Edge (ou Chrome/Chromium,
// indicado em EDGE_PATH). Usa o protocolo de depuração do navegador (CDP) direto, sem dependências extras.

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORTA = 9333;
const PITCH = process.argv.includes("pitch");
const SAIDA = join(process.cwd(), ...(PITCH ? ["public", "pitch"] : ["docs", "img"]));
const FOCOS = join(process.cwd(), "src", "app", "pitch", "focos.json");

/** Retirada da demonstração: ver README (seção 6) e tests/demo.test.ts. */
const RETIRADA_DEMO_L = "170";

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const CELULAR = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const SLIDE = { width: 1200, height: 750, deviceScaleFactor: 2, mobile: false }; // 16:10, nítido no projetor
const CARTAO = { width: 1600, height: 1000, deviceScaleFactor: 2, mobile: false }; // card de alerta mais largo e legível

type Resultado = { data?: string; result?: { value?: unknown } };
type Caixa = { x: number; y: number; w: number; h: number };

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function conectar() {
  for (let i = 0; i < 50; i++) {
    try {
      const alvo = await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
      return alvo.webSocketDebuggerUrl as string;
    } catch {
      await espera(200);
    }
  }
  throw new Error("Edge não respondeu na porta de depuração");
}

// Funções usadas dentro da página: acham elementos pelo texto e preenchem campos do React.
const AJUDA = `
  window.__card = (texto, seletor = "article, .rounded-lg") =>
    [...document.querySelectorAll(seletor)].filter((e) => e.textContent.includes(texto)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
  window.__botao = (texto, dentro = document) => [...dentro.querySelectorAll("button")].find((b) => b.textContent.includes(texto));
  window.__definir = (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
`;

async function main() {
  mkdirSync(SAIDA, { recursive: true });
  const perfil = mkdtempSync(join(tmpdir(), "agrosentinela-telas-"));
  const semSandbox = process.platform === "linux" && process.getuid?.() === 0 ? ["--no-sandbox"] : [];
  const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`, "--hide-scrollbars", "--no-first-run", ...semSandbox, "about:blank"], { stdio: "ignore" });

  const ws = new WebSocket(await conectar());
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pendentes = new Map<number, (v: Resultado | Promise<never>) => void>();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(String(e.data));
    if (msg.id && pendentes.has(msg.id)) {
      pendentes.get(msg.id)!(msg.error ? Promise.reject(new Error(msg.error.message)) : msg.result);
      pendentes.delete(msg.id);
    }
  });
  const cdp = (method: string, params: object = {}): Promise<Resultado> =>
    new Promise((r) => {
      pendentes.set(++id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const avaliar = async (expressao: string) => (await cdp("Runtime.evaluate", { expression: expressao, awaitPromise: true, returnByValue: true })).result?.value;

  let telaAtual: { width: number; height: number } = DESKTOP;
  async function abrir(caminho: string, tela: typeof DESKTOP) {
    telaAtual = tela;
    await cdp("Emulation.setDeviceMetricsOverride", tela);
    await cdp("Page.navigate", { url: BASE + caminho });
    for (let i = 0; i < 60 && !(await avaliar("!!document.querySelector('main h1')")); i++) await espera(250);
    await avaliar(AJUDA);
    await espera(1500); // gráficos e fontes
  }
  async function capturar(nome: string, clip?: object) {
    const { data } = await cdp("Page.captureScreenshot", { format: "png", ...(clip ? { clip, captureBeyondViewport: true } : {}) });
    writeFileSync(join(SAIDA, `${nome}.png`), Buffer.from(data ?? "", "base64"));
    console.log(`${PITCH ? "public/pitch" : "docs/img"}/${nome}.png`);
  }
  /**
   * Caixa (em px CSS da imagem) que envolve um elemento ou uma lista deles, com uma pequena folga.
   * Com `dentro`, a caixa é relativa a esse elemento (para recortes como o card de alerta).
   */
  async function caixa(expressao: string, folga = 10, dentro?: string): Promise<Caixa> {
    const [x0, y0, x1, y1, ox, oy, W, H] = (await avaliar(`(() => {
      const els = [].concat(${expressao});
      const rs = els.map((e) => e.getBoundingClientRect());
      const o = ${dentro ? `(${dentro}).getBoundingClientRect()` : `{ left: 0, top: 0, width: innerWidth, height: innerHeight }`};
      return [Math.min(...rs.map((r) => r.left)), Math.min(...rs.map((r) => r.top)), Math.max(...rs.map((r) => r.right)), Math.max(...rs.map((r) => r.bottom)), o.left, o.top, o.width, o.height];
    })()`)) as number[];
    const x = Math.max(0, x0 - ox - folga), y = Math.max(0, y0 - oy - folga);
    const w = Math.min(W - x, x1 - x0 + 2 * folga), h = Math.min(H - y, y1 - y0 + 2 * folga);
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  }
  /** Recorte de um elemento da página (em px CSS; a escala 2× vem da emulação). */
  async function recortar(nome: string, expressaoElemento: string) {
    const r = (await avaliar(`(() => { const e = ${expressaoElemento}; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return [r.left + scrollX, r.top + scrollY, r.width, r.height]; })()`)) as number[];
    await espera(300);
    await capturar(nome, { x: r[0], y: r[1], width: r[2], height: r[3], scale: 1 });
  }
  async function preencherRetirada(tela: typeof DESKTOP) {
    await abrir("/movimentacoes", tela);
    const campo = (rotulo: string) => `[...document.querySelectorAll("form label")].find((l) => l.textContent.trim().startsWith("${rotulo}")).querySelector("input")`;
    // Um campo por vez: o produto preenche categoria, unidade e mínimo antes dos demais.
    for (const [rotulo, valor] of [["Produto", "Herbicida glifosato"], ["Quantidade", RETIRADA_DEMO_L], ["Destino", "Talhão 2"], ["Responsável", "Demonstração"]]) {
      await avaliar(`__definir(${campo(rotulo)}, "${valor}")`);
      await espera(150);
    }
  }
  async function salvarRetirada() {
    await avaliar(`document.querySelector("form").requestSubmit()`);
    for (let i = 0; i < 20 && !(await avaliar(`!!document.querySelector('[role=status]')`)); i++) await espera(250);
    await espera(800);
  }

  try {
    await cdp("Page.enable");

    if (!PITCH) {
      await abrir("/", DESKTOP); await capturar("painel");
      await abrir("/produtos", DESKTOP); await capturar("produtos");
      const ficha = await avaliar(`[...document.querySelectorAll('a[href^="/produtos/"]')].find(a => a.textContent.includes('diesel'))?.getAttribute('href')`);
      await abrir(typeof ficha === "string" ? ficha : "/produtos", DESKTOP); await capturar("ficha-produto");
      await abrir("/financeiro", DESKTOP); await capturar("financeiro");
      await abrir("/cadastros", DESKTOP); await capturar("cadastros");
      await abrir("/importar", DESKTOP); await capturar("importar");
      await abrir("/como-funciona", DESKTOP); await capturar("como-funciona");
      await abrir("/", CELULAR); await capturar("celular-painel");
      await abrir("/produtos", CELULAR); await capturar("celular-produtos");

      // Por último, porque registra uma retirada e muda a análise das telas seguintes.
      await preencherRetirada(DESKTOP);
      await salvarRetirada();
      await capturar("registrar");
      return;
    }

    // ---- Telas do pitch (public/pitch), cada uma no mesmo estado das versões anteriores ----
    // focos.json guarda, para cada imagem, o tamanho em px CSS e as paradas da câmera dos slides.
    const focos: Record<string, { tam: [number, number]; focos: Record<string, Caixa> }> = {};
    const tela = (nome: string, tam: [number, number] = [telaAtual.width, telaAtual.height]): Record<string, Caixa> => (focos[nome] = { tam, focos: {} }).focos;
    const cardDiesel = `__card("Óleo diesel S10 · Estoque crítico", "article")`;

    await abrir("/", SLIDE);
    let f = tela("painel");
    f.resumo = await caixa(`document.querySelector('section[aria-label="Resumo para o gestor"]')`);
    f.niveis = await caixa(`document.querySelector('section[aria-label="Resumo"] > div')`);
    f.indicadores = await caixa(`document.querySelector('section[aria-label="Resumo"]')`);
    await capturar("painel");
    await abrir("/", CARTAO);
    await recortar("alerta-diesel", cardDiesel);
    await avaliar(`__botao("Como calculamos?", ${cardDiesel}).click()`);
    await espera(300);
    await recortar("alerta-diesel-metodo", cardDiesel);
    const [cw, ch] = (await avaliar(`(() => { const r = ${cardDiesel}.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })()`)) as number[];
    f = tela("alerta-diesel-metodo", [cw, ch]);
    f.alerta = await caixa(`[...${cardDiesel}.children].slice(0, 3)`, 10, cardDiesel);
    f.fazer = await caixa(`[...${cardDiesel}.querySelectorAll("p")].find((p) => p.textContent.startsWith("O que fazer"))`, 10, cardDiesel);
    f.confianca = await caixa(`${cardDiesel}.querySelector("dl")`, 10, cardDiesel);

    const ficha = await avaliar(`[...document.querySelectorAll('a[href^="/produtos/"]')].find(a => a.textContent.includes('diesel'))?.getAttribute('href')`);
    await abrir(typeof ficha === "string" ? ficha : "/produtos", SLIDE);
    f = tela("diesel");
    f.saldo = await caixa(`[...document.querySelector("main section.grid").children].slice(0, 3)`);
    f.duraAte = await caixa(`__card("Dura até")`);
    await capturar("diesel");
    await avaliar(`(() => { const e = __card("Saldo ao longo do tempo"); scrollTo(0, e.getBoundingClientRect().top + scrollY - 24); })()`);
    await espera(800);
    tela("diesel-graficos").consumo = await caixa(`__card("Consumo por semana")`);
    await capturar("diesel-graficos");

    await abrir("/financeiro", SLIDE); await capturar("financeiro");
    await abrir("/importar", SLIDE); await capturar("importar");
    await abrir("/como-funciona", SLIDE); await capturar("como-funciona");

    await abrir("/cadastros", SLIDE);
    const grupoKcl = `__card("KCl", "div.rounded-lg")`;
    tela("cadastros").kcl = await caixa(grupoKcl);
    await capturar("cadastros");
    await avaliar(`__botao("Unificar", ${grupoKcl}).click()`);
    for (let i = 0; i < 20 && !(await avaliar(`!!document.querySelector('[role=status]')`)); i++) await espera(250);
    await espera(800);
    tela("cadastros-unificado").aviso = await caixa(`document.querySelector('[role=status]')`, 8);
    await capturar("cadastros-unificado");

    // Demo de registro sobre a base sem a unificação acima.
    await avaliar(`localStorage.clear()`);
    await preencherRetirada(SLIDE);
    await capturar("registrar");
    await salvarRetirada();
    tela("registrar-novo").aviso = await caixa(`document.querySelector('[role=status]')`, 8);
    await capturar("registrar-novo");
    await abrir("/", SLIDE); await capturar("painel-depois");

    writeFileSync(FOCOS, JSON.stringify(focos, null, 2) + "\n");
    console.log("src/app/pitch/focos.json");
  } finally {
    ws.close();
    edge.kill();
    await espera(500);
    rmSync(perfil, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

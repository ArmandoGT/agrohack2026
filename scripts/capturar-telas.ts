// npm run capturar-telas — gera as imagens da seção "Telas" do README em docs/img/.
// Requer o app rodando (npm run build && npm start) e o Microsoft Edge (ou Chrome/Chromium, indicado em EDGE_PATH).
// Usa o protocolo de depuração do navegador (CDP) direto, sem dependências extras.

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORTA = 9333;
const SAIDA = join(process.cwd(), "docs", "img");

/** Retirada da demonstração: ver README (seção 6) e tests/demo.test.ts. */
const RETIRADA_DEMO_L = "170";

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const CELULAR = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

type Resultado = { data?: string; result?: { value?: unknown } };

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

  async function abrir(caminho: string, tela: object) {
    await cdp("Emulation.setDeviceMetricsOverride", tela);
    await cdp("Page.navigate", { url: BASE + caminho });
    for (let i = 0; i < 60 && !(await avaliar("!!document.querySelector('main h1')")); i++) await espera(250);
    await espera(1500); // gráficos e fontes
  }
  async function capturar(nome: string) {
    const { data } = await cdp("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(SAIDA, `${nome}.png`), Buffer.from(data ?? "", "base64"));
    console.log(`docs/img/${nome}.png`);
  }

  try {
    await cdp("Page.enable");

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
    await abrir("/movimentacoes", DESKTOP);
    await avaliar(`(() => {
      const definir = (el, v) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const campos = document.querySelectorAll("form input");
      definir(campos[0], "Herbicida glifosato");
      definir(campos[1], "${RETIRADA_DEMO_L}");
    })()`);
    await espera(300);
    await avaliar(`document.querySelector("form").requestSubmit()`);
    await espera(1500);
    await capturar("registrar");
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

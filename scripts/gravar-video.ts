// npm run gravar-video — grava o vídeo demonstrativo seguindo docs/roteiro-video.md, com interações reais no app.
// Saída: video/agrosentinela-demo.mp4 (H.264, 30 fps, 1920×1080), video/agrosentinela-demo.srt e os quadros
//   das cenas 1, 2, 6 e 9 em docs/img/video/.
// As cenas, os tempos e as legendas vêm da tabela do roteiro: mudou o roteiro, é só gravar de novo.
// APP_URL muda o endereço (padrão: o site da Netlify). Navegador: o Chromium do Playwright
//   (npx playwright install chromium) ou, se ele não estiver baixado, CHROMIUM_PATH ou um Chromium/Chrome do sistema.
// ffmpeg: o do sistema ou, se não houver, o pacote ffmpeg-static (npm i --no-save ffmpeg-static).
// Os carregamentos de página (abertura e recarga antes da cena 6) são gravados, mas cortados do vídeo final.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Locator } from "playwright";

const BASE = (process.env.APP_URL ?? "https://agrohack-agrosentinela.netlify.app").replace(/\/$/, "");
const RAIZ = process.cwd();
const ROTEIRO = join(RAIZ, "docs", "roteiro-video.md");
const SAIDA = join(RAIZ, "video");
const BRUTO = join(SAIDA, "bruto");
const MP4 = join(SAIDA, "agrosentinela-demo.mp4");
const SRT = join(SAIDA, "agrosentinela-demo.srt");
const QUADROS = join(RAIZ, "docs", "img", "video");
const CENAS_QUADROS = [1, 2, 6, 9];
const REPOSITORIO = "github.com/ArmandoGT/agrohack2026";
const SITE = "agrohack-agrosentinela.netlify.app"; // a tela final sempre aponta para o site público

// A gravação do Playwright tem o tamanho da janela em px CSS; por isso a janela é 1920×1080 e a página recebe
// zoom de 125% (como num notebook), para o texto do app ficar legível no vídeo. Legenda e cursor ficam sem zoom.
const VIEWPORT = { width: 1920, height: 1080 };
const ZOOM = 1.25;
const VIDEO = VIEWPORT;

/** Retirada da demonstração: ver README (seção 6) e tests/demo.test.ts. */
const RETIRADA_DEMO_L = "170";
const AVISO_GLIFOSATO = ["Novo", "Atenção", "Herbicida glifosato", "Vai faltar em breve"];

type Cena = { num: number; tela: string; ini: number; dur: number; texto: string };
type Trecho = { ini: number; fim: number };
type Deixa = { ini: number; fim: number; texto: string };

const espera = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const seg = (t: string) => t.split(":").reduce((s, p) => s * 60 + Number(p), 0);

/** Lê a tabela do roteiro: | # | Tempo | Tela | Narração |. */
function lerRoteiro(): Cena[] {
  const cenas = readFileSync(ROTEIRO, "utf8")
    .split("\n")
    .filter((l) => /^\|\s*\d+\s*\|/.test(l))
    .map((l) => {
      const [num, tempo, tela, narracao] = l.split("|").slice(1, 5).map((c) => c.trim());
      const [ini, fim] = tempo.split(/[–-]/).map(seg);
      return { num: Number(num), tela: tela.replace(/\*/g, ""), ini, dur: fim - ini, texto: narracao.replace(/^"|"$/g, "").replace(/\*\*/g, "") };
    });
  if (!cenas.length) throw new Error(`Nenhuma cena na tabela de ${ROTEIRO}`);
  return cenas;
}

/** Quebra a narração em legendas de até ~2 linhas, por frase, com tempo proporcional ao tamanho. */
function quebrar(texto: string, dur: number): Deixa[] {
  const blocos: string[] = [];
  for (const frase of texto.split(/(?<=[.!?:])\s+(?=[A-ZÀ-Ú"“])/)) {
    const ultimo = blocos.at(-1);
    if (ultimo && ultimo.length + frase.length < 120) blocos[blocos.length - 1] = `${ultimo} ${frase}`;
    else blocos.push(frase);
  }
  const total = blocos.reduce((s, b) => s + b.length, 0);
  let t = 0;
  return blocos.map((b) => {
    const d = (dur * b.length) / total;
    return { ini: t, fim: (t += d), texto: b };
  });
}

// Funções injetadas na página: legenda, cursor desenhado, rolagem suave e o preenchimento de campos do React
// (o mesmo __definir de scripts/capturar-telas.ts). Os elementos ficam em <html>, fora da árvore do React.
function instalarAjuda(zoom: number) {
  type Janela = Window & Record<string, unknown>;
  const w = window as unknown as Janela;
  document.documentElement.style.zoom = String(zoom);
  if (w.__legenda) return;
  const fonte = getComputedStyle(document.body).fontFamily;
  const fonteTitulo = getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily;
  const estilo = document.createElement("style");
  estilo.textContent = `
    #demo-legenda, #demo-cursor, .demo-clique, #demo-final { zoom: ${1 / zoom}; }
    #demo-legenda { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 2147483646;
      width: min(1720px, calc(100vw - 80px)); box-sizing: border-box; padding: 18px 40px 20px; border-radius: 14px;
      background: rgb(22 17 11 / 0.88); border-top: 3px solid #d8b965; color: #fff; font-family: ${fonte};
      font-size: 40px; line-height: 1.3; font-weight: 600; text-align: center; text-wrap: balance;
      box-shadow: 0 8px 28px rgb(0 0 0 / 0.35); transition: opacity 200ms ease; pointer-events: none; }
    #demo-legenda:empty { display: none; }
    /* Com zoom, 100vh fica maior que a janela: o menu lateral fixo volta a ter a altura da tela. */
    aside { height: ${100 / zoom}vh !important; }
    /* O aviso de reanálise fica no canto de baixo: sobe para não ficar atrás da legenda. */
    [role=status].fixed { bottom: calc(var(--demo-legenda-h, 0px) + 32px) !important; }
    #demo-cursor { position: fixed; left: 0; top: 0; z-index: 2147483647; width: 36px; height: 36px; pointer-events: none;
      filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.45)); will-change: transform; }
    .demo-clique { position: fixed; z-index: 2147483646; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
      border: 3px solid #d8b965; background: rgb(216 185 101 / 0.3); pointer-events: none; animation: demo-clique 600ms ease-out forwards; }
    @keyframes demo-clique { from { transform: scale(0.3); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
    #demo-final { position: fixed; inset: 0; z-index: 2147483645; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 22px; background: #2b4220; color: #fff; font-family: ${fonte}; text-align: center;
      opacity: 0; transition: opacity 900ms ease; border: 14px double #d8b965; padding-bottom: 190px; box-sizing: border-box; }
    #demo-final h2 { font-family: ${fonteTitulo}; font-size: 120px; font-weight: 600; margin: 0; line-height: 1; }
    #demo-final p { margin: 0; font-size: 38px; color: #e5e7cd; }
    #demo-final .link { font-size: 52px; font-weight: 700; color: #fff; background: rgb(255 255 255 / 0.1);
      border: 3px solid #d8b965; border-radius: 14px; padding: 12px 36px; }`;
  document.documentElement.append(estilo);

  const legenda = document.createElement("div");
  legenda.id = "demo-legenda";
  legenda.setAttribute("aria-hidden", "true");
  const cursor = document.createElement("div");
  cursor.id = "demo-cursor";
  cursor.innerHTML = `<svg viewBox="0 0 24 24" width="36" height="36"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.6 L14.6 20.3 L11.7 13.6 L18 13.6 Z" fill="#fff" stroke="#16110b" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  document.documentElement.append(legenda, cursor);

  let pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const posicionar = (x: number, y: number) => {
    pos = { x, y };
    cursor.style.transform = `translate(${x - 4}px, ${y - 2}px)`;
  };
  posicionar(pos.x, pos.y);
  const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const animar = (ms: number, passo: (k: number) => void) =>
    new Promise<void>((fim) => {
      const t0 = performance.now();
      const quadro = (agora: number) => {
        const k = Math.min(1, (agora - t0) / ms);
        passo(suave(k));
        if (k < 1) requestAnimationFrame(quadro);
        else fim();
      };
      requestAnimationFrame(quadro);
    });

  w.__legenda = (texto: string) => {
    legenda.style.opacity = "0";
    setTimeout(() => {
      legenda.textContent = texto;
      // O aviso está dentro da página com zoom: a altura vai em px da página.
      document.documentElement.style.setProperty("--demo-legenda-h", `${(legenda.getBoundingClientRect().height + 28) / zoom}px`);
      legenda.style.opacity = "1";
    }, texto ? 200 : 0);
  };
  w.__alturaLegenda = () => legenda.getBoundingClientRect().height + 28;
  w.__posicionarCursor = posicionar;
  w.__moverCursor = (x: number, y: number, ms: number) => {
    const { x: x0, y: y0 } = pos;
    return animar(ms, (k) => posicionar(x0 + (x - x0) * k, y0 + (y - y0) * k));
  };
  w.__clique = (x: number, y: number) => {
    const c = document.createElement("div");
    c.className = "demo-clique";
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    document.documentElement.append(c);
    setTimeout(() => c.remove(), 700);
  };
  w.__rolar = (y: number, ms: number) => {
    const y0 = scrollY;
    scrollTo(0, 1e7); // descobre o fim da página (sem pintar entre as duas rolagens)
    const alvo = Math.max(0, Math.min(y, scrollY));
    scrollTo(0, y0);
    return animar(ms, (k) => scrollTo(0, y0 + (alvo - y0) * k));
  };
  w.__definir = (el: HTMLInputElement, v: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  w.__telaFinal = (repositorio: string, site: string) => {
    const tela = document.createElement("div");
    tela.id = "demo-final";
    tela.innerHTML = `<h2>AgroSentinela</h2><p>Equipe 3 Hacketeers · AGROHACK 2026/2 · IFRO Ariquemes</p>
      <p style="margin-top:28px">Código, documentação e instruções de teste</p><div class="link">${repositorio}</div>
      <p style="margin-top:12px">Experimente: ${site}</p>`;
    document.documentElement.append(tela);
    requestAnimationFrame(() => requestAnimationFrame(() => (tela.style.opacity = "1")));
  };
}

/** Chromium do Playwright; se o download dele foi bloqueado, um Chromium/Chrome já instalado. */
async function abrirNavegador(): Promise<Browser> {
  const args = ["--hide-scrollbars", "--force-color-profile=srgb"];
  try {
    return await chromium.launch({ args });
  } catch (e) {
    const candidatos = [
      process.env.CHROMIUM_PATH,
      "/opt/pw-browsers/chromium",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/google-chrome",
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ].filter((c): c is string => !!c && existsSync(c));
    if (!candidatos.length) throw e;
    console.log(`Chromium do Playwright indisponível; usando ${candidatos[0]}`);
    return chromium.launch({ args, executablePath: candidatos[0] });
  }
}

function caminhoFfmpeg(): string {
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return "ffmpeg";
  try {
    // Carregado só quando necessário, para não pesar na instalação do projeto.
    const estatico = (eval("require") as NodeRequire)("ffmpeg-static") as string | null;
    if (estatico && existsSync(estatico)) return estatico;
  } catch {}
  throw new Error("ffmpeg não encontrado. Instale o ffmpeg ou rode: npm i --no-save ffmpeg-static");
}

function ffmpeg(bin: string, args: string[]) {
  const r = spawnSync(bin, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "inherit", "pipe"], encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg falhou (${r.signal ?? r.status}): ${r.stderr}`);
}

function duracaoVideo(bin: string, arquivo: string): number {
  const r = spawnSync(bin, ["-hide_banner", "-i", arquivo], { encoding: "utf8" });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN;
}

const srtTempo = (t: number) => {
  const ms = Math.round(t * 1000);
  const p = (n: number, d = 2) => String(n).padStart(d, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

async function main() {
  const cenas = lerRoteiro();
  const cena = (n: number) => cenas.find((c) => c.num === n) ?? (() => { throw new Error(`Cena ${n} não está no roteiro`); })();
  const ffmpegBin = caminhoFfmpeg();
  rmSync(BRUTO, { recursive: true, force: true });
  mkdirSync(BRUTO, { recursive: true });
  mkdirSync(QUADROS, { recursive: true });

  const navegador = await abrirNavegador();
  const contexto = await navegador.newContext({
    viewport: VIEWPORT,
    locale: "pt-BR",
    recordVideo: { dir: BRUTO, size: VIDEO },
  });
  // O tsx (esbuild) envolve funções com __name(); a página precisa dele para rodar as funções passadas a evaluate.
  await contexto.addInitScript("window.__name = (f) => f;");
  const page = await contexto.newPage();
  const t0 = Date.now();
  const relogio = () => (Date.now() - t0) / 1000;
  const trechos: Trecho[] = []; // partes da gravação que entram no vídeo, em segundos desde o início dela
  const deixas: Deixa[] = []; // legendas na linha do tempo do vídeo final
  const quadros: Record<number, number> = {}; // instante (no vídeo final) de cada quadro do PR
  let cursor = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 };

  const avaliar = <T>(fn: string) => page.evaluate(fn) as Promise<T>;

  /** Abre um endereço fora do vídeo (o carregamento é cortado) e deixa a página pronta para a próxima cena. */
  async function carregar(caminho: string) {
    await page.goto(BASE + caminho, { waitUntil: "networkidle" });
    await page.locator("main h1").first().waitFor();
    await page.getByText("Carregando e analisando registros").waitFor({ state: "detached" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(instalarAjuda, ZOOM);
    await espera(300);
    await page.evaluate(([x, y]) => (window as unknown as { __posicionarCursor: (x: number, y: number) => void }).__posicionarCursor(x, y), [cursor.x, cursor.y]);
    // Gráficos animados, fontes e folga para a gravação, que pode atrasar um pouco em relação ao relógio
    // quando a máquina está ocupada: o corte nunca deve pegar a tela de carregamento.
    await espera(4000);
  }

  async function moverPara(x: number, y: number, ms = 700) {
    await Promise.all([avaliar(`__moverCursor(${x}, ${y}, ${ms})`), page.mouse.move(x, y, { steps: Math.max(2, Math.round(ms / 40)) })]);
    cursor = { x, y };
  }

  /** Rola suavemente até o elemento ficar a `topo` px do alto da tela (ou acima da legenda, se for alto). */
  async function rolarAte(alvo: Locator, topo = 90, ms = 1100) {
    const caixa = await alvo.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { y: r.top + scrollY, h: r.height };
    });
    await avaliar(`__rolar(${caixa.y - topo}, ${ms})`);
    await espera(150);
  }

  /** Rola só o necessário para o elemento inteiro ficar acima da legenda. */
  async function mostrarInteiro(alvo: Locator, ms = 900) {
    const [fundo, legendaH] = await Promise.all([alvo.evaluate((e) => e.getBoundingClientRect().bottom), avaliar<number>("__alturaLegenda()")]);
    const limite = VIEWPORT.height - legendaH - 24;
    if (fundo > limite) await avaliar(`__rolar(scrollY + ${fundo - limite}, ${ms})`);
  }

  /** Centro do elemento na tela; antes, rola suavemente se ele estiver fora da área livre (acima da legenda). */
  async function centro(alvo: Locator) {
    await alvo.waitFor({ state: "visible" });
    const [r, legendaH] = await Promise.all([alvo.evaluate((e) => e.getBoundingClientRect().toJSON() as DOMRect), avaliar<number>("__alturaLegenda()")]);
    const limite = VIEWPORT.height - legendaH - 24;
    if (r.top < 60 || r.bottom > limite) {
      const alvoY = r.height > limite - 90 ? 90 : Math.max(90, (limite - r.height) / 2);
      await avaliar(`__rolar(scrollY + ${r.top - alvoY}, 1000)`);
      await espera(150);
    }
    const b = (await alvo.boundingBox())!;
    return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), b };
  }

  async function apontar(alvo: Locator, ms = 700) {
    const { x, y } = await centro(alvo);
    await moverPara(x, y, ms);
  }

  async function clicar(alvo: Locator, ms = 750) {
    const { x, y } = await centro(alvo);
    await moverPara(x, y, ms);
    await espera(180);
    await avaliar(`__clique(${x}, ${y})`);
    await page.mouse.click(x, y);
  }

  /** Digita letra por letra num campo controlado pelo React. */
  async function digitar(campo: Locator, texto: string, msPorLetra = 70) {
    await clicar(campo);
    for (let i = 1; i <= texto.length; i++) {
      await campo.evaluate((el, v) => (window as unknown as { __definir: (e: Element, v: string) => void }).__definir(el, v), texto.slice(0, i));
      await espera(msPorLetra);
    }
  }

  const final = () => trechos.reduce((s, t) => s + (t.fim - t.ini), 0);

  /** Grava uma cena: legendas no tempo do roteiro, as ações e a espera até completar a duração. */
  async function gravarCena(n: number, acoes: () => Promise<void>, quadroEm?: number) {
    const c = cena(n);
    const partes = quebrar(c.texto, c.dur);
    const inicioFinal = final();
    await avaliar(`__legenda(${JSON.stringify(partes[0].texto)})`);
    const ini = relogio();
    const timers = partes.slice(1).map((p) => setTimeout(() => void avaliar(`__legenda(${JSON.stringify(p.texto)})`).catch(() => {}), p.ini * 1000));
    try {
      await acoes();
    } finally {
      const sobra = c.dur - (relogio() - ini);
      if (sobra < 0) console.warn(`Cena ${n}: as ações passaram ${(-sobra).toFixed(1)} s da duração do roteiro`);
      await espera(sobra * 1000);
      timers.forEach(clearTimeout);
    }
    const passou = relogio() - ini;
    const fim = ini + (passou > c.dur + 0.25 ? passou : c.dur); // corta na duração exata do roteiro
    trechos.push({ ini, fim });
    for (const p of partes) deixas.push({ ini: inicioFinal + p.ini, fim: inicioFinal + Math.min(p.fim, fim - ini), texto: p.texto });
    if (CENAS_QUADROS.includes(n)) quadros[n] = inicioFinal + (quadroEm ?? c.dur / 2);
    console.log(`Cena ${n} (${c.tela}): ${(fim - ini).toFixed(1)} s`);
  }

  const main = page.locator("main");
  const card = (...textos: string[]) => textos.reduce((l, t) => l.filter({ hasText: t }), main.locator("article"));
  const linkMenu = (rotulo: string) => page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: rotulo });
  const titulo = (texto: string) => main.locator("h1", { hasText: texto });
  const aviso = page.locator("[role=status]").filter({ hasText: "Reanálise concluída" });

  try {
    // Abertura fora do vídeo: começa com o painel já pronto, sem tela de carregamento.
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await carregar("/");

    await gravarCena(1, async () => {
      await espera(1500);
      await apontar(main.locator('section[aria-label="Resumo para o gestor"] h2'), 1200);
      await espera(3500);
      await apontar(main.getByRole("button", { name: /Críticos/ }), 1000);
      await espera(2500);
      await apontar(main.getByRole("button", { name: /Atenção/ }).first(), 900);
    });

    const diesel = card("Óleo diesel S10", "Estoque crítico");
    await gravarCena(2, async () => {
      await rolarAte(diesel, 100, 1400);
      await apontar(diesel.locator("h3"), 900);
      await espera(4000);
      await apontar(diesel.getByText("O que fazer:"), 900);
      await espera(3500);
      await clicar(diesel.getByRole("button", { name: /Como calculamos\?/ }));
      await espera(400);
      await mostrarInteiro(diesel);
      await apontar(diesel.locator("dl"), 900);
    }, 20);

    await gravarCena(3, async () => {
      await clicar(diesel.locator("h3 a"));
      await titulo("Óleo diesel S10").waitFor();
      await espera(1200);
      await apontar(main.getByText("Dura até").first(), 900);
      await espera(2500);
      // A narração diz que o modelo confirma a data da média: confere antes de gravar o resto.
      const modelo = main.locator("div", { has: page.getByRole("heading", { name: "Previsão do modelo" }) }).last();
      const data = (t: string) => t.match(/\d{2}\/\d{2}/)?.[0];
      const dataMedia = data(await main.getByText("Dura até").first().locator("..").innerText());
      const dataModelo = data(await modelo.getByText("deve zerar por volta de").innerText());
      if (!dataModelo || dataModelo !== dataMedia) throw new Error(`A previsão do modelo (${dataModelo}) não confirma a data da média (${dataMedia})`);
      await rolarAte(modelo, 90, 1200);
      await apontar(modelo.getByText("deve zerar por volta de"), 900);
      await espera(2500);
      await apontar(modelo.getByText(/^Teste:/), 900);
      await espera(2000);
      const saldo = main.locator("div", { has: page.getByRole("heading", { name: "Saldo ao longo do tempo" }) }).last();
      await rolarAte(page.getByRole("heading", { name: "Saldo ao longo do tempo" }), 90, 1500);
      const grafico = saldo.locator(".recharts-surface").first();
      const { b } = await centro(grafico);
      await moverPara(b.x + b.width * 0.2, b.y + b.height * 0.5, 900);
      await moverPara(b.x + b.width * 0.85, b.y + b.height * 0.5, 3000); // percorre a linha: dica com o saldo de cada dia
      await espera(800);
      await rolarAte(page.getByRole("heading", { name: "Consumo por semana" }), 90, 1500);
      const barras = main.locator("div", { has: page.getByRole("heading", { name: "Consumo por semana" }) }).last().locator(".recharts-surface").first();
      const c2 = (await centro(barras)).b;
      await moverPara(c2.x + c2.width * 0.3, c2.y + c2.height * 0.55, 900);
      await moverPara(c2.x + c2.width * 0.9, c2.y + c2.height * 0.55, 1800);
    });

    await gravarCena(4, async () => {
      await clicar(linkMenu("Painel do dia"));
      await titulo("Painel do dia").waitFor();
      await espera(800);
      const tricho = card("Trichoderma", "vencido");
      await rolarAte(tricho, 100, 1300);
      await apontar(tricho.locator("h3"), 900);
      await espera(3000);
      const inoculante = card("Inoculante para soja", "Pode vencer antes do uso");
      await apontar(inoculante.locator("h3"), 900);
      await espera(2000);
      await clicar(inoculante.getByRole("button", { name: /Como calculamos\?/ }));
      await espera(400);
      await mostrarInteiro(inoculante);
      await apontar(inoculante.locator("dl"), 900);
    });

    await gravarCena(5, async () => {
      await clicar(linkMenu("Cadastros duplicados"));
      await titulo("Cadastros duplicados").waitFor();
      await espera(800);
      const grupo = main.locator("div.rounded-lg").filter({ has: page.getByRole("button", { name: "Unificar e reanalisar" }) }).filter({ hasText: "KCl" }).last();
      await rolarAte(grupo, 100, 1000);
      await apontar(grupo.locator("fieldset label").first(), 800);
      await espera(1500);
      await apontar(grupo.locator("fieldset label").last(), 700);
      await espera(1500);
      await clicar(grupo.getByRole("button", { name: "Unificar e reanalisar" }));
      await aviso.waitFor();
      await espera(500);
      await apontar(aviso, 900);
    });

    // Fora do vídeo: a demonstração do registro parte da base original, sem a unificação da cena 5.
    await page.evaluate(() => localStorage.clear());
    await carregar("/movimentacoes");

    await gravarCena(6, async () => {
      await espera(800);
      await clicar(page.getByRole("radio", { name: /Saída/ }), 900);
      const campo = (rotulo: string) => main.locator("form label").filter({ hasText: rotulo }).locator("input").first();
      await digitar(campo("Produto"), "Herbicida glifosato");
      await digitar(campo("Quantidade"), RETIRADA_DEMO_L, 200);
      await apontar(campo("Data"), 800); // a data sugerida é a da análise
      await espera(900);
      await digitar(campo("Destino"), "Talhão 2");
      await digitar(campo("Responsável"), "Demonstração");
      await clicar(main.getByRole("button", { name: "Salvar e reanalisar" }));
      await aviso.waitFor();
      const textoAviso = await aviso.innerText();
      const falta = AVISO_GLIFOSATO.filter((t) => !textoAviso.includes(t));
      if (falta.length) throw new Error(`O aviso do glifosato não mostrou ${falta.join(", ")}:\n${textoAviso}`);
      await espera(500);
      await apontar(aviso.locator("li").filter({ hasText: "Herbicida glifosato" }), 1000);
      // Sai de cima do aviso para ele ficar inteiro legível.
      const caixaAviso = (await aviso.boundingBox())!;
      await espera(1200);
      await moverPara(caixaAviso.x - 90, caixaAviso.y + caixaAviso.height / 2, 900);
    }, 23);

    await gravarCena(7, async () => {
      await clicar(aviso.getByRole("button", { name: "Fechar" }), 700);
      await clicar(linkMenu("Financeiro"));
      await titulo("Financeiro").waitFor();
      await espera(1500);
      const abc = page.getByRole("heading", { name: /Curva ABC/ });
      await rolarAte(abc, 90, 1300);
      const grafico = main.locator("div", { has: abc }).last().locator(".recharts-surface").first();
      const { b } = await centro(grafico);
      await moverPara(b.x + b.width * 0.3, b.y + b.height * 0.12, 900);
      await moverPara(b.x + b.width * 0.3, b.y + b.height * 0.85, 3000);
      await espera(1500);
      await rolarAte(page.getByRole("heading", { name: "Alertas financeiros" }), 90, 1500);
    });

    await gravarCena(8, async () => {
      await clicar(linkMenu("Como funciona"));
      await titulo("Como funciona").waitFor();
      await espera(1500);
      await rolarAte(page.getByRole("heading", { name: /Pipeline de análise/ }), 90, 1500);
      await espera(3500);
      await rolarAte(page.getByRole("heading", { name: /Previsão de consumo \(modelo\)/ }), 90, 1300);
      await espera(3500);
      await rolarAte(page.getByRole("heading", { name: /Critérios de cada alerta/ }), 90, 1300);
      await espera(2500);
      await avaliar("__rolar(scrollY + 380, 3000)");
    });

    await gravarCena(9, async () => {
      await avaliar(`__telaFinal(${JSON.stringify(REPOSITORIO)}, ${JSON.stringify(SITE)})`);
      await moverPara(VIEWPORT.width - 60, VIEWPORT.height - 60, 1200);
    }, 6);
    await espera(1000); // a gravação termina um pouco depois do relógio: folga para a última cena sair inteira
  } finally {
    await contexto.close(); // grava o .webm
    await navegador.close();
  }

  const webm = readdirSync(BRUTO).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("O Playwright não gerou o vídeo");
  const bruto = join(BRUTO, webm);

  // Junta só os trechos das cenas (sem os carregamentos) e converte para H.264 a 30 fps. Um único filtro select,
  // em vez de trim + concat, para o ffmpeg não guardar na memória os quadros de todos os trechos ao mesmo tempo.
  const selecao = trechos.map((t) => `between(t,${t.ini.toFixed(3)},${t.fim.toFixed(3)})`).join("+");
  const filtro = `fps=30,select='${selecao}',setpts=N/30/TB,scale=${VIDEO.width}:${VIDEO.height}:flags=lanczos,format=yuv420p`;
  ffmpeg(ffmpegBin, ["-i", bruto, "-vf", filtro, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-r", "30", "-t", final().toFixed(3), "-movflags", "+faststart", MP4]);

  writeFileSync(SRT, deixas.map((d, i) => `${i + 1}\n${srtTempo(d.ini)} --> ${srtTempo(d.fim)}\n${d.texto}\n`).join("\n"));

  for (const [n, t] of Object.entries(quadros)) {
    ffmpeg(ffmpegBin, ["-ss", t.toFixed(2), "-i", MP4, "-frames:v", "1", join(QUADROS, `cena-${n}.png`)]);
  }
  rmSync(BRUTO, { recursive: true, force: true });

  const dur = duracaoVideo(ffmpegBin, MP4);
  const mmss = (s: number) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;
  console.log(`\nvideo/agrosentinela-demo.mp4 (${mmss(dur)}, ${dur.toFixed(2)} s)`);
  console.log("video/agrosentinela-demo.srt");
  console.log(`docs/img/video/: ${Object.keys(quadros).map((n) => `cena-${n}.png`).join(", ")}`);
  if (!(dur >= 150 && dur <= 180.1)) throw new Error(`Duração fora de 2:30–3:00: ${dur.toFixed(2)} s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

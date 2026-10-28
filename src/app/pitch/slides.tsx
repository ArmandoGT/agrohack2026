"use client";

// Slides do pitch (roteiro em docs/pitch.md). Cada slide é um componente de 1920×1080;
// as telas reais ficam em public/pitch/ (capturas do app rodando com a base simulada) e
// focos.json guarda o tamanho de cada uma e as paradas da câmera (os dois saem de `npm run capturar-telas -- pitch`).
//
// Identidade "Iluminura", a mesma do app: pergaminho e marfim, folha de ouro, cinabre, ultramarino
// e verde-terra; EB Garamond nos títulos e Source Sans 3 no texto. Os slides escuros são um
// "painel de altar": ultramarino profundo com ouro. Todos os pares de texto passam AA com folga (≥ 5:1).
//
// Motion: filetes de ouro que se desenham, capitulares que surgem, arco ogival que se abre sobre as
// telas e revelações em sequência. Nada fica em loop. Com prefers-reduced-motion, só fade
// (o MotionConfig da Apresentacao desliga os transforms; aqui desligamos traços, recortes e zoom).

import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import FOCOS from "./focos.json";

export const C = {
  noite: "#0E1528", // ultramarino profundo: fundo dos slides escuros
  noite2: "#1A2650",
  pergaminho: "#F3EAD5",
  marfim: "#FDF8EC",
  ouro: "#D4AF5A", // folha de ouro sobre a noite
  ouroClaro: "#E8CF8A",
  ouroEscuro: "#7A5C1C", // ouro que pode ser texto sobre o pergaminho
  nevoa: "#C3CADC", // texto secundário sobre a noite
  tinta: "#2B2116",
  tintaSuave: "#5C4E3B",
  cinabre: "#A3241A",
  cinabreClaro: "#EE8473",
  ultramar: "#24408E",
  azulClaro: "#9DB4F0",
  ocreClaro: "#E6B65C",
  verde: "#3E5B2B",
  verdeClaro: "#A9C97F",
  borda: "#DCCAA0",
};

const TITULO = "var(--font-titulo), 'EB Garamond', Georgia, serif";
const EASE = [0.22, 1, 0.36, 1] as const;
const NUMEROS: CSSProperties = { fontVariantNumeric: "lining-nums tabular-nums" };

type Foco = { x: number; y: number; w: number; h: number }; // em % da imagem
type Tema = "noite" | "pergaminho";

const useReduz = () => useReducedMotion() ?? false;

/** Traço que se desenha (pathLength); com movimento reduzido, só aparece. */
function useTraco(atraso: number, dur: number) {
  const reduz = useReduz();
  return reduz
    ? // pathLength fixo em 1: no primeiro render a preferência ainda não é conhecida e o traço pode ter nascido em 0.
      { initial: { pathLength: 1, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { delay: atraso, duration: 0.4 } }
    : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { delay: atraso, duration: dur, ease: "easeInOut" as const, opacity: { delay: atraso, duration: 0.01 } } };
}

// ---------- peças ----------

function Base({ tema = "noite", children }: { tema?: Tema; children: ReactNode }) {
  const noite = tema === "noite";
  return (
    <div
      style={{
        position: "absolute", inset: 0, padding: 128, overflow: "hidden", color: noite ? C.marfim : C.tinta,
        background: noite
          ? `radial-gradient(120% 90% at 70% 35%, ${C.noite2}, ${C.noite} 70%)`
          : `radial-gradient(110% 90% at 30% 20%, ${C.marfim}, ${C.pergaminho} 75%)`,
      }}
    >
      {/* Céu estrelado de ouro (estático), como nos fundos de Fra Angelico */}
      {noite && (
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(212,175,90,.22) 1.3px, transparent 1.8px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(180deg, #000, transparent 60%)", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 60%)" }} />
      )}
      {/* Moldura dupla de filete, como a borda de um painel */}
      <div aria-hidden style={{ position: "absolute", inset: 36, border: `1px solid ${noite ? "rgba(212,175,90,.45)" : "rgba(122,92,28,.35)"}`, pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", inset: 44, border: `1px solid ${noite ? "rgba(212,175,90,.2)" : "rgba(122,92,28,.16)"}`, pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function Entra({ atraso = 0, y = 26, children, style }: { atraso?: number; y?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: atraso, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}

function Losango({ cor, tam = 12 }: { cor: string; tam?: number }) {
  return <span aria-hidden style={{ display: "inline-block", width: tam, height: tam, background: cor, transform: "rotate(45deg)", flexShrink: 0 }} />;
}

function Rotulo({ children, tema = "noite" }: { children: ReactNode; tema?: Tema }) {
  const cor = tema === "noite" ? C.ouro : C.ouroEscuro;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, fontWeight: 600, letterSpacing: 5, color: cor, textTransform: "uppercase" }}>
      <Losango cor={cor} />
      {children}
    </div>
  );
}

function Titulo({ children, cor = C.marfim, tamanho = 76 }: { children: ReactNode; cor?: string; tamanho?: number }) {
  return <h2 style={{ fontFamily: TITULO, fontSize: tamanho, fontWeight: 600, lineHeight: 1.08, color: cor, margin: 0 }}>{children}</h2>;
}

/** Filete de ouro que se desenha do centro para as pontas, com um quadrifólio no meio. */
function Filete({ largura, atraso = 0, dur = 1.1, cor = C.ouro, style }: { largura: number; atraso?: number; dur?: number; cor?: string; style?: CSSProperties }) {
  const tracoE = useTraco(atraso + 0.15, dur);
  const tracoD = useTraco(atraso + 0.15, dur);
  const m = largura / 2;
  return (
    <svg width={largura} height={20} viewBox={`0 0 ${largura} 20`} style={{ display: "block", overflow: "visible", ...style }} aria-hidden>
      <motion.path d={`M${m - 18} 10H0`} stroke={cor} strokeWidth={1.6} fill="none" {...tracoE} />
      <motion.path d={`M${m + 18} 10H${largura}`} stroke={cor} strokeWidth={1.6} fill="none" {...tracoD} />
      <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: atraso, duration: 0.45, ease: EASE }} style={{ transformOrigin: `${m}px 10px` }}>
        {[[0, -5], [0, 5], [-5, 0], [5, 0]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={m + dx} cy={10 + dy} r={4} fill={cor} />)}
        <circle cx={m} cy={10} r={2.4} fill={C.cinabre} />
      </motion.g>
    </svg>
  );
}

/** Capitular iluminada: quadro de ouro que se desenha, fundo ultramarino e a letra que surge. */
function Capitular({ letra, tam = 180, atraso = 0, cor = C.ouroClaro, style }: { letra: string; tam?: number; atraso?: number; cor?: string; style?: CSSProperties }) {
  const traco = useTraco(atraso, 0.9);
  const t2 = useTraco(atraso + 0.2, 0.9);
  return (
    <span aria-hidden style={{ position: "relative", display: "inline-block", width: tam, height: tam, flexShrink: 0, ...style }}>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: atraso + 0.1, duration: 0.6 }}
        style={{ position: "absolute", inset: 8, background: `linear-gradient(160deg, ${C.ultramar}, ${C.noite2})` }} />
      <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <motion.rect x={2} y={2} width={tam - 4} height={tam - 4} fill="none" stroke={C.ouro} strokeWidth={3} {...traco} />
        <motion.rect x={8} y={8} width={tam - 16} height={tam - 16} fill="none" stroke={C.ouroClaro} strokeWidth={1} {...t2} />
      </svg>
      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: atraso + 0.45, duration: 0.7, ease: EASE }}
        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TITULO, fontWeight: 700, fontSize: tam * 0.78, lineHeight: 1, color: cor, paddingTop: tam * 0.04 }}>
        {letra}
      </motion.span>
    </span>
  );
}

function Contador({ ate, prefixo = "", sufixo = "", atraso = 0.4, dur = 1.4 }: { ate: number; prefixo?: string; sufixo?: string; atraso?: number; dur?: number }) {
  const reduz = useReduz();
  const [v, setV] = useState(reduz ? ate : 0);
  useEffect(() => {
    if (reduz) return setV(ate);
    const c = animate(0, ate, { duration: dur, delay: atraso, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [ate, atraso, dur, reduz]);
  return <span style={NUMEROS}>{prefixo}{v}{sufixo}</span>;
}

/**
 * Moldura com topo em arco ogival que se desenha e depois "abre" o conteúdo do centro para as
 * bordas, como as portas de um retábulo. Tamanho fixo em px, então o arco nunca é esticado.
 */
function Arco({ largura, alturaArco = 96, atraso = 0.2, tema = "noite", rotulo, children, corpo }: {
  largura: number; alturaArco?: number; atraso?: number; tema?: Tema; rotulo?: string; children: ReactNode; corpo?: CSSProperties;
}) {
  const reduz = useReduz();
  const L = largura, A = alturaArco, m = 1.5;
  const noite = tema === "noite";
  const traco = noite ? C.ouro : C.ouroEscuro;
  const arco = (i: number) => `M${m + i} ${A} C${m + i} ${A * 0.42 + i * 0.3} ${L * 0.28} ${A * 0.14 + i * 0.5} ${L / 2} ${m + i * 1.15} C${L * 0.72} ${A * 0.14 + i * 0.5} ${L - m - i} ${A * 0.42 + i * 0.3} ${L - m - i} ${A}`;
  const fora = useTraco(atraso, 0.9);
  const dentro = useTraco(atraso + 0.25, 0.9);
  const abre = reduz
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: atraso + 0.3, duration: 0.5 } }
    : { initial: { clipPath: "inset(0% 50% 0% 50%)" }, animate: { clipPath: "inset(0% 0% 0% 0%)" }, transition: { delay: atraso + 0.55, duration: 0.95, ease: EASE } };
  return (
    <div style={{ width: L, position: "relative", filter: noite ? "drop-shadow(0 36px 60px rgba(0,0,0,.45))" : "drop-shadow(0 18px 30px rgba(43,33,22,.12))" }}>
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ display: "block", overflow: "visible" }} aria-hidden>
        <motion.path d={arco(0) + "Z"} fill={noite ? C.noite2 : C.marfim} stroke="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: atraso + 0.2, duration: 0.6 }} />
        <motion.path d={arco(0)} fill="none" stroke={traco} strokeWidth={3} {...fora} />
        <motion.path d={arco(11)} fill="none" stroke={noite ? C.ouroClaro : C.ouro} strokeWidth={1} {...dentro} />
        {rotulo && (
          <motion.text x={L / 2} y={A * 0.78} textAnchor="middle" fontSize={17} letterSpacing={4} fill={noite ? C.ouroClaro : C.ouroEscuro} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: atraso + 0.9, duration: 0.6 }}
            style={{ textTransform: "uppercase", fontWeight: 600 }}>
            {rotulo}
          </motion.text>
        )}
      </svg>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: atraso, duration: 0.3 }}
        style={{ borderLeft: `3px solid ${traco}`, borderRight: `3px solid ${traco}`, borderBottom: `3px solid ${traco}`, background: noite ? C.marfim : C.marfim, ...corpo }}>
        <motion.div {...abre} style={{ position: "relative" }}>{children}</motion.div>
      </motion.div>
    </div>
  );
}

// ---------- tela real com zoom ----------
// O print fica dentro do arco, no lugar de sempre, e vai se aprofundando dentro do próprio quadro:
// cada → (ou o passador) aproxima o próximo ponto falado; depois da última parada, → passa o slide.
// ↑ volta uma parada. Nada avança sozinho: o ritmo é o da fala.

type Focos = Record<string, { tam: number[]; focos: Record<string, Foco> }>;
const TELAS = FOCOS as Focos;

/** Controle que a Apresentacao usa para avançar/voltar o zoom do slide atual pelo teclado. */
export type ControleCamera = { avancar: () => boolean; voltar: () => boolean };
export const CameraCtx = createContext<RefObject<ControleCamera | null> | null>(null);

/** Ponto a aproximar (nome em focos.json); `tela` troca a imagem nessa parada. */
type Parada = { foco: string; tela?: string };

const ZOOM_MAX = 3; // as capturas são 2×: até 3× ainda fica nítido no projetor

function Tela({ tela, alt, paradas = [], largura = 1150, atraso = 0.2, alturaArco, rotulo = "agrosentinela · tela real do sistema" }: {
  tela: string; alt: string; paradas?: Parada[]; largura?: number; atraso?: number; alturaArco?: number; rotulo?: string;
}) {
  const reduz = useReduz();
  const controle = useContext(CameraCtx);
  const n = paradas.length;
  const [fase, setFase] = useState(-1); // -1: print inteiro · 0..n-1: paradas
  const faseRef = useRef(fase);
  useEffect(() => { faseRef.current = fase; }, [fase]);
  const [chegouEm, setChegouEm] = useState(-2); // parada em que o zoom já pousou (o filete só aparece aí)

  useEffect(() => {
    if (!controle || n === 0) return;
    const meu: ControleCamera = {
      avancar: () => (faseRef.current < n - 1 ? (setFase(++faseRef.current), true) : false),
      voltar: () => (faseRef.current > -1 ? (setFase(--faseRef.current), true) : false),
    };
    controle.current = meu;
    return () => { if (controle.current === meu) controle.current = null; };
  }, [controle, n]);

  const tam = TELAS[tela].tam;
  const W = largura - 6, H = (W * tam[1]) / tam[0]; // quadro dentro das bordas do arco
  const base = W / tam[0];
  const parada = fase >= 0 ? paradas[fase] : null;
  const atual = parada?.tela ?? (fase >= 0 ? [...paradas.slice(0, fase + 1)].reverse().find((p) => p.tela)?.tela : undefined) ?? tela;
  const foco = parada ? TELAS[atual].focos[parada.foco] : null;

  // Zoom que enquadra o foco no quadro, sem deixar a imagem sair da moldura.
  let s = base, x = 0, y = 0;
  if (foco) {
    s = base * Math.min((0.97 * tam[0]) / foco.w, (0.88 * tam[1]) / foco.h, ZOOM_MAX);
    const limita = (v: number, total: number, janela: number) => Math.min(0, Math.max(janela - total * s, v));
    x = limita(W / 2 - (foco.x + foco.w / 2) * s, tam[0], W);
    y = limita(H / 2 - (foco.y + foco.h / 2) * s, tam[1], H);
  }
  const r = foco && { x: foco.x * s + x, y: foco.y * s + y, w: foco.w * s, h: foco.h * s };
  const traco = useTraco(0.05, 0.7);
  const telas = [tela, ...paradas.map((p) => p.tela).filter((t): t is string => !!t && t !== tela)];

  return (
    <div style={{ position: "relative" }}>
      <Arco largura={largura} atraso={atraso} alturaArco={alturaArco} rotulo={rotulo}>
        <div style={{ position: "relative", overflow: "hidden", width: W, height: H }}>
          <motion.div
            initial={false}
            animate={{ x, y, scale: s }}
            transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => setChegouEm(faseRef.current)}
            style={{ position: "absolute", left: 0, top: 0, width: tam[0], height: tam[1], transformOrigin: "0 0" }}
          >
            {telas.map((t, k) => (
              <motion.img key={t} src={`/pitch/${t}.png`} alt={t === atual ? alt : ""} draggable={false} initial={false} animate={{ opacity: t === atual ? 1 : 0 }} transition={{ duration: k === 0 ? 0 : 0.5 }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
            ))}
          </motion.div>
          <AnimatePresence>
            {r && (chegouEm === fase || reduz) && (
              <motion.svg key={fase} width={W} height={H} viewBox={`0 0 ${W} ${H}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.35 }}
                style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} aria-hidden>
                <path d={`M0 0H${W}V${H}H0Z M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}Z`} fillRule="evenodd" fill="rgba(14,21,40,.38)" />
                <motion.rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} fill="none" stroke={C.ouro} strokeWidth={4} {...traco} />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>
      </Arco>
      {/* Paradas do zoom, discretas, para o apresentador saber quantos → faltam */}
      {n > 0 && (
        <div aria-hidden style={{ position: "absolute", right: 6, bottom: -30, display: "flex", gap: 10 }}>
          {paradas.map((p, k) => <Losango key={p.foco + k} cor={k <= fase ? C.ouro : "rgba(212,175,90,.3)"} tam={10} />)}
        </div>
      )}
    </div>
  );
}

function Rodape({ tema = "noite" }: { tema?: Tema }) {
  return (
    <p style={{ position: "absolute", left: 128, bottom: 60, fontSize: 22, color: tema === "noite" ? C.nevoa : C.tintaSuave, margin: 0 }}>
      Tela real do sistema · base simulada da demonstração, identificada no app
    </p>
  );
}

/** Slide de "momento da demo": número grande à esquerda, tela real à direita. */
function Momento({ n, numero, legenda, tela, alt, paradas, tamanho = 170 }: {
  n: number; numero: ReactNode; legenda: ReactNode; tela: string; alt: string; paradas: Parada[]; tamanho?: number;
}) {
  return (
    <Base>
      <div style={{ position: "absolute", left: 128, top: 128, width: 470, display: "flex", flexDirection: "column", gap: 26 }}>
        <Entra><Rotulo>Demo · momento {n} de 4</Rotulo></Entra>
        <Entra atraso={0.15}>
          <div style={{ fontFamily: TITULO, fontSize: tamanho, fontWeight: 700, lineHeight: 1, color: C.ouro, whiteSpace: "nowrap", ...NUMEROS }}>{numero}</div>
        </Entra>
        <Filete largura={300} atraso={0.45} />
        <Entra atraso={0.6}><p style={{ fontSize: 34, lineHeight: 1.4, color: C.marfim, margin: 0 }}>{legenda}</p></Entra>
      </div>
      <div style={{ position: "absolute", right: 128, top: 140 }}>
        <Tela tela={tela} alt={alt} paradas={paradas} />
      </div>
      <Rodape />
    </Base>
  );
}

function Icone({ tipo, cor = C.ouro, tam = 56 }: { tipo: "gota" | "relogio" | "duplo" | "check" | "broto" | "seta"; cor?: string; tam?: number }) {
  const p = { fill: "none", stroke: cor, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden>
      {tipo === "gota" && <path {...p} d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />}
      {tipo === "relogio" && <><circle {...p} cx="12" cy="12" r="9" /><path {...p} d="M12 7v5l3 2" /></>}
      {tipo === "duplo" && <><rect {...p} x="3" y="5" width="12" height="12" rx="2" /><rect {...p} x="9" y="9" width="12" height="12" rx="2" /></>}
      {tipo === "check" && <path {...p} d="M5 12.5l4.5 4.5L19 7.5" />}
      {tipo === "broto" && <><path {...p} d="M12 21v-9" /><path {...p} d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7z" /><path {...p} d="M12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5z" /></>}
      {tipo === "seta" && <path {...p} d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  );
}

/** Medalhão: círculo com aro de ouro que se desenha. */
function Medalhao({ tam = 96, atraso = 0, fundo = C.noite, aro = C.ouro, children }: { tam?: number; atraso?: number; fundo?: string; aro?: string; children: ReactNode }) {
  const traco = useTraco(atraso, 0.7);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: atraso, duration: 0.5, ease: EASE }}
      style={{ position: "relative", width: tam, height: tam, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 5, borderRadius: "50%", background: fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
        <motion.circle cx={tam / 2} cy={tam / 2} r={tam / 2 - 2} fill="none" stroke={aro} strokeWidth={2.5} {...traco} />
      </svg>
    </motion.div>
  );
}

/** Emblema da capa: arco ogival em ultramarino com filete de ouro, estrela e broto que cresce. */
function Emblema() {
  const reduz = useReduz();
  const arco = useTraco(0.5, 1.3);
  const interno = useTraco(0.8, 1.2);
  const caule = useTraco(1.6, 0.8);
  const chao = useTraco(1.4, 0.8);
  return (
    <svg width={380} height={470} viewBox="0 0 36 44" aria-hidden style={{ overflow: "visible", filter: "drop-shadow(0 30px 50px rgba(0,0,0,.5))" }}>
      <motion.path d="M2 43V20C2 10 10 3 18 1c8 2 16 9 16 19v23Z" fill={C.ultramar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }} />
      <motion.path d="M2 43V20C2 10 10 3 18 1c8 2 16 9 16 19v23Z" fill="none" stroke={C.ouro} strokeWidth={0.7} {...arco} />
      <motion.path d="M5.5 40V20.5C5.5 12.5 11.5 6.8 18 5c6.5 1.8 12.5 7.5 12.5 15.5V40Z" fill="none" stroke={C.ouroClaro} strokeWidth={0.3} {...interno} />
      <motion.path d="m18 9.2 1 2.2 2.3.2-1.8 1.5.6 2.3-2.1-1.3-2.1 1.3.6-2.3-1.8-1.5 2.3-.2Z" fill={C.ouroClaro}
        initial={{ opacity: 0, scale: reduz ? 1 : 0.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, duration: 0.6, ease: EASE }} style={{ transformOrigin: "18px 12.5px" }} />
      <motion.path d="M8 38h20" stroke={C.ouroClaro} strokeWidth={0.5} fill="none" {...chao} />
      <motion.path d="M18 38V24" stroke={C.verdeClaro} strokeWidth={1.4} strokeLinecap="round" fill="none" {...caule} />
      <motion.path d="M18 30c-5 0-7.5-3-7.5-6.5 4.5 0 7.5 2.5 7.5 6.5Z" fill={C.verdeClaro} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.1, duration: 0.6, ease: EASE }} style={{ transformOrigin: "18px 30px" }} />
      <motion.path d="M18 27.5c4.5 0 7-2.8 7-6-4 0-7 2.3-7 6Z" fill={C.verdeClaro} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.3, duration: 0.6, ease: EASE }} style={{ transformOrigin: "18px 27.5px" }} />
    </svg>
  );
}

/** Palavra que entra (usada nos títulos grandes). */
function Palavras({ texto, base, passo = 0.11 }: { texto: string; base: number; passo?: number }) {
  return (
    <>
      {texto.split(" ").map((p, k) => (
        <motion.span key={k} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: base + k * passo, duration: 0.55, ease: EASE }} style={{ display: "inline-block", marginRight: "0.25em" }}>{p}</motion.span>
      ))}
    </>
  );
}

// ---------- slides ----------

function Capa() {
  const resto = "groSentinela".split("");
  return (
    <Base>
      <div style={{ position: "absolute", left: 1370, top: 210 }}>
        <Emblema />
      </div>
      <Entra><Rotulo>AGROHACK 2026/2 · Equipe 3 Hacketeers</Rotulo></Entra>
      <h1 aria-label="AgroSentinela" style={{ display: "flex", alignItems: "flex-end", gap: 6, fontFamily: TITULO, fontSize: 168, fontWeight: 600, lineHeight: 1, color: C.marfim, margin: "48px 0 0" }}>
        <Capitular letra="A" tam={184} atraso={0.15} />
        <span aria-hidden style={{ paddingBottom: 10 }}>
          {resto.map((l, k) => (
            <motion.span key={k} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + k * 0.04, duration: 0.6, ease: EASE }} style={{ display: "inline-block" }}>{l}</motion.span>
          ))}
        </span>
      </h1>
      <Filete largura={1150} atraso={1.1} style={{ marginTop: 34 }} />
      <Entra atraso={1.35}><p style={{ fontFamily: TITULO, fontSize: 62, fontWeight: 500, color: C.ouroClaro, margin: "26px 0 0" }}>O agrônomo de bolso do estoque.</p></Entra>
      <Entra atraso={1.7}><p style={{ fontSize: 36, lineHeight: 1.45, color: C.nevoa, width: 1050, margin: "22px 0 0" }}>Lê a planilha que a fazenda já tem e diz <b style={{ color: C.marfim }}>o que fazer hoje</b>, <b style={{ color: C.marfim }}>por quê</b> e <b style={{ color: C.marfim }}>quanto dá para confiar</b>.</p></Entra>
      <p style={{ position: "absolute", left: 128, bottom: 70, fontSize: 24, color: C.nevoa, margin: 0 }}>IFRO Campus Ariquemes · SNCT · 29/10/2026</p>
    </Base>
  );
}

function Dor() {
  const cards: [Parameters<typeof Icone>[0]["tipo"], string, string][] = [
    ["gota", "Diesel acaba no plantio", "Máquina parada no meio da janela de plantio."],
    ["relogio", "Inoculante vence no galpão", "Ninguém viu a data. O dinheiro vira lixo."],
    ["duplo", "Adubo com dois nomes", "“KCl” e “Cloreto de potássio”: a fazenda compra de novo o que já tinha."],
  ];
  return (
    <Base tema="pergaminho">
      <Entra><Rotulo tema="pergaminho">O problema</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 24 }}><Titulo cor={C.tinta} tamanho={80}>O Seu João sabe quanto tem.<br /><span style={{ color: C.cinabre }}>Não sabe o que vai dar problema.</span></Titulo></Entra>
      <div style={{ display: "flex", gap: 40, marginTop: 60 }}>
        {cards.map(([ic, t, d], k) => (
          <Entra key={t} atraso={0.7 + k * 0.45} y={40}>
            <Arco largura={528} alturaArco={64} atraso={0.7 + k * 0.45} tema="pergaminho" corpo={{ minHeight: 360 }}>
              <div style={{ padding: "8px 40px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
                <Medalhao tam={92} atraso={1.1 + k * 0.45}><Icone tipo={ic} tam={48} /></Medalhao>
                <h3 style={{ fontFamily: TITULO, fontSize: 46, fontWeight: 600, color: C.tinta, margin: 0, lineHeight: 1.12 }}>{t}</h3>
                <p style={{ fontSize: 30, lineHeight: 1.4, color: C.tintaSuave, margin: 0 }}>{d}</p>
              </div>
            </Arco>
          </Entra>
        ))}
      </div>
    </Base>
  );
}

function Frase() {
  return (
    <Base tema="pergaminho">
      <div style={{ position: "absolute", left: 128, right: 128, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <Capitular letra="N" tam={132} atraso={0.1} cor={C.ouroClaro} style={{ marginBottom: 14 }} />
          <p aria-label="Não é falta de dado." style={{ fontFamily: TITULO, fontSize: 104, fontWeight: 500, color: C.tintaSuave, margin: 0, lineHeight: 1.1 }}>
            <span aria-hidden><Palavras texto="ão é falta de dado." base={0.5} /></span>
          </p>
        </div>
        <p style={{ fontFamily: TITULO, fontSize: 104, fontWeight: 700, color: C.tinta, margin: 0, lineHeight: 1.1 }}><Palavras texto="É falta de alguém olhando os dados por ele." base={1.2} /></p>
        <Filete largura={1664} atraso={2.3} cor={C.ouroEscuro} />
        <Entra atraso={2.7}><p style={{ fontSize: 34, color: C.tinta, margin: 0 }}>A planilha guarda o passado. Ninguém tem tempo de ler o futuro nela.</p></Entra>
      </div>
    </Base>
  );
}

function Ideia() {
  const pilares: [string, string][] = [
    ["O quê", "Óleo diesel S10 em estoque crítico."],
    ["Por quê", "No consumo dos últimos 30 dias (220 L/dia), o saldo dura cerca de 9 dias."],
    ["Quanto confiar", "Alta: 15 retiradas na janela e 376 dias de histórico. A conta fica à vista."],
  ];
  return (
    <Base>
      <Entra><Rotulo>A ideia</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo tamanho={88}>O agrônomo de bolso do estoque</Titulo></Entra>
      <Entra atraso={0.35}><p style={{ fontSize: 34, lineHeight: 1.4, color: C.nevoa, margin: "20px 0 0", width: 940 }}>Ele lê os registros que a fazenda já tem e entrega <b style={{ color: C.marfim }}>uma lista do que fazer hoje</b>, em ordem de prioridade. Cada alerta responde três perguntas:</p></Entra>
      <div style={{ position: "absolute", left: 128, top: 500, width: 900, display: "flex", flexDirection: "column", gap: 24 }}>
        {pilares.map(([t, d], k) => (
          <motion.div key={t} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 + k * 0.5, duration: 0.6, ease: EASE }}
            style={{ display: "flex", gap: 26, alignItems: "center", background: "rgba(26,38,80,.85)", padding: "20px 28px", borderLeft: `5px solid ${C.ouro}`, boxShadow: "inset 0 0 0 1px rgba(212,175,90,.25)" }}>
            <div style={{ fontFamily: TITULO, fontSize: 62, fontWeight: 700, color: C.cinabreClaro, lineHeight: 1, minWidth: 40, ...NUMEROS }}>{k + 1}</div>
            <div>
              <div style={{ fontFamily: TITULO, fontSize: 40, color: C.marfim, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 26, color: C.nevoa, lineHeight: 1.4, marginTop: 4 }}>{d}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 1152, top: 400 }}>
        <Tela tela="alerta-diesel-metodo" alt="Alerta real do sistema: Óleo diesel S10, estoque crítico, com critério e confiança"
          largura={640} alturaArco={74} atraso={0.6} rotulo="" paradas={[{ foco: "alerta" }, { foco: "fazer" }, { foco: "confianca" }]} />
      </div>
    </Base>
  );
}

function Painel() {
  const niveis: [string, string, string][] = [["Crítico", C.cinabreClaro, "agir hoje"], ["Atenção", C.ocreClaro, "agir nesta semana"], ["Monitorar", C.azulClaro, "acompanhar"]];
  return (
    <Base>
      <div style={{ position: "absolute", left: 128, top: 128, width: 470, display: "flex", flexDirection: "column", gap: 26 }}>
        <Entra><Rotulo>O produto</Rotulo></Entra>
        <Entra atraso={0.15}><Titulo tamanho={76}>Painel do dia</Titulo></Entra>
        <Filete largura={300} atraso={0.35} />
        <Entra atraso={0.5}><p style={{ fontSize: 32, lineHeight: 1.45, color: C.nevoa, margin: 0 }}>Não é mais um cadastro com gráfico bonito. É <b style={{ color: C.marfim }}>apoio à decisão</b>: do mais urgente ao menos urgente, com o que fazer e quanto custa.</p></Entra>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {niveis.map(([n, cor, d], k) => (
            <Entra key={n} atraso={0.9 + k * 0.25} y={14}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.marfim }}>
                <Losango cor={cor} tam={16} /><b style={{ color: cor }}>{n}</b><span style={{ color: C.nevoa }}>· {d}</span>
              </div>
            </Entra>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 128, top: 140 }}>
        <Tela tela="painel" alt="Painel do dia real do sistema" paradas={[{ foco: "resumo" }, { foco: "indicadores" }]} />
      </div>
      <Rodape />
    </Base>
  );
}

const Momento1 = () => (
  <Momento n={1} numero={<><Contador ate={9} /> dias</>} tela="diesel" alt="Ficha do óleo diesel S10"
    legenda={<>é quanto o diesel dura no ritmo atual. O prazo de compra é de 15 dias: <b style={{ color: C.ouroClaro }}>já passou da hora de comprar.</b></>}
    paradas={[{ foco: "saldo" }, { foco: "duraAte" }]} />
);

const Momento2 = () => (
  <Momento n={2} numero={<><Contador ate={87} prefixo="+" sufixo="%" /></>} tela="diesel-graficos" alt="Gráfico de consumo semanal do diesel subindo"
    legenda={<>de consumo de diesel em 4 meses. <b style={{ color: C.ouroClaro }}>Quem olhasse a média do ano acharia que está tudo bem.</b></>}
    paradas={[{ foco: "consumo" }]} />
);

const Momento3 = () => (
  <Momento n={3} numero="1 clique" tamanho={130} tela="cadastros" alt="Sugestão de cadastro duplicado KCl"
    legenda={<>“KCl” e “Cloreto de potássio” eram o mesmo adubo. Unificou, a análise foi refeita e <b style={{ color: C.ouroClaro }}>o alarme falso sumiu sozinho.</b></>}
    paradas={[{ foco: "kcl" }, { foco: "aviso", tela: "cadastros-unificado" }]} />
);

const Momento4 = () => (
  <Momento n={4} numero={<><Contador ate={170} dur={1.2} /> L</>} tela="registrar-novo" alt="Aviso de novo alerta de atenção após registrar retirada"
    legenda={<>de glifosato retirados de uma vez. Salvou, o sistema refez tudo e <b style={{ color: C.ouroClaro }}>avisou na hora: Novo · Atenção · Vai faltar em breve.</b></>}
    paradas={[{ foco: "aviso" }]} />
);

function Perguntas() {
  const linhas: [string, string][] = [
    ["O que está acabando e precisa ser comprado?", "Estoque crítico + Vai faltar em breve"],
    ["Quais produtos podem vencer antes do uso?", "Vencimento por lote, quem vence primeiro sai primeiro"],
    ["Quanto está sendo consumido de cada produto?", "Consumo semanal na ficha do produto"],
    ["Existem consumos fora do padrão?", "Retirada fora do padrão + Consumo em alta"],
    ["Por quanto tempo o estoque dura?", "Cobertura em dias, com projeção"],
    ["Quais produtos têm mais dinheiro parado?", "Curva ABC + Dinheiro parado"],
    ["Quais itens merecem atenção imediata?", "Painel do dia, com prioridade"],
  ];
  return (
    <Base tema="pergaminho">
      <Entra><Rotulo tema="pergaminho">Aderência ao desafio</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo cor={C.tinta} tamanho={72}>As 7 perguntas do desafio, respondidas</Titulo></Entra>
      <Filete largura={1664} atraso={0.35} cor={C.ouroEscuro} style={{ marginTop: 22 }} />
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
        {linhas.map(([q, r], k) => (
          <Linha key={q} q={q} r={r} atraso={0.6 + k * 0.24} />
        ))}
      </div>
    </Base>
  );
}

function Linha({ q, r, atraso }: { q: string; r: string; atraso: number }) {
  const traco = useTraco(atraso + 0.3, 0.45);
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: atraso, duration: 0.5, ease: EASE }}
      style={{ display: "flex", alignItems: "center", gap: 24, background: C.marfim, border: `1px solid ${C.borda}`, borderLeft: `4px solid ${C.ouro}`, padding: "12px 24px" }}>
      <Medalhao tam={54} atraso={atraso + 0.05} fundo={C.verde} aro={C.ouroEscuro}>
        <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.marfim} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" {...traco} />
        </svg>
      </Medalhao>
      <div style={{ flex: 1, fontSize: 29, color: C.tinta, fontWeight: 500 }}>{q}</div>
      <div style={{ width: 690, fontSize: 26, color: C.verde, fontWeight: 700 }}>{r}</div>
    </motion.div>
  );
}

function Confianca() {
  const passos = ["Plantamos problemas e um gabarito", "Rodamos o motor", "Medimos acertos e alarmes falsos", "Ajustamos a regra"];
  const R = 250;
  const centro = R + 80;
  const roda = useTraco(0.7, 2.2);
  return (
    <Base>
      <Entra><Rotulo>Por que confiar</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo tamanho={76}>Método, não chute</Titulo></Entra>
      <div style={{ position: "absolute", left: 128, top: 350, width: 790 }}>
        <div style={{ fontFamily: TITULO, fontSize: 230, fontWeight: 700, color: C.ouro, lineHeight: 1, ...NUMEROS }}><Contador ate={17} atraso={0.5} />/17</div>
        <Entra atraso={0.9}><p style={{ fontSize: 34, color: C.marfim, lineHeight: 1.4, margin: "16px 0 0" }}>problemas escondidos de propósito numa base de teste. <b>O sistema encontrou todos</b>, e repetimos em 10 bases diferentes para não “decorar” uma só.</p></Entra>
        <Entra atraso={1.5}><p style={{ fontSize: 26, color: C.nevoa, lineHeight: 1.45, margin: "28px 0 0", borderLeft: `4px solid ${C.ouro}`, paddingLeft: 20 }}>Honestidade: fomos nós que criamos essa base. Ela prova que cada regra faz o que diz; a prova no mundo real vem da base oficial e da validação com quem é do campo.</p></Entra>
      </div>
      {/* Loop de avaliação: o círculo se desenha uma vez e para */}
      <div style={{ position: "absolute", left: 1060, top: 300, width: 2 * centro, height: 2 * centro }}>
        <svg width={2 * centro} height={2 * centro} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={centro} cy={centro} r={R} fill="none" stroke="rgba(212,175,90,.18)" strokeWidth={14} />
          <motion.circle cx={centro} cy={centro} r={R} fill="none" stroke={C.ouro} strokeWidth={3} {...roda} />
        </svg>
        <Entra atraso={0.6} y={0} style={{ position: "absolute", left: centro - 120, top: centro - 60, width: 240, textAlign: "center", fontFamily: TITULO, fontSize: 46, fontWeight: 600, color: C.ouroClaro, lineHeight: 1.05 }}>Loop de<br />avaliação</Entra>
        {passos.map((p, k) => {
          const ang = (-90 + k * 90) * (Math.PI / 180);
          const x = centro + R * Math.cos(ang);
          const y = centro + R * Math.sin(ang);
          return (
            <motion.div key={p} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + k * 0.5, duration: 0.5, ease: EASE }}
              style={{ position: "absolute", left: x - 135, top: y - 52, width: 270, minHeight: 104, background: C.noite2, border: `2px solid ${C.ouro}`, padding: "14px 16px", fontSize: 25, color: C.marfim, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, boxShadow: "0 12px 30px rgba(0,0,0,.35)" }}>
              {p}
            </motion.div>
          );
        })}
      </div>
    </Base>
  );
}

function Motor() {
  const etapas: [string, string][] = [
    ["Planilha", "CSV ou Excel que a fazenda já tem"],
    ["Normalização", "vazio ≠ zero, kg ≠ litro"],
    ["Grafo de cadastros", "KCl = Cloreto de potássio"],
    ["Saldos por lote", "vence primeiro, sai primeiro"],
    ["10 detectores", "rodam em paralelo"],
    ["Prioridade", "nível + urgência + R$ + confiança"],
  ];
  const detectores = ["Estoque crítico", "Vai faltar em breve", "Consumo em alta", "Retirada fora do padrão", "Vencimento por lote", "Excesso", "Variação de preço", "Dinheiro parado", "Cadastro duplicado", "Qualidade dos dados"];
  const larg = 240;
  const passo = (1664 - larg) / 5;
  const linha = useTraco(0.5, 2.2);
  return (
    <Base tema="pergaminho">
      <Entra><Rotulo tema="pergaminho">Como funciona</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo cor={C.tinta} tamanho={72}>Um grafo de etapas, do dado bruto à decisão</Titulo></Entra>
      <svg width={1664} height={20} style={{ position: "absolute", left: 128, top: 470 }} aria-hidden>
        <motion.line x1={larg / 2} y1={10} x2={1664 - larg / 2} y2={10} stroke={C.ouroEscuro} strokeWidth={3} {...linha} />
      </svg>
      {etapas.map(([t, d], k) => {
        const destaque = k === 4;
        return (
          <motion.div key={t} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + k * 0.38, duration: 0.5, ease: EASE }}
            style={{ position: "absolute", left: 128 + k * passo, top: 360, width: larg, minHeight: 230, background: destaque ? C.noite : C.marfim, border: `2px solid ${destaque ? C.ouro : C.ouroEscuro}`, boxShadow: destaque ? "0 18px 40px rgba(14,21,40,.35)" : "0 8px 20px rgba(43,33,22,.08)", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: TITULO, fontSize: 34, fontWeight: 700, color: destaque ? C.cinabreClaro : C.cinabre, lineHeight: 1, ...NUMEROS }}>{k + 1}</div>
            <div style={{ fontFamily: TITULO, fontSize: 36, fontWeight: 600, color: destaque ? C.marfim : C.tinta, lineHeight: 1.08 }}>{t}</div>
            <div style={{ fontSize: 24, color: destaque ? C.nevoa : C.tintaSuave, lineHeight: 1.35 }}>{d}</div>
          </motion.div>
        );
      })}
      <div style={{ position: "absolute", left: 128, top: 660, width: 1664, display: "flex", flexWrap: "wrap", gap: 14 }}>
        {detectores.map((d, k) => (
          <motion.span key={d} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 + k * 0.09, duration: 0.4, ease: EASE }}
            style={{ fontSize: 26, padding: "10px 20px", borderRadius: 999, background: C.noite, color: C.marfim, border: `1px solid ${C.ouro}` }}>{d}</motion.span>
        ))}
      </div>
      <Entra atraso={3.8} style={{ position: "absolute", left: 128, top: 850, width: 1664 }}>
        <p style={{ fontSize: 28, color: C.tintaSuave, margin: 0 }}><b style={{ color: C.tinta }}>Graph Engineering:</b> o motor é um grafo; nomes parecidos viram um só produto. Sem caixa-preta: cada alerta tem a regra escrita.</p>
      </Entra>
    </Base>
  );
}

function Visao() {
  const passos: [string, string][] = [
    ["Lista de compras", "pronta para mandar pelo WhatsApp ao fornecedor"],
    ["“Use primeiro”", "quais lotes usar antes para nada vencer"],
    ["Calendário de safra", "estoque de safra ≠ estoque encalhado"],
    ["Funciona offline", "fazenda nem sempre tem internet"],
    ["Cooperativas", "várias fazendas num painel só"],
  ];
  const col = 1664 / 5;
  const linha = useTraco(0.6, 2);
  return (
    <Base>
      <Entra><Rotulo>A visão</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo tamanho={80}>Esta é a primeira versão.<br /><span style={{ color: C.ouroClaro }}>O caminho já está mapeado.</span></Titulo></Entra>
      <svg width={1664} height={10} style={{ position: "absolute", left: 128, top: 545 }} aria-hidden>
        <motion.line x1={col / 2} y1={5} x2={1664 - col / 2} y2={5} stroke={C.ouro} strokeWidth={3} {...linha} />
      </svg>
      {passos.map(([t, d], k) => (
        <div key={t} style={{ position: "absolute", left: 128 + k * col, top: 500, width: col, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 14px" }}>
          <Medalhao tam={100} atraso={0.8 + k * 0.4} fundo={C.noite2}>
            <span style={{ fontFamily: TITULO, fontSize: 52, fontWeight: 700, color: C.ouroClaro, ...NUMEROS }}>{k + 1}</span>
          </Medalhao>
          <Entra atraso={1.0 + k * 0.4} y={18}>
            <div style={{ fontFamily: TITULO, fontSize: 40, fontWeight: 600, color: C.marfim, marginTop: 26, lineHeight: 1.1 }}>{t}</div>
            <div style={{ fontSize: 26, color: C.nevoa, marginTop: 12, lineHeight: 1.4 }}>{d}</div>
          </Entra>
        </div>
      ))}
    </Base>
  );
}

function Negocio() {
  const etapas: [string, string, string][] = [
    ["Produtor", "Grátis", "A porta de entrada: usa a planilha que já tem."],
    ["Cooperativas e revendas", "Assinatura", "Painel de várias fazendas: onde vai faltar e onde está sobrando."],
    ["Por que pagam", "Valor", "Sabem quando oferecer reposição antes de o cliente pedir."],
  ];
  return (
    <Base tema="pergaminho">
      <Entra><Rotulo tema="pergaminho">Como vira negócio</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo cor={C.tinta} tamanho={76}>Grátis para quem planta. Valioso para quem vende.</Titulo></Entra>
      <div style={{ display: "flex", alignItems: "stretch", gap: 20, marginTop: 80 }}>
        {etapas.map(([t, tag, d], k) => {
          const meio = k === 1;
          return (
            <div key={t} style={{ display: "contents" }}>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + k * 0.6, duration: 0.6, ease: EASE }}
                style={{ flex: 1, background: meio ? C.noite : C.marfim, border: `2px solid ${meio ? C.ouro : C.borda}`, borderTop: `6px solid ${meio ? C.ouro : C.ouroEscuro}`, padding: 44, display: "flex", flexDirection: "column", gap: 18, boxShadow: meio ? "0 24px 50px rgba(14,21,40,.35)" : "0 10px 24px rgba(43,33,22,.08)" }}>
                <span style={{ alignSelf: "flex-start", fontSize: 24, fontWeight: 700, padding: "6px 16px", borderRadius: 999, background: meio ? C.ouro : C.noite, color: meio ? C.noite : C.ouroClaro }}>{tag}</span>
                <h3 style={{ fontFamily: TITULO, fontSize: 48, fontWeight: 600, margin: 0, color: meio ? C.marfim : C.tinta, lineHeight: 1.12 }}>{t}</h3>
                <p style={{ fontSize: 30, lineHeight: 1.4, margin: 0, color: meio ? C.nevoa : C.tintaSuave }}>{d}</p>
              </motion.div>
              {k < 2 && (
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 + k * 0.6 }} style={{ display: "flex", alignItems: "center" }}>
                  <Icone tipo="seta" cor={C.ouroEscuro} tam={64} />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </Base>
  );
}

function Fechamento() {
  return (
    <Base>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 128, gap: 26 }}>
        <Entra><p style={{ fontSize: 38, color: C.nevoa, margin: 0 }}>Toda fazenda já tem os dados. Falta alguém olhando por ela todo dia.</p></Entra>
        <h1 aria-label="AgroSentinela" style={{ display: "flex", alignItems: "flex-end", gap: 6, fontFamily: TITULO, fontSize: 160, fontWeight: 600, color: C.marfim, margin: 0, lineHeight: 1 }}>
          <Capitular letra="A" tam={170} atraso={0.4} />
          <motion.span aria-hidden initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8, ease: EASE }} style={{ paddingBottom: 8 }}>groSentinela</motion.span>
        </h1>
        <Filete largura={900} atraso={1.1} />
        <Entra atraso={1.3}><p style={{ fontFamily: TITULO, fontSize: 54, fontWeight: 500, color: C.ouroClaro, margin: 0 }}>O que fazer hoje, por quê e quanto dá para confiar.</p></Entra>
        <Entra atraso={1.7}>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 12, fontSize: 28, color: C.marfim }}>
            <span style={{ padding: "12px 28px", borderRadius: 999, border: `2px solid ${C.ouro}` }}>github.com/ArmandoGT/agrohack2026</span>
          </div>
        </Entra>
        <Entra atraso={2.0}><p style={{ fontSize: 26, color: C.nevoa, margin: "14px 0 0" }}>Equipe 3 Hacketeers · Armando · Pedro · Leandro · ADS IFRO Ariquemes</p></Entra>
        <Entra atraso={2.4}><p style={{ fontFamily: TITULO, fontSize: 64, fontWeight: 600, color: C.marfim, margin: "6px 0 0" }}>Obrigado!</p></Entra>
      </div>
    </Base>
  );
}

// ---------- roteiro ----------

export const SLIDES: { id: string; titulo: string; tempo: string; notas: string; Componente: () => React.JSX.Element }[] = [
  { id: "capa", titulo: "Capa", tempo: "0:00–0:10", Componente: Capa,
    notas: "ARMANDO. Pausa de 2 s olhando para a banca.\n“Bom dia. Somos a equipe 3 Hacketeers, e viemos apresentar a AgroSentinela: o agrônomo de bolso do estoque.”\n[▶] próximo slide" },
  { id: "dor", titulo: "A dor", tempo: "0:10–0:40", Componente: Dor,
    notas: "ARMANDO.\n“Levanta a mão quem já abriu a geladeira e descobriu que o leite tinha acabado depois de passar o café.\nAgora imaginem isso numa fazenda. Não é o leite: é o diesel, no meio do plantio, com a máquina parada e a janela de chuva fechando.\nO Seu João, gerente de uma fazenda aqui de Rondônia, anota tudo. Mas a planilha só diz quanto tem. Ela não avisa que o diesel vai acabar, que o inoculante vai vencer no galpão ou que o mesmo adubo está cadastrado com dois nomes, e a fazenda compra de novo o que já tinha.”\n[▶] próximo slide" },
  { id: "frase", titulo: "A virada", tempo: "0:40–0:50", Componente: Frase,
    notas: "ARMANDO. Deixe a frase aparecer antes de falar. Devagar:\n“Nenhum desses problemas é falta de dado. É falta de alguém olhando os dados por ele.”\n[▶] próximo slide" },
  { id: "ideia", titulo: "A ideia", tempo: "0:50–1:25", Componente: Ideia,
    notas: "ARMANDO. 3 toques no print.\n“A AgroSentinela é esse alguém. Ela lê a mesma planilha de entradas e saídas que a fazenda já usa e devolve uma lista do que fazer hoje, em ordem de prioridade. E cada alerta responde três perguntas. Este aqui é um alerta real do sistema.”\n[▶] zoom no alerta: “O quê: o diesel está em estoque crítico. Por quê: no consumo dos últimos 30 dias, de 220 litros por dia, o saldo dura cerca de 9 dias. O edital deu como exemplo ‘suficiente por aproximadamente 8 dias’, e é exatamente essa a conversa que a gente entrega.”\n[▶] zoom no “O que fazer”: “E ele vai além: diz o que fazer, que é comprar cerca de 8.300 litros.”\n[▶] zoom na confiança: “E diz quanto dá para confiar: confiança alta, porque são 15 retiradas na janela e mais de um ano de histórico. Quando o histórico é curto, ele avisa que a confiança é baixa.”\n[▶] próximo slide" },
  { id: "painel", titulo: "Painel do dia", tempo: "1:25–1:50", Componente: Painel,
    notas: "ARMANDO. 2 toques no print.\n“Como o Seu João usa isso? De manhã, ele abre o Painel do dia, no computador ou no celular.”\n[▶] zoom no resumo: “Primeiro, um resumo em português claro do que importa hoje.”\n[▶] zoom nos indicadores: “Depois, os alertas por nível: Crítico é agir hoje, Atenção é agir nesta semana e Monitorar é acompanhar. Em cinco minutos ele decide o que comprar, o que usar primeiro, qual retirada conferir e qual cadastro corrigir. Não é mais um cadastro com gráfico bonito. É apoio à decisão, que é o que o desafio pediu.”\n[▶] próximo slide. Passe o passador para o LEANDRO." },
  { id: "m1", titulo: "Momento 1 · 9 dias", tempo: "1:50–2:10", Componente: Momento1,
    notas: "LEANDRO. 2 toques no print.\n“Tudo o que vocês vão ver agora são telas reais do sistema funcionando. Usamos uma base simulada, porque a base oficial do desafio não foi divulgada até o prazo de entrega, 27 de outubro. O Pedro já explica como nos preparamos para isso.”\n[▶] zoom no saldo: “Esta é a ficha do diesel: o saldo está abaixo do mínimo.”\n[▶] zoom em “dura até”: “No ritmo atual, ele dura 9 dias. O prazo de compra é de 15 dias. Ou seja: já passou da hora de comprar. Hoje o Seu João só descobriria isso com o tanque vazio.”\n[▶] próximo slide" },
  { id: "m2", titulo: "Momento 2 · +87%", tempo: "2:10–2:30", Componente: Momento2,
    notas: "LEANDRO. 1 toque no print.\n[▶] zoom no gráfico de consumo: “O consumo de diesel subiu 87% em 4 meses. Vejam as barras subindo no fim. Quem olhasse a média do ano acharia que está tudo bem. O sistema compara o consumo recente com o anterior e avisa quando o ritmo muda, antes de virar falta.”\n[▶] próximo slide\n(Se perguntarem sobre IA ou previsão: “Um modelo de previsão aprende o ritmo de cada insumo. Testamos escondendo as últimas 4 semanas: ele erra 6% menos que a média, e por isso só aparece no produto em que venceu. Nenhum alerta depende dele.”)" },
  { id: "m3", titulo: "Momento 3 · 1 clique", tempo: "2:30–2:50", Componente: Momento3,
    notas: "LEANDRO. 2 toques no print.\n[▶] zoom no par KCl: “Aqui o sistema achou que ‘KCl’ e ‘Cloreto de potássio’ são o mesmo adubo, cadastrado com dois nomes. Sozinho, o ‘KCl’ parecia estar acabando.”\n[▶] zoom no aviso “Resolvido” (a tela troca sozinha): “Um clique para unificar, e o sistema refaz a análise e o alarme falso some sozinho. Sem isso, a fazenda compraria um adubo que já tem no galpão.”\n[▶] próximo slide" },
  { id: "m4", titulo: "Momento 4 · 170 L", tempo: "2:50–3:10", Componente: Momento4,
    notas: "LEANDRO. 1 toque no print.\n“E quando entra um registro novo? Alguém tirou 170 litros de glifosato de uma vez.”\n[▶] zoom no aviso: “No momento em que a retirada foi salva, o sistema refez toda a análise e avisou: ‘Novo · Atenção · Vai faltar em breve’. É o tipo de coisa que hoje só se descobre no fim do mês. É isso que o edital chama de atualização dos registros e reanálise.”\n[▶] próximo slide" },
  { id: "perguntas", titulo: "As 7 perguntas", tempo: "3:10–3:25", Componente: Perguntas,
    notas: "LEANDRO. Não leia a lista.\n“O desafio fez 7 perguntas: o que está acabando, o que vai vencer, como varia o consumo, o que está fora do padrão, quanto tempo o estoque dura, onde está o dinheiro parado e o que merece atenção imediata. As 7 têm resposta no sistema, e cada uma está ligada a um alerta com a sua regra escrita.”\n[▶] próximo slide. Passe o passador para o PEDRO." },
  { id: "confianca", titulo: "Por que confiar", tempo: "3:25–4:00", Componente: Confianca,
    notas: "PEDRO.\n“Uma pergunta justa: com que dados testamos?\nA base oficial não foi divulgada até o prazo de entrega, 27 de outubro. O regulamento previu esse caso: dados criados pelas equipes devem ser identificados como simulados, e é o que fizemos. O app mostra ‘SIMULADO’ no topo da tela.\nMas a gente não ficou esperando. Escondemos 17 problemas de propósito numa fazenda simulada, com um gabarito, e o sistema encontrou os 17. Para não ‘decorar’ uma base só, repetimos em 10 fazendas diferentes: encontrou todos, com 98,9% de precisão.\nE com honestidade: fomos nós que criamos essa base. Ela prova que cada regra faz o que promete, não que acerta tudo numa fazenda real. Por isso fomos a campo. Apresentamos a ideia a um produtor da Linha C-45, aqui em Ariquemes, e o que ele valorizou foi previsibilidade, saber antes. É por isso que todo alerta diz quantos dias ainda faltam.”\n[▶] próximo slide" },
  { id: "motor", titulo: "Como funciona", tempo: "4:00–4:15", Componente: Motor,
    notas: "PEDRO.\n“Por dentro, é simples de explicar. O sistema lê a planilha que a fazenda já tem, seja CSV ou Excel, e reconhece as colunas pelo nome. Quando a base oficial existir, ela entra sem mudar uma linha de código.\nEle toma os cuidados que o edital pede: litro nunca é somado com quilo, preço ou validade em branco nunca viram zero, e a incerteza aparece escrita. Depois rodam 10 detectores, e cada alerta tem a regra à vista. Não tem caixa-preta.”\n[▶] próximo slide. Passe o passador para o ARMANDO." },
  { id: "visao", titulo: "A visão", tempo: "4:15–4:35", Componente: Visao,
    notas: "ARMANDO.\n“Esta é a primeira versão, e o caminho já está mapeado: lista de compras pronta para mandar pelo WhatsApp ao fornecedor; ‘use primeiro’, para nenhum lote vencer; calendário de safra, para semente da safrinha não virar ‘excesso’; funcionar offline, porque nem toda fazenda tem sinal; e cooperativas, com várias fazendas num painel só.”\n[▶] próximo slide" },
  { id: "negocio", titulo: "Como vira negócio", tempo: "4:35–4:45", Componente: Negocio,
    notas: "ARMANDO. Se o tempo apertar, pule este slide.\n“É grátis para o produtor, que usa a planilha que já tem. Quem paga são cooperativas e revendas: elas sabem onde vai faltar e oferecem a reposição antes de o cliente pedir.”\n[▶] próximo slide" },
  { id: "fechamento", titulo: "Fechamento", tempo: "4:45–5:00", Componente: Fechamento,
    notas: "ARMANDO.\n“Toda fazenda já tem os dados. O que falta é alguém olhando por ela todo dia.\nA AgroSentinela é o agrônomo de bolso do estoque: lê a planilha que a fazenda já tem e diz o que fazer hoje, por quê e quanto dá para confiar.\nO sistema está no ar, e o código, os testes e o vídeo estão neste GitHub. Somos a equipe 3 Hacketeers. Obrigado!”\nSorria, faça uma pausa e espere as perguntas. Deixe o notebook aberto no app, caso a banca peça para ver." },
];

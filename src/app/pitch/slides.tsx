"use client";

// Slides do pitch (roteiro em docs/pitch.md). Cada slide é um componente de 1920×1080;
// as telas reais ficam em public/pitch/ (capturas do app rodando com a base simulada).

import { animate, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

export const C = {
  dark: "#10241B",
  dark2: "#183528",
  light: "#F5F1E6",
  card: "#FFFDF7",
  amber: "#E8A33D",
  green: "#2E6B47",
  greenLight: "#6FBF8B",
  soft: "#C3D3C7",
  softL: "#4A5A50",
  crit: "#B83A26",
};

const DISPLAY = "var(--font-oswald), 'Arial Narrow', Arial, sans-serif";
const EASE = [0.22, 1, 0.36, 1] as const;

type Foco = { x: number; y: number; w: number; h: number }; // em % da imagem

// ---------- peças ----------

function Base({ fundo, children }: { fundo: string; children: ReactNode }) {
  return <div style={{ position: "absolute", inset: 0, background: fundo, padding: 128, overflow: "hidden" }}>{children}</div>;
}

function Entra({ atraso = 0, y = 30, children, style }: { atraso?: number; y?: number; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: atraso, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}

function Rotulo({ children, cor = C.amber }: { children: ReactNode; cor?: string }) {
  return <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 5, color: cor, textTransform: "uppercase" }}>{children}</div>;
}

function Titulo({ children, cor = C.light, tamanho = 76 }: { children: ReactNode; cor?: string; tamanho?: number }) {
  return <h2 style={{ fontFamily: DISPLAY, fontSize: tamanho, fontWeight: 600, lineHeight: 1.1, color: cor, margin: 0 }}>{children}</h2>;
}

function Contador({ ate, prefixo = "", sufixo = "", atraso = 0.4, dur = 1.4 }: { ate: number; prefixo?: string; sufixo?: string; atraso?: number; dur?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, ate, { duration: dur, delay: atraso, ease: "easeOut", onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [ate, atraso, dur]);
  return <>{prefixo}{v}{sufixo}</>;
}

function Imagem({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}

/** Janela de navegador com uma tela real; aproxima o zoom do ponto de interesse e o destaca. */
function Tela({ etapas, largura = 1150, atraso = 1.1 }: { etapas: { src: string; alt: string; foco?: Foco; zoom?: number; dura?: number }[]; largura?: number; atraso?: number }) {
  const [fase, setFase] = useState(0);
  useEffect(() => {
    if (etapas.length < 2) return;
    const t = setTimeout(() => setFase((f) => Math.min(f + 1, etapas.length - 1)), (etapas[fase].dura ?? 3.2) * 1000);
    return () => clearTimeout(t);
  }, [fase, etapas]);
  const e = etapas[fase];
  const espera = fase === 0 ? atraso : 0.5;
  // Zoom que leva o centro do foco ao centro da janela, sem deixar a imagem sair da moldura.
  const s = e.foco ? Math.min(e.zoom ?? 1.6, 88 / e.foco.w, 88 / e.foco.h) : 1;
  const desloca = (centro: number) => Math.max(100 - 100 * s, Math.min(0, 50 - centro * s));
  const tx = e.foco ? desloca(e.foco.x + e.foco.w / 2) : 0;
  const ty = e.foco ? desloca(e.foco.y + e.foco.h / 2) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 70, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
      style={{ width: largura, borderRadius: 18, overflow: "hidden", background: "#fff", boxShadow: "0 40px 90px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.08)" }}
    >
      <div style={{ height: 40, background: "#E9E5DA", display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
        {["#E0645A", "#E8B53D", "#5DB86A"].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
        <span style={{ marginLeft: 16, fontSize: 16, color: "#6B6F66", background: "#F7F4EC", borderRadius: 6, padding: "3px 14px" }}>agrosentinela · tela real do sistema</span>
      </div>
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16 / 10" }}>
        <motion.div
          key={e.src}
          initial={{ opacity: fase === 0 ? 1 : 0, scale: 1, x: "0%", y: "0%" }}
          animate={{ opacity: 1, scale: s, x: `${tx}%`, y: `${ty}%` }}
          transition={{ opacity: { duration: 0.5 }, default: { delay: espera, duration: 1.4, ease: EASE } }}
          style={{ position: "absolute", inset: 0, transformOrigin: "0% 0%" }}
        >
          <Imagem src={e.src} alt={e.alt} />
          {e.foco && (
            <motion.div
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: espera + 1.1, duration: 0.5, ease: EASE }}
              style={{ position: "absolute", left: `${e.foco.x}%`, top: `${e.foco.y}%`, width: `${e.foco.w}%`, height: `${e.foco.h}%`, border: `3px solid ${C.amber}`, borderRadius: 10, boxShadow: "0 0 0 4000px rgba(16,36,27,.32)" }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/** Slide de "momento da demo": número grande à esquerda, tela real à direita. */
function Momento({ n, numero, legenda, etapas, tamanho = 170 }: { n: number; numero: ReactNode; legenda: ReactNode; etapas: Parameters<typeof Tela>[0]["etapas"]; tamanho?: number }) {
  return (
    <Base fundo={`radial-gradient(circle at 75% 50%, ${C.dark2}, ${C.dark} 70%)`}>
      <div style={{ position: "absolute", left: 128, top: 128, width: 470, display: "flex", flexDirection: "column", gap: 28 }}>
        <Entra><Rotulo>Demo · momento {n} de 4</Rotulo></Entra>
        <Entra atraso={0.15}>
          <div style={{ fontFamily: DISPLAY, fontSize: tamanho, fontWeight: 700, lineHeight: 1, color: C.amber, whiteSpace: "nowrap" }}>{numero}</div>
        </Entra>
        <Entra atraso={0.5}><p style={{ fontSize: 34, lineHeight: 1.4, color: C.light, margin: 0 }}>{legenda}</p></Entra>
      </div>
      <div style={{ position: "absolute", right: 128, top: 150 }}>
        <Tela etapas={etapas} />
      </div>
      <p style={{ position: "absolute", left: 128, bottom: 56, fontSize: 22, color: "rgba(195,211,199,.75)", margin: 0 }}>Tela real do sistema · base simulada da demonstração, identificada no app</p>
    </Base>
  );
}

function Icone({ tipo, cor = C.amber, tam = 56 }: { tipo: "gota" | "relogio" | "duplo" | "check" | "broto" | "seta"; cor?: string; tam?: number }) {
  const p = { fill: "none", stroke: cor, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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

// ---------- slides ----------

function Capa() {
  const nome = "AgroSentinela".split("");
  return (
    <Base fundo={`radial-gradient(circle at 78% 45%, #24503A, ${C.dark} 62%)`}>
      {/* radar: a sentinela vigiando */}
      <div style={{ position: "absolute", left: 1260, top: 230, width: 520, height: 520 }}>
        {[0, 1, 2].map((k) => (
          <motion.div key={k} initial={{ scale: 0.4, opacity: 0.7 }} animate={{ scale: 1.35, opacity: 0 }} transition={{ duration: 3.2, repeat: Infinity, delay: k * 1.05, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${C.greenLight}` }} />
        ))}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 160, damping: 14 }}
          style={{ position: "absolute", left: 160, top: 160, width: 200, height: 200, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 80px ${C.green}` }}>
          <Icone tipo="broto" tam={120} cor={C.amber} />
        </motion.div>
      </div>
      <Entra><Rotulo>AGROHACK 2026/2 · Equipe 3 Hacketeers</Rotulo></Entra>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 176, fontWeight: 700, lineHeight: 1.1, color: C.light, margin: "36px 0 0" }}>
        {nome.map((l, k) => (
          <motion.span key={k} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.045, duration: 0.6, ease: EASE }} style={{ display: "inline-block" }}>{l}</motion.span>
        ))}
      </h1>
      <Entra atraso={1.0}><p style={{ fontFamily: DISPLAY, fontSize: 64, color: C.amber, margin: "18px 0 0" }}>O agrônomo de bolso do estoque.</p></Entra>
      <Entra atraso={1.35}><p style={{ fontSize: 36, lineHeight: 1.45, color: C.soft, width: 1000, margin: "28px 0 0" }}>Lê a planilha que a fazenda já tem e diz <b style={{ color: C.light }}>o que fazer hoje</b>, <b style={{ color: C.light }}>por quê</b> e <b style={{ color: C.light }}>quanto dá para confiar</b>.</p></Entra>
      <p style={{ position: "absolute", left: 128, bottom: 64, fontSize: 24, color: "#8FA697", margin: 0 }}>IFRO Campus Ariquemes · SNCT · 29/10/2026</p>
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
    <Base fundo={C.light}>
      <Entra><Rotulo cor={C.green}>O problema</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 24 }}><Titulo cor={C.dark} tamanho={80}>O Seu João sabe quanto tem.<br /><span style={{ color: C.crit }}>Não sabe o que vai dar problema.</span></Titulo></Entra>
      <div style={{ display: "flex", gap: 40, marginTop: 80 }}>
        {cards.map(([ic, t, d], k) => (
          <motion.div key={t} initial={{ opacity: 0, y: 60, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.7 + k * 0.35, duration: 0.7, ease: EASE }}
            style={{ flex: 1, background: C.card, border: "1px solid #E2DCCB", borderRadius: 24, padding: 44, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 18px 40px rgba(16,36,27,.08)" }}>
            <div style={{ width: 88, height: 88, borderRadius: 20, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}><Icone tipo={ic} /></div>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 46, fontWeight: 600, color: C.dark, margin: 0, lineHeight: 1.15 }}>{t}</h3>
            <p style={{ fontSize: 30, lineHeight: 1.4, color: C.softL, margin: 0 }}>{d}</p>
          </motion.div>
        ))}
      </div>
    </Base>
  );
}

function Frase() {
  const linha = (txt: string, base: number) =>
    txt.split(" ").map((p, k) => (
      <motion.span key={k} initial={{ opacity: 0, y: 40, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: base + k * 0.12, duration: 0.5 }} style={{ display: "inline-block", marginRight: "0.25em" }}>{p}</motion.span>
    ));
  return (
    <Base fundo={C.amber}>
      <div style={{ position: "absolute", left: 128, right: 128, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 36 }}>
        <p style={{ fontFamily: DISPLAY, fontSize: 104, fontWeight: 500, color: "rgba(16,36,27,.6)", margin: 0, lineHeight: 1.1 }}>{linha("Não é falta de dado.", 0.2)}</p>
        <p style={{ fontFamily: DISPLAY, fontSize: 104, fontWeight: 700, color: C.dark, margin: 0, lineHeight: 1.1 }}>{linha("É falta de alguém olhando os dados por ele.", 1.1)}</p>
        <Entra atraso={2.4}><p style={{ fontSize: 34, color: C.dark, margin: 0 }}>A planilha guarda o passado. Ninguém tem tempo de ler o futuro nela.</p></Entra>
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
    <Base fundo={C.dark}>
      <Entra><Rotulo>A ideia</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo tamanho={88}>O agrônomo de bolso do estoque</Titulo></Entra>
      <Entra atraso={0.35}><p style={{ fontSize: 34, color: C.soft, margin: "20px 0 0", width: 1500 }}>Ele lê os registros que a fazenda já tem e entrega <b style={{ color: C.light }}>uma lista do que fazer hoje</b>, em ordem de prioridade. Cada alerta responde três perguntas:</p></Entra>
      <div style={{ position: "absolute", left: 128, top: 470, width: 700, display: "flex", flexDirection: "column", gap: 26 }}>
        {pilares.map(([t, d], k) => (
          <motion.div key={t} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + k * 0.45, duration: 0.6, ease: EASE }}
            style={{ display: "flex", gap: 24, alignItems: "flex-start", background: C.dark2, borderRadius: 18, padding: "24px 28px", borderLeft: `6px solid ${C.amber}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 52, fontWeight: 700, color: C.amber, lineHeight: 1, minWidth: 40 }}>{k + 1}</div>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 38, color: C.light, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 26, color: C.soft, lineHeight: 1.4, marginTop: 6 }}>{d}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 60, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.6, duration: 0.9, ease: EASE }}
        style={{ position: "absolute", left: 900, top: 450, width: 892, borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.5)" }}>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pitch/alerta-diesel-metodo.png" alt="Alerta real do sistema: Óleo diesel S10, estoque crítico, com critério e confiança" style={{ width: "100%", display: "block" }} />
        </motion.div>
      </motion.div>
    </Base>
  );
}

function Painel() {
  return (
    <Base fundo={`radial-gradient(circle at 75% 50%, ${C.dark2}, ${C.dark} 70%)`}>
      <div style={{ position: "absolute", left: 128, top: 128, width: 470, display: "flex", flexDirection: "column", gap: 28 }}>
        <Entra><Rotulo>O produto</Rotulo></Entra>
        <Entra atraso={0.15}><Titulo tamanho={72}>Painel do dia</Titulo></Entra>
        <Entra atraso={0.4}><p style={{ fontSize: 32, lineHeight: 1.45, color: C.soft, margin: 0 }}>Não é mais um cadastro com gráfico bonito. É <b style={{ color: C.light }}>apoio à decisão</b>: do mais urgente ao menos urgente, com o que fazer e quanto custa.</p></Entra>
        <Entra atraso={0.7}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Crítico", C.crit, "agir hoje"], ["Atenção", "#B7791F", "agir nesta semana"], ["Monitorar", "#3B6EA8", "acompanhar"]].map(([n, cor, d]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: C.light }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: cor }} /><b>{n}</b><span style={{ color: C.soft }}>· {d}</span>
              </div>
            ))}
          </div>
        </Entra>
      </div>
      <div style={{ position: "absolute", right: 128, top: 150 }}>
        <Tela etapas={[{ src: "/pitch/painel.png", alt: "Painel do dia real do sistema", foco: { x: 57.6, y: 67.4, w: 34, h: 24.6 }, zoom: 1.75 }]} atraso={1.6} />
      </div>
      <p style={{ position: "absolute", left: 128, bottom: 56, fontSize: 22, color: "rgba(195,211,199,.75)", margin: 0 }}>Tela real do sistema · base simulada da demonstração, identificada no app</p>
    </Base>
  );
}

const Momento1 = () => (
  <Momento n={1} numero={<><Contador ate={9} /> dias</>}
    legenda={<>é quanto o diesel dura no ritmo atual. O prazo de compra é de 15 dias: <b style={{ color: C.amber }}>já passou da hora de comprar.</b></>}
    etapas={[{ src: "/pitch/diesel.png", alt: "Ficha do óleo diesel S10", foco: { x: 57.6, y: 14.2, w: 11.2, h: 10.8 }, zoom: 2.1 }]} />
);

const Momento2 = () => (
  <Momento n={2} numero={<><Contador ate={87} prefixo="+" sufixo="%" /></>}
    legenda={<>de consumo de diesel em 4 meses. <b style={{ color: C.amber }}>Quem olhasse a média do ano acharia que está tudo bem.</b></>}
    etapas={[{ src: "/pitch/diesel-graficos.png", alt: "Gráfico de consumo semanal do diesel subindo", foco: { x: 57.8, y: 20.6, w: 34, h: 36.2 }, zoom: 1.65 }]} />
);

const Momento3 = () => (
  <Momento n={3} numero="1 clique" tamanho={130}
    legenda={<>“KCl” e “Cloreto de potássio” eram o mesmo adubo. Unificou, a análise foi refeita e <b style={{ color: C.amber }}>o alarme falso sumiu sozinho.</b></>}
    etapas={[
      { src: "/pitch/cadastros.png", alt: "Sugestão de cadastro duplicado KCl", foco: { x: 57.8, y: 15.6, w: 34, h: 23 }, zoom: 1.7, dura: 3.6 },
      { src: "/pitch/cadastros-unificado.png", alt: "Aviso de alertas resolvidos após unificar", foco: { x: 73.2, y: 85.8, w: 25.6, h: 12.8 }, zoom: 1.3 },
    ]} />
);

const Momento4 = () => (
  <Momento n={4} numero={<><Contador ate={170} dur={1.2} /> L</>}
    legenda={<>de glifosato retirados de uma vez. Salvou, o sistema refez tudo e <b style={{ color: C.amber }}>avisou na hora: Novo · Atenção · Vai faltar em breve.</b></>}
    etapas={[{ src: "/pitch/registrar-novo.png", alt: "Aviso de novo alerta de atenção após registrar retirada", foco: { x: 72.9, y: 88.2, w: 26, h: 10.4 }, zoom: 1.3 }]} />
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
    <Base fundo={C.light}>
      <Entra><Rotulo cor={C.green}>Aderência ao desafio</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo cor={C.dark} tamanho={72}>As 7 perguntas do desafio, respondidas</Titulo></Entra>
      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 12 }}>
        {linhas.map(([q, r], k) => (
          <motion.div key={q} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + k * 0.22, duration: 0.5, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 24, background: C.card, border: "1px solid #E2DCCB", borderRadius: 14, padding: "14px 24px" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + k * 0.22, type: "spring", stiffness: 300, damping: 15 }}
              style={{ width: 52, height: 52, borderRadius: 26, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icone tipo="check" cor="#fff" tam={32} />
            </motion.div>
            <div style={{ flex: 1, fontSize: 29, color: C.dark, fontWeight: 500 }}>{q}</div>
            <div style={{ width: 690, fontSize: 26, color: C.green, fontWeight: 700 }}>{r}</div>
          </motion.div>
        ))}
      </div>
    </Base>
  );
}

function Confianca() {
  const passos = ["Plantamos problemas e um gabarito", "Rodamos o motor", "Medimos acertos e alarmes falsos", "Ajustamos a regra"];
  const R = 250;
  return (
    <Base fundo={C.dark}>
      <Entra><Rotulo>Por que confiar</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo tamanho={72}>Método, não chute</Titulo></Entra>
      <div style={{ position: "absolute", left: 128, top: 360, width: 760 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 230, fontWeight: 700, color: C.amber, lineHeight: 1 }}><Contador ate={17} atraso={0.5} />/17</div>
        <Entra atraso={0.9}><p style={{ fontSize: 34, color: C.light, lineHeight: 1.4, margin: "16px 0 0" }}>problemas escondidos de propósito numa base de teste. <b>O sistema encontrou todos</b>, e repetimos em 10 bases diferentes para não “decorar” uma só.</p></Entra>
        <Entra atraso={1.5}><p style={{ fontSize: 26, color: C.soft, lineHeight: 1.45, margin: "28px 0 0", borderLeft: `4px solid ${C.green}`, paddingLeft: 20 }}>Honestidade: fomos nós que criamos essa base. Ela prova que cada regra faz o que diz; a prova no mundo real vem da base oficial e da validação com quem é do campo.</p></Entra>
      </div>
      {/* Loop Engineering */}
      <div style={{ position: "absolute", left: 1060, top: 300, width: 2 * R + 160, height: 2 * R + 160 }}>
        <motion.svg width={2 * R + 160} height={2 * R + 160} style={{ position: "absolute", inset: 0 }} animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
          <circle cx={R + 80} cy={R + 80} r={R} fill="none" stroke={C.green} strokeWidth="6" strokeDasharray="18 16" />
        </motion.svg>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} style={{ position: "absolute", left: R + 80 - 110, top: R + 80 - 60, width: 220, textAlign: "center", fontFamily: DISPLAY, fontSize: 40, color: C.amber, lineHeight: 1.1 }}>Loop de<br />avaliação</motion.div>
        {passos.map((p, k) => {
          const ang = (-90 + k * 90) * (Math.PI / 180);
          const x = R + 80 + R * Math.cos(ang);
          const y = R + 80 + R * Math.sin(ang);
          return (
            <motion.div key={p} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + k * 0.4, duration: 0.5, ease: EASE }}
              style={{ position: "absolute", left: x - 130, top: y - 50, width: 260, minHeight: 100, background: C.dark2, border: `2px solid ${C.greenLight}`, borderRadius: 16, padding: "14px 16px", fontSize: 24, color: C.light, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
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
  return (
    <Base fundo={C.light}>
      <Entra><Rotulo cor={C.green}>Como funciona</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo cor={C.dark} tamanho={72}>Um grafo de etapas, do dado bruto à decisão</Titulo></Entra>
      <svg width={1664} height={20} style={{ position: "absolute", left: 128, top: 470 }} aria-hidden>
        <motion.line x1={larg / 2} y1={10} x2={1664 - larg / 2} y2={10} stroke={C.green} strokeWidth={5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 2.2, ease: "easeInOut" }} />
      </svg>
      {etapas.map(([t, d], k) => (
        <motion.div key={t} initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 + k * 0.38, duration: 0.5, ease: EASE }}
          style={{ position: "absolute", left: 128 + k * passo, top: 360, width: larg, minHeight: 230, background: k === 4 ? C.dark : C.card, border: `2px solid ${k === 4 ? C.amber : C.green}`, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: k === 4 ? C.amber : C.green }}>{k + 1}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 600, color: k === 4 ? C.light : C.dark, lineHeight: 1.1 }}>{t}</div>
          <div style={{ fontSize: 24, color: k === 4 ? C.soft : C.softL, lineHeight: 1.35 }}>{d}</div>
        </motion.div>
      ))}
      <div style={{ position: "absolute", left: 128, top: 660, width: 1664, display: "flex", flexWrap: "wrap", gap: 14 }}>
        {detectores.map((d, k) => (
          <motion.span key={d} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.6 + k * 0.09, type: "spring", stiffness: 260, damping: 16 }}
            style={{ fontSize: 26, padding: "10px 20px", borderRadius: 999, background: C.dark, color: C.light }}>{d}</motion.span>
        ))}
      </div>
      <Entra atraso={3.8} style={{ position: "absolute", left: 128, top: 850, width: 1664 }}>
        <p style={{ fontSize: 28, color: C.softL, margin: 0 }}><b style={{ color: C.dark }}>Graph Engineering:</b> o motor é um grafo; nomes parecidos viram um só produto. Sem caixa-preta: cada alerta tem a regra escrita.</p>
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
  return (
    <Base fundo={`linear-gradient(180deg, ${C.dark}, ${C.dark2})`}>
      <Entra><Rotulo>A visão</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo tamanho={80}>Esta é a primeira versão.<br /><span style={{ color: C.amber }}>O caminho já está mapeado.</span></Titulo></Entra>
      <svg width={1664} height={10} style={{ position: "absolute", left: 128, top: 545 }} aria-hidden>
        <motion.line x1={col / 2} y1={5} x2={1664 - col / 2} y2={5} stroke={C.green} strokeWidth={6} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 2, ease: "easeInOut" }} />
      </svg>
      {passos.map(([t, d], k) => (
        <div key={t} style={{ position: "absolute", left: 128 + k * col, top: 500, width: col, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 14px" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + k * 0.4, type: "spring", stiffness: 220, damping: 13 }}
            style={{ width: 100, height: 100, borderRadius: 50, background: C.amber, color: C.dark, fontFamily: DISPLAY, fontSize: 48, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{k + 1}</motion.div>
          <Entra atraso={1.0 + k * 0.4} y={20}>
            <div style={{ fontFamily: DISPLAY, fontSize: 38, color: C.light, marginTop: 28, lineHeight: 1.15 }}>{t}</div>
            <div style={{ fontSize: 26, color: C.soft, marginTop: 12, lineHeight: 1.4 }}>{d}</div>
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
    <Base fundo={C.light}>
      <Entra><Rotulo cor={C.green}>Como vira negócio</Rotulo></Entra>
      <Entra atraso={0.15} style={{ marginTop: 20 }}><Titulo cor={C.dark} tamanho={76}>Grátis para quem planta. Valioso para quem vende.</Titulo></Entra>
      <div style={{ display: "flex", alignItems: "stretch", gap: 20, marginTop: 90 }}>
        {etapas.map(([t, tag, d], k) => (
          <div key={t} style={{ display: "contents" }}>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + k * 0.6, duration: 0.6, ease: EASE }}
              style={{ flex: 1, background: k === 1 ? C.dark : C.card, border: `1px solid ${k === 1 ? C.dark : "#E2DCCB"}`, borderRadius: 24, padding: 44, display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ alignSelf: "flex-start", fontSize: 24, fontWeight: 700, padding: "6px 16px", borderRadius: 999, background: C.amber, color: C.dark }}>{tag}</span>
              <h3 style={{ fontFamily: DISPLAY, fontSize: 46, fontWeight: 600, margin: 0, color: k === 1 ? C.light : C.dark, lineHeight: 1.15 }}>{t}</h3>
              <p style={{ fontSize: 30, lineHeight: 1.4, margin: 0, color: k === 1 ? C.soft : C.softL }}>{d}</p>
            </motion.div>
            {k < 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 + k * 0.6 }} style={{ display: "flex", alignItems: "center" }}>
                <Icone tipo="seta" cor={C.green} tam={64} />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </Base>
  );
}

function Fechamento() {
  return (
    <Base fundo={`radial-gradient(circle at 50% 40%, #24503A, ${C.dark} 65%)`}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 128, gap: 30 }}>
        <Entra><p style={{ fontSize: 38, color: C.soft, margin: 0 }}>Toda fazenda já tem os dados. Falta alguém olhando por ela todo dia.</p></Entra>
        <motion.h1 initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
          style={{ fontFamily: DISPLAY, fontSize: 168, fontWeight: 700, color: C.light, margin: 0, lineHeight: 1.05 }}>AgroSentinela</motion.h1>
        <Entra atraso={1.0}><p style={{ fontFamily: DISPLAY, fontSize: 52, color: C.amber, margin: 0 }}>O que fazer hoje, por quê e quanto dá para confiar.</p></Entra>
        <Entra atraso={1.5}>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 20, fontSize: 28, color: C.light }}>
            <span style={{ padding: "12px 26px", borderRadius: 999, border: `2px solid ${C.green}` }}>github.com/ArmandoGT/agrohack2026</span>
          </div>
        </Entra>
        <Entra atraso={1.9}><p style={{ fontSize: 26, color: C.soft, margin: "20px 0 0" }}>Equipe 3 Hacketeers · Armando · Pedro · Leandro · ADS IFRO Ariquemes</p></Entra>
        <Entra atraso={2.3}><p style={{ fontFamily: DISPLAY, fontSize: 60, color: C.light, margin: "10px 0 0" }}>Obrigado!</p></Entra>
      </div>
    </Base>
  );
}

// ---------- roteiro ----------

export const SLIDES: { id: string; titulo: string; tempo: string; notas: string; Componente: () => React.JSX.Element }[] = [
  { id: "capa", titulo: "Capa", tempo: "0:00", Componente: Capa,
    notas: "Armando. Pausa de 2 s. Frase-tese de cor: “A AgroSentinela é o agrônomo de bolso do estoque: lê a planilha que a fazenda já tem e diz o que fazer hoje, por quê e quanto dá para confiar.”" },
  { id: "dor", titulo: "A dor", tempo: "0:05–0:35", Componente: Dor,
    notas: "“Imaginem o Seu João, gerente de uma fazenda aqui em Rondônia. Ele sabe quanto tem de cada insumo — está tudo anotado. O que a planilha não conta é o que vai dar problema: o diesel que acaba no meio do plantio, o inoculante que vence no galpão, o mesmo adubo com dois nomes, e a fazenda compra de novo o que já tinha.”" },
  { id: "frase", titulo: "A virada", tempo: "0:35–0:45", Componente: Frase,
    notas: "Deixe a frase aparecer. Fale devagar: “Nenhum desses problemas é falta de dado. É falta de alguém olhando os dados por ele.”" },
  { id: "ideia", titulo: "A ideia", tempo: "0:45–1:15", Componente: Ideia,
    notas: "“A AgroSentinela é esse alguém. Ela entrega uma lista do que fazer hoje, e todo alerta responde três perguntas: o quê, por quê e quanto dá para confiar. Este é um alerta real do sistema: o diesel dura cerca de 9 dias, e a conta e a confiança estão à vista.”" },
  { id: "painel", titulo: "Painel do dia", tempo: "1:15–1:35", Componente: Painel,
    notas: "“De manhã, o Seu João abre o Painel do dia: crítico, atenção, monitorar, do mais urgente ao menos urgente. Não é mais um cadastro com gráfico bonito — é apoio à decisão, que é o que o desafio pediu.” (Na demo ao vivo, NÃO abrir pelo alerta do óleo de motor.)" },
  { id: "m1", titulo: "Momento 1 · 9 dias", tempo: "1:35–1:55", Componente: Momento1,
    notas: "“Mantendo o consumo dos últimos 30 dias, o diesel dura cerca de 9 dias. O prazo de compra é 15. Ele já está atrasado — e o sistema mostra a conta e a confiança.”" },
  { id: "m2", titulo: "Momento 2 · +87%", tempo: "1:55–2:15", Componente: Momento2,
    notas: "“O consumo subiu 87% em 4 meses. Quem olhasse a média do ano acharia que está tudo bem.” Apontar as barras subindo no fim do gráfico." },
  { id: "m3", titulo: "Momento 3 · 1 clique", tempo: "2:15–2:35", Componente: Momento3,
    notas: "“Era o mesmo adubo com dois nomes: KCl e Cloreto de potássio. Um clique, a análise é refeita e o alarme falso de ‘vai faltar’ some sozinho.” A tela troca sozinha para o aviso ‘Resolvido’." },
  { id: "m4", titulo: "Momento 4 · 170 L", tempo: "2:35–2:55", Componente: Momento4,
    notas: "“Alguém tirou 170 litros de glifosato de uma vez. Na hora o sistema refaz tudo e avisa: Novo, Atenção, vai faltar em breve. É o tipo de coisa que hoje só se descobre no fim do mês.”" },
  { id: "perguntas", titulo: "As 7 perguntas", tempo: "2:55–3:10", Componente: Perguntas,
    notas: "Rápido: “As 7 perguntas do desafio têm resposta no sistema — e o mapa está na tela Como funciona.” Não ler a lista inteira." },
  { id: "confianca", titulo: "Por que confiar", tempo: "3:10–3:40", Componente: Confianca,
    notas: "Pedro. “Montamos uma base com 17 problemas escondidos e um gabarito. O sistema encontrou os 17, e repetimos em 10 bases. Honestidade: fomos nós que criamos essa base, então ela prova que cada regra faz o que diz. [Se for verdade no dia: validamos com X, de Agronomia, que nos fez mudar Y; rodamos a base oficial.] Usamos IA para construir, e isso está declarado; o sistema em si decide com regras que sabemos explicar.”" },
  { id: "motor", titulo: "Como funciona", tempo: "3:40–3:55", Componente: Motor,
    notas: "Pedro. “Por dentro, é um grafo de etapas: normaliza, une cadastros parecidos, calcula saldos por lote e roda 10 detectores em paralelo. Vazio nunca vira zero, kg nunca soma com litro, e a incerteza sempre aparece escrita.”" },
  { id: "visao", titulo: "A visão", tempo: "3:55–4:30", Componente: Visao,
    notas: "Armando. “Isso é a primeira versão. O caminho já está mapeado: lista de compras pelo WhatsApp, ‘use primeiro’ por lote, calendário de safra, funcionar offline e, depois, cooperativas com várias fazendas num painel só.” Fraqueza vira roadmap." },
  { id: "negocio", titulo: "Como vira negócio", tempo: "4:30–4:40", Componente: Negocio,
    notas: "Curto: “Grátis para o produtor, como porta de entrada. Quem paga são cooperativas e revendas, que ganham a visão de onde vai faltar e quando oferecer reposição.” Se o tempo apertar, pule este slide." },
  { id: "fechamento", titulo: "Fechamento", tempo: "4:40–5:00", Componente: Fechamento,
    notas: "“Toda fazenda já tem os dados. O que falta é alguém olhando por ela todo dia. A AgroSentinela é o agrônomo de bolso do estoque. Somos a equipe 3 Hacketeers. Obrigado!” Sorrir, pausa, aguardar perguntas." },
];

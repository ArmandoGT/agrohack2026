"use client";

// Motor da apresentação: palco 1920×1080 escalado para a janela, navegação por teclado/clique,
// transição entre slides (Motion) e notas do apresentador (tecla N).

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { C, SLIDES } from "./slides";

const W = 1920;
const H = 1080;

export function Apresentacao() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [escala, setEscala] = useState(1);
  const [notas, setNotas] = useState(false);

  useEffect(() => {
    const ajustar = () => setEscala(Math.min(window.innerWidth / W, window.innerHeight / H));
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  const ir = useCallback((n: number) => {
    setI((atual) => {
      const alvo = Math.max(0, Math.min(SLIDES.length - 1, n));
      setDir(alvo >= atual ? 1 : -1);
      return alvo;
    });
  }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); ir(i + 1); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); ir(i - 1); }
      else if (e.key === "Home") ir(0);
      else if (e.key === "End") ir(SLIDES.length - 1);
      else if (e.key.toLowerCase() === "n") setNotas((v) => !v);
      else if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [i, ir]);

  const slide = SLIDES[i];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#07120D", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "var(--font-dm), Arial, sans-serif" }}
      onClick={(e) => (e.clientX > window.innerWidth / 3 ? ir(i + 1) : ir(i - 1))}
    >
      <div style={{ width: W, height: H, flexShrink: 0, transform: `scale(${escala})`, position: "relative", overflow: "hidden", background: C.dark }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            initial={{ opacity: 0, x: 80 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 * dir }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <slide.Componente />
          </motion.div>
        </AnimatePresence>

        {/* Barra de progresso */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(0,0,0,.15)" }}>
          <motion.div animate={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} transition={{ duration: 0.5 }} style={{ height: "100%", background: C.amber }} />
        </div>
        <div style={{ position: "absolute", right: 40, bottom: 24, fontSize: 22, color: "rgba(128,140,130,.9)", fontVariantNumeric: "tabular-nums" }}>
          {i + 1} / {SLIDES.length}
        </div>
      </div>

      {notas && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", left: 16, right: 16, bottom: 16, maxHeight: "38vh", overflow: "auto", background: "rgba(16,36,27,.96)", color: "#F5F1E6", border: `1px solid ${C.green}`, borderRadius: 12, padding: "16px 20px", fontSize: 16, lineHeight: 1.5 }}>
          <div style={{ color: C.amber, fontWeight: 700, marginBottom: 6 }}>Notas · {slide.titulo} · {slide.tempo}</div>
          {slide.notas}
          <div style={{ marginTop: 10, fontSize: 13, color: C.soft }}>→ / espaço: avançar · ←: voltar · F: tela cheia · N: esconder notas</div>
        </div>
      )}
    </div>
  );
}

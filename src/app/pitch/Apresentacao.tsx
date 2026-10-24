"use client";

// Motor da apresentação: palco 1920×1080 escalado para a janela, navegação por teclado/clique,
// transição entre slides (Motion) e notas do apresentador (tecla N).
// Nos slides com câmera, → (e o passador) primeiro avança a câmera e só depois passa o slide,
// como as animações do PowerPoint; ↓ e ↑ movem só a câmera.
// Transição curta e sempre igual: o slide sai em 0,22 s e o próximo entra em 0,38 s (0,6 s no total).
// Com prefers-reduced-motion, o MotionConfig deixa só o fade (sem deslocamento nem escala).

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { C, CameraCtx, SLIDES, type ControleCamera } from "./slides";

const W = 1920;
const H = 1080;
const EASE = [0.22, 1, 0.36, 1] as const;

export function Apresentacao() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [escala, setEscala] = useState(1);
  const [notas, setNotas] = useState(false);
  const camera = useRef<ControleCamera | null>(null);

  useEffect(() => {
    const ajustar = () => setEscala(Math.min(window.innerWidth / W, window.innerHeight / H));
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  const avancar = useCallback(() => {
    if (!camera.current?.avancar()) setI((atual) => { setDir(1); return Math.min(SLIDES.length - 1, atual + 1); });
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
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); avancar(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); camera.current?.avancar(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); camera.current?.voltar(); }
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
  }, [i, ir, avancar]);

  const slide = SLIDES[i];

  const progresso = ((i + 1) / SLIDES.length) * 100;

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{ position: "fixed", inset: 0, background: "#070B16", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "var(--font-texto), 'Source Sans 3', Arial, sans-serif" }}
        onClick={(e) => (e.clientX > window.innerWidth / 3 ? avancar() : ir(i - 1))}
      >
        <div style={{ width: W, height: H, flexShrink: 0, transform: `scale(${escala})`, position: "relative", overflow: "hidden", background: C.noite }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={slide.id}
              custom={dir}
              initial={{ opacity: 0, x: 36 * dir }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.38, ease: EASE } }}
              exit={{ opacity: 0, x: -24 * dir, transition: { duration: 0.22, ease: "easeIn" } }}
              style={{ position: "absolute", inset: 0 }}
            >
              <CameraCtx.Provider value={camera}>
                <slide.Componente />
              </CameraCtx.Provider>
            </motion.div>
          </AnimatePresence>

          {/* Barra de progresso: filete de ouro com um losango na ponta */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: "rgba(14,21,40,.55)" }}>
            <motion.div animate={{ width: `${progresso}%` }} transition={{ duration: 0.5, ease: EASE }} style={{ position: "relative", height: "100%", background: `linear-gradient(90deg, ${C.ouroEscuro}, ${C.ouro})` }}>
              <span style={{ position: "absolute", right: -7, top: -5, width: 14, height: 14, background: C.ouroClaro, transform: "rotate(45deg)" }} />
            </motion.div>
          </div>
          <div style={{ position: "absolute", right: 64, bottom: 14, padding: "2px 12px", fontSize: 22, color: C.marfim, background: "rgba(14,21,40,.75)", fontVariantNumeric: "tabular-nums" }}>
            {i + 1} / {SLIDES.length}
          </div>
        </div>

        {notas && (
          <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", left: 16, right: 16, bottom: 16, maxHeight: "38vh", overflow: "auto", background: "rgba(14,21,40,.97)", color: C.marfim, border: `1px solid ${C.ouro}`, borderTop: `4px double ${C.ouro}`, borderRadius: 8, padding: "16px 20px", fontSize: 17, lineHeight: 1.55 }}>
            <div style={{ color: C.ouroClaro, fontWeight: 700, marginBottom: 6 }}>Notas · {slide.titulo} · {slide.tempo}</div>
            {slide.notas}
            <div style={{ marginTop: 10, fontSize: 14, color: C.nevoa }}>→ / espaço / passador: avançar (câmera, depois slide) · ↓ ↑: câmera · ←: voltar slide · F: tela cheia · N: esconder notas</div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

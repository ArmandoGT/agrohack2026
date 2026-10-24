/* Ícones e ornamentos em SVG inline, desenhados para este projeto (sem imagens externas). */

type P = { className?: string };

function Svg({ className = "h-5 w-5", children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const IconePainel = (p: P) => (
  <Svg {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </Svg>
);

export const IconeProdutos = (p: P) => (
  <Svg {...p}>
    <path d="M7 7h10l2 13H5L7 7Z" />
    <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
    <path d="M9.5 13c1.5 1.5 3.5 1.5 5 0" />
  </Svg>
);

export const IconeRegistrar = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

export const IconeFinanceiro = (p: P) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
    <path d="M5 6.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" />
    <path d="M5 11.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" />
  </Svg>
);

export const IconeCadastros = (p: P) => (
  <Svg {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Svg>
);

export const IconeImportar = (p: P) => (
  <Svg {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Svg>
);

/** Saída: seta deixando a caixa. */
export const IconeSaida = IconeImportar;

/** Entrada: seta chegando na caixa. */
export const IconeEntrada = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </Svg>
);

export const IconeComoFunciona = (p: P) => (
  <Svg {...p}>
    <path d="M4 5.5C6.5 4 9.5 4 12 5.5v14C9.5 18 6.5 18 4 19.5v-14Z" />
    <path d="M20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0v-14Z" />
  </Svg>
);

export const IconeMais = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconeFechar = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconeBusca = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const IconeSeta = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconeVoltar = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

/* Ícones de nível: forma diferente para cada um, para não depender só da cor. */
export const IconeCritico = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
    <path d="M12 10v4.5M12 17.3v.2" />
  </Svg>
);
export const IconeAtencao = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.3v.2" />
  </Svg>
);
export const IconeMonitorar = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const IconeOk = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.3 2.7 2.7L16.3 9.4" />
  </Svg>
);

/** Emblema da marca: arco ogival em ultramarino com filete de ouro, broto verde e estrela. */
export function Emblema({ className = "h-11 w-9" }: P) {
  return (
    <svg viewBox="0 0 36 44" className={className} aria-hidden>
      <path d="M2 43V20C2 10 10 3 18 1c8 2 16 9 16 19v23Z" fill="var(--ultramar)" stroke="var(--ouro-claro)" strokeWidth="1.5" />
      <path d="M5.5 40V20.5C5.5 12.5 11.5 6.8 18 5c6.5 1.8 12.5 7.5 12.5 15.5V40Z" fill="none" stroke="var(--ouro-claro)" strokeWidth=".6" opacity=".8" />
      <path d="m18 9.2 1 2.2 2.3.2-1.8 1.5.6 2.3-2.1-1.3-2.1 1.3.6-2.3-1.8-1.5 2.3-.2Z" fill="var(--ouro-claro)" />
      <path d="M18 38V24" stroke="#9fbf74" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 30c-5 0-7.5-3-7.5-6.5 4.5 0 7.5 2.5 7.5 6.5ZM18 27.5c4.5 0 7-2.8 7-6 -4 0-7 2.3-7 6Z" fill="#9fbf74" />
      <path d="M8 38h20" stroke="var(--ouro-claro)" strokeWidth="1" />
    </svg>
  );
}

/** Divisor ornamental: filete de ouro com um quadrifólio ao centro. */
export function Fleurao({ className = "" }: P) {
  return (
    <div className={`flex items-center gap-3 text-ouro ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-ouro" />
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <circle cx="12" cy="6.5" r="3.5" />
        <circle cx="12" cy="17.5" r="3.5" />
        <circle cx="6.5" cy="12" r="3.5" />
        <circle cx="17.5" cy="12" r="3.5" />
        <circle cx="12" cy="12" r="2.2" fill="var(--carmim)" />
      </svg>
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-ouro" />
    </div>
  );
}

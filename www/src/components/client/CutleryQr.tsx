import { useMemo } from "react";
import QRCode from "qrcode";
import styles from "./CutleryQr.module.css";

type CutleryQrProps = {
  value: string;
  label: string;
  /** Ocupa todo el espacio disponible (pantalla completa en teléfono). */
  fullscreen?: boolean;
};

const INK = "#1d1d1f";

function inFinderZone(col: number, row: number, size: number) {
  const zone = (x: number, y: number) => x < 8 && y < 8;
  return zone(col, row) || zone(size - 1 - col, row) || zone(col, size - 1 - row);
}

function Finder({ x, y, cell }: { x: number; y: number; cell: number }) {
  const outer = cell * 7;
  const mid = cell * 5;
  const eye = cell * 3;

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={outer} height={outer} rx={outer * 0.34} fill={INK} />
      <rect x={cell} y={cell} width={mid} height={mid} rx={mid * 0.34} fill="#fff" />
      <rect x={cell * 2} y={cell * 2} width={eye} height={eye} rx={eye * 0.36} fill={INK} />
    </g>
  );
}

function CenterMark({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const s = r * 1.15;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" />
      <g
        fill="none"
        stroke={INK}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${cx} ${cy}) scale(${s / 12})`}
      >
        <path d="M-4.6 -4.4v3.2M-3.1 -4.4v3.2M-1.6 -4.4v3.2" />
        <path d="M-3.1 -1.2v6.8" />
        <path d="M1.4 -4.2h1.15c1.4 2.4 1.4 5.2 0 7.6H1.4" />
        <path d="M2 3.4v3.4" />
      </g>
    </g>
  );
}

export default function CutleryQr({ value, label, fullscreen }: CutleryQrProps) {
  const qr = useMemo(() => QRCode.create(value, { errorCorrectionLevel: "H" }), [value]);
  const size = qr.modules.size;
  const cell = 100 / size;
  const quiet = cell * 2.4;
  const dots: { col: number; row: number }[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!qr.modules.get(row, col) || inFinderZone(col, row, size)) {
        continue;
      }
      dots.push({ col, row });
    }
  }

  return (
    <figure className={`${styles.wrap} ${fullscreen ? styles.wrapFull : ""}`}>
      <div className={styles.card}>
        <svg
          viewBox={`${-quiet} ${-quiet} ${100 + quiet * 2} ${100 + quiet * 2}`}
          className={`${styles.svg} ${fullscreen ? styles.svgFull : ""}`}
          role="img"
          aria-label={label}
        >
          <rect
            x={-quiet}
            y={-quiet}
            width={100 + quiet * 2}
            height={100 + quiet * 2}
            rx={quiet * 1.8}
            fill="#fff"
          />
          {dots.map((dot) => (
            <circle
              key={`${dot.row}-${dot.col}`}
              cx={(dot.col + 0.5) * cell}
              cy={(dot.row + 0.5) * cell}
              r={cell * 0.38}
              fill={INK}
            />
          ))}
          <Finder x={0} y={0} cell={cell} />
          <Finder x={(size - 7) * cell} y={0} cell={cell} />
          <Finder x={0} y={(size - 7) * cell} cell={cell} />
          <CenterMark cx={50} cy={50} r={cell * 3.1} />
        </svg>
      </div>
      <figcaption className={styles.caption}>Muéstralo en la cámara del mostrador</figcaption>
    </figure>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import type { ActiveOrder } from "@lib/order";
import styles from "./IncomingOrderOverlay.module.css";

interface IncomingOrderOverlayProps {
  order: ActiveOrder | null;
  onAccept: (order: ActiveOrder) => void;
  onReject: (order: ActiveOrder) => void;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING_SNAP = { type: "spring" as const, stiffness: 320, damping: 28 };
const SPRING_BUTTON = { type: "spring" as const, stiffness: 420, damping: 26 };

function playKitchenChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.8);
  } catch {
    // Ignorar restricciones de audio
  }
}

export default function IncomingOrderOverlay({
  order,
  onAccept,
  onReject,
}: IncomingOrderOverlayProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"wave" | "title_center" | "content">("wave");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!order) {
      setPhase("wave");
      setIsClosing(false);
      return;
    }

    setPhase("wave");
    setIsClosing(false);
    playKitchenChime();

    // Fase 1: La ola verde se expande rápidamente al 100% (350ms)
    const waveTimer = setTimeout(() => {
      setPhase("title_center");
    }, 380);

    // Fase 2: "Nuevo Pedido" se muestra en el centro brevemente (450ms) y luego sube al header
    const titleTimer = setTimeout(() => {
      setPhase("content");
    }, 850);

    return () => {
      clearTimeout(waveTimer);
      clearTimeout(titleTimer);
    };
  }, [order]);

  const handleAction = useCallback(
    (callback: () => void) => {
      if (isClosing) return;
      setIsClosing(true);
      setTimeout(() => {
        callback();
      }, 200);
    },
    [isClosing],
  );

  // Atajos de teclado: Enter para aceptar, Escape para rechazar
  useEffect(() => {
    if (!order || isClosing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAction(() => onAccept(order));
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleAction(() => onReject(order));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [order, isClosing, handleAction, onAccept, onReject]);

  if (!mounted || !order) return null;

  const displayId = order.id.startsWith("ord-")
    ? order.id.slice(4)
    : order.id.replace(/^[^\d]*/, "") || order.id.slice(-4);

  return createPortal(
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          key="incoming-overlay-portal"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
          className={`${styles.overlayRoot} ${phase !== "wave" ? styles.overlayRootActive : ""}`}
        >
          {/* 1. OLA VERDE EXPANDIÉNDOSE AL 100% CON MOTION */}
          {phase === "wave" && (
            <div className={styles.waveCenter}>
              <motion.div
                initial={{ scale: 0.04, rotate: 0, opacity: 0.7 }}
                animate={{ scale: 3.6, rotate: 50, opacity: 0.4 }}
                transition={reduce ? { duration: 0.2 } : { duration: 0.4, ease: EASE_OUT }}
                style={{
                  position: "absolute",
                  width: "100vmax",
                  height: "100vmax",
                  borderRadius: "45% 55% 52% 48% / 54% 46% 54% 46%",
                  backgroundColor: "rgba(34, 197, 94, 0.45)",
                }}
              />
              <motion.div
                initial={{ scale: 0.02 }}
                animate={{ scale: 3.4 }}
                transition={reduce ? { duration: 0.2 } : { duration: 0.38, ease: EASE_OUT }}
                style={{
                  position: "absolute",
                  width: "100vmax",
                  height: "100vmax",
                  borderRadius: "50%",
                  backgroundColor: "#15803d",
                }}
              />
            </div>
          )}

          {/* 2. EN MEDIO APARECE "NUEVO PEDIDO" */}
          {phase === "title_center" && (
            <div className={styles.waveCenter} style={{ backgroundColor: "#15803d" }}>
              <motion.h1
                layoutId="incoming-order-title"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING_SNAP}
                className={styles.heroTitle}
              >
                Nuevo Pedido
              </motion.h1>
            </div>
          )}

          {/* 3. CONTENIDO: TÍTULO ARRIBA, CUADRÍCULA EN MEDIO, BOTONES ABAJO */}
          {phase === "content" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={styles.contentStage}
            >
              {/* TÍTULO ARRIBA (SIN DIVISOR) */}
              <div className={styles.header}>
                <motion.h1
                  layoutId="incoming-order-title"
                  transition={SPRING_SNAP}
                  className={styles.headerTitle}
                >
                  Nuevo Pedido
                </motion.h1>

                <motion.div
                  initial={reduce ? { opacity: 0 } : { x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={reduce ? { duration: 0.1 } : { delay: 0.08, ...SPRING_SNAP }}
                  className={styles.headerMeta}
                >
                  <span>Pedido #{displayId}</span>
                  <span>•</span>
                  <span>{order.method === "cash" ? "Efectivo" : "Tarjeta"}</span>
                  <span>•</span>
                  <span className={styles.headerTotal}>
                    Total: ${order.total ? order.total.toFixed(2) : "0.00"}
                  </span>
                </motion.div>
              </div>

              {/* CONTENIDO DEL PEDIDO EN CUADRÍCULA (CSS GRID PURO: NO CARDS, NO TABLAS, SIN BORDES FEOS NI SOMBRAS) */}
              <div className={styles.gridContainer}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: reduce ? 0 : 0.04,
                        delayChildren: reduce ? 0 : 0.05,
                      },
                    },
                  }}
                  className={styles.grid}
                >
                  {order.lines.map((line, idx) => {
                    const price = typeof line.price === "number"
                      ? line.price
                      : (line as unknown as { unitPrice?: number }).unitPrice || 0;
                    const cleanName = line.name.replace(/^\d+\s*[×x]\s*/i, "");

                    return (
                      <motion.div
                        key={line.id || idx}
                        variants={{
                          hidden: { opacity: 0, y: 18 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.28, ease: EASE_OUT },
                          },
                        }}
                        className={styles.gridItem}
                      >
                        <div className={styles.itemMain}>
                          <span className={styles.itemQty}>
                            {line.quantity}×
                          </span>
                          <h2 className={styles.itemName}>
                            {cleanName}
                          </h2>
                        </div>

                        <div className={styles.itemPrice}>
                          ${price ? (price * line.quantity).toFixed(2) : "0.00"}{" "}
                          {line.quantity > 1 ? `($${price.toFixed(2)} c/u)` : ""}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* ABAJO DE LA CUADRÍCULA: BOTONES BLANCOS (SIN DIVISOR, RECHAZAR TEXTO ROJO, ACEPTAR TEXTO VERDE, SIN BORDES FEOS NI SOMBRAS) */}
              <motion.div
                initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={reduce ? { duration: 0.1 } : { delay: 0.1, ...SPRING_SNAP }}
                className={styles.actions}
              >
                {/* BOTÓN RECHAZAR: BLANCO, TEXTO ROJO, SIN BORDES FEOS NI SOMBRAS */}
                <motion.button
                  type="button"
                  onClick={() => handleAction(() => onReject(order))}
                  whileHover={reduce ? undefined : { scale: 1.025 }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  transition={SPRING_BUTTON}
                  className={styles.rejectBtn}
                >
                  <X style={{ width: 34, height: 34, strokeWidth: 3.5, color: "#dc2626" }} />
                  <span>Rechazar</span>
                </motion.button>

                {/* BOTÓN ACEPTAR: BLANCO, TEXTO VERDE, SIN BORDES FEOS NI SOMBRAS */}
                <motion.button
                  type="button"
                  onClick={() => handleAction(() => onAccept(order))}
                  whileHover={reduce ? undefined : { scale: 1.025 }}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  transition={SPRING_BUTTON}
                  className={styles.acceptBtn}
                >
                  <Check style={{ width: 36, height: 36, strokeWidth: 4, color: "#15803d" }} />
                  <span>Aceptar</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

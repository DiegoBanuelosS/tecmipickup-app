import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { fetchPedido } from "@lib/api";
import {
  applyRemoteOrder,
  getActiveOrder,
  orderMods,
  orderReadyAt,
  orderStatus,
  pickupAbsoluteUrl,
  statusCopy,
  subscribeOrder,
  type ActiveOrder,
  type OrderStatus,
} from "@lib/order";
import { formatMxn } from "@lib/data/menu";
import CutleryQr from "./CutleryQr";
import { OrderStatusIcon } from "./OrderStatusIcons";
import styles from "./OrderIsland.module.css";

const spring = { type: "spring" as const, stiffness: 380, damping: 32 };

function countItems(order: ActiveOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function OrderIsland() {
  const reduceMotion = useReducedMotion();
  const detailsId = useId();
  const qrCloseRef = useRef<HTMLButtonElement>(null);
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    setOrder(getActiveOrder());
    return subscribeOrder(() => setOrder(getActiveOrder()));
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px), ((hover: none) and (pointer: coarse))");
    const update = () => setIsPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const qrFullscreen = qrOpen && isPhone;

  useEffect(() => {
    if (!qrFullscreen) {
      return;
    }

    const previous = document.activeElement as HTMLElement | null;
    qrCloseRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQrOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [qrFullscreen]);

  useEffect(() => {
    if (!order) {
      return;
    }

    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [order]);

  useEffect(() => {
    if (!order?.id || order.id.startsWith("ord-")) {
      return;
    }

    const orderId = order.id;
    let cancelled = false;

    const refresh = async () => {
      try {
        const current = getActiveOrder();
        if (!current || current.id !== orderId) {
          return;
        }

        const remote = await fetchPedido(orderId, current);
        if (!cancelled && remote) {
          applyRemoteOrder(remote);
        }
      } catch {
        // El temporizador local sigue mostrando el estado.
      }
    };

    void refresh();
    const poll = window.setInterval(() => void refresh(), 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [order?.id]);

  if (!order) {
    return null;
  }

  const status: OrderStatus = orderStatus(order, now);
  const copy = statusCopy[status];
  const items = countItems(order);
  const expanded = open || qrOpen;
  const remainMs = Math.max(0, orderReadyAt(order) - now);

  function collapse() {
    if (qrOpen) {
      return;
    }
    setOpen(false);
  }

  function onToggle() {
    if (qrOpen) {
      setQrOpen(false);
      setOpen(false);
      return;
    }

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    setOpen((value) => !value);
  }

  return (
    <>
      <div className={styles.wrap}>
      <motion.div
        className={`${styles.pill} ${expanded ? styles.pillOpen : ""}`}
        layout
        transition={reduceMotion ? { duration: 0.2 } : spring}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={collapse}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            collapse();
          }
        }}
      >
        <button
          type="button"
          className={styles.summary}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
        >
          <span className={`${styles.icon} ${styles[`icon_${status}`]}`}>
            <OrderStatusIcon status={status} className={styles.iconSvg} />
          </span>
          <span className={styles.summaryCopy}>
            <span className={styles.status}>{copy.short}</span>
            {!expanded ? (
              <span className={styles.meta}>
                {items} {items === 1 ? "artículo" : "artículos"}
                {status === "ready" ? " · Pasa a recoger" : ` · ${formatRemain(remainMs)}`}
              </span>
            ) : null}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              id={detailsId}
              className={styles.details}
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={reduceMotion ? { duration: 0.15 } : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <p className={styles.long}>{copy.long}</p>
              <p className={styles.eta}>
                Recoger en campus · {order.etaMin}–{order.etaMax} min ·{" "}
                {order.method === "cash" ? "Efectivo" : "Tarjeta"}
              </p>

              {qrOpen && !isPhone ? (
                <CutleryQr
                  value={pickupAbsoluteUrl(order)}
                  label={`Código QR del pedido ${order.id}`}
                />
              ) : (
                <>
                  <ul className={styles.lines}>
                    {order.lines.map((line) => {
                      const mods = orderMods(line);

                      return (
                        <li key={line.id}>
                          <div className={styles.lineTop}>
                            <span>
                              {line.quantity}× {line.name}
                            </span>
                            <span className={styles.linePrice}>{formatMxn(line.unitPrice * line.quantity)}</span>
                          </div>
                          {mods.length === 0 ? <p className={styles.place}>Sin extras</p> : null}
                          {mods.map((mod) => (
                            <p key={mod.title} className={styles.mod}>
                              <strong>{mod.title}.</strong> {mod.values.join(", ")}
                            </p>
                          ))}
                        </li>
                      );
                    })}
                  </ul>

                  <p className={styles.total}>
                    <span>Total</span>
                    <span>{formatMxn(order.total)}</span>
                  </p>
                </>
              )}

              <button
                type="button"
                className={styles.dismiss}
                onClick={(event) => {
                  event.stopPropagation();
                  setQrOpen((value) => !value);
                }}
              >
                {qrOpen && !isPhone ? "Ver pedido" : "Recoger"}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
      </div>

      <AnimatePresence>
        {qrFullscreen ? (
          <motion.div
            className={styles.qrScreen}
            role="dialog"
            aria-modal="true"
            aria-label={`Código QR del pedido ${order.id}`}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.qrHead}>
              <div className={styles.qrHeadCopy}>
                <span className={styles.qrTitle}>{copy.short}</span>
                <span className={styles.qrMeta}>Pedido {order.id}</span>
              </div>
              <button
                ref={qrCloseRef}
                type="button"
                className={styles.qrClose}
                aria-label="Cerrar código QR"
                onClick={() => setQrOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <CutleryQr
              fullscreen
              value={pickupAbsoluteUrl(order)}
              label={`Código QR del pedido ${order.id}`}
            />

            <p className={styles.qrFoot}>
              {items} {items === 1 ? "artículo" : "artículos"} · {formatMxn(order.total)} ·{" "}
              {order.method === "cash" ? "Efectivo" : "Tarjeta"}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

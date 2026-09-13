"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Camera, ChevronLeft, ChevronRight, GripVertical, QrCode } from "lucide-react";
import IncomingOrderOverlay from "./IncomingOrderOverlay";
import QrDeliveryScanner from "../../components/delivery/QrDeliveryScanner";
import { fetchAllPedidos, patchPedidoEstado } from "@lib/api";
import { getRecentOrders, getActiveOrder, applyRemoteOrder, type ActiveOrder, type OrderStatus } from "@lib/order";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out";

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.32 };

// 3 Filas / Columnas de preparación en cocina
const COLUMNS = [
  { id: "today", name: "En cola" },
  { id: "doing", name: "En cocina" },
  { id: "done", name: "Listos" },
] as const;
type ColumnId = (typeof COLUMNS)[number]["id"];

interface KanbanCard {
  id: string;
  order: ActiveOrder;
}

export function cleanItemName(raw: string): string {
  if (!raw) return "";
  // Strip any duplicate quantity prefixes such as "2× ", "2x ", "1* "
  return raw.replace(/^(\d+[\s×xX*]+)+/i, "").trim();
}

function columnToOrderStatus(col: ColumnId): {
  clientStatus: OrderStatus;
  backendStatus: "PENDIENTE" | "EN_PREPARACION" | "LISTO" | "ENTREGADO";
} {
  switch (col) {
    case "today":
      return { clientStatus: "received", backendStatus: "PENDIENTE" };
    case "doing":
      return { clientStatus: "preparing", backendStatus: "EN_PREPARACION" };
    case "done":
      return { clientStatus: "ready", backendStatus: "LISTO" };
  }
}

function orderToColumn(order: ActiveOrder): ColumnId {
  const status = (order.remoteStatus || order.status || "").toLowerCase();
  if (status === "ready" || status === "listo") return "done";
  if (status === "preparing" || status === "en_preparacion" || status === "en preparacion") return "doing";
  return "today";
}

export default function Kanban6() {
  const reduce = useReducedMotion();
  const [cards, setCards] = useState<Record<string, KanbanCard>>({});
  const [items, setItems] = useState<Record<ColumnId, string[]>>({
    today: [],
    doing: [],
    done: [],
  });
  const [page, setPage] = useState<ColumnId>("today");
  const [dragId, setDragId] = useState<string | null>(null);
  const [ghost, setGhost] = useState({ x: 0, y: 0, w: 0 });
  const [announce, setAnnounce] = useState("");

  // Alerta de Nuevo Pedido en tiempo real
  const [incomingOrder, setIncomingOrder] = useState<ActiveOrder | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialSyncDoneRef = useRef(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef(new Map<ColumnId, HTMLElement>());
  const dragRef = useRef<{
    id: string;
    dx: number;
    dy: number;
    w: number;
    active: boolean;
    startX: number;
    startY: number;
    pointerId: number;
  } | null>(null);

  const triggerNewOrderAlert = useCallback((order: ActiveOrder) => {
    setIncomingOrder(order);
  }, []);

  // Sincronización real con la API del backend
  const syncWithApi = useCallback(async () => {
    try {
      const [remoteOrders, localRecent, active] = await Promise.all([
        fetchAllPedidos(),
        Promise.resolve(getRecentOrders()),
        Promise.resolve(getActiveOrder()),
      ]);

      const allOrders: ActiveOrder[] = [];
      const seen = new Set<string>();

      if (active && !seen.has(active.id)) {
        seen.add(active.id);
        allOrders.push(active);
      }
      for (const o of remoteOrders) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          allOrders.push(o);
        }
      }
      for (const o of localRecent) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          allOrders.push(o);
        }
      }

      // Excluir pedidos entregados o cancelados del kanban activo
      const activeOrders = allOrders.filter(
        (o) => o.remoteStatus !== "delivered" && (o.remoteStatus as string) !== "cancelled",
      );

      // Detectar nuevos pedidos para activar la alerta en tiempo real
      if (!initialSyncDoneRef.current) {
        for (const o of activeOrders) {
          knownOrderIdsRef.current.add(o.id);
        }
        initialSyncDoneRef.current = true;
      } else {
        for (const o of activeOrders) {
          if (!knownOrderIdsRef.current.has(o.id)) {
            knownOrderIdsRef.current.add(o.id);
            if (o.remoteStatus === "received" || o.status === "received") {
              triggerNewOrderAlert(o);
              break;
            }
          }
        }
      }

      const nextCards: Record<string, KanbanCard> = {};
      const nextColumns: Record<ColumnId, string[]> = {
        today: [],
        doing: [],
        done: [],
      };

      for (const order of activeOrders) {
        const targetCol = orderToColumn(order);
        nextCards[order.id] = {
          id: order.id,
          order,
        };
        nextColumns[targetCol].push(order.id);
      }

      setCards(nextCards);
      setItems(nextColumns);
    } catch {
      // Ignorar errores transitorios de red
    }
  }, [triggerNewOrderAlert]);

  useEffect(() => {
    void syncWithApi();
    const timer = setInterval(() => void syncWithApi(), 3_000);
    return () => clearInterval(timer);
  }, [syncWithApi]);

  // Escuchar eventos de pedidos locales del cliente
  useEffect(() => {
    const handleOrderEvent = () => {
      const active = getActiveOrder();
      if (active && !knownOrderIdsRef.current.has(active.id)) {
        knownOrderIdsRef.current.add(active.id);
        triggerNewOrderAlert(active);
      }
      void syncWithApi();
    };
    window.addEventListener("tecmipickup-order", handleOrderEvent);
    return () => window.removeEventListener("tecmipickup-order", handleOrderEvent);
  }, [triggerNewOrderAlert, syncWithApi]);

  const columnOf = useCallback(
    (id: string) =>
      (Object.keys(items) as ColumnId[]).find((c) => items[c].includes(id)) ??
      "today",
    [items],
  );

  const propagateStatusChange = useCallback((id: string, toCol: ColumnId) => {
    const { clientStatus, backendStatus } = columnToOrderStatus(toCol);

    if (!id.startsWith("t")) {
      void patchPedidoEstado(id, backendStatus);
    }

    const active = getActiveOrder();
    if (active && (active.id === id || id.startsWith("ord-") || active.id.includes(id))) {
      applyRemoteOrder({
        ...active,
        remoteStatus: clientStatus,
      });
    }

    const history = getRecentOrders();
    const updated = history.map((o) => (o.id === id ? { ...o, remoteStatus: clientStatus } : o));
    window.localStorage.setItem("tecmipickup.orders", JSON.stringify(updated));
    window.dispatchEvent(new Event("tecmipickup-order"));
  }, []);

  const move = useCallback((id: string, toCol: ColumnId, toIndex: number) => {
    setItems((prev) => {
      const next = { ...prev } as Record<ColumnId, string[]>;
      let from: ColumnId | null = null;
      for (const c of Object.keys(next) as ColumnId[]) {
        if (next[c].includes(id)) from = c;
      }
      if (!from) return prev;
      if (from === toCol && next[from].indexOf(id) === toIndex) return prev;
      next[from] = next[from].filter((x) => x !== id);
      const list = from === toCol ? next[from] : [...next[toCol]];
      list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, id);
      next[toCol] = list;

      if (from !== toCol) {
        propagateStatusChange(id, toCol);
      }

      return next;
    });
  }, [propagateStatusChange]);

  const shift = (id: string, dir: -1 | 1) => {
    const ci = COLUMNS.findIndex((c) => c.id === columnOf(id));
    const to = COLUMNS[ci + dir];
    if (!to) return;
    move(id, to.id, items[to.id].length);
    setAnnounce(`Pedido movido a ${to.name}.`);
  };

  const targetFromPoint = useCallback(
    (clientX: number, clientY: number, id: string) => {
      for (const [colId, el] of colRefs.current) {
        const r = el.getBoundingClientRect();
        if (
          clientX < r.left ||
          clientX > r.right ||
          r.width === 0 ||
          r.height === 0
        )
          continue;
        const others = Array.from(
          el.querySelectorAll<HTMLElement>("[data-card]"),
        ).filter((c) => c.dataset.card !== id);
        let index = others.length;
        for (let i = 0; i < others.length; i++) {
          const cr = others[i].getBoundingClientRect();
          if (clientY < cr.top + cr.height / 2) {
            index = i;
            break;
          }
        }
        return { col: colId, index };
      }
      return null;
    },
    [],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0) return;
    const el = e.currentTarget.closest<HTMLElement>("[data-card]");
    const root = rootRef.current;
    if (!el || !root) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    dragRef.current = {
      id,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      w: r.width,
      active: false,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };
    root.setPointerCapture(e.pointerId);
    el.querySelector<HTMLElement>(
      '[aria-roledescription="Draggable card"]',
    )?.focus();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    const root = rootRef.current;
    if (!d || !root) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 4) return;
      d.active = true;
      setDragId(d.id);
    }
    const rr = root.getBoundingClientRect();
    setGhost({
      x: e.clientX - rr.left - d.dx,
      y: e.clientY - rr.top - d.dy,
      w: d.w,
    });
    const t = targetFromPoint(e.clientX, e.clientY, d.id);
    if (t) move(d.id, t.col as ColumnId, t.index);
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    const root = rootRef.current;
    if (root?.hasPointerCapture?.(d.pointerId)) {
      root.releasePointerCapture(d.pointerId);
    }
    if (d.active) {
      setAnnounce(
        `Pedido movido a ${
          COLUMNS.find((c) => c.id === columnOf(d.id))?.name
        }.`,
      );
    }
    setDragId(null);
  };

  // Acciones del overlay de nuevo pedido
  const handleAcceptOrder = useCallback((order: ActiveOrder) => {
    setCards((prev) => ({
      ...prev,
      [order.id]: {
        id: order.id,
        order,
      },
    }));

    setItems((prev) => {
      const nextDoing = prev.doing.filter((x) => x !== order.id);
      return {
        ...prev,
        today: prev.today.filter((x) => x !== order.id),
        doing: [order.id, ...nextDoing],
      };
    });

    if (!order.id.startsWith("t")) {
      void patchPedidoEstado(order.id, "EN_PREPARACION");
    }

    applyRemoteOrder({
      ...order,
      remoteStatus: "preparing",
    });

    const history = getRecentOrders();
    const updated = history.map((o) =>
      o.id === order.id ? { ...o, remoteStatus: "preparing" as const } : o,
    );
    if (!updated.some((o) => o.id === order.id)) {
      updated.unshift({ ...order, remoteStatus: "preparing" as const });
    }
    window.localStorage.setItem("tecmipickup.orders", JSON.stringify(updated));
    window.dispatchEvent(new Event("tecmipickup-order"));

    setAnnounce(`Pedido #${order.id.replace(/^[^\d]*/, "") || order.id} aceptado.`);
    setIncomingOrder(null);
  }, []);

  const handleRejectOrder = useCallback((order: ActiveOrder) => {
    setItems((prev) => ({
      ...prev,
      today: prev.today.filter((id) => id !== order.id),
      doing: prev.doing.filter((id) => id !== order.id),
      done: prev.done.filter((id) => id !== order.id),
    }));

    if (!order.id.startsWith("t")) {
      void patchPedidoEstado(order.id, "CANCELADO");
    }

    setAnnounce(`Pedido rechazado.`);
    setIncomingOrder(null);
  }, []);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [targetDeliverId, setTargetDeliverId] = useState<string | null>(null);

  const handleDeliverOrder = (orderId: string) => {
    setTargetDeliverId(orderId);
    setScannerOpen(true);
  };

  const handleScannerDelivery = (data: { orderId: string }) => {
    setScannerOpen(false);
    const deliveredId = targetDeliverId || data.orderId;
    if (deliveredId) {
      setItems((prev) => ({
        ...prev,
        today: prev.today.filter((id) => id !== deliveredId),
        doing: prev.doing.filter((id) => id !== deliveredId),
        done: prev.done.filter((id) => id !== deliveredId),
      }));

      if (!deliveredId.startsWith("t")) {
        void patchPedidoEstado(deliveredId, "ENTREGADO");
      }

      setAnnounce(`Pedido #${deliveredId.replace(/^[^\d]*/, "") || deliveredId} entregado.`);
      setTargetDeliverId(null);
    }
  };

  const total = useMemo(
    () => Object.values(items).reduce((s, l) => s + l.length, 0),
    [items],
  );

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      className={cx(
        "relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-neutral-950 box-border",
        dragId && "touch-none select-none",
      )}
    >
      {/* Barra superior limpia sin título */}
      <header className="shrink-0 px-6 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-wider uppercase text-neutral-400">
            Cocina
          </span>
          <span className="text-sm text-neutral-300 dark:text-neutral-700">•</span>
          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            {total} {total === 1 ? "pedido activo" : "pedidos activos"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setTargetDeliverId(null);
              setScannerOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 dark:hover:bg-neutral-700 transition cursor-pointer shadow-sm"
          >
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>Entregar con QR</span>
          </button>
        </div>
      </header>

      {/* Tabs para móvil (3 columnas) */}
      <div
        role="tablist"
        aria-label="Column"
        className="mx-4 my-2 flex shrink-0 items-center gap-1.5 overflow-x-auto rounded-xl bg-neutral-100 p-1.5 md:hidden dark:bg-neutral-800"
      >
        {COLUMNS.map((c) => {
          const active = c.id === page;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPage(c.id)}
              className={cx(
                "relative inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold whitespace-nowrap",
                active
                  ? "text-neutral-950 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-950 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              {active && (
                <motion.span
                  layoutId="kanban6-page"
                  transition={reduce ? { duration: 0 } : SPRING}
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-neutral-950"
                />
              )}
              <span className={cx("relative", active && "font-black")}>
                {c.name}
              </span>
              <span className="relative text-xs font-bold tabular-nums text-neutral-500">
                {items[c.id]?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3 Columnas responsivas contenidas dentro del Kanban */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-3 sm:px-6">
        <div className="flex h-full gap-4 w-full">
          {COLUMNS.map((col) => {
            const list = items[col.id] || [];
            const ci = COLUMNS.findIndex((c) => c.id === col.id);
            const isPage = col.id === page;
            return (
              <section
                key={col.id}
                aria-label={col.name}
                className={cx(
                  "h-full flex-col rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-3.5 flex-1 min-w-0 dark:border-neutral-800 dark:bg-neutral-900/40 overflow-hidden",
                  isPage ? "flex w-full" : "hidden md:flex",
                )}
              >
                {/* Cabecera de Columna limpia sin badge */}
                <div className="hidden h-9 shrink-0 items-center justify-between px-1 mb-2 md:flex">
                  <span className="truncate text-base font-bold tracking-tight text-neutral-950 dark:text-neutral-100 font-display">
                    {col.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-neutral-500">
                    {list.length}
                  </span>
                </div>

                {/* Contenedor con scroll vertical contenido */}
                <div
                  ref={(el) => {
                    if (el) colRefs.current.set(col.id, el);
                    else colRefs.current.delete(col.id);
                  }}
                  className="flex-1 min-h-0 space-y-3 overflow-y-auto px-0.5"
                >
                  {list.map((id) => {
                    const card = cards[id];
                    if (!card) return null;
                    const isDragging = dragId === id;
                    const orderIdDisplay = card.order.id.replace(/^[^\d]*/, "") || card.order.id;

                    return (
                      <motion.div
                        key={id}
                        layout={reduce ? false : "position"}
                        transition={SPRING}
                        data-card={id}
                        className={cx(
                          "rounded-xl",
                          isDragging &&
                            "border-2 border-dashed border-neutral-300 bg-neutral-100/60 dark:border-neutral-700 dark:bg-neutral-900/60",
                        )}
                      >
                        <div
                          className={cx(
                            "group flex flex-col gap-2.5 rounded-xl border border-neutral-200/90 bg-white p-4 shadow-xs hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
                            isDragging && "invisible",
                            transition,
                          )}
                        >
                          {/* Arrastre y Encabezado de la Tarjeta (Sin Badges) */}
                          <div
                            role="button"
                            tabIndex={0}
                            aria-roledescription="Draggable card"
                            aria-label={`Pedido #${orderIdDisplay}`}
                            onPointerDown={(e) => {
                              if (e.pointerType === "mouse")
                                onPointerDown(e, id);
                            }}
                            className={cx(
                              "flex cursor-grab flex-col gap-1.5 text-left select-none",
                              focus,
                            )}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
                              <span>Pedido #{orderIdDisplay}</span>
                              <div className="flex items-center gap-2">
                                <span>{card.order.method === "cash" ? "Efectivo" : "Tarjeta"}</span>
                                <span
                                  onPointerDown={(e) => onPointerDown(e, id)}
                                  style={{ touchAction: "none" }}
                                  aria-hidden
                                  className="hidden cursor-grab text-neutral-400 group-hover:text-neutral-600 md:inline"
                                >
                                  <GripVertical className="h-4 w-4" strokeWidth={2.4} />
                                </span>
                              </div>
                            </div>

                            {/* Lista vertical de platillos sin duplicar cantidades */}
                            <ul className="space-y-1.5 list-none p-0 m-0 w-full pt-1">
                              {card.order.lines.map((line, idx) => {
                                const cleanName = cleanItemName(line.name);
                                return (
                                  <li
                                    key={line.id || idx}
                                    className="flex items-baseline gap-2 text-[15px] leading-snug text-neutral-900 dark:text-neutral-100"
                                  >
                                    <span className="font-extrabold font-display text-neutral-950 dark:text-white flex-shrink-0">
                                      {line.quantity}×
                                    </span>
                                    <span className="break-words font-medium">
                                      {cleanName}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          {/* Pie de Tarjeta limpio sin badges */}
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                              ${card.order.total ? card.order.total.toFixed(2) : "0.00"}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={ci === 0}
                                onClick={() => shift(id, -1)}
                                aria-label="Mover a columna anterior"
                                className={cx(
                                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 shadow-xs",
                                  ci === 0
                                    ? "cursor-not-allowed opacity-30"
                                    : "cursor-pointer hover:bg-neutral-200 hover:text-neutral-950",
                                  transition,
                                  focus,
                                )}
                              >
                                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                              </button>

                              {ci === COLUMNS.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeliverOrder(id)}
                                  aria-label="Entregar pedido"
                                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                  <span>Entregar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => shift(id, 1)}
                                  aria-label="Mover a siguiente columna"
                                  className={cx(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 shadow-xs",
                                    "cursor-pointer hover:bg-neutral-200 hover:text-neutral-950",
                                    transition,
                                    focus,
                                  )}
                                >
                                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {list.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-44 text-center text-neutral-400 text-sm font-medium">
                      <p>No hay pedidos en esta etapa</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Alerta en pantalla completa de Nuevo Pedido */}
      <IncomingOrderOverlay
        order={incomingOrder}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
      />

      {/* Escáner de QR para Entregar Pedido */}
      <QrDeliveryScanner
        isOpen={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setTargetDeliverId(null);
        }}
        onSuccess={handleScannerDelivery}
        targetOrderId={targetDeliverId || undefined}
      />

      {/* Ghost de arrastre */}
      <AnimatePresence>
        {dragId && cards[dragId] && (
          <motion.div
            key="ghost"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              left: ghost.x,
              top: ghost.y,
              width: ghost.w,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
              <span className="text-xs font-semibold text-neutral-500">
                Pedido #{cards[dragId].order.id.replace(/^[^\d]*/, "") || cards[dragId].order.id}
              </span>
              <ul className="space-y-1 list-none p-0 m-0 w-full pt-1">
                {cards[dragId].order.lines.slice(0, 2).map((l, idx) => (
                  <li key={idx} className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {l.quantity}× {cleanItemName(l.name)}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

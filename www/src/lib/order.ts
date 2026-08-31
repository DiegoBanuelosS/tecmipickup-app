import { apiConfig } from "./api/config";
import { type CartLine } from "./cart";
import { getCatalogRestaurants } from "./catalogStore";
import { getMenuItem, restaurantOf } from "./data/menu";
import { getSession } from "./session";

export type OrderMethod = "card" | "cash";
export type OrderStatus = "received" | "preparing" | "ready";

export type ActiveOrder = {
  id: string;
  placedAt: number;
  method: OrderMethod;
  total: number;
  lines: CartLine[];
  etaMin: number;
  etaMax: number;
  remoteStatus?: OrderStatus;
};

export type OrderMod = {
  title: string;
  values: string[];
};

const KEY = "tecmipickup.order";
const HISTORY_KEY = "tecmipickup.orders";
const EVENT = "tecmipickup-order";
const HISTORY_LIMIT = 12;

const RECEIVED_MS = 6_000;

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function read(): ActiveOrder | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ActiveOrder;
    if (!parsed?.id || !Array.isArray(parsed.lines)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isOrder(value: unknown): value is ActiveOrder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const order = value as ActiveOrder;
  return Boolean(order.id && typeof order.placedAt === "number" && Array.isArray(order.lines));
}

function readHistory(): ActiveOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isOrder);
  } catch {
    return [];
  }
}

function writeHistory(orders: ActiveOrder[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(orders.slice(0, HISTORY_LIMIT)));
}

function remember(order: ActiveOrder) {
  writeHistory([order, ...readHistory().filter((entry) => entry.id !== order.id)]);
}

export function getActiveOrder() {
  return read();
}

export function getRecentOrders() {
  const history = readHistory();
  const active = read();

  if (!active) {
    return history;
  }

  if (history.some((entry) => entry.id === active.id)) {
    return history;
  }

  const seeded = [active, ...history];
  writeHistory(seeded);
  return seeded;
}

function persist(order: ActiveOrder) {
  window.localStorage.setItem(KEY, JSON.stringify(order));
  remember(order);
  emit();
}

export function applyRemoteOrder(order: ActiveOrder) {
  const current = read();
  if (!current || current.id !== order.id) {
    persist(order);
    return order;
  }

  const next: ActiveOrder = {
    ...current,
    ...order,
    lines: order.lines.length > 0 ? order.lines : current.lines,
  };

  if (
    current.remoteStatus === next.remoteStatus &&
    current.total === next.total &&
    current.lines.length === next.lines.length
  ) {
    return current;
  }

  persist(next);
  return next;
}

export function mergeRemoteOrders(orders: ActiveOrder[]) {
  const current = readHistory();
  const merged = [...orders, ...current].reduce<ActiveOrder[]>((list, order) => {
    if (list.some((entry) => entry.id === order.id)) {
      return list;
    }
    list.push(order);
    return list;
  }, []);

  writeHistory(merged);
  emit();
  return merged;
}

export async function placeOrder(input: { lines: CartLine[]; method: OrderMethod; total: number }) {
  let etaMin = 8;
  let etaMax = 14;

  for (const line of input.lines) {
    const item = getMenuItem(line.slug);
    const place = item ? restaurantOf(item, getCatalogRestaurants()) : null;
    if (place) {
      etaMin = Math.max(etaMin, place.etaMin);
      etaMax = Math.max(etaMax, place.etaMax);
    }
  }

  const draft: ActiveOrder = {
    id: `ord-${Date.now()}`,
    placedAt: Date.now(),
    method: input.method,
    total: input.total,
    lines: input.lines,
    etaMin,
    etaMax,
  };

  const session = getSession();
  const userId = session?.user.id;

  if (!apiConfig.bypassAuth && userId && userId !== "local-user") {
    const { createPedido } = await import("./api/orders");
    const order = await createPedido(userId, draft);
    persist(order);
    return order;
  }

  if (!apiConfig.bypassAuth) {
    const { ApiError } = await import("./api/client");
    throw new ApiError("Inicia sesión para confirmar el pedido.", 401);
  }

  persist(draft);
  return draft;
}

export function clearOrder() {
  window.localStorage.removeItem(KEY);
  emit();
}

export function subscribeOrder(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVENT, handler);
  };
}

export function preparingDuration(order: ActiveOrder) {
  return Math.max(18_000, order.etaMin * 2_000);
}

export function orderReadyAt(order: ActiveOrder) {
  return order.placedAt + RECEIVED_MS + preparingDuration(order);
}

export function orderStatus(order: ActiveOrder, now = Date.now()): OrderStatus {
  if (order.remoteStatus) {
    return order.remoteStatus;
  }

  const elapsed = now - order.placedAt;
  if (elapsed < RECEIVED_MS) {
    return "received";
  }
  if (elapsed < RECEIVED_MS + preparingDuration(order)) {
    return "preparing";
  }
  return "ready";
}

export function orderMods(line: CartLine): OrderMod[] {
  const item = getMenuItem(line.slug);
  if (!item) {
    return line.labels.length > 0 ? [{ title: "Cómo lo pediste", values: line.labels }] : [];
  }

  const groups = item.groups
    .map((group) => {
      const picked = line.selections[group.id] ?? [];
      const values = group.options.filter((option) => picked.includes(option.id)).map((option) => option.label);
      if (values.length === 0) {
        return null;
      }
      return { title: group.title, values };
    })
    .filter((entry): entry is OrderMod => Boolean(entry));

  if (groups.length > 0) {
    return groups;
  }

  return line.labels.length > 0 ? [{ title: "Cómo lo pediste", values: line.labels }] : [];
}

export type PickupTicket = {
  id: string;
  total: number;
  items: string[];
  method: OrderMethod;
};

function toBase64(value: string) {
  return btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))));
}

function fromBase64(value: string) {
  return decodeURIComponent(
    Array.from(atob(value), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
  );
}

export function pickupTicket(order: ActiveOrder): PickupTicket {
  return {
    id: order.id,
    total: order.total,
    items: order.lines.map((line) => `${line.quantity}× ${line.name}`),
    method: order.method,
  };
}

export function encodePickupQuery(ticket: PickupTicket) {
  return encodeURIComponent(toBase64(JSON.stringify(ticket)));
}

export function decodePickupQuery(raw: string): PickupTicket | null {
  try {
    const parsed = JSON.parse(fromBase64(decodeURIComponent(raw))) as PickupTicket;
    if (!parsed?.id || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function pickupHref(order: ActiveOrder) {
  return `/client/pickup/${encodeURIComponent(order.id)}?p=${encodePickupQuery(pickupTicket(order))}`;
}

export function pickupAbsoluteUrl(order: ActiveOrder) {
  return `${window.location.origin}${pickupHref(order)}`;
}

export const statusCopy: Record<OrderStatus, { short: string; long: string }> = {
  received: { short: "Recibido", long: "El local ya tiene tu pedido." },
  preparing: { short: "En cocina", long: "Lo están preparando ahora." },
  ready: { short: "Listo", long: "Pasa al mostrador a recogerlo." },
};

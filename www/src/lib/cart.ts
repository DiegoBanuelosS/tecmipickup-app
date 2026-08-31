export type CartLine = {
  id: string;
  itemId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number;
  selections: Record<string, string[]>;
  labels: string[];
};

const KEY = "tecmipickup.cart";
const EVENT = "tecmipickup-cart";

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function read(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  emit();
}

export function subscribeCart(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVENT, handler);
  };
}

export function addCartLine(line: Omit<CartLine, "id">) {
  const lines = read();
  const match = lines.find(
    (entry) =>
      entry.itemId === line.itemId && JSON.stringify(entry.selections) === JSON.stringify(line.selections),
  );

  if (match) {
    match.quantity += line.quantity;
    write(lines);
    return;
  }

  lines.push({ ...line, id: `${line.itemId}-${Date.now()}` });
  write(lines);
}

export function addCartLines(lines: CartLine[]) {
  for (const line of lines) {
    addCartLine({
      itemId: line.itemId,
      slug: line.slug,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      selections: line.selections,
      labels: line.labels,
    });
  }
}

export function removeCartLine(id: string) {
  write(read().filter((line) => line.id !== id));
}

export function getCartLines() {
  return read();
}

export function clearCart() {
  write([]);
}

export function cartCount() {
  return read().reduce((sum, line) => sum + line.quantity, 0);
}

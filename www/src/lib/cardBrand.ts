export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

const LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  unknown: "",
};

export function cardBrandLabel(brand: CardBrand) {
  return LABELS[brand];
}

export function detectCardBrand(value: string): CardBrand {
  const pan = value.replace(/\D/g, "");
  if (!pan) {
    return "unknown";
  }

  if (pan.startsWith("4")) {
    return "visa";
  }

  if (/^3[47]/.test(pan)) {
    return "amex";
  }

  if (/^5[1-5]/.test(pan)) {
    return "mastercard";
  }

  const bin4 = Number(pan.slice(0, 4));
  if (pan.length >= 4 && bin4 >= 2221 && bin4 <= 2720) {
    return "mastercard";
  }

  if (/^(6011|65|64[4-9])/.test(pan)) {
    return "discover";
  }

  return "unknown";
}

export function cardPanLength(brand: CardBrand) {
  return brand === "amex" ? 15 : 16;
}

export function cardCvvLength(brand: CardBrand) {
  return brand === "amex" ? 4 : 3;
}

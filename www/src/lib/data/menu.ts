import type { FoodGlyph } from "../../components/client/home/FoodIcons";
import { findCatalogItem, getCatalogItems } from "../catalogStore";
import type { Restaurant } from "./restaurants";

export type OptionKind = "single" | "multi";

export type MenuOption = {
  id: string;
  label: string;
  hint?: string;
  price?: number;
};

export type OptionGroup = {
  id: string;
  title: string;
  kind: OptionKind;
  required: boolean;
  max?: number;
  options: MenuOption[];
};

export type MenuItem = {
  id: string;
  slug: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  glyph: FoodGlyph;
  image?: string;
  groups: OptionGroup[];
};

export const menuItems: MenuItem[] = [
  {
    id: "m-pastor",
    slug: "tacos-pastor",
    restaurantId: "r-buho",
    name: "Tacos al pastor",
    description: "Tres tacos de trompo, piña asada, cilantro y cebolla. Elígelos a tu modo.",
    price: 78,
    glyph: "taco",
    image: "/ads/ad-pastor.png",
    groups: [
      {
        id: "tortilla",
        title: "Tortilla",
        kind: "single",
        required: true,
        options: [
          { id: "maiz", label: "Maíz", hint: "De la casa" },
          { id: "harina", label: "Harina", price: 4 },
          { id: "azul", label: "Maíz azul", price: 6 },
        ],
      },
      {
        id: "salsas",
        title: "Salsas",
        kind: "multi",
        required: false,
        max: 3,
        options: [
          { id: "verde", label: "Verde" },
          { id: "roja", label: "Roja" },
          { id: "habanero", label: "Habanero" },
          { id: "guacamole", label: "Guacamole", price: 12 },
        ],
      },
      {
        id: "extras-pastor",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "queso", label: "Queso fundido", price: 14 },
          { id: "extra-pastor", label: "Extra pastor", price: 22 },
          { id: "pina", label: "Más piña" },
          { id: "cebolla", label: "Cebolla asada", price: 8 },
        ],
      },
    ],
  },
  {
    id: "m-smash",
    slug: "smash-doble",
    restaurantId: "r-bros",
    name: "Smash doble",
    description: "Dos smash, cheddar derretido, pickles y cebolla caramelizada en brioche.",
    price: 129,
    glyph: "burger",
    image: "/ads/ad-burger.png",
    groups: [
      {
        id: "punto",
        title: "Término",
        kind: "single",
        required: true,
        options: [
          { id: "medio", label: "Medio" },
          { id: "tres", label: "Tres cuartos" },
          { id: "bien", label: "Bien cocido" },
        ],
      },
      {
        id: "queso",
        title: "Queso",
        kind: "single",
        required: true,
        options: [
          { id: "cheddar", label: "Cheddar" },
          { id: "americano", label: "Americano" },
          { id: "sin", label: "Sin queso", price: -8 },
        ],
      },
      {
        id: "extras-smash",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "bacon", label: "Tocino", price: 18 },
          { id: "huevo", label: "Huevo frito", price: 16 },
          { id: "jalapeno", label: "Jalapeños" },
          { id: "papas", label: "Papas gajo", price: 32 },
        ],
      },
    ],
  },
  {
    id: "m-bowl",
    slug: "bowl-proteina",
    restaurantId: "r-green",
    name: "Bowl proteína",
    description: "Quinoa, aguacate, pollo a la plancha, edamame y aderezo de hierbas.",
    price: 118,
    glyph: "salad",
    image: "/ads/ad-bowl.png",
    groups: [
      {
        id: "base",
        title: "Base",
        kind: "single",
        required: true,
        options: [
          { id: "quinoa", label: "Quinoa" },
          { id: "arroz", label: "Arroz integral" },
          { id: "mix", label: "Mix de hojas" },
        ],
      },
      {
        id: "proteina",
        title: "Proteína",
        kind: "single",
        required: true,
        options: [
          { id: "pollo", label: "Pollo" },
          { id: "tofu", label: "Tofu" },
          { id: "salmon", label: "Salmón", price: 28 },
        ],
      },
      {
        id: "toppings",
        title: "Complementos",
        kind: "multi",
        required: false,
        max: 4,
        options: [
          { id: "aguacate", label: "Aguacate extra", price: 18 },
          { id: "huevo", label: "Huevo pochado", price: 14 },
          { id: "semillas", label: "Semillas" },
          { id: "feta", label: "Queso feta", price: 16 },
        ],
      },
    ],
  },
  {
    id: "m-matcha",
    slug: "matcha-latte",
    restaurantId: "r-central",
    name: "Matcha latte",
    description: "Matcha ceremonial, leche de tu elección y un toque de vainilla.",
    price: 62,
    glyph: "coffee",
    groups: [
      {
        id: "leche",
        title: "Leche",
        kind: "single",
        required: true,
        options: [
          { id: "entera", label: "Entera" },
          { id: "avena", label: "Avena", price: 8 },
          { id: "almendra", label: "Almendra", price: 8 },
        ],
      },
      {
        id: "temp",
        title: "Temperatura",
        kind: "single",
        required: true,
        options: [
          { id: "caliente", label: "Caliente" },
          { id: "frio", label: "Frío" },
        ],
      },
      {
        id: "extras-cafe",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "espresso", label: "Shot de espresso", price: 12 },
          { id: "vainilla", label: "Vainilla" },
          { id: "pan", label: "Pan dulce", price: 28 },
        ],
      },
    ],
  },
  {
    id: "m-pizza",
    slug: "pizza-margarita",
    restaurantId: "r-pizzalab",
    name: "Pizza margarita",
    description: "Masa madre, salsa San Marzano, mozzarella y albahaca.",
    price: 149,
    glyph: "pizza",
    groups: [
      {
        id: "tamano",
        title: "Tamaño",
        kind: "single",
        required: true,
        options: [
          { id: "personal", label: "Personal" },
          { id: "media", label: "Mediana", price: 40 },
        ],
      },
      {
        id: "borde",
        title: "Borde",
        kind: "single",
        required: true,
        options: [
          { id: "clasico", label: "Clásico" },
          { id: "queso", label: "Relleno de queso", price: 22 },
        ],
      },
      {
        id: "extras-pizza",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "pepperoni", label: "Pepperoni", price: 24 },
          { id: "champi", label: "Champiñones", price: 16 },
          { id: "albahaca", label: "Albahaca extra" },
        ],
      },
    ],
  },
  {
    id: "m-roll",
    slug: "roll-california",
    restaurantId: "r-sushigo",
    name: "California roll",
    description: "Kanikama, pepino, aguacate y ajonjolí. Ocho piezas.",
    price: 98,
    glyph: "sushi",
    groups: [
      {
        id: "acabado",
        title: "Acabado",
        kind: "single",
        required: true,
        options: [
          { id: "ajonjoli", label: "Ajonjolí" },
          { id: "tempura", label: "Tempura", price: 14 },
          { id: "spicy", label: "Spicy mayo" },
        ],
      },
      {
        id: "extras-sushi",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "jengibre", label: "Jengibre extra" },
          { id: "wasabi", label: "Wasabi extra" },
          { id: "edamame", label: "Edamame", price: 28 },
          { id: "miso", label: "Sopa miso", price: 32 },
        ],
      },
    ],
  },
  {
    id: "m-verde",
    slug: "verde-vital",
    restaurantId: "r-vita",
    name: "Verde vital",
    description: "Espinaca, piña, pepino y jengibre. Prensado al momento.",
    price: 48,
    glyph: "drink",
    groups: [
      {
        id: "tamano-jugo",
        title: "Tamaño",
        kind: "single",
        required: true,
        options: [
          { id: "chico", label: "350 ml" },
          { id: "grande", label: "500 ml", price: 12 },
        ],
      },
      {
        id: "extras-jugo",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "jengibre", label: "Jengibre extra" },
          { id: "chia", label: "Chía", price: 8 },
          { id: "proteina", label: "Proteína", price: 18 },
        ],
      },
    ],
  },
  {
    id: "m-cake",
    slug: "cheesecake",
    restaurantId: "r-dulce",
    name: "Cheesecake",
    description: "Rebanada de cheesecake al horno, base de galleta y coulis.",
    price: 72,
    glyph: "cake",
    groups: [
      {
        id: "coulis",
        title: "Coulis",
        kind: "single",
        required: true,
        options: [
          { id: "fresa", label: "Fresa" },
          { id: "maracuya", label: "Maracuyá" },
          { id: "sin", label: "Sin salsa" },
        ],
      },
      {
        id: "extras-postre",
        title: "Complementos",
        kind: "multi",
        required: false,
        options: [
          { id: "chantilly", label: "Chantilly" },
          { id: "cafe", label: "Café americano", price: 28 },
          { id: "nuez", label: "Nuez caramelizada", price: 12 },
        ],
      },
    ],
  },
];

function withZeroPrice(groups: OptionGroup[]): OptionGroup[] {
  return groups.map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option, price: option.price ?? 0 })),
  }));
}

function allMenuItems() {
  const remote = getCatalogItems();
  if (remote.length === 0) {
    return menuItems;
  }

  const seen = new Set(remote.map((item) => item.id));
  return [...remote, ...menuItems.filter((item) => !seen.has(item.id))];
}

export function getMenuItem(slug: string) {
  const item =
    findCatalogItem(slug) ?? menuItems.find((entry) => entry.slug === slug || entry.id === slug);
  if (!item) {
    return null;
  }

  return { ...item, groups: withZeroPrice(item.groups) };
}

export function accompanimentsFor(item: MenuItem, limit = 3) {
  const others = allMenuItems().filter((entry) => entry.id !== item.id);
  const samePlace = others.filter((entry) => entry.restaurantId === item.restaurantId);
  const pairings = others.filter((entry) => {
    if (item.glyph === "drink" || item.glyph === "cake") {
      return true;
    }

    return entry.glyph === "drink" || entry.glyph === "cake";
  });

  const ranked = [...samePlace, ...pairings, ...others];
  const seen = new Set<string>();
  const picks: MenuItem[] = [];

  for (const entry of ranked) {
    if (seen.has(entry.id)) {
      continue;
    }

    seen.add(entry.id);
    picks.push({ ...entry, groups: withZeroPrice(entry.groups) });

    if (picks.length === limit) {
      break;
    }
  }

  return picks;
}

export function restaurantOf(item: MenuItem, list: Restaurant[]) {
  return list.find((restaurant) => restaurant.id === item.restaurantId) ?? null;
}

export function defaultSelections(item: MenuItem) {
  const next: Record<string, string[]> = {};

  for (const group of item.groups) {
    next[group.id] = group.kind === "single" && group.required ? [group.options[0].id] : [];
  }

  return next;
}

export function unitPrice(item: MenuItem, selections: Record<string, string[]>) {
  let total = item.price;

  for (const group of item.groups) {
    const picked = selections[group.id] ?? [];
    for (const option of group.options) {
      if (picked.includes(option.id)) {
        total += option.price ?? 0;
      }
    }
  }

  return total;
}

export function formatMxn(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function groupReady(group: OptionGroup, picked: string[]) {
  if (group.required && picked.length === 0) {
    return false;
  }

  if (group.max && picked.length > group.max) {
    return false;
  }

  return true;
}

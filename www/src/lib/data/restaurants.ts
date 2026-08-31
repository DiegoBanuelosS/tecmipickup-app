import type { FoodGlyph } from "../../components/client/home/FoodIcons";

export type Category = {
  id: string;
  label: string;
  icon: FoodGlyph;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  icon: FoodGlyph;
  /** Soft background tint for the visual tile. Keep within the neutral set. */
  tint: "mist" | "sage" | "cream" | "cloud";
  rating: number;
  reviews: number;
  etaMin: number;
  etaMax: number;
  priceLevel: 1 | 2 | 3;
  tags: string[];
  promo?: string;
  featuredSlug: string;
};

export type Ad = {
  id: string;
  restaurantId: string;
  itemSlug: string;
  image: string;
  headline: string;
  sub: string;
};

export const categories: Category[] = [
  { id: "todo", label: "Todo", icon: "sparkle" },
  { id: "tacos", label: "Tacos", icon: "taco" },
  { id: "cafe", label: "Café", icon: "coffee" },
  { id: "saludable", label: "Saludable", icon: "salad" },
  { id: "pizza", label: "Pizza", icon: "pizza" },
  { id: "sushi", label: "Sushi", icon: "sushi" },
  { id: "burgers", label: "Burgers", icon: "burger" },
  { id: "postres", label: "Postres", icon: "cake" },
  { id: "bebidas", label: "Bebidas", icon: "drink" },
];

export const restaurants: Restaurant[] = [
  {
    id: "r-buho",
    slug: "tacos-el-buho",
    name: "Tacos El Búho",
    categories: ["tacos"],
    icon: "taco",
    tint: "cream",
    rating: 4.8,
    reviews: 412,
    etaMin: 10,
    etaMax: 20,
    priceLevel: 1,
    tags: ["Pastor", "Suadero", "Salsas de la casa"],
    promo: "2x1 en pastor hoy",
    featuredSlug: "tacos-pastor",
  },
  {
    id: "r-central",
    slug: "cafe-central",
    name: "Café Central",
    categories: ["cafe", "postres"],
    icon: "coffee",
    tint: "mist",
    rating: 4.9,
    reviews: 623,
    etaMin: 5,
    etaMax: 12,
    priceLevel: 2,
    tags: ["Espresso", "Matcha", "Pan dulce"],
    featuredSlug: "matcha-latte",
  },
  {
    id: "r-green",
    slug: "green-bowl",
    name: "Green Bowl",
    categories: ["saludable", "bebidas"],
    icon: "salad",
    tint: "sage",
    rating: 4.7,
    reviews: 288,
    etaMin: 8,
    etaMax: 15,
    priceLevel: 2,
    tags: ["Bowls", "Prensados", "Proteína"],
    promo: "−15% en bowls",
    featuredSlug: "bowl-proteina",
  },
  {
    id: "r-pizzalab",
    slug: "pizza-lab",
    name: "Pizza Lab",
    categories: ["pizza"],
    icon: "pizza",
    tint: "cloud",
    rating: 4.6,
    reviews: 351,
    etaMin: 15,
    etaMax: 25,
    priceLevel: 2,
    tags: ["Masa madre", "Horno de piedra"],
    featuredSlug: "pizza-margarita",
  },
  {
    id: "r-sushigo",
    slug: "sushi-go",
    name: "Sushi Go",
    categories: ["sushi"],
    icon: "sushi",
    tint: "mist",
    rating: 4.5,
    reviews: 197,
    etaMin: 18,
    etaMax: 30,
    priceLevel: 3,
    tags: ["Rollos", "Poke", "Ramen"],
    featuredSlug: "roll-california",
  },
  {
    id: "r-bros",
    slug: "burger-bros",
    name: "Burger Bros",
    categories: ["burgers"],
    icon: "burger",
    tint: "cream",
    rating: 4.4,
    reviews: 509,
    etaMin: 12,
    etaMax: 22,
    priceLevel: 2,
    tags: ["Smash", "Papas gajo", "Malteadas"],
    promo: "-20% en combos",
    featuredSlug: "smash-doble",
  },
  {
    id: "r-vita",
    slug: "jugos-vita",
    name: "Jugos Vita",
    categories: ["bebidas", "saludable"],
    icon: "drink",
    tint: "sage",
    rating: 4.8,
    reviews: 164,
    etaMin: 4,
    etaMax: 10,
    priceLevel: 1,
    tags: ["Jugos", "Smoothies", "Chai"],
    featuredSlug: "verde-vital",
  },
  {
    id: "r-dulce",
    slug: "dulce-taller",
    name: "Dulce Taller",
    categories: ["postres", "cafe"],
    icon: "cake",
    tint: "cloud",
    rating: 4.9,
    reviews: 231,
    etaMin: 10,
    etaMax: 18,
    priceLevel: 2,
    tags: ["Cheesecake", "Brownies", "Galletas"],
    featuredSlug: "cheesecake",
  },
];

export const ads: Ad[] = [
  {
    id: "ad-pastor",
    restaurantId: "r-buho",
    itemSlug: "tacos-pastor",
    image: "/ads/ad-pastor.png",
    headline: "2x1 en pastor",
    sub: "Solo por hoy, con piña y todo",
  },
  {
    id: "ad-burger",
    restaurantId: "r-bros",
    itemSlug: "smash-doble",
    image: "/ads/ad-burger.png",
    headline: "−20% en combos",
    sub: "Smash doble + papas gajo",
  },
  {
    id: "ad-bowl",
    restaurantId: "r-green",
    itemSlug: "bowl-proteina",
    image: "/ads/ad-bowl.png",
    headline: "−15% en bowls",
    sub: "Fresco y listo para recoger",
  },
];

export function filterByCategory(list: Restaurant[], categoryId: string) {
  if (categoryId === "todo") {
    return list;
  }

  return list.filter((restaurant) => restaurant.categories.includes(categoryId));
}

export function priceLabel(level: Restaurant["priceLevel"]) {
  return "$".repeat(level);
}

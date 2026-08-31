import type { FoodGlyph } from "../../components/client/home/FoodIcons";
import type { MenuItem, MenuOption, OptionGroup, OptionKind } from "../data/menu";
import type { Ad, Category, Restaurant } from "../data/restaurants";
import { asNumber, asString, isRecord, pick, slugify, unwrapList, unwrapObject } from "./normalize";

const tints: Restaurant["tint"][] = ["mist", "sage", "cream", "cloud"];

function glyphFromLabel(value: string): FoodGlyph {
  const text = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (text.includes("taco")) return "taco";
  if (text.includes("cafe") || text.includes("coffee")) return "coffee";
  if (text.includes("ensalad") || text.includes("salud") || text.includes("bowl")) return "salad";
  if (text.includes("pizza")) return "pizza";
  if (text.includes("sushi")) return "sushi";
  if (text.includes("burger") || text.includes("hamburg")) return "burger";
  if (text.includes("postre") || text.includes("cake") || text.includes("dulce")) return "cake";
  if (text.includes("bebida") || text.includes("drink") || text.includes("agua")) return "drink";
  return "plate";
}

function mapOption(raw: unknown, index: number): MenuOption | null {
  const row = unwrapObject(raw);
  const label = asString(pick(row, "label", "nombre", "name", "titulo"));
  if (!label) {
    return null;
  }

  return {
    id: asString(pick(row, "id", "opcionId"), `${index}-${slugify(label)}`),
    label,
    hint: asString(pick(row, "hint", "descripcion", "description")) || undefined,
    price: asNumber(pick(row, "price", "precio", "extra"), 0) || undefined,
  };
}

function mapGroup(raw: unknown, index: number): OptionGroup | null {
  const row = unwrapObject(raw);
  const title = asString(pick(row, "title", "titulo", "nombre", "name"));
  const options = unwrapList(pick(row, "options", "opciones", "extras") ?? raw).flatMap((entry, optionIndex) => {
    const mapped = mapOption(entry, optionIndex);
    return mapped ? [mapped] : [];
  });

  if (!title || options.length === 0) {
    return null;
  }

  const kindRaw = asString(pick(row, "kind", "tipo"), "single").toLowerCase();
  const kind: OptionKind = kindRaw.includes("multi") || kindRaw.includes("varios") ? "multi" : "single";

  return {
    id: asString(pick(row, "id", "grupoId"), `${index}-${slugify(title)}`),
    title,
    kind,
    required: Boolean(pick(row, "required", "requerido")) || kind === "single",
    max: asNumber(pick(row, "max", "maximo"), 0) || undefined,
    options,
  };
}

export function mapCategory(raw: unknown): Category | null {
  const row = unwrapObject(raw);
  const label = asString(pick(row, "label", "nombre", "name", "titulo"));
  const id = asString(pick(row, "id", "categoriaId", "idCategoria"), label ? slugify(label) : "");

  if (!id || !label || id === "todo") {
    return null;
  }

  return {
    id,
    label,
    icon: glyphFromLabel(asString(pick(row, "icon", "icono"), label)),
  };
}

export function mapCategories(raw: unknown): Category[] {
  const mapped = unwrapList(raw, "categorias", "categories")
    .map((entry) => mapCategory(entry))
    .filter((entry): entry is Category => Boolean(entry));

  return [{ id: "todo", label: "Todo", icon: "sparkle" }, ...mapped];
}

export function mapProduct(raw: unknown): MenuItem | null {
  const row = unwrapObject(raw);
  const name = asString(pick(row, "name", "nombre", "titulo", "title"));
  const id = asString(pick(row, "id", "productoId", "idProducto"), name ? slugify(name) : "");

  if (!id || !name) {
    return null;
  }

  const categoryId = asString(pick(row, "categoriaId", "idCategoria", "categoryId", "categoria"));
  const restaurantId = asString(
    pick(row, "restauranteId", "idRestaurante", "restaurantId"),
    categoryId || `p-${id}`,
  );
  const slug = asString(pick(row, "slug"), slugify(name) || `p-${id}`);
  const groups = unwrapList(pick(row, "groups", "grupos", "opciones", "extras")).flatMap((entry, index) => {
    const mapped = mapGroup(entry, index);
    return mapped ? [mapped] : [];
  });

  return {
    id: String(id),
    slug,
    restaurantId,
    name,
    description: asString(pick(row, "description", "descripcion", "detalle")),
    price: asNumber(pick(row, "price", "precio", "precioUnitario")),
    glyph: glyphFromLabel(asString(pick(row, "icon", "icono", "categoriaNombre"), name)),
    image: asString(pick(row, "image", "imagen", "urlImagen", "foto", "imageUrl")) || undefined,
    groups,
  };
}

export function mapProducts(raw: unknown): MenuItem[] {
  return unwrapList(raw, "productos", "products")
    .map((entry) => mapProduct(entry))
    .filter((entry): entry is MenuItem => Boolean(entry));
}

export function restaurantsFromProducts(products: MenuItem[], categories: Category[] = []): Restaurant[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return products.map((product, index) => {
    const category = byId.get(product.restaurantId);
    const priceLevel: Restaurant["priceLevel"] = product.price >= 120 ? 3 : product.price >= 70 ? 2 : 1;

    return {
      id: product.restaurantId.startsWith("r-") ? product.restaurantId : `p-${product.id}`,
      slug: product.slug,
      name: product.name,
      categories: category ? [category.id] : product.restaurantId ? [product.restaurantId] : [],
      icon: product.glyph,
      tint: tints[index % tints.length],
      rating: 4.6,
      reviews: 0,
      etaMin: 8,
      etaMax: 16,
      priceLevel,
      tags: category ? [category.label] : [],
      featuredSlug: product.slug,
    };
  });
}

export function mapRestaurant(raw: unknown, index: number): Restaurant | null {
  const row = unwrapObject(raw);
  const name = asString(pick(row, "name", "nombre", "titulo"));
  const id = asString(pick(row, "id", "restauranteId", "idRestaurante"), name ? slugify(name) : "");

  if (!id || !name) {
    return null;
  }

  const featured = asString(
    pick(row, "featuredSlug", "productoDestacado", "featuredProductId", "slug"),
    slugify(name),
  );
  const categoryIds = unwrapList(pick(row, "categories", "categorias") ?? []).map((entry) =>
    isRecord(entry) ? asString(pick(entry, "id", "categoriaId"), asString(entry.nombre)) : asString(entry),
  );

  return {
    id,
    slug: asString(pick(row, "slug"), slugify(name)),
    name,
    categories: categoryIds.filter(Boolean),
    icon: glyphFromLabel(asString(pick(row, "icon", "icono"), name)),
    tint: tints[index % tints.length],
    rating: asNumber(pick(row, "rating", "calificacion"), 4.6),
    reviews: asNumber(pick(row, "reviews", "resenas", "opiniones")),
    etaMin: asNumber(pick(row, "etaMin", "tiempoMin", "prepMin"), 8),
    etaMax: asNumber(pick(row, "etaMax", "tiempoMax", "prepMax"), 16),
    priceLevel: (asNumber(pick(row, "priceLevel", "nivelPrecio"), 2) as Restaurant["priceLevel"]) || 2,
    tags: unwrapList(pick(row, "tags") ?? []).map((entry) => asString(entry)).filter(Boolean),
    promo: asString(pick(row, "promo", "promocion")) || undefined,
    featuredSlug: featured,
  };
}

export function mapRestaurants(raw: unknown): Restaurant[] {
  return unwrapList(raw, "restaurantes", "restaurants")
    .map((entry, index) => mapRestaurant(entry, index))
    .filter((entry): entry is Restaurant => Boolean(entry));
}

export function mapAds(raw: unknown, products: MenuItem[], places: Restaurant[]): Ad[] {
  const mapped = unwrapList(raw, "anuncios", "ads")
    .map((entry, index) => {
      const row = unwrapObject(entry);
      const itemSlug = asString(pick(row, "itemSlug", "slug", "productoSlug", "productoId"));
      const image = asString(pick(row, "image", "imagen", "urlImagen"));
      if (!itemSlug && !image) {
        return null;
      }

      const product = products.find((item) => item.slug === itemSlug || item.id === itemSlug);

      return {
        id: asString(pick(row, "id"), `ad-${index}`),
        restaurantId: asString(pick(row, "restaurantId", "restauranteId"), product?.restaurantId || places[0]?.id || ""),
        itemSlug: itemSlug || product?.slug || "",
        image: image || product?.image || "",
        headline: asString(pick(row, "headline", "titulo", "nombre"), product?.name || "Destacado"),
        sub: asString(pick(row, "sub", "descripcion", "copy"), product?.description || ""),
      } satisfies Ad;
    })
    .filter((entry): entry is Ad => Boolean(entry && (entry.image || entry.itemSlug)));

  if (mapped.length > 0) {
    return mapped;
  }

  return products
    .filter((item) => item.image)
    .slice(0, 3)
    .map((item, index) => ({
      id: `ad-${item.id}`,
      restaurantId: places[index]?.id || item.restaurantId,
      itemSlug: item.slug,
      image: item.image ?? "",
      headline: item.name,
      sub: item.description,
    }));
}

export function applySchedule(places: Restaurant[], rawHours: unknown): Restaurant[] {
  const rows = unwrapList(rawHours, "horarios", "hours");
  if (rows.length === 0) {
    return places;
  }

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  let open = true;
  let etaMin = 0;
  let etaMax = 0;

  for (const entry of rows) {
    const row = unwrapObject(entry);
    const start = parseClock(asString(pick(row, "horaApertura", "apertura", "inicio", "open")));
    const end = parseClock(asString(pick(row, "horaCierre", "cierre", "fin", "close")));
    const flagged = pick(row, "abierto", "open", "isOpen");

    if (typeof flagged === "boolean") {
      open = flagged;
    } else if (start !== null && end !== null) {
      open = start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
    }

    etaMin = Math.max(etaMin, asNumber(pick(row, "etaMin", "tiempoMin")));
    etaMax = Math.max(etaMax, asNumber(pick(row, "etaMax", "tiempoMax")));
  }

  return places.map((place) => ({
    ...place,
    promo: !open ? place.promo ?? "Cerrado ahora" : place.promo,
    etaMin: etaMin || place.etaMin,
    etaMax: etaMax || place.etaMax,
  }));
}

function parseClock(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

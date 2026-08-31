import {
  ads as localAds,
  categories as localCategories,
  restaurants as localRestaurants,
  type Ad,
  type Category,
  type Restaurant,
} from "../data/restaurants";
import { fetchHomeFromApi } from "./catalog";

export type HomeData = {
  categories: Category[];
  restaurants: Restaurant[];
  ads: Ad[];
};

export type HomeCounts = {
  categories: number;
  restaurants: number;
  ads: number;
};

const COUNTS_KEY = "tecmipickup.home.counts";

/** Conteos de la fuente local; sirven de base la primera vez y en SSR. */
export const defaultHomeCounts: HomeCounts = {
  categories: localCategories.length,
  restaurants: localRestaurants.length,
  ads: localAds.length,
};

function sanitize(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), 40)
    : fallback;
}

/**
 * Cuántos elementos se esperan antes de que llegue la data:
 * usa los conteos de la última carga exitosa (localStorage) para que
 * el skeleton refleje la cantidad real de elementos.
 */
export function getExpectedCounts(): HomeCounts {
  if (typeof window === "undefined") {
    return defaultHomeCounts;
  }

  try {
    const raw = window.localStorage.getItem(COUNTS_KEY);
    if (!raw) {
      return defaultHomeCounts;
    }

    const parsed = JSON.parse(raw) as Partial<HomeCounts>;
    return {
      categories: sanitize(parsed.categories, defaultHomeCounts.categories),
      restaurants: sanitize(parsed.restaurants, defaultHomeCounts.restaurants),
      ads: sanitize(parsed.ads, defaultHomeCounts.ads),
    };
  } catch {
    return defaultHomeCounts;
  }
}

function rememberCounts(data: HomeData) {
  try {
    window.localStorage.setItem(
      COUNTS_KEY,
      JSON.stringify({
        categories: data.categories.length,
        restaurants: data.restaurants.length,
        ads: data.ads.length,
      }),
    );
  } catch {
    // Sin almacenamiento disponible, el skeleton usará los conteos base.
  }
}

const localHome = (): HomeData => ({
  categories: localCategories,
  restaurants: localRestaurants,
  ads: localAds,
});

export async function fetchHomeData(): Promise<HomeData> {
  try {
    const data = await fetchHomeFromApi();
    if (data.restaurants.length === 0 && data.categories.length <= 1) {
      const fallback = localHome();
      rememberCounts(fallback);
      return fallback;
    }

    rememberCounts(data);
    return data;
  } catch {
    const fallback = localHome();
    rememberCounts(fallback);
    return fallback;
  }
}

export async function prefetchCatalog() {
  try {
    await fetchHomeFromApi();
  } catch {
    // El catálogo local sigue disponible.
  }
}

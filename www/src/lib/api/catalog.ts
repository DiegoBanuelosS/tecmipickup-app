import { setCatalog } from "../catalogStore";
import type { MenuItem } from "../data/menu";
import type { Ad, Category, Restaurant } from "../data/restaurants";
import { apiFetch } from "./client";
import {
  applySchedule,
  mapAds,
  mapCategories,
  mapProducts,
  mapRestaurants,
  restaurantsFromProducts,
} from "./mappers";

export type CatalogHome = {
  categories: Category[];
  restaurants: Restaurant[];
  ads: Ad[];
};

function hydrate(items: MenuItem[], places: Restaurant[]) {
  setCatalog(items, places);
}

export async function fetchCategorias(): Promise<Category[]> {
  return mapCategories(await apiFetch<unknown>("/api/categorias"));
}

export async function fetchProductos(): Promise<MenuItem[]> {
  return mapProducts(await apiFetch<unknown>("/api/productos"));
}

export async function fetchProductosByCategoria(categoriaId: string): Promise<MenuItem[]> {
  const items = mapProducts(await apiFetch<unknown>(`/api/productos/categoria/${encodeURIComponent(categoriaId)}`));
  hydrate(items, restaurantsFromProducts(items));
  return items;
}

export async function fetchHorarios() {
  return apiFetch<unknown>("/api/horarios");
}

export async function fetchHomeFromApi(): Promise<CatalogHome> {
  const [homeResult, categoriasResult, productosResult, horariosResult] = await Promise.allSettled([
    apiFetch<unknown>("/api/home"),
    apiFetch<unknown>("/api/categorias"),
    apiFetch<unknown>("/api/productos"),
    apiFetch<unknown>("/api/horarios"),
  ]);

  const home = homeResult.status === "fulfilled" ? homeResult.value : null;
  const categoriasRaw = categoriasResult.status === "fulfilled" ? categoriasResult.value : home;
  const productosRaw = productosResult.status === "fulfilled" ? productosResult.value : home;
  const horariosRaw = horariosResult.status === "fulfilled" ? horariosResult.value : home;

  const categories = mapCategories(categoriasRaw ?? home);
  const products = mapProducts(productosRaw ?? home);
  const listed = mapRestaurants(home);
  const places = applySchedule(
    listed.length > 0 ? listed : restaurantsFromProducts(products, categories),
    horariosRaw,
  );
  const ads = mapAds(home, products, places);

  hydrate(products, places);

  return { categories, restaurants: places, ads };
}

export async function restaurantsForCategory(categoriaId: string): Promise<Restaurant[]> {
  const items = await fetchProductosByCategoria(categoriaId);
  return restaurantsFromProducts(items);
}

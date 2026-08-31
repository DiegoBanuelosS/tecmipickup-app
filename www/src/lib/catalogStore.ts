import type { MenuItem } from "./data/menu";
import { restaurants as localRestaurants, type Restaurant } from "./data/restaurants";

let remoteItems: MenuItem[] = [];
let remoteRestaurants: Restaurant[] = [];

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const next = [...current];

  for (const item of incoming) {
    const index = next.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      next[index] = item;
    } else {
      next.push(item);
    }
  }

  return next;
}

export function setCatalog(items: MenuItem[], places: Restaurant[]) {
  if (items.length > 0) {
    remoteItems = mergeById(remoteItems, items);
  }

  if (places.length > 0) {
    remoteRestaurants = mergeById(remoteRestaurants, places);
  }
}

export function getCatalogItems() {
  return remoteItems;
}

export function getCatalogRestaurants() {
  return remoteRestaurants.length > 0 ? remoteRestaurants : localRestaurants;
}

export function findCatalogItem(slugOrId: string) {
  return (
    remoteItems.find((item) => item.slug === slugOrId || item.id === slugOrId) ??
    null
  );
}

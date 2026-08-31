export const routes = {
  auth: "/auth",
  client: "/client",
  clientCart: "/client/cart",
  clientPay: "/client/pay",
  clientSearch: "/client/search",
  restaurant: "/restaurant",
} as const;

export function itemPath(slug: string) {
  return `/client/item/${slug}`;
}

export function pickupPath(id: string) {
  return `/client/pickup/${id}`;
}

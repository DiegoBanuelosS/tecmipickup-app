export { apiConfig } from "./config";
export { apiFetch, ApiError } from "./client";
export { login, register, forgotPassword } from "./auth";
export type { LoginPayload, RegisterPayload, ForgotPasswordPayload } from "./auth";
export { fetchHomeData, prefetchCatalog, getExpectedCounts, defaultHomeCounts } from "./home";
export type { HomeData, HomeCounts } from "./home";
export { fetchProductosByCategoria, restaurantsForCategory } from "./catalog";
export { createPedido, fetchPedido, fetchUserPedidos } from "./orders";

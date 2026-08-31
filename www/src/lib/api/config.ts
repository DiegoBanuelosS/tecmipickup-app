const DEFAULT_ORIGIN = "https://tecmiratti.fly.dev";

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "").replace(/\/api$/i, "");
}

export const apiConfig = {
  /** Origin only. Paths always start with `/api/...`. */
  baseUrl: normalizeOrigin(process.env.NEXT_PUBLIC_API_URL || DEFAULT_ORIGIN),
  /**
   * Local-only login. Leave unset (or `0`) to use the real API.
   * Set NEXT_PUBLIC_AUTH_BYPASS=1 to skip the backend.
   */
  bypassAuth: process.env.NEXT_PUBLIC_AUTH_BYPASS === "1",
} as const;

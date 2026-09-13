const DEFAULT_ORIGIN = "https://tecmipickup.fly.dev";

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "").replace(/\/api$/i, "");
}

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_API_URL);
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8080";
    }
  }
  return DEFAULT_ORIGIN;
}

export const apiConfig = {
  /** Origin only. Paths always start with `/api/...`. */
  get baseUrl() {
    return resolveBaseUrl();
  },
  /**
   * Local-only login. Leave unset (or `0`) to use the real API.
   * Set NEXT_PUBLIC_AUTH_BYPASS=1 to skip the backend.
   */
  get bypassAuth() {
    return process.env.NEXT_PUBLIC_AUTH_BYPASS === "1";
  },
};


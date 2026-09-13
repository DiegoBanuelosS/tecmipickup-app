import { apiConfig } from "./config";
import { getSession } from "../session";
import { isRecord } from "./normalize";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function apiUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${suffix}`;
}

function sameOriginRequest() {
  if (typeof window === "undefined") {
    return false;
  }

  return apiConfig.baseUrl === window.location.origin;
}

function isAuthPath(path: string) {
  return path.startsWith("/api/auth/");
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as unknown;
    if (!isRecord(payload)) {
      return "No se pudo completar la solicitud.";
    }

    const errors = payload.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === "string" && first.trim()) {
        return first;
      }
      if (isRecord(first) && typeof first.message === "string") {
        return first.message;
      }
    }

    for (const key of ["message", "error", "detail", "title"]) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }

    return "No se pudo completar la solicitud.";
  } catch {
    return "No se pudo completar la solicitud.";
  }
}

async function doFetch(url: string, headers: Headers, init: RequestInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
      credentials: sameOriginRequest() ? "include" : "omit",
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!apiConfig.baseUrl) {
    throw new ApiError("La API aún no está configurada.", 0);
  }

  const headers = new Headers(init.headers);
  const session = getSession();
  const token = session?.token && session.token !== "bypass" ? session.token : "";

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !isAuthPath(path) && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  const targetUrl = apiUrl(path);

  try {
    response = await doFetch(targetUrl, headers, init, 5000);
  } catch (err: unknown) {
    const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
    const isNotLocalUrl = !targetUrl.includes("localhost:8080") && !targetUrl.includes("127.0.0.1:8080");

    if (isLocal && isNotLocalUrl) {
      try {
        const localUrl = `http://localhost:8080${path.startsWith("/") ? path : `/${path}`}`;
        response = await doFetch(localUrl, headers, init, 5000);
      } catch {
        throw new ApiError("No se pudo conectar con el servidor. Verifica que el backend esté activo.", 0);
      }
    } else {
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiError("El servidor tardó demasiado en responder.", 408);
      }
      throw new ApiError("No se pudo conectar con el servidor.", 0);
    }
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

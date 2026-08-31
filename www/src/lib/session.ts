export type AuthUser = {
  id: string;
  email: string;
  name: string;
  matricula: string;
  role: "client" | "restaurant";
};

export type Session = {
  token: string;
  user: AuthUser;
};

const KEY = "tecmipickup.session";

export function buildMatricula(seed: string) {
  let hash = 1748932;
  for (const char of seed) {
    hash = (hash * 33 + char.charCodeAt(0)) % 10_000_000;
  }
  return `A0${String(hash).padStart(7, "0")}`;
}

function store(remember: boolean) {
  if (typeof window === "undefined") {
    return null;
  }

  return remember ? window.localStorage : window.sessionStorage;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Session;
    return {
      ...parsed,
      user: {
        id: parsed.user?.id ?? "local-user",
        email: parsed.user?.email ?? "",
        name: parsed.user?.name || "Invitado",
        matricula: parsed.user?.matricula || buildMatricula(parsed.user?.email || parsed.user?.name || "invitado"),
        role: parsed.user?.role === "restaurant" ? "restaurant" : "client",
      },
    };
  } catch {
    return null;
  }
}

export function setSession(session: Session, remember = true) {
  const target = store(remember);
  const other = store(!remember);
  other?.removeItem(KEY);
  target?.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
}

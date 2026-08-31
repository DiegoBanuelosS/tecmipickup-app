import { apiConfig } from "./config";
import { apiFetch, ApiError } from "./client";
import { asString, pick, readJwtClaims, unwrapObject } from "./normalize";
import { setSession, buildMatricula, type AuthUser, type Session } from "../session";

export type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

function bypassSession(email: string, name = "Invitado"): Session {
  const resolvedEmail = email || "invitado@tecmipickup.local";
  const user: AuthUser = {
    id: "local-user",
    email: resolvedEmail,
    name: name || "Invitado",
    matricula: buildMatricula(resolvedEmail),
    role: "client",
  };

  return {
    token: "bypass",
    user,
  };
}

function toSession(raw: unknown, fallbackEmail = "", fallbackName = ""): Session {
  const root = unwrapObject(raw);
  const userRaw = unwrapObject(pick(root, "user", "usuario", "account") ?? root);
  const token = asString(
    pick(root, "token", "accessToken", "access_token", "jwt", "jwtToken") ??
      pick(userRaw, "token", "accessToken"),
  );

  if (!token) {
    throw new ApiError("La API no devolvió una sesión válida.", 0);
  }

  const claims = readJwtClaims(token) ?? {};
  const email =
    asString(pick(userRaw, "email", "correo", "username") ?? pick(claims, "email", "sub")) ||
    fallbackEmail;
  const name =
    asString(pick(userRaw, "name", "nombre", "fullName") ?? pick(claims, "name", "nombre")) ||
    fallbackName ||
    email.split("@")[0] ||
    "Invitado";
  const id = asString(
    pick(userRaw, "id", "usuarioId", "idUsuario", "userId") ?? pick(claims, "id", "uid", "sub"),
    email || "user",
  );

  return {
    token,
    user: {
      id,
      email,
      name,
      matricula: asString(pick(userRaw, "matricula", "matrícula"), buildMatricula(email || id)),
      role: asString(pick(userRaw, "role", "rol")) === "restaurant" ? "restaurant" : "client",
    },
  };
}

export async function login(payload: LoginPayload): Promise<Session> {
  if (apiConfig.bypassAuth) {
    const session = bypassSession(payload.email);
    setSession(session, payload.remember ?? true);
    return session;
  }

  try {
    const raw = await apiFetch<unknown>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        correo: payload.email,
        password: payload.password,
        contrasena: payload.password,
      }),
    });

    const session = toSession(raw, payload.email);
    setSession(session, payload.remember ?? true);
    return session;
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
      throw new ApiError("Correo o contraseña incorrectos.", cause.status);
    }
    throw cause;
  }
}

export async function register(payload: RegisterPayload): Promise<Session | void> {
  if (apiConfig.bypassAuth) {
    return;
  }

  const raw = await apiFetch<unknown>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      nombre: payload.name,
      name: payload.name,
      email: payload.email,
      correo: payload.email,
      password: payload.password,
      contrasena: payload.password,
    }),
  });

  if (raw === undefined || !pick(unwrapObject(raw), "token", "accessToken", "jwt")) {
    return;
  }

  try {
    const session = toSession(raw, payload.email, payload.name);
    setSession(session, true);
    return session;
  } catch {
    return;
  }
}

export async function forgotPassword(_payload: ForgotPasswordPayload): Promise<void> {
  // No hay endpoint de recuperación en la API actual.
}

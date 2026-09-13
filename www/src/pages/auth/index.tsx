import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { routes } from "@config/Router";
import { LOGO_SRC } from "../../components/client/Brand";
import { ApiError, forgotPassword, login, register } from "@lib/api";
import { playEntrance, playLeave, playSwap } from "@lib/auth/motion";
import styles from "./AuthPage.module.css";

gsap.registerPlugin(useGSAP);

type AuthView = "login" | "register" | "forgot";

const titles: Record<AuthView, string> = {
  login: "Inicia sesión",
  register: "Crea tu cuenta",
  forgot: "¿Olvidaste tu contraseña?",
};

export default function AuthPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const skipNextEnter = useRef(true);
  const [view, setView] = useState<AuthView>("login");
  const [swapped, setSwapped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [matricula, setMatricula] = useState("");
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { contextSafe } = useGSAP(
    () => {
      const form = formRef.current;
      if (!form) {
        return;
      }

      playEntrance({
        form,
        visual: visualRef.current,
        submit: submitRef.current,
      });
    },
    { scope: pageRef },
  );

  useGSAP(
    () => {
      if (skipNextEnter.current) {
        skipNextEnter.current = false;
        return;
      }

      const form = formRef.current;
      if (!form) {
        return;
      }

      playEntrance(
        {
          form,
          visual: visualRef.current,
          submit: submitRef.current,
        },
        { animateVisual: false, animateBrand: false },
      );
    },
    { dependencies: [view, swapped], scope: pageRef, revertOnUpdate: false },
  );

  const goToView = contextSafe((next: AuthView, options?: { force?: boolean }) => {
    if ((!options?.force && busy) || next === view) {
      return;
    }

    setError("");
    const shouldSwap = (view === "login" && next === "register") || (view === "register" && next === "login");

    if (!shouldSwap) {
      setView(next);
      return;
    }

    const form = formRef.current;
    if (!form) {
      setSwapped(next === "register");
      setView(next);
      return;
    }

    setBusy(true);
    skipNextEnter.current = true;

    void playSwap({
      form,
      visual: visualRef.current,
      submit: submitRef.current,
      card: cardRef.current,
      swapToRegister: next === "register",
      onCross: () => {
        setSwapped(next === "register");
        setView(next);
      },
    }).then(() => {
      setBusy(false);
    });
  });

  const animateLeave = contextSafe(() => {
    const form = formRef.current;
    if (!form) {
      return Promise.resolve();
    }

    return playLeave({
      form,
      visual: visualRef.current,
      submit: submitRef.current,
    });
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setError("");
    const remember = new FormData(event.currentTarget).get("remember") === "on";

    if (view === "forgot") {
      setBusy(true);
      try {
        await forgotPassword({ email });
        setSent(true);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "No se pudo enviar el enlace.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (view === "register") {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError("Por favor completa los campos de nombre, correo y contraseña.");
        return;
      }

      setBusy(true);
      try {
        const session = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          matricula: matricula.trim(),
          isRestaurant,
        });
        try {
          await Promise.race([
            animateLeave(),
            new Promise((resolve) => setTimeout(resolve, 400)),
          ]);
        } catch {
          // ignore animation failure
        }
        const targetRoute = isRestaurant || session?.user?.role === "restaurant" ? routes.restaurant : routes.client;
        await router.push(targetRoute);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "No se pudo crear la cuenta.");
        setBusy(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setBusy(true);

    try {
      const session = await login({ email: email.trim(), password, remember });
      try {
        await Promise.race([
          animateLeave(),
          new Promise((resolve) => setTimeout(resolve, 400)),
        ]);
      } catch {
        // ignore animation failure
      }
      const targetRoute = session?.user?.role === "restaurant" ? routes.restaurant : routes.client;
      await router.push(targetRoute);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo entrar.");
      setBusy(false);
    }
  }

  const heading = titles[view];

  return (
    <main className={styles.page} ref={pageRef}>
      <div className={styles.brand} aria-label="Tecmipickup">
        <Image src={LOGO_SRC} alt="Tecmipickup" width={220} height={44} priority className={styles.brandLogo} />
      </div>

      <section
        className={`${styles.card} ${swapped ? styles.cardSwapped : ""}`}
        aria-labelledby="auth-heading"
        ref={cardRef}
      >
        <div className={styles.formPane} ref={formRef}>
          <header className={styles.header}>
            <h1 id="auth-heading">{heading}</h1>
          </header>

          <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={busy}>
            {view === "register" ? (
              <>
                <label className={styles.field}>
                  <span>Nombre</span>
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Ana Miratti"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>

                <div className={styles.field}>
                  <div className={styles.fieldHeader}>
                    <label htmlFor="matricula-input" className={styles.fieldLabelAnimated}>
                      <span key={isRestaurant ? "rest" : "mat"} className={styles.fadeText}>
                        {isRestaurant ? "Código de Restaurante" : "Matrícula"}
                      </span>
                    </label>
                    <label className={styles.roleToggle}>
                      <input
                        type="checkbox"
                        checked={isRestaurant}
                        onChange={(event) => setIsRestaurant(event.target.checked)}
                      />
                      <span>Soy restaurante</span>
                    </label>
                  </div>
                  <div className={styles.inputWrap}>
                    <span
                      className={`${styles.restaurantIcon} ${isRestaurant ? styles.restaurantIconActive : ""}`}
                      aria-hidden="true"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                        <line x1="6" y1="1" x2="6" y2="4"/>
                        <line x1="10" y1="1" x2="10" y2="4"/>
                        <line x1="14" y1="1" x2="14" y2="4"/>
                      </svg>
                    </span>
                    <input
                      id="matricula-input"
                      name={isRestaurant ? "codigoRestaurante" : "matricula"}
                      autoComplete="off"
                      placeholder={isRestaurant ? "Ej. REST-1024" : "Ej. AL02938475"}
                      value={matricula}
                      onChange={(event) => setMatricula(event.target.value)}
                      className={`${styles.morphInput} ${isRestaurant ? styles.morphInputRestaurant : ""}`}
                    />
                  </div>
                </div>
              </>
            ) : null}

            <label className={styles.field}>
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {view !== "forgot" ? (
              <label className={styles.field}>
                <span>Contraseña</span>
                <div className={styles.passwordRow}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete={view === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </label>
            ) : null}

            {view === "login" ? (
              <div className={styles.inlineLinks}>
                <label className={styles.remember}>
                  <input type="checkbox" name="remember" />
                  Recuérdame
                </label>
                <button
                  type="button"
                  className={styles.textLink}
                  onClick={() => {
                    setSent(false);
                    goToView("forgot");
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            ) : null}

            {view === "forgot" && sent ? (
              <p className={styles.notice} role="status">
                Si existe una cuenta con {email || "ese correo"}, te enviamos las instrucciones.
              </p>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className={styles.submit} ref={submitRef} disabled={busy}>
              {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
              <span>
                {view === "login"
                  ? "Iniciar sesión"
                  : view === "register"
                    ? "Crear cuenta"
                    : sent
                      ? "Reenviar enlace"
                      : "Enviar enlace"}
              </span>
            </button>
          </form>

          <p className={styles.switch}>
            {view === "login" ? (
              <>
                ¿No tienes cuenta?{" "}
                <button type="button" className={styles.textLink} onClick={() => goToView("register")}>
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <button type="button" className={styles.textLink} onClick={() => goToView("login")}>
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>

        <aside className={styles.visual} aria-hidden="true" ref={visualRef}>
          <div className={styles.visualFrame}>
            <div className={styles.heroMotion}>
              <Image
                src="/auth-hero.png"
                alt=""
                fill
                priority
                sizes="(max-width: 860px) 0px, 54vw"
                className={styles.heroImage}
              />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

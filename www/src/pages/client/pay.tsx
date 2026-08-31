import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, useReducedMotion } from "motion/react";
import ClientShell from "../../components/client/ClientShell";
import { FoodIcon } from "../../components/client/home/FoodIcons";
import CardBrandIcon from "../../components/client/CardBrandIcon";
import PayButton from "../../components/client/PayButton";
import { routes } from "@config/Router";
import { detectCardBrand, cardBrandLabel } from "@lib/cardBrand";
import { clearCart, getCartLines, type CartLine } from "@lib/cart";
import { ApiError } from "@lib/api";
import { getCatalogRestaurants } from "@lib/catalogStore";
import { formatMxn, getMenuItem, restaurantOf } from "@lib/data/menu";
import { placeOrder } from "@lib/order";
import { getSession } from "@lib/session";
import styles from "./pay.module.css";

const PaySuccessLottie = dynamic(() => import("../../components/client/PaySuccessLottie"), { ssr: false });

type Method = "card" | "cash";

const ease = [0.32, 0.72, 0, 1] as const;

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCard(value: string) {
  const raw = digits(value);
  const amex = detectCardBrand(raw) === "amex";
  const pan = raw.slice(0, amex ? 15 : 16);

  if (amex) {
    const a = pan.slice(0, 4);
    const b = pan.slice(4, 10);
    const c = pan.slice(10, 15);
    return [a, b, c].filter(Boolean).join(" ");
  }

  return pan.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function lineMods(line: CartLine) {
  const item = getMenuItem(line.slug);
  if (!item) {
    return line.labels.length > 0 ? [{ title: "Cómo lo pediste", values: line.labels }] : [];
  }

  const groups = item.groups
    .map((group) => {
      const picked = line.selections[group.id] ?? [];
      const values = group.options.filter((option) => picked.includes(option.id)).map((option) => option.label);
      if (values.length === 0) {
        return null;
      }
      return { title: group.title, values };
    })
    .filter((entry): entry is { title: string; values: string[] } => Boolean(entry));

  if (groups.length > 0) {
    return groups;
  }

  return line.labels.length > 0 ? [{ title: "Cómo lo pediste", values: line.labels }] : [];
}

export default function PayPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [method, setMethod] = useState<Method>("card");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    setName(session?.user.name ?? "");

    const cart = getCartLines();
    if (cart.length === 0 && !done) {
      void router.replace(routes.clientCart);
      return;
    }

    if (!done) {
      setLines(cart);
    }
  }, [router, done]);

  const total = useMemo(
    () => (lines ?? []).reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [lines],
  );

  const brand = detectCardBrand(number);
  const brandText = cardBrandLabel(brand) || (digits(number).length >= 4 ? "Tarjeta" : "");

  const revealConfirm = useCallback(() => setShowConfirm(true), []);

  function close() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    void router.push(routes.clientCart);
  }

  async function pay(event?: FormEvent) {
    event?.preventDefault();
    if (busy || !lines?.length) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await placeOrder({ lines, method, total });
      clearCart();
      setDone(true);
      setNumber("");
      setCvv("");
      setExpiry("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo confirmar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  if (!lines || lines.length === 0) {
    return (
      <ClientShell fullBleed hideTopbar>
        <div className={styles.page} />
      </ClientShell>
    );
  }

  return (
    <ClientShell fullBleed hideTopbar>
      <motion.article
        className={styles.page}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28 }}
      >
        <motion.aside
          className={styles.receipt}
          aria-labelledby="pay-order-heading"
          initial={reduceMotion ? false : { opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <button type="button" className={styles.close} aria-label="Cerrar" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <header className={styles.receiptHead}>
            <p className={styles.kicker}>Tu pedido</p>
            <h1 id="pay-order-heading" className={styles.receiptTitle}>
              Recibo
            </h1>
          </header>

          <ul className={styles.order}>
            {lines.map((line) => {
              const item = getMenuItem(line.slug);
              const place = item ? restaurantOf(item, getCatalogRestaurants()) : null;
              const mods = lineMods(line);

              return (
                <li key={line.id} className={styles.orderLine}>
                  <div className={styles.thumb}>
                    {item?.image ? (
                      <Image src={item.image} alt="" fill sizes="72px" className={styles.thumbImg} />
                    ) : item ? (
                      <FoodIcon glyph={item.glyph} className={styles.thumbIcon} />
                    ) : null}
                  </div>

                  <div className={styles.orderBody}>
                    <div className={styles.orderTop}>
                      <p className={styles.orderName}>
                        {line.quantity}× {line.name}
                      </p>
                      <span className={styles.orderPrice}>{formatMxn(line.unitPrice * line.quantity)}</span>
                    </div>
                    {place ? <p className={styles.orderPlace}>{place.name}</p> : null}
                    {mods.length > 0 ? (
                      <dl className={styles.mods}>
                        {mods.map((mod) => (
                          <div key={mod.title} className={styles.mod}>
                            <dt>{mod.title}</dt>
                            <dd>{mod.values.join(", ")}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className={styles.orderPlace}>Sin extras</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.aside>

        <motion.div
          className={styles.panel}
          initial={reduceMotion ? false : { opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          {done ? (
            <div className={styles.done} role="status">
              <div className={styles.lottieFrame}>
                <PaySuccessLottie
                  reducedMotion={Boolean(reduceMotion)}
                  onComplete={revealConfirm}
                  className={styles.lottie}
                />
              </div>
              {showConfirm || reduceMotion ? (
                <div className={styles.doneCopy}>
                  <p className={styles.kicker}>Listo para recoger</p>
                  <h2 className={styles.title}>Pedido confirmado</h2>
                  <p className={styles.copy}>Recógelo en el mostrador del campus. No hay envío.</p>
                  <Link href={routes.client} className={styles.home}>
                    Volver al inicio
                  </Link>
                </div>
              ) : (
                <p className={styles.doneWait}>Confirmando tu pedido…</p>
              )}
            </div>
          ) : (
            <form className={styles.form} onSubmit={pay} noValidate aria-busy={busy}>
              <header>
                <p className={styles.kicker}>Recoger en campus</p>
                <h2 className={styles.title}>Pagar</h2>
                <p className={styles.copy}>Elige cómo pagar. Los datos de tarjeta no se guardan en este dispositivo.</p>
              </header>

              <fieldset className={styles.fieldset}>
                <legend className={styles.groupTitle}>Método</legend>
                <div className={styles.options} role="radiogroup" aria-label="Método de pago">
                  <button
                    type="button"
                    role="radio"
                    className={`${styles.chip} ${method === "card" ? styles.chipOn : ""}`}
                    aria-checked={method === "card"}
                    onClick={() => setMethod("card")}
                  >
                    Tarjeta
                  </button>
                  <button
                    type="button"
                    role="radio"
                    className={`${styles.chip} ${method === "cash" ? styles.chipOn : ""}`}
                    aria-checked={method === "cash"}
                    onClick={() => setMethod("cash")}
                  >
                    Efectivo al recoger
                  </button>
                </div>
              </fieldset>

              {method === "card" ? (
                <div className={styles.fields}>
                  <label className={styles.field}>
                    <span>Nombre en la tarjeta</span>
                    <input
                      name="card-name"
                      autoComplete="cc-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <div className={styles.field}>
                    <span id="card-number-label">Número</span>
                    <div className={styles.numberBox}>
                      <input
                        name="card-number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="•••• •••• •••• ••••"
                        aria-labelledby="card-number-label"
                        aria-describedby="card-brand-live"
                        value={number}
                        onChange={(event) => setNumber(formatCard(event.target.value))}
                      />
                      <span id="card-brand-live" className={styles.brand} aria-live="polite">
                        <CardBrandIcon brand={brandText ? brand : "unknown"} className={styles.brandIcon} />
                        <span className={styles.brandName}>{brandText || "Tarjeta"}</span>
                      </span>
                    </div>
                  </div>
                  <div className={styles.row}>
                    <label className={styles.field}>
                      <span>Vence</span>
                      <input
                        name="card-exp"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        value={expiry}
                        onChange={(event) => {
                          const next = digits(event.target.value).slice(0, 4);
                          setExpiry(next.length > 2 ? `${next.slice(0, 2)}/${next.slice(2)}` : next);
                        }}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>CVV</span>
                      <input
                        name="card-cvv"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        type="password"
                        maxLength={4}
                        value={cvv}
                        onChange={(event) => setCvv(digits(event.target.value).slice(0, 4))}
                      />
                    </label>
                  </div>
                  <p className={styles.hint}>Tecmipickup no almacena el número completo ni el CVV.</p>
                </div>
              ) : (
                <p className={styles.copy}>Pagas al recoger. Te daremos un código para el mostrador.</p>
              )}

              <p className={styles.total}>
                <span>Total</span>
                <span>{formatMxn(total)}</span>
              </p>

              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}

              <div className={styles.actions}>
                <PayButton onClick={() => void pay()} disabled={busy} />
              </div>
            </form>
          )}
        </motion.div>
      </motion.article>
    </ClientShell>
  );
}

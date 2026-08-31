import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ClientShell from "../../../components/client/ClientShell";
import { FoodIcon } from "../../../components/client/home/FoodIcons";
import { routes } from "@config/Router";
import { addCartLine } from "@lib/cart";
import {
  accompanimentsFor,
  defaultSelections,
  formatMxn,
  getMenuItem,
  menuItems,
  groupReady,
  restaurantOf,
  unitPrice,
  type OptionGroup,
} from "@lib/data/menu";
import { prefetchCatalog } from "@lib/api";
import { getCatalogRestaurants } from "@lib/catalogStore";
import homeStyles from "../../../components/client/home/home.module.css";
import styles from "./item.module.css";

const visualTint: Record<string, string> = {
  mist: styles.visualMist,
  sage: styles.visualSage,
  cream: styles.visualCream,
  cloud: styles.visualCloud,
};

const tileTint: Record<string, string> = {
  mist: homeStyles.tileMist,
  sage: homeStyles.tileSage,
  cream: homeStyles.tileCream,
  cloud: homeStyles.tileCloud,
};

const ease = [0.32, 0.72, 0, 1] as const;

function resolveSlug(query: string | string[] | undefined, asPath: string) {
  const fromQuery = typeof query === "string" ? query : "";
  const fromPath = decodeURIComponent(asPath.split("?")[0].match(/\/client\/item\/([^/]+)/)?.[1] ?? "");

  if (fromQuery && fromQuery !== "_") {
    return fromQuery;
  }

  if (fromPath && fromPath !== "_") {
    return fromPath;
  }

  return fromQuery;
}

export default function ItemPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const slug = resolveSlug(router.query.slug, router.asPath);
  const item = slug ? getMenuItem(slug) : null;
  const restaurant = item ? restaurantOf(item, getCatalogRestaurants()) : null;
  const [catalogReady, setCatalogReady] = useState(Boolean(item));

  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [sides, setSides] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (item) {
      setCatalogReady(true);
      return;
    }

    let cancelled = false;
    void prefetchCatalog().finally(() => {
      if (!cancelled) {
        setCatalogReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [item]);

  const readySelections = useMemo(() => {
    if (!item) {
      return {};
    }

    return Object.keys(selections).length ? selections : defaultSelections(item);
  }, [item, selections]);

  const recs = useMemo(() => (item ? accompanimentsFor(item) : []), [item]);
  const pickedSides = recs.filter((entry) => sides.includes(entry.id));
  const total = item
    ? (unitPrice(item, readySelections) + pickedSides.reduce((sum, side) => sum + side.price, 0)) * qty
    : 0;
  const complete =
    item?.groups.every((group) => groupReady(group, readySelections[group.id] ?? [])) ?? false;

  function close() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    void router.push(routes.client);
  }

  function toggle(group: OptionGroup, optionId: string) {
    setSelections((current) => {
      const base = Object.keys(current).length && item ? current : defaultSelections(item!);
      const picked = base[group.id] ?? [];

      if (group.kind === "single") {
        return { ...base, [group.id]: [optionId] };
      }

      const on = picked.includes(optionId);
      let next = on ? picked.filter((id) => id !== optionId) : [...picked, optionId];

      if (group.max && next.length > group.max) {
        next = next.slice(1);
      }

      return { ...base, [group.id]: next };
    });
  }

  function add() {
    if (!item || !complete) {
      return;
    }

    const labels = item.groups.flatMap((group) => {
      const picked = readySelections[group.id] ?? [];
      return group.options.filter((option) => picked.includes(option.id)).map((option) => option.label);
    });

    addCartLine({
      itemId: item.id,
      slug: item.slug,
      name: item.name,
      quantity: qty,
      unitPrice: unitPrice(item, readySelections),
      selections: readySelections,
      labels,
    });

    for (const side of pickedSides) {
      addCartLine({
        itemId: side.id,
        slug: side.slug,
        name: side.name,
        quantity: qty,
        unitPrice: side.price,
        selections: defaultSelections(side),
        labels: ["Acompañamiento"],
      });
    }

    setAdded(true);
    window.setTimeout(() => {
      void router.push(routes.clientCart);
    }, 420);
  }

  if (!router.isReady || (!item && !catalogReady)) {
    return (
      <ClientShell fullBleed hideTopbar>
        <div className={styles.page} />
      </ClientShell>
    );
  }

  if (!item) {
    return (
      <ClientShell fullBleed hideTopbar>
        <div className={styles.missing}>
          <h1>Ese platillo ya no está</h1>
          <Link href={routes.client}>Volver al inicio</Link>
        </div>
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
        <motion.div
          className={`${styles.visual} ${visualTint[restaurant?.tint ?? "mist"]}`}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease }}
        >
          {item.image ? (
            <Image src={item.image} alt="" fill priority sizes="(min-width: 900px) 50vw, 100vw" className={styles.visualImg} />
          ) : (
            <FoodIcon glyph={item.glyph} className={styles.visualIcon} />
          )}
        </motion.div>

        <motion.div
          className={styles.panel}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: { opacity: 0, x: 36 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.55, ease, staggerChildren: 0.07, delayChildren: 0.12 },
            },
          }}
        >
          <motion.button
            type="button"
            className={styles.close}
            aria-label="Cerrar"
            onClick={close}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 380, damping: 22 }}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>

          <motion.header variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}>
            {restaurant ? <p className={styles.kicker}>{restaurant.name}</p> : null}
            <h1 className={styles.title}>{item.name}</h1>
            <p className={styles.copy}>{item.description}</p>
            <div className={styles.priceRow}>
              <span className={styles.price}>{formatMxn(unitPrice(item, readySelections))}</span>
              {restaurant ? (
                <span className={styles.eta}>
                  Listo en {restaurant.etaMin}–{restaurant.etaMax} min
                </span>
              ) : null}
            </div>
          </motion.header>

          {item.groups.map((group) => {
            const picked = readySelections[group.id] ?? [];
            const hint =
              group.kind === "single"
                ? group.required
                  ? "Elige una"
                  : "Opcional"
                : group.max
                  ? `Hasta ${group.max}`
                  : "Elige las que quieras";

            return (
              <motion.section
                key={group.id}
                className={styles.group}
                aria-labelledby={`g-${group.id}`}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              >
                <div className={styles.groupHead}>
                  <h2 id={`g-${group.id}`} className={styles.groupTitle}>
                    {group.title}
                  </h2>
                  <span className={styles.groupHint}>{hint}</span>
                </div>
                <div className={styles.options} role={group.kind === "single" ? "radiogroup" : "group"}>
                  {group.options.map((option) => {
                    const on = picked.includes(option.id);
                    const delta = option.price ?? 0;

                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                        aria-pressed={on}
                        onClick={() => toggle(group, option.id)}
                        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                      >
                        {option.label}
                        {delta ? (
                          <span className={styles.chipDelta}>
                            {delta > 0 ? "+" : ""}
                            {formatMxn(delta)}
                          </span>
                        ) : null}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}

          <motion.div
            className={styles.actions}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          >
            <div className={styles.qty} aria-label="Cantidad">
              <button
                type="button"
                className={styles.qtyBtn}
                aria-label="Quitar uno"
                disabled={qty <= 1}
                onClick={() => setQty((value) => Math.max(1, value - 1))}
              >
                −
              </button>
              <span className={styles.qtyValue}>{qty}</span>
              <button
                type="button"
                className={styles.qtyBtn}
                aria-label="Agregar uno"
                onClick={() => setQty((value) => Math.min(12, value + 1))}
              >
                +
              </button>
            </div>

            <motion.button
              type="button"
              className={styles.add}
              disabled={!complete}
              onClick={add}
              whileTap={reduceMotion || !complete ? undefined : { scale: 0.96 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={added ? "ok" : total}
                  initial={reduceMotion ? false : { y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {added ? "Agregado" : `Agregar ${formatMxn(total)}`}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {recs.length > 0 ? (
            <motion.section
              className={styles.recs}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              aria-labelledby="recs-heading"
            >
              <h2 id="recs-heading" className={styles.recsTitle}>
                Para acompañar tu {item.name}
              </h2>
              <div className={homeStyles.grid}>
                {recs.map((side) => {
                  const on = sides.includes(side.id);
                  const place = restaurantOf(side, getCatalogRestaurants());

                  return (
                    <motion.button
                      key={side.id}
                      type="button"
                      className={`${homeStyles.card} ${styles.recCard}`}
                      aria-pressed={on}
                      onClick={() =>
                        setSides((current) =>
                          current.includes(side.id)
                            ? current.filter((id) => id !== side.id)
                            : [...current, side.id],
                        )
                      }
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    >
                      <div
                        className={`${homeStyles.tile} ${tileTint[place?.tint ?? "mist"]} ${on ? styles.tileRing : ""}`}
                      >
                        {on ? <span className={homeStyles.promoBadge}>En el pedido</span> : null}
                        <FoodIcon glyph={side.glyph} className={homeStyles.tileIcon} />
                        <span className={homeStyles.etaBadge}>{formatMxn(side.price)}</span>
                      </div>
                      <div className={homeStyles.cardBody}>
                        <h3 className={homeStyles.cardName}>{side.name}</h3>
                        <p className={homeStyles.cardMeta}>{place?.name ?? "Recomendado"}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          ) : null}
        </motion.div>
      </motion.article>
    </ClientShell>
  );
}

export function getStaticPaths() {
  return {
    paths: [...menuItems.map((entry) => ({ params: { slug: entry.slug } })), { params: { slug: "_" } }],
    fallback: false,
  };
}

export function getStaticProps() {
  return { props: {} };
}

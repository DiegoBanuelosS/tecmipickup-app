import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ClientShell from "../../components/client/ClientShell";
import RestaurantCard from "../../components/client/home/RestaurantCard";
import { FoodIcon } from "../../components/client/home/FoodIcons";
import { AutocompleteTree, normalizeText } from "@lib/autocomplete";
import type { Restaurant } from "@lib/data/restaurants";
import { useFavorites } from "@lib/favorites";
import { useHomeData } from "@lib/useHomeData";
import homeStyles from "../../components/client/home/home.module.css";
import styles from "./search.module.css";

const suggestions = ["tacos", "un café", "algo dulce", "un antojo", "matcha", "sushi"];

function matches(restaurant: Restaurant, term: string) {
  const haystack = normalizeText(
    [restaurant.name, ...restaurant.tags, ...restaurant.categories].join(" "),
  );
  return term.split(/\s+/).every((word) => haystack.includes(word));
}

export default function ClientSearch() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { data, loading } = useHomeData();
  const { favorites, isFavorite, toggle } = useFavorites();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const q = router.query.q;
    if (typeof q === "string" && q) {
      setQuery(q);
    }
  }, [router.isReady, router.query.q]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % suggestions.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const term = normalizeText(query).trim();
  const active = focused || term.length > 0;

  const tree = useMemo(() => {
    if (!data) {
      return null;
    }

    const trie = new AutocompleteTree();
    data.restaurants.forEach((restaurant) => {
      trie.insert(restaurant.name, 10 + restaurant.rating);
      restaurant.tags.forEach((tag) => trie.insert(tag, 5));
    });
    data.categories.forEach((category) => {
      if (category.id !== "todo") {
        trie.insert(category.label, 7);
      }
    });
    return trie;
  }, [data]);

  const completion = useMemo(() => {
    if (!tree || !query || !term) {
      return null;
    }

    const phrase = tree.complete(query);
    if (!phrase) {
      return null;
    }

    const normalizedPhrase = normalizeText(phrase);
    const normalizedQuery = normalizeText(query);
    if (!normalizedPhrase.startsWith(normalizedQuery) || normalizedPhrase.length <= normalizedQuery.length) {
      return null;
    }

    return { phrase, remainder: phrase.slice(query.length) };
  }, [tree, query, term]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab" && completion) {
      event.preventDefault();
      setQuery(query + completion.remainder);
    }
  }

  const results = useMemo(() => {
    if (!data || !term) {
      return null;
    }

    return data.restaurants.filter((restaurant) => matches(restaurant, term));
  }, [data, term]);

  const recommended = useMemo(() => {
    if (!data) {
      return [];
    }

    const favoriteCategories = new Set(
      data.restaurants
        .filter((restaurant) => favorites.includes(restaurant.id))
        .flatMap((restaurant) => restaurant.categories),
    );

    return [...data.restaurants]
      .map((restaurant) => ({
        restaurant,
        score:
          restaurant.rating +
          (restaurant.categories.some((id) => favoriteCategories.has(id)) ? 0.6 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.restaurant);
  }, [data, favorites]);

  return (
    <ClientShell>
      <h1 className={styles.srOnly}>Buscar</h1>

      <div className={styles.stack}>
        <div className={`${styles.hero} ${active ? styles.heroCompact : ""}`}>
          <div className={styles.group}>
            <motion.div
              className={styles.box}
              role="search"
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true" fill="none">
                <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.75" />
                <path d="m15.6 15.6 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>

              {query && completion ? (
                <span className={styles.typeGhost} aria-hidden="true">
                  <span className={styles.typeGhostTyped}>{query}</span>
                  <span className={styles.typeGhostRest}>{completion.remainder}</span>
                </span>
              ) : null}

              <input
                className={styles.input}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label="Buscar platillos y restaurantes"
                placeholder="Buscar"
                autoComplete="off"
              />

              {!query ? (
                <span className={styles.ghost} aria-hidden="true">
                  Buscar{" "}
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={suggestions[wordIndex]}
                      className={styles.ghostWord}
                      initial={reduceMotion ? false : { y: 14, opacity: 0, filter: "blur(4px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={reduceMotion ? { opacity: 0 } : { y: -14, opacity: 0, filter: "blur(4px)" }}
                      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1.15, 0.36, 1] }}
                    >
                      {suggestions[wordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ) : null}

              <AnimatePresence>
                {query ? (
                  <motion.button
                    key="clear"
                    type="button"
                    className={styles.clear}
                    aria-label="Borrar búsqueda"
                    onClick={() => setQuery("")}
                    initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </motion.button>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {completion ? (
                  <motion.span
                    key="tab-hint"
                    className={styles.tabHint}
                    initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <kbd className={styles.tabKey}>Tab</kbd> para completar
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.div>

            {loading || !data ? (
              <div className={styles.section} aria-busy="true" aria-label="Cargando sugerencias">
                <div className={`${homeStyles.grid} ${styles.gridLeft}`}>
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className={homeStyles.card} aria-hidden="true">
                      <div className={`${homeStyles.skel} ${homeStyles.skelTile}`} />
                      <div className={`${homeStyles.skel} ${homeStyles.skelLine} ${homeStyles.skelLineWide}`} />
                      <div className={`${homeStyles.skel} ${homeStyles.skelLine} ${homeStyles.skelLineNarrow}`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.section
                  key={results ? "results" : "recommended"}
                  className={styles.section}
                  aria-live="polite"
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: 44, scale: 0.97, filter: "blur(10px)" }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -36, scale: 0.97, filter: "blur(8px)" }
                  }
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className={homeStyles.sectionHead}>
                    <h2 className={homeStyles.sectionTitle}>
                      {results ? "Resultados" : "Te podría gustar…"}
                    </h2>
                    {results ? (
                      <motion.span
                        key={results.length}
                        className={homeStyles.sectionCount}
                        initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        {results.length}
                      </motion.span>
                    ) : null}
                  </div>

                  <div className={`${homeStyles.grid} ${styles.gridLeft}`}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {(results ?? recommended).map((restaurant) => (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          favorite={isFavorite(restaurant.id)}
                          onToggleFavorite={toggle}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {results && results.length === 0 ? (
                    <div className={homeStyles.empty}>
                      <FoodIcon glyph="plate" className={homeStyles.emptyIcon} />
                      <h3 className={homeStyles.emptyTitle}>Sin resultados para “{query.trim()}”</h3>
                      <p className={homeStyles.emptyCopy}>Revisa la ortografía o intenta con otro antojo.</p>
                      <button type="button" className={homeStyles.emptyReset} onClick={() => setQuery("")}>
                        Limpiar búsqueda
                      </button>
                    </div>
                  ) : null}
                </motion.section>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </ClientShell>
  );
}

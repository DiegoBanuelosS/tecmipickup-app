import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ClientShell from "../../components/client/ClientShell";
import CategoryRail from "../../components/client/home/CategoryRail";
import HomeSkeleton from "../../components/client/home/HomeSkeleton";
import RestaurantCard from "../../components/client/home/RestaurantCard";
import { restaurantsForCategory } from "@lib/api";
import { filterByCategory, type Restaurant } from "@lib/data/restaurants";
import { useFavorites } from "@lib/favorites";
import { getSession } from "@lib/session";
import { useHomeData } from "@lib/useHomeData";
import styles from "../../components/client/home/home.module.css";

function greetingForHour(hour: number) {
  if (hour < 12) {
    return "Buenos días";
  }

  if (hour < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function ClientHome() {
  const reduceMotion = useReducedMotion();
  const { data, loading, counts } = useHomeData();
  const { isFavorite, toggle } = useFavorites();
  const [category, setCategory] = useState("todo");
  const [categoryPlaces, setCategoryPlaces] = useState<Restaurant[] | null>(null);
  const [greeting, setGreeting] = useState("Hola");
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
    const name = getSession()?.user.name ?? "";
    setFirstName(name.split(" ")[0] ?? "");
  }, []);

  useEffect(() => {
    if (category === "todo") {
      setCategoryPlaces(null);
      return;
    }

    let cancelled = false;
    void restaurantsForCategory(category)
      .then((places) => {
        if (!cancelled) {
          setCategoryPlaces(places);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryPlaces(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, data?.products]);

  const visible = useMemo(() => {
    if (!data) {
      return [];
    }

    if (category !== "todo" && categoryPlaces) {
      return categoryPlaces;
    }

    return filterByCategory(data.restaurants, category);
  }, [data, category, categoryPlaces]);

  if (loading || !data) {
    return (
      <ClientShell>
        <div aria-busy="true" aria-label="Cargando inicio">
          <HomeSkeleton counts={counts} />
        </div>
      </ClientShell>
    );
  }

  return (
    <ClientShell>
      <motion.div
        className={styles.stack}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        <motion.header className={styles.header} variants={fadeUp}>
          <h1 className={styles.greeting}>
            {greeting}
            {firstName ? (
              <>
                , <span className={styles.greetingName}>{firstName}</span>
              </>
            ) : null}
          </h1>
          <p className={styles.tagline}>¿Qué se te antoja hoy?</p>
        </motion.header>

        <motion.div variants={fadeUp}>
          <CategoryRail categories={data.categories} active={category} onSelect={setCategory} />
        </motion.div>

        <motion.section variants={fadeUp} aria-labelledby="stores-heading" aria-live="polite">
          <div className={styles.sectionHead}>
            <h2 id="stores-heading" className={styles.sectionTitle}>
              {category === "todo" ? "Tiendas" : "Tiendas de esta categoría"}
            </h2>
            <span className={styles.sectionCount}>{visible.length}</span>
          </div>
          <div className={styles.grid}>
            {visible.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                favorite={isFavorite(restaurant.id)}
                onToggleFavorite={toggle}
              />
            ))}
          </div>
        </motion.section>

        <AnimatePresence>
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              className={styles.empty}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className={styles.emptyTitle}>No hay tiendas en esta categoría</h3>
              <p className={styles.emptyCopy}>Prueba con otra categoría o vuelve a ver todas las tiendas.</p>
              <button type="button" className={styles.emptyReset} onClick={() => setCategory("todo")}>
                Ver tiendas
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </motion.div>
    </ClientShell>
  );
}

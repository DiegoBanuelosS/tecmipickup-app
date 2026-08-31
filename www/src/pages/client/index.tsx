import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ClientShell from "../../components/client/ClientShell";
import AdCarousel from "../../components/client/home/AdCarousel";
import CategoryRail from "../../components/client/home/CategoryRail";
import HomeSkeleton from "../../components/client/home/HomeSkeleton";
import RestaurantCard from "../../components/client/home/RestaurantCard";
import { FoodIcon } from "../../components/client/home/FoodIcons";
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
  }, [category]);

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

        <motion.div variants={fadeUp}>
          <AdCarousel ads={data.ads} restaurants={data.restaurants} />
        </motion.div>

        <motion.section variants={fadeUp} aria-live="polite">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Destacado</h2>
            <motion.span
              key={visible.length}
              className={styles.sectionCount}
              initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {visible.length}
            </motion.span>
          </div>
        </motion.section>

        <motion.div className={styles.grid} layout={!reduceMotion} variants={fadeUp}>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                favorite={isFavorite(restaurant.id)}
                onToggleFavorite={toggle}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {visible.length === 0 ? (
            <motion.div
              key="empty"
              className={styles.empty}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <FoodIcon glyph="plate" className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>Nada por aquí todavía</h3>
              <p className={styles.emptyCopy}>Prueba con otra categoría o explora todo el campus.</p>
              <button type="button" className={styles.emptyReset} onClick={() => setCategory("todo")}>
                Ver todo
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </ClientShell>
  );
}

import { motion, useReducedMotion } from "motion/react";
import type { Category } from "@lib/data/restaurants";
import { FoodIcon } from "./FoodIcons";
import styles from "./home.module.css";

type CategoryRailProps = {
  categories: Category[];
  active: string;
  onSelect: (id: string) => void;
};

export default function CategoryRail({ categories, active, onSelect }: CategoryRailProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={styles.railWrap}>
      <div className={styles.rail} role="group" aria-label="Filtrar por categoría">
        {categories.map((category) => {
          const isActive = category.id === active;

          return (
            <motion.button
              key={category.id}
              type="button"
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelect(category.id)}
              whileTap={reduceMotion ? undefined : { scale: 0.93 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              {isActive ? (
                <motion.span
                  layoutId="chip-glow"
                  className={styles.chipGlow}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                />
              ) : (
                <span className={styles.chipIdle} />
              )}
              <FoodIcon glyph={category.icon} className={styles.chipIcon} />
              {category.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

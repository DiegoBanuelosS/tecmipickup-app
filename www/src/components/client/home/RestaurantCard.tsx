import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { itemPath } from "@config/Router";
import { getMenuItem } from "@lib/data/menu";
import { priceLabel, type Restaurant } from "@lib/data/restaurants";
import { FoodIcon } from "./FoodIcons";
import styles from "./home.module.css";

const tileClass: Record<Restaurant["tint"], string> = {
  mist: styles.tileMist,
  sage: styles.tileSage,
  cream: styles.tileCream,
  cloud: styles.tileCloud,
};

type RestaurantCardProps = {
  restaurant: Restaurant;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
};

export default function RestaurantCard({ restaurant, favorite, onToggleFavorite }: RestaurantCardProps) {
  const reduceMotion = useReducedMotion();
  const featured = getMenuItem(restaurant.featuredSlug);

  return (
    <motion.article
      layout={!reduceMotion}
      className={styles.card}
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <FavoriteButton
        name={restaurant.name}
        on={favorite}
        onToggle={() => onToggleFavorite(restaurant.id)}
      />

      <Link
        href={itemPath(restaurant.featuredSlug)}
        className={styles.cardLink}
        aria-label={`${restaurant.name}, ${restaurant.rating} estrellas, listo en ${restaurant.etaMin} a ${restaurant.etaMax} minutos`}
      >
        <div className={`${styles.tile} ${featured?.image ? styles.tilePhoto : tileClass[restaurant.tint]}`}>
          {restaurant.promo ? <span className={styles.promoBadge}>{restaurant.promo}</span> : null}
          {featured?.image ? (
            <Image
              src={featured.image}
              alt=""
              fill
              sizes="(max-width: 720px) 72px, 264px"
              className={styles.tileImg}
            />
          ) : (
            <FoodIcon glyph={restaurant.icon} className={styles.tileIcon} />
          )}
          <span className={styles.etaBadge}>
            {restaurant.etaMin}–{restaurant.etaMax} min
          </span>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardName}>{restaurant.name}</h3>
            <span className={styles.rating}>
              <span className={styles.ratingStar} aria-hidden="true">
                ★
              </span>
              {restaurant.rating.toFixed(1)}
              <span className={styles.ratingReviews}>({restaurant.reviews})</span>
            </span>
          </div>
          <p className={styles.cardMeta}>
            {restaurant.etaMin}–{restaurant.etaMax} min · {priceLabel(restaurant.priceLevel)} · {restaurant.tags.join(" · ")}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

function FavoriteButton({ name, on, onToggle }: { name: string; on: boolean; onToggle: () => void }) {
  const reduceMotion = useReducedMotion();
  const [ping, setPing] = useState(0);

  function handleClick() {
    if (!on) {
      setPing((value) => value + 1);
    }
    onToggle();
  }

  return (
    <motion.button
      type="button"
      className={`${styles.favButton} ${on ? styles.favButtonOn : ""}`}
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      onClick={handleClick}
      whileTap={reduceMotion ? undefined : { scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <AnimatePresence>
        {ping > 0 && on && !reduceMotion ? (
          <motion.span
            key={ping}
            className={styles.favPing}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      <motion.svg
        viewBox="0 0 24 24"
        className={styles.favHeart}
        aria-hidden="true"
        initial={false}
        animate={
          on && !reduceMotion
            ? { scale: [1, 1.35, 0.9, 1.08, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.5, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeOut" }}
      >
        <path
          d="M12 20.2 4.9 13a4.6 4.6 0 0 1 0-6.5 4.5 4.5 0 0 1 6.4 0l.7.7.7-.7a4.5 4.5 0 0 1 6.4 0 4.6 4.6 0 0 1 0 6.5z"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.button>
  );
}

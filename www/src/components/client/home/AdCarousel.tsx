import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { itemPath } from "@config/Router";
import type { Ad, Restaurant } from "@lib/data/restaurants";
import styles from "./home.module.css";

type AdCarouselProps = {
  ads: Ad[];
  restaurants: Restaurant[];
};

const AUTOPLAY_MS = 5000;

export default function AdCarousel({ ads, restaurants }: AdCarouselProps) {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const measure = () => {
      setHasOverflow(rail.scrollWidth > rail.clientWidth + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);

    return () => observer.disconnect();
  }, [ads.length]);

  function handleScroll() {
    const rail = railRef.current;
    if (!rail) {
      return;
    }

    const slides = Array.from(rail.children) as HTMLElement[];
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });

    setActive(closest);
  }

  function goTo(index: number) {
    const rail = railRef.current;
    const slide = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !slide) {
      return;
    }

    rail.scrollTo({
      left: slide.offsetLeft - (rail.clientWidth - slide.offsetWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function step(direction: 1 | -1) {
    goTo((active + direction + ads.length) % ads.length);
  }

  useEffect(() => {
    if (reduceMotion || paused || !hasOverflow || ads.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      const rail = railRef.current;
      const next = (active + 1) % ads.length;
      const slide = rail?.children[next] as HTMLElement | undefined;
      if (rail && slide) {
        rail.scrollTo({
          left: slide.offsetLeft - (rail.clientWidth - slide.offsetWidth) / 2,
          behavior: "smooth",
        });
      }
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [active, paused, reduceMotion, hasOverflow, ads.length]);

  return (
    <section
      className={styles.adsWrap}
      aria-label="Promociones de restaurantes"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div ref={railRef} className={styles.adsRail} onScroll={handleScroll}>
        {ads.map((ad, index) => {
          const restaurant = restaurants.find((item) => item.id === ad.restaurantId);
          if (!restaurant) {
            return null;
          }

          return (
            <Link
              key={ad.id}
              href={itemPath(ad.itemSlug)}
              className={styles.adSlide}
              aria-label={`${ad.headline}, ${restaurant.name}`}
            >
              <Image
                src={ad.image}
                alt=""
                fill
                priority={index === 0}
                sizes="(max-width: 700px) 92vw, 640px"
                className={styles.adImage}
              />
              <span className={styles.adShade} aria-hidden="true" />
              <span className={styles.adTag}>Promoción</span>
              <span className={styles.adContent}>
                <span className={styles.adKicker}>{restaurant.name}</span>
                <span className={styles.adHeadline}>{ad.headline}</span>
                <span className={styles.adSub}>{ad.sub}</span>
                <span className={styles.adCta}>
                  Pedir ahora
                  <svg viewBox="0 0 24 24" className={styles.adCtaArrow} aria-hidden="true" fill="none">
                    <path
                      d="M4 12h15m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {hasOverflow ? (
        <>
          <motion.button
            type="button"
            className={`${styles.adNav} ${styles.adNavPrev}`}
            aria-label="Promoción anterior"
            onClick={() => step(-1)}
            whileTap={reduceMotion ? undefined : { scale: 0.88 }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="m14.5 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.adNav} ${styles.adNavNext}`}
            aria-label="Promoción siguiente"
            onClick={() => step(1)}
            whileTap={reduceMotion ? undefined : { scale: 0.88 }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="m9.5 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

          <div className={styles.adsDots} role="tablist" aria-label="Ir a promoción">
            {ads.map((ad, index) => (
              <button
                key={ad.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Promoción ${index + 1} de ${ads.length}`}
                className={`${styles.adDot} ${index === active ? styles.adDotActive : ""}`}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

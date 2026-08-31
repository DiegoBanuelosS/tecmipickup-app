import type { HomeCounts } from "@lib/api/home";
import styles from "./home.module.css";

type HomeSkeletonProps = {
  /** Cantidad real de elementos que van a llegar, conocida antes de la carga. */
  counts: HomeCounts;
};

/** Replica el layout del inicio con el número exacto de elementos esperados. */
export default function HomeSkeleton({ counts }: HomeSkeletonProps) {
  return (
    <div className={styles.stack} aria-hidden="true">
      <div>
        <div className={`${styles.skel} ${styles.skelGreeting}`} />
        <div className={`${styles.skel} ${styles.skelTagline}`} />
      </div>

      <div className={styles.skelChips}>
        {Array.from({ length: counts.categories }, (_, index) => (
          <div key={index} className={`${styles.skel} ${styles.skelChip}`} />
        ))}
      </div>

      <div>
        <div className={styles.skelAdsRail}>
          {Array.from({ length: counts.ads }, (_, index) => (
            <div key={index} className={`${styles.skel} ${styles.skelAdSlide}`} />
          ))}
        </div>
        {counts.ads > 1 ? (
          <div className={styles.skelDots}>
            {Array.from({ length: counts.ads }, (_, index) => (
              <div key={index} className={`${styles.skel} ${styles.skelDot}`} />
            ))}
          </div>
        ) : null}
      </div>

      <div className={`${styles.skel} ${styles.skelSectionTitle}`} />

      <div className={styles.grid}>
        {Array.from({ length: counts.restaurants }, (_, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardLink}>
              <div className={`${styles.skel} ${styles.skelTile}`} />
              <div>
                <div className={`${styles.skel} ${styles.skelLine} ${styles.skelLineWide}`} />
                <div className={`${styles.skel} ${styles.skelLine} ${styles.skelLineNarrow}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

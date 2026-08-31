import styles from "./PayButton.module.css";

type PayButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
};

export default function PayButton({ onClick, disabled }: PayButtonProps) {
  return (
    <div className={`${styles.shell} ${disabled ? styles.shellOff : ""}`}>
      <button type="button" className={styles.pay} onClick={onClick} aria-label="Pagar" disabled={disabled}>
      <span className={styles.left} aria-hidden="true">
        <span className={styles.card}>
          <span className={styles.cardLine} />
          <span className={styles.buttons} />
        </span>
        <span className={styles.post}>
          <span className={styles.postLine} />
          <span className={styles.screen}>
            <span className={styles.dollar}>$</span>
          </span>
          <span className={styles.numbers} />
          <span className={styles.numbersLine} />
        </span>
      </span>
      <span className={styles.right}>
        <span className={styles.label}>Pagar</span>
        <svg viewBox="0 0 451.846 451.847" className={styles.arrow} aria-hidden="true">
          <path
            fill="currentColor"
            d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"
          />
        </svg>
      </span>
    </button>
    </div>
  );
}

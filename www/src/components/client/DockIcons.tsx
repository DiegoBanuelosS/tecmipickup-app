import { useReducedMotion, motion } from "motion/react";

type IconProps = {
  className?: string;
  hovered?: boolean;
  active?: boolean;
};

const pop = {
  duration: 0.55,
  times: [0, 0.28, 0.62, 1],
  ease: [0.22, 1.15, 0.36, 1] as const,
};

export function HomeIcon({ className, hovered }: IconProps) {
  const reduce = useReducedMotion();
  const play = Boolean(hovered) && !reduce;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      initial={false}
      animate={
        play
          ? { y: [0, -5, 1, 0], scaleY: [1, 0.72, 1.12, 1] }
          : { y: 0, scaleY: 1 }
      }
      transition={play ? pop : { duration: 0.2 }}
      style={{ originY: 1, originX: 0.5 }}
    >
      <path
        d="M4.5 11 12 4.5 19.5 11v8.2a.8.8 0 0 1-.8.8h-4.4v-5.2h-4.6v5.2H5.3a.8.8 0 0 1-.8-.8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

export function SearchIcon({ className, hovered }: IconProps) {
  const reduce = useReducedMotion();
  const play = Boolean(hovered) && !reduce;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      initial={false}
      animate={play ? { rotate: [0, -16, 10, 0], x: [0, 1.5, -1, 0] } : { rotate: 0, x: 0 }}
      transition={play ? { duration: 0.5, ease: [0.22, 1.15, 0.36, 1] } : { duration: 0.2 }}
      style={{ originX: 0.46, originY: 0.46 }}
    >
      <motion.circle
        cx="11"
        cy="11"
        r="6.2"
        stroke="currentColor"
        strokeWidth="1.75"
        animate={play ? { scale: [1, 0.88, 1.06, 1] } : { scale: 1 }}
        transition={play ? pop : { duration: 0.2 }}
        style={{ originX: "11px", originY: "11px" }}
      />
      <motion.path
        d="m15.6 15.6 4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        animate={play ? { pathLength: [1, 0.35, 1], x: [0, 2, 0], y: [0, 2, 0] } : { pathLength: 1, x: 0, y: 0 }}
        transition={play ? { duration: 0.48, ease: "easeOut" } : { duration: 0.2 }}
      />
    </motion.svg>
  );
}

export function ProfileIcon({ className, hovered }: IconProps) {
  const reduce = useReducedMotion();
  const play = Boolean(hovered) && !reduce;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      initial={false}
      animate={play ? { y: [0, -3, 0] } : { y: 0 }}
      transition={play ? { duration: 0.45, ease: [0.22, 1.15, 0.36, 1] } : { duration: 0.2 }}
    >
      <motion.circle
        cx="12"
        cy="8"
        r="3.35"
        stroke="currentColor"
        strokeWidth="1.75"
        animate={play ? { y: [0, -1.8, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
        transition={play ? pop : { duration: 0.2 }}
        style={{ originX: "12px", originY: "8px" }}
      />
      <motion.path
        d="M5.8 19.2c.85-3.15 3.2-5.05 6.2-5.05s5.35 1.9 6.2 5.05"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        animate={play ? { scaleX: [1, 1.06, 1] } : { scaleX: 1 }}
        transition={play ? pop : { duration: 0.2 }}
        style={{ originX: 0.5, originY: 1 }}
      />
    </motion.svg>
  );
}

export function CartIcon({ className, hovered }: IconProps) {
  const reduce = useReducedMotion();
  const play = Boolean(hovered) && !reduce;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      initial={false}
      animate={play ? { rotate: [0, -11, 7, 0], y: [0, -3, 0] } : { rotate: 0, y: 0 }}
      transition={play ? { duration: 0.5, ease: [0.22, 1.15, 0.36, 1] } : { duration: 0.2 }}
      style={{ originY: 1, originX: 0.5 }}
    >
      <motion.path
        d="M9 7.2V5.8A3 3 0 0 1 12 2.8a3 3 0 0 1 3 3v1.4"
        stroke="currentColor"
        strokeWidth="1.75"
        animate={play ? { y: [0, -2.5, 0] } : { y: 0 }}
        transition={play ? { duration: 0.42, ease: "easeOut" } : { duration: 0.2 }}
      />
      <motion.path
        d="M6.2 7.2h12.3l-1.1 9.3a1.2 1.2 0 0 1-1.2 1.05H8.5A1.2 1.2 0 0 1 7.3 16.5L6.2 7.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        animate={play ? { scaleY: [1, 0.9, 1.06, 1] } : { scaleY: 1 }}
        transition={play ? pop : { duration: 0.2 }}
        style={{ originY: 1, originX: 0.5 }}
      />
    </motion.svg>
  );
}

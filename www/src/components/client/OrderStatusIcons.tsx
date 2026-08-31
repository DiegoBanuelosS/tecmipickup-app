import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { OrderStatus } from "@lib/order";

type StatusIconProps = {
  status: OrderStatus;
  className?: string;
};

const loop = { repeat: Infinity, ease: "easeInOut" as const };

export function OrderStatusIcon({ status, className }: StatusIconProps) {
  const reduce = Boolean(useReducedMotion());

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.svg
        key={status}
        viewBox="0 0 32 32"
        className={className}
        aria-hidden="true"
        fill="none"
        initial={reduce ? false : { opacity: 0, scale: 0.72, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={reduce ? undefined : { opacity: 0, scale: 0.72, rotate: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {status === "received" ? <ReceivedMarks reduce={reduce} /> : null}
        {status === "preparing" ? <PreparingMarks reduce={reduce} /> : null}
        {status === "ready" ? <ReadyMarks reduce={reduce} /> : null}
      </motion.svg>
    </AnimatePresence>
  );
}

function ReceivedMarks({ reduce }: { reduce: boolean }) {
  return (
    <>
      <motion.path
        d="M9.2 6.4h13.6a1.6 1.6 0 0 1 1.6 1.6v16.2c0 .7-.8 1.1-1.3.7l-1.7-1.3-1.7 1.3c-.5.4-1.3 0-1.3-.7v-.2c0-.7-.8-1.1-1.3-.7l-1.5 1.1-1.5-1.1c-.5-.4-1.3 0-1.3.7v.2c0 .7-.8 1.1-1.3.7l-1.7-1.3-1.7 1.3c-.5.4-1.3 0-1.3-.7V8a1.6 1.6 0 0 1 1.6-1.6Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        animate={reduce ? undefined : { y: [0, -0.6, 0] }}
        transition={reduce ? undefined : { duration: 2.2, ...loop }}
      />
      <path d="M11.4 10.6h9.2M11.4 13.4h7.4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.45" />
      <motion.circle
        cx="20.6"
        cy="20.2"
        r="4.4"
        fill="currentColor"
        animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
        transition={reduce ? undefined : { duration: 1.5, ...loop }}
        style={{ originX: "20.6px", originY: "20.2px" }}
      />
      <motion.path
        d="M18.5 20.3 19.9 21.7 22.8 18.6"
        stroke="#171717"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={reduce ? undefined : { pathLength: [0.35, 1, 1, 0.35] }}
        transition={reduce ? undefined : { duration: 2.1, ...loop }}
      />
    </>
  );
}

function PreparingMarks({ reduce }: { reduce: boolean }) {
  return (
    <>
      <motion.path
        d="M12.4 7.2c.4-1.1 1-1.9 2.4-1.9s2 .8 2.4 1.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        animate={reduce ? undefined : { y: [0, -2.2, 0], opacity: [0.25, 1, 0.25] }}
        transition={reduce ? undefined : { duration: 1.15, ...loop }}
      />
      <motion.path
        d="M16.6 6.6c.3-.9.8-1.5 1.8-1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.7"
        animate={reduce ? undefined : { y: [0, -2.6, 0], opacity: [0.15, 0.9, 0.15] }}
        transition={reduce ? undefined : { duration: 1.3, delay: 0.18, ...loop }}
      />
      <motion.path
        d="M10.8 7c-.25-.8-.7-1.3-1.5-1.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.7"
        animate={reduce ? undefined : { y: [0, -2, 0], opacity: [0.15, 0.85, 0.15] }}
        transition={reduce ? undefined : { duration: 1.25, delay: 0.32, ...loop }}
      />

      <motion.g
        animate={reduce ? undefined : { rotate: [0, -5, 5, 0], y: [0, -0.6, 0] }}
        transition={reduce ? undefined : { duration: 1.4, ...loop }}
        style={{ originX: "16px", originY: "14px" }}
      >
        <path d="M8.4 13.2h15.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M9.3 13.2c.4 6.2 2.6 9.4 6.7 9.4s6.3-3.2 6.7-9.4Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinejoin="round"
        />
        <path d="M7.2 15.4h2.1M22.7 15.4h2.1" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
        <motion.circle
          cx="14.2"
          cy="17.6"
          r="0.85"
          fill="currentColor"
          animate={reduce ? undefined : { y: [0, -2.4, 0], opacity: [0.3, 1, 0.3] }}
          transition={reduce ? undefined : { duration: 0.85, ...loop }}
        />
        <motion.circle
          cx="17.4"
          cy="18.4"
          r="0.7"
          fill="currentColor"
          animate={reduce ? undefined : { y: [0, -2.8, 0], opacity: [0.2, 1, 0.2] }}
          transition={reduce ? undefined : { duration: 1, delay: 0.2, ...loop }}
        />
      </motion.g>

      <motion.path
        d="M13.2 25.4c.6-1.3 1.4-1.6 2.8-1.6s2.2.3 2.8 1.6"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        animate={reduce ? undefined : { scaleY: [0.7, 1.15, 0.7], opacity: [0.45, 1, 0.45] }}
        transition={reduce ? undefined : { duration: 0.55, ...loop }}
        style={{ originX: "16px", originY: "25.4px" }}
      />
    </>
  );
}

function ReadyMarks({ reduce }: { reduce: boolean }) {
  return (
    <>
      <motion.circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.28"
        animate={reduce ? undefined : { scale: [0.82, 1.12], opacity: [0.35, 0] }}
        transition={reduce ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        style={{ originX: "16px", originY: "16px" }}
      />
      <motion.circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        strokeWidth="1.15"
        opacity="0.2"
        animate={reduce ? undefined : { scale: [0.82, 1.12], opacity: [0.3, 0] }}
        transition={reduce ? undefined : { duration: 1.6, delay: 0.45, repeat: Infinity, ease: "easeOut" }}
        style={{ originX: "16px", originY: "16px" }}
      />

      <motion.g
        animate={reduce ? undefined : { y: [0, -1.8, 0], rotate: [0, -4, 3, 0] }}
        transition={reduce ? undefined : { duration: 1.15, ease: [0.22, 1.15, 0.36, 1], repeat: Infinity }}
        style={{ originX: "16px", originY: "20px" }}
      >
        <path
          d="M10.2 12.4 11.1 24a1.7 1.7 0 0 0 1.7 1.5h6.4A1.7 1.7 0 0 0 20.9 24l.9-11.6Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M10 12.4h12c.4-2.6-1.4-4.6-6-4.6s-6.4 2-6 4.6Z"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M13.1 9.4c.3-1.4 1.1-2.2 2.9-2.2s2.6.8 2.9 2.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        <motion.path
          d="M13.6 17.4 15.4 19.2 18.6 15.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={reduce ? undefined : { pathLength: [0.2, 1, 1, 0.2] }}
          transition={reduce ? undefined : { duration: 1.8, ...loop }}
        />
      </motion.g>

      <motion.circle
        cx="23.4"
        cy="8.6"
        r="1.05"
        fill="currentColor"
        animate={reduce ? undefined : { scale: [0.4, 1.2, 0.4], opacity: [0.2, 1, 0.2] }}
        transition={reduce ? undefined : { duration: 1.2, ...loop }}
        style={{ originX: "23.4px", originY: "8.6px" }}
      />
    </>
  );
}

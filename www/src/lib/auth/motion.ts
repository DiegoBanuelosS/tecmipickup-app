import { flushSync } from "react-dom";
import gsap from "gsap";
import styles from "../../pages/auth/AuthPage.module.css";

const ENTER = { duration: 0.72, ease: "power3.out" } as const;
const EXIT = { duration: 0.38, ease: "power3.in" } as const;
const STAGGER_IN = 0.055;
const STAGGER_OUT = 0.028;
const RISE = 28;
const VISUAL_TRAVEL = 108;

export type MotionRefs = {
  form: HTMLElement;
  visual: HTMLElement | null;
  submit: HTMLElement | null;
  card?: HTMLElement | null;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isVisualHidden(visual: HTMLElement | null) {
  return !visual || getComputedStyle(visual).display === "none";
}

export function collectPieces(form: HTMLElement, submit: HTMLElement | null): HTMLElement[] {
  const header = form.querySelector("header");
  const fields = gsap.utils.toArray<HTMLElement>(form.querySelectorAll(`.${styles.field}`));
  const links = form.querySelector(`.${styles.inlineLinks}`);
  const switchEl = form.querySelector(`.${styles.switch}`);

  return [header, ...fields, links, submit, switchEl].filter((node): node is HTMLElement =>
    Boolean(node),
  );
}

function killMotion({ form, visual, submit }: MotionRefs) {
  const pieces = collectPieces(form, submit);
  const brand = form.closest("main")?.querySelector(`.${styles.brand}`);
  gsap.killTweensOf([form, visual, submit, brand, ...pieces].filter(Boolean));
}

function revealImmediately({ form, visual, submit }: MotionRefs) {
  const pieces = collectPieces(form, submit);
  const brand = form.closest("main")?.querySelector(`.${styles.brand}`);

  gsap.set([form, visual, brand, ...pieces].filter(Boolean), { clearProps: "all" });
  gsap.set(pieces, { autoAlpha: 1, y: 0 });
  if (visual) {
    gsap.set(visual, { yPercent: 0, y: 0, autoAlpha: 1 });
  }
}

export function playEntrance(
  refs: MotionRefs,
  options: { animateVisual?: boolean; animateBrand?: boolean } = {},
) {
  const { form, visual, submit } = refs;
  const animateVisual = options.animateVisual !== false;
  const animateBrand = options.animateBrand !== false;
  const pieces = collectPieces(form, submit);

  killMotion(refs);

  if (prefersReducedMotion()) {
    revealImmediately(refs);
    return Promise.resolve();
  }

  const timeline = gsap.timeline({ defaults: { ease: ENTER.ease, overwrite: "auto" } });
  const brand = form.closest("main")?.querySelector(`.${styles.brand}`);

  gsap.set(form, { y: 0, autoAlpha: 1 });
  gsap.set(pieces, { y: RISE, autoAlpha: 0 });

  if (animateBrand && brand && Number(gsap.getProperty(brand, "opacity")) < 1) {
    gsap.set(brand, { y: 8, autoAlpha: 0 });
    timeline.to(brand, { y: 0, autoAlpha: 1, duration: 0.5 }, 0);
  }

  if (animateVisual && visual && !isVisualHidden(visual)) {
    gsap.set(visual, { y: 0, yPercent: -VISUAL_TRAVEL, autoAlpha: 1, force3D: true });
    timeline.to(
      visual,
      { yPercent: 0, duration: 0.95, ease: "power3.out", force3D: true },
      0,
    );
  }

  timeline.to(
    pieces,
    { y: 0, autoAlpha: 1, duration: ENTER.duration, stagger: STAGGER_IN },
    0.1,
  );

  return timeline;
}

export async function playSwap(options: {
  form: HTMLElement;
  visual: HTMLElement | null;
  submit: HTMLElement | null;
  card: HTMLElement | null;
  swapToRegister: boolean;
  onCross: () => void;
}) {
  const { form, visual, submit, card, swapToRegister, onCross } = options;
  const refs: MotionRefs = { form, visual, submit, card };
  const pieces = collectPieces(form, submit);

  killMotion(refs);

  if (prefersReducedMotion() || pieces.length === 0) {
    card?.classList.toggle(styles.cardSwapped, swapToRegister);
    onCross();
    return;
  }

  const showVisual = Boolean(visual && !isVisualHidden(visual));
  const exit = gsap.timeline({ defaults: { ease: EXIT.ease, overwrite: "auto" } });

  exit.to(
    pieces,
    { y: -RISE, autoAlpha: 0, duration: EXIT.duration, stagger: STAGGER_OUT },
    0,
  );

  if (showVisual && visual) {
    exit.to(
      visual,
      { yPercent: VISUAL_TRAVEL, y: 0, duration: 0.52, ease: "power3.in", force3D: true },
      0,
    );
  }

  await exit;

  flushSync(() => {
    card?.classList.toggle(styles.cardSwapped, swapToRegister);
    onCross();
  });

  await playEntrance(refs, { animateVisual: showVisual, animateBrand: false });
}

export function playLeave(refs: MotionRefs) {
  const { form, visual, submit } = refs;
  const pieces = collectPieces(form, submit);

  killMotion(refs);

  if (prefersReducedMotion()) {
    return Promise.resolve();
  }

  const timeline = gsap.timeline({ defaults: { ease: EXIT.ease } });

  timeline.to(
    pieces,
    { y: -20, autoAlpha: 0, duration: 0.32, stagger: 0.022 },
    0,
  );

  if (visual && !isVisualHidden(visual)) {
    timeline.to(
      visual,
      { yPercent: -24, autoAlpha: 0, duration: 0.36, force3D: true },
      0,
    );
  }

  const brand = form.closest("main")?.querySelector(`.${styles.brand}`);
  if (brand) {
    timeline.to(brand, { autoAlpha: 0, duration: 0.24 }, 0);
  }

  return timeline;
}

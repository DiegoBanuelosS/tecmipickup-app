import {
  KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { routes } from "@config/Router";
import { CartIcon, HomeIcon, ProfileIcon, SearchIcon } from "./DockIcons";
import styles from "./GlassDock.module.css";

export type DockIcon = ComponentType<{ className?: string; hovered?: boolean; active?: boolean }>;

export type DockGlyph = "home" | "search" | "cart" | "profile";

export type DockItem = {
  title: string;
  subtitle?: string;
  icon?: DockIcon;
  glyph?: DockGlyph;
  href?: string;
  onClick?: () => void;
  badge?: number;
};

type GlassDockProps = {
  items: DockItem[];
};

const spring = { type: "spring" as const, stiffness: 300, damping: 24 };
const tooltipSpring = { type: "spring" as const, stiffness: 120, damping: 18 };

function scaleForDistance(distance: number, reduceMotion: boolean) {
  if (reduceMotion) {
    return 1;
  }

  if (distance === 0) {
    return 1.22;
  }

  if (distance === 1) {
    return 1.08;
  }

  return 1;
}

function liftForDistance(distance: number, reduceMotion: boolean) {
  if (reduceMotion || distance > 1) {
    return 0;
  }

  return distance === 0 ? -8 : -3;
}

export default function GlassDock({ items }: GlassDockProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const dockRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [tooltipX, setTooltipX] = useState(0);

  function highlight(index: number) {
    setHoveredIndex((current) => {
      if (current !== null && index !== current) {
        setDirection(index > current ? 1 : -1);
      }
      return index;
    });
  }

  function clearHighlight() {
    setHoveredIndex(null);
    setDirection(0);
  }

  useLayoutEffect(() => {
    if (hoveredIndex === null || !dockRef.current) {
      return;
    }

    const item = itemRefs.current[hoveredIndex];
    const dock = dockRef.current;
    if (!item) {
      return;
    }

    const dockBox = dock.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    setTooltipX(itemBox.left - dockBox.left + itemBox.width / 2);
  }, [hoveredIndex, items.length]);

  const tooltip = hoveredIndex === null ? null : items[hoveredIndex];

  return (
    <div className={styles.wrap}>
      <nav ref={dockRef} className={styles.dock} aria-label="Principal" onMouseLeave={clearHighlight}>
        <AnimatePresence>
          {tooltip ? (
            <div className={styles.tooltipAnchor} style={{ left: tooltipX }}>
              <motion.div
                key="tooltip"
                className={styles.tooltip}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
                transition={reduceMotion ? { duration: 0 } : tooltipSpring}
              >
                <div className={styles.tooltipInner}>
                  <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.span
                      key={tooltip.title + (tooltip.subtitle ?? "")}
                      className={styles.tooltipCopy}
                      custom={direction}
                      initial={
                        reduceMotion
                          ? false
                          : {
                              x: direction > 0 ? 28 : -28,
                              opacity: 0,
                              filter: "blur(6px)",
                            }
                      }
                      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : {
                              x: direction > 0 ? -28 : 28,
                              opacity: 0,
                              filter: "blur(6px)",
                            }
                      }
                      transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
                    >
                      {tooltip.title}
                      {tooltip.subtitle ? <span className={styles.tooltipSub}>{tooltip.subtitle}</span> : null}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        {items.map((item, index) => {
          const Icon = resolveIcon(item);
          const active = Boolean(item.href) && isActive(item.href!, router.pathname);
          const distance = hoveredIndex === null ? 99 : Math.abs(index - hoveredIndex);
          const hovered = hoveredIndex === index;

          if (!Icon) {
            return null;
          }

          return (
            <DockControl
              key={`${item.title}-${index}`}
              item={item}
              active={active}
              hovered={hovered}
              scale={scaleForDistance(distance, Boolean(reduceMotion))}
              y={liftForDistance(distance, Boolean(reduceMotion))}
              onHighlight={() => highlight(index)}
              onClear={clearHighlight}
              controlRef={(node) => {
                itemRefs.current[index] = node;
              }}
            >
              <Icon
                hovered={hovered}
                active={active}
                className={active || hovered ? styles.iconActive : styles.icon}
              />
              {item.badge && item.badge > 0 ? (
                <span className={styles.badge} aria-hidden="true">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </DockControl>
          );
        })}
      </nav>
    </div>
  );
}

function resolveIcon(item: DockItem): DockIcon | undefined {
  if (item.glyph === "home") {
    return HomeIcon;
  }

  if (item.glyph === "search") {
    return SearchIcon;
  }

  if (item.glyph === "cart") {
    return CartIcon;
  }

  if (item.glyph === "profile") {
    return ProfileIcon;
  }

  return item.icon;
}

function isActive(href: string, pathname: string) {
  if (href === routes.client) {
    return pathname === routes.client;
  }

  if (href === routes.clientCart) {
    return pathname === href || pathname === routes.clientPay;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DockControl({
  item,
  active,
  hovered,
  scale,
  y,
  onHighlight,
  onClear,
  controlRef,
  children,
}: {
  item: DockItem;
  active: boolean;
  hovered: boolean;
  scale: number;
  y: number;
  onHighlight: () => void;
  onClear: () => void;
  controlRef: (node: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const className = `${styles.item} ${active ? styles.itemActive : ""} ${hovered ? styles.itemHovered : ""}`;
  const label = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.key === "Enter" || event.key === " ") && item.onClick) {
      event.preventDefault();
      item.onClick();
    }
  }

  const inner = (
    <motion.div
      className={styles.iconWrap}
      animate={{ scale, y }}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      transition={reduceMotion ? { duration: 0 } : spring}
    >
      {children}
    </motion.div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={className}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        onMouseEnter={onHighlight}
        onFocus={onHighlight}
        onBlur={onClear}
        ref={controlRef}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={item.onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onHighlight}
      onFocus={onHighlight}
      onBlur={onClear}
      ref={controlRef}
    >
      {inner}
    </button>
  );
}

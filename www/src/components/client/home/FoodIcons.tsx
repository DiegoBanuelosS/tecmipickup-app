import type { ReactElement } from "react";

export type FoodGlyph =
  | "sparkle"
  | "taco"
  | "coffee"
  | "salad"
  | "pizza"
  | "sushi"
  | "burger"
  | "cake"
  | "drink"
  | "plate";

type FoodIconProps = {
  glyph: FoodGlyph;
  className?: string;
};

/**
 * Line icon set for food categories, matching the dock icon style:
 * 24px grid, 1.75 stroke, currentColor.
 */
export function FoodIcon({ glyph, className }: FoodIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphs[glyph]}
    </svg>
  );
}

const glyphs: Record<FoodGlyph, ReactElement> = {
  sparkle: (
    <>
      <path d="M10.5 4c.5 3.4 2.2 5.1 5.6 5.6-3.4.5-5.1 2.2-5.6 5.6-.5-3.4-2.2-5.1-5.6-5.6 3.4-.5 5.1-2.2 5.6-5.6Z" />
      <path d="M17.4 14.6c.3 1.9 1.2 2.8 3.1 3.1-1.9.3-2.8 1.2-3.1 3.1-.3-1.9-1.2-2.8-3.1-3.1 1.9-.3 2.8-1.2 3.1-3.1Z" />
    </>
  ),
  taco: (
    <>
      <path d="M3.75 16.75a8.25 8.25 0 0 1 16.5 0Z" />
      <path d="M7.4 12.4c.77-.93 1.53-.93 2.3 0s1.53.93 2.3 0 1.53-.93 2.3 0 1.53.93 2.3 0" />
    </>
  ),
  coffee: (
    <>
      <path d="M5 10h11v4.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z" />
      <path d="M16 11.2h.9a2.4 2.4 0 0 1 0 4.8h-1.3" />
      <path d="M9.3 6.8c-.6-.9.6-1.4 0-2.3M12.7 6.8c-.6-.9.6-1.4 0-2.3" />
    </>
  ),
  salad: (
    <>
      <path d="M4 12.5h16a8 8 0 0 1-16 0Z" />
      <path d="M12 12.5V9.8" />
      <path d="M12 9.8c0-2.6 2-4.3 4.6-4.3 0 2.6-2 4.3-4.6 4.3Z" />
    </>
  ),
  pizza: (
    <>
      <path d="M12 20.5 4.6 7.3a15 15 0 0 1 14.8 0Z" />
      <path d="M6.3 9.9a11.6 11.6 0 0 1 11.4 0" />
      <circle cx="10.5" cy="12" r="0.95" />
      <circle cx="12.7" cy="15.4" r="0.95" />
    </>
  ),
  sushi: (
    <>
      <path d="M12 5c3.1 0 6.6 3.5 6.6 7.4 0 2.7-1.5 4.6-3.4 4.6H8.8c-1.9 0-3.4-1.9-3.4-4.6C5.4 8.5 8.9 5 12 5Z" />
      <path d="M9.7 17v-3.6h4.6V17" />
    </>
  ),
  burger: (
    <>
      <path d="M5 10.5a7 4.9 0 0 1 14 0Z" />
      <path d="M4.75 13.75h14.5" />
      <path d="M5.5 17h13a2.9 2.9 0 0 1-2.9 2.9H8.4A2.9 2.9 0 0 1 5.5 17Z" />
      <circle cx="10.2" cy="8.2" r="0.3" fill="currentColor" />
      <circle cx="13.8" cy="8.4" r="0.3" fill="currentColor" />
    </>
  ),
  cake: (
    <>
      <path d="M7 13.5h10l-1.1 5.4a1.1 1.1 0 0 1-1.1.9H9.2a1.1 1.1 0 0 1-1.1-.9Z" />
      <path d="M6.8 13.5a5.2 5.2 0 0 1 10.4 0" />
      <circle cx="12" cy="6.4" r="1.15" />
    </>
  ),
  drink: (
    <>
      <path d="M8.2 8h7.6l-1 11a1.5 1.5 0 0 1-1.5 1.4h-2.6a1.5 1.5 0 0 1-1.5-1.4Z" />
      <path d="M12.7 8.1 14.4 3" />
      <circle cx="10.4" cy="16.9" r="0.55" fill="currentColor" />
      <circle cx="12.9" cy="17.4" r="0.55" fill="currentColor" />
      <circle cx="11.6" cy="14.9" r="0.55" fill="currentColor" />
    </>
  ),
  plate: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <circle cx="12" cy="12" r="4.7" />
    </>
  ),
};

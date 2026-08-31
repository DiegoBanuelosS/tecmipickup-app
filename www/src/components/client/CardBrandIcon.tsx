import type { CardBrand } from "@lib/cardBrand";

type CardBrandIconProps = {
  brand: CardBrand;
  className?: string;
};

export default function CardBrandIcon({ brand, className }: CardBrandIconProps) {
  return (
    <svg viewBox="0 0 38 24" className={className} aria-hidden="true">
      {brand === "visa" ? <VisaMark /> : null}
      {brand === "mastercard" ? <MastercardMark /> : null}
      {brand === "amex" ? <AmexMark /> : null}
      {brand === "discover" ? <DiscoverMark /> : null}
      {brand === "unknown" ? <GenericMark /> : null}
    </svg>
  );
}

function VisaMark() {
  return (
    <>
      <rect width="38" height="24" rx="4" fill="#1a1f71" />
      <text
        x="19"
        y="16"
        textAnchor="middle"
        fill="#fff"
        fontSize="9"
        fontWeight="800"
        fontStyle="italic"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.6"
      >
        VISA
      </text>
    </>
  );
}

function MastercardMark() {
  return (
    <>
      <rect width="38" height="24" rx="4" fill="#111" />
      <circle cx="15" cy="12" r="7" fill="#eb001b" />
      <circle cx="23" cy="12" r="7" fill="#f79e1b" />
      <path
        d="M19 6.4a7 7 0 0 1 0 11.2 7 7 0 0 1 0-11.2Z"
        fill="#ff5f00"
      />
    </>
  );
}

function AmexMark() {
  return (
    <>
      <rect width="38" height="24" rx="4" fill="#016fd0" />
      <text
        x="19"
        y="16"
        textAnchor="middle"
        fill="#fff"
        fontSize="7.5"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.8"
      >
        AMEX
      </text>
    </>
  );
}

function DiscoverMark() {
  return (
    <>
      <rect width="38" height="24" rx="4" fill="#fff" stroke="#e4e4e4" />
      <text
        x="13"
        y="15.5"
        textAnchor="middle"
        fill="#171717"
        fontSize="6"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.3"
      >
        DISC
      </text>
      <circle cx="29" cy="12" r="5" fill="#f76f1c" />
    </>
  );
}

function GenericMark() {
  return (
    <>
      <rect width="38" height="24" rx="4" fill="#ececec" />
      <rect x="6" y="7" width="12" height="3" rx="1" fill="#c8c8c8" />
      <rect x="6" y="14" width="18" height="2.5" rx="1" fill="#d4d4d4" />
    </>
  );
}

/**
 * The board the page is printed on.
 *
 * Copper traces and vias, fixed behind everything at low opacity. Rendered as
 * an inline SVG rather than a CSS background image so it can read the theme
 * tokens and follow light and dark like the rest of the page.
 *
 * It is decoration with no meaning, so it is hidden from assistive technology
 * and never intercepts a pointer. Kept faint on purpose: the board is texture,
 * and the moment it reads as a drawing it is costing the reader something.
 */
export function Board() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="text-copper pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.07]"
    >
      <defs>
        <pattern id="traces" width="220" height="220" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.25">
            {/* Bus lines, with the 45° corners a router actually produces —
                copper is never bent at a right angle. */}
            <path d="M0 24 H60 L84 48 H160" />
            <path d="M0 96 H28 L52 72 H108 L132 96 H160" />
            <path d="M24 0 V44 L44 64 V160" />
            <path d="M116 0 V28 L96 48 V112 L120 136 V160" />
            <path d="M0 136 H72 L92 116" />
          </g>
          <g fill="none" stroke="currentColor" strokeWidth="1.25">
            {/* Vias: a ring with a drilled centre. */}
            <circle cx="60" cy="24" r="3.5" />
            <circle cx="108" cy="72" r="3.5" />
            <circle cx="44" cy="64" r="3.5" />
            <circle cx="96" cy="112" r="3.5" />
            <circle cx="28" cy="96" r="3.5" />
          </g>
          <g fill="currentColor" opacity="0.5">
            {/* Pads. */}
            <rect x="138" y="46" width="7" height="7" />
            <rect x="6" y="130" width="7" height="7" />
            <rect x="70" y="150" width="7" height="7" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#traces)" />
    </svg>
  );
}

/**
 * The shopping bag that sits in the Add to Cart button.
 *
 * Drawn rather than set as an emoji: 🛒 renders as a different object on
 * every platform — a trolley on Android, a basket on some Windows builds —
 * and comes in its own colour, which fights a button that is one flat black.
 * This inherits the button's text colour and is the same shape everywhere.
 *
 * Sized from the font size by .btn-cart in globals.css, so it scales with
 * whatever button it is dropped into.
 */
export default function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.5 8h15l-1.1 11.2a1.8 1.8 0 0 1-1.8 1.6H7.4a1.8 1.8 0 0 1-1.8-1.6Z" />
      <path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8" />
    </svg>
  );
}

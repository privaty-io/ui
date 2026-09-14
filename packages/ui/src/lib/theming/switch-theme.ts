/**
 * Applies a theme flip (or any whole-page restyle) ATOMICALLY.
 *
 * The general problem: elements carry `transition-colors` (and friends)
 * for their interaction states, so a theme flip makes every transitioned
 * property animate from old-theme to new-theme — each element on its own
 * duration and property set. Borders lag behind backgrounds and the page
 * goes through a mismatched half-faded frame. The common workaround —
 * transitions on EVERYTHING so at least it fades together — couples the
 * switch experience to every element's interaction transitions and
 * animates properties never meant to move.
 *
 * The fix keeps the two concerns apart:
 * - Where the View Transitions API exists, the flip runs inside
 *   `document.startViewTransition`: the browser crossfades a SNAPSHOT of
 *   the whole page in one composited animation, so everything switches
 *   in perfect sync.
 * - Elsewhere — and under `prefers-reduced-motion`, where instant is the
 *   correct experience — the flip lands as one clean frame.
 *
 * ThemeProvider routes its changes through this; call it directly for
 * hand-rolled toggles:
 *
 * ```ts
 * switchTheme(() => {
 *   document.documentElement.dataset.theme = next;
 * });
 * ```
 */
export function switchTheme(apply: () => void): void {
  if (typeof document === "undefined") {
    apply();
    return;
  }

  // The change always lands with element transitions suppressed — ALSO
  // inside a view transition: its "new" side is live-rendered, so an
  // unsuppressed border transition would half-fade within the incoming
  // snapshot. Suppression makes the new state instantly final; the
  // crossfade (when there is one) is then purely old → final.
  const applyAtomically = () => {
    const suppressor = document.createElement("style");
    suppressor.textContent =
      "*, *::before, *::after { transition: none !important; }";
    document.head.appendChild(suppressor);
    try {
      apply();
    } finally {
      // Flush styles so the change lands while transitions are off, then
      // let a frame paint before re-enabling them.
      void document.documentElement.offsetWidth;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => suppressor.remove()),
      );
    }
  };

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const withViewTransition = (
    document as Document & {
      startViewTransition?: (update: () => void) => unknown;
    }
  ).startViewTransition;

  if (!reduceMotion && withViewTransition) {
    withViewTransition.call(document, applyAtomically);
    return;
  }

  applyAtomically();
}

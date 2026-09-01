import type { Attachment } from "svelte/attachments";

/**
 * Anchored positioning: place a floating element (popover, tooltip, menu —
 * or any consumer content) next to an anchor element, kept in place across
 * scrolling, resizing, and content changes.
 *
 * Two layers, both public:
 * - {@link computeAnchorPosition} — the pure geometry (placement, flip,
 *   shift, offset). No DOM; deterministic and unit-testable.
 * - {@link anchorTo} — a Svelte attachment that measures the real elements,
 *   applies the result as fixed-position coordinates, and re-positions on
 *   scroll/resize automatically.
 *
 * Hand-rolled on purpose: the library positions its own overlays and stays
 * dependency-free. {@link anchorTo} is dual-engine — native CSS anchor
 * positioning (Baseline 2026) where the browser supports it, the JS engine
 * above as the fallback everywhere else.
 */

/** The anchor side the floating element is placed against. */
type Side = "top" | "bottom" | "left" | "right";

/** Cross-axis alignment along the chosen side (physical, not RTL-aware). */
type Alignment = "start" | "end";

/**
 * Where to place the floating element relative to its anchor: a side, with
 * an optional cross-axis alignment. A bare side centers on the cross axis;
 * `start` aligns the leading edges (left edge for top/bottom placements,
 * top edge for left/right), `end` the trailing edges.
 */
type Placement = Side | `${Side}-${Alignment}`;

/** A viewport-relative rectangle, shaped like `getBoundingClientRect()`. */
interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Width and height of the floating element or the boundary it must fit. */
interface AnchorSize {
  width: number;
  height: number;
}

/** Options shared by {@link computeAnchorPosition} and {@link anchorTo}. */
interface AnchorPositionOptions {
  /**
   * Preferred placement (default `"bottom"`). When `flip` is on and the
   * preferred side lacks room, the opposite side may be used instead — the
   * placement actually applied is reported back.
   */
  placement?: Placement;
  /** Gap in px between the anchor and the floating element (default 0). */
  offset?: number;
  /**
   * Flip to the opposite side when the floating element does not fit on the
   * preferred side AND the opposite side has more room (default true). The
   * cross-axis alignment is kept.
   */
  flip?: boolean;
  /**
   * Slide along the cross axis to keep the floating element inside the
   * viewport (default true). An element wider/taller than the viewport pins
   * its leading edge so the start of the content stays reachable.
   */
  shift?: boolean;
  /**
   * Minimum px kept between the floating element and the viewport edges
   * when flipping and shifting (default 0).
   */
  padding?: number;
}

/** Options for {@link anchorTo}: the shared geometry options plus the
 * engine override. */
interface AnchorToOptions extends AnchorPositionOptions {
  /**
   * Forces one positioning engine instead of the automatic pick (native
   * CSS anchor positioning where the browser supports it, the JS engine
   * elsewhere). Primarily a test/debug seam: where anchor positioning is
   * supported, the JS engine is otherwise unreachable — and it is the only
   * engine older browsers get, so it must stay testable. Forcing
   * `"native"` in a browser without support leaves the element unanchored.
   */
  engine?: "native" | "js";
}

/** Input to {@link computeAnchorPosition}: measurements plus options. */
interface ComputeAnchorPositionInput extends AnchorPositionOptions {
  /** The anchor's viewport-relative rectangle. */
  anchor: AnchorRect;
  /** The floating element's rendered size. */
  floating: AnchorSize;
  /** The boundary to fit within — normally the viewport's size. */
  viewport: AnchorSize;
}

/** The result of {@link computeAnchorPosition}. */
interface AnchorPosition {
  /** Viewport-relative x for the floating element's left edge. */
  x: number;
  /** Viewport-relative y for the floating element's top edge. */
  y: number;
  /**
   * The placement actually used — differs from the requested one when a
   * flip occurred. Useful for arrows and transform-origin styling.
   */
  placement: Placement;
}

const opposites: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Computes where a floating element should sit relative to its anchor.
 * Pure geometry — pass viewport-relative measurements, get viewport-relative
 * coordinates back. Prefer {@link anchorTo} for the common case; use this
 * directly for custom update strategies or non-DOM environments.
 */
function computeAnchorPosition(
  input: ComputeAnchorPositionInput,
): AnchorPosition {
  const {
    anchor,
    floating,
    viewport,
    placement = "bottom",
    offset = 0,
    flip = true,
    shift = true,
    padding = 0,
  } = input;

  const [preferred, alignment] = placement.split("-") as [
    Side,
    Alignment | undefined,
  ];

  // Free room between the anchor and each viewport edge, minus padding.
  const space: Record<Side, number> = {
    top: anchor.y - padding,
    bottom: viewport.height - (anchor.y + anchor.height) - padding,
    left: anchor.x - padding,
    right: viewport.width - (anchor.x + anchor.width) - padding,
  };

  const vertical = preferred === "top" || preferred === "bottom";
  const needed = offset + (vertical ? floating.height : floating.width);

  // Flip only when it actually helps: the preferred side must lack room AND
  // the opposite side must offer strictly more — otherwise an oversized
  // element would ping-pong between two equally-bad sides.
  let side = preferred;
  if (
    flip &&
    space[preferred] < needed &&
    space[opposites[preferred]] > space[preferred]
  ) {
    side = opposites[preferred];
  }

  // Main axis: sit against the chosen side, offset px away.
  let x = 0;
  let y = 0;
  if (side === "top") y = anchor.y - offset - floating.height;
  if (side === "bottom") y = anchor.y + anchor.height + offset;
  if (side === "left") x = anchor.x - offset - floating.width;
  if (side === "right") x = anchor.x + anchor.width + offset;

  // Cross axis: align edges (start/end) or centers (no alignment).
  const alignCross = (
    anchorStart: number,
    anchorLength: number,
    floatingLength: number,
  ) => {
    if (alignment === "start") return anchorStart;
    if (alignment === "end") return anchorStart + anchorLength - floatingLength;
    return anchorStart + (anchorLength - floatingLength) / 2;
  };

  if (vertical) x = alignCross(anchor.x, anchor.width, floating.width);
  else y = alignCross(anchor.y, anchor.height, floating.height);

  if (shift) {
    // Clamp the cross axis into the viewport. Math.max LAST: when the
    // element is bigger than the viewport, the leading edge wins so the
    // start of the content stays reachable.
    if (vertical) {
      x = Math.max(
        padding,
        Math.min(x, viewport.width - floating.width - padding),
      );
    } else {
      y = Math.max(
        padding,
        Math.min(y, viewport.height - floating.height - padding),
      );
    }
  }

  return {
    x,
    y,
    placement: alignment ? (`${side}-${alignment}` as Placement) : side,
  };
}

// CSS anchor positioning ships in every engine now (Baseline 2026 —
// Chrome 125+, Firefox 147+, Safari 18.2+): the compositor tracks the
// anchor, so the floating element never lags a frame behind scrolling the
// way JS repositioning inherently does (scrolling paints before the main
// thread hears the event). Detected once; the JS engine stays as the
// fallback for anything older.
const supportsAnchorPositioning =
  typeof CSS !== "undefined" &&
  CSS.supports("anchor-name", "--a") &&
  CSS.supports("position-area", "bottom");

// One anchor-name per attachment — names must not collide across
// simultaneously mounted overlays.
let anchorSequence = 0;

/** Our placement vocabulary mapped onto physical position-area keywords:
 * "span-right" grows rightward from the anchor's left edge — the physical
 * reading of our start alignment (and so on around the compass). */
const positionAreas: Record<Placement, string> = {
  top: "top",
  "top-start": "top span-right",
  "top-end": "top span-left",
  bottom: "bottom",
  "bottom-start": "bottom span-right",
  "bottom-end": "bottom span-left",
  left: "left",
  "left-start": "left span-bottom",
  "left-end": "left span-top",
  right: "right",
  "right-start": "right span-bottom",
  "right-end": "right span-top",
};

/** The margin side that pushes the element `offset` px away from the
 * anchor for each side of placement. */
const offsetMargins: Record<Side, string> = {
  top: "margin-bottom",
  bottom: "margin-top",
  left: "margin-right",
  right: "margin-left",
};

/**
 * Svelte attachment that keeps the attached element positioned next to
 * `anchor` — via native CSS anchor positioning where the browser has it
 * (compositor-tracked: zero scroll lag), and `position: fixed` viewport
 * coordinates updated from JS everywhere else. Both work for top-layer
 * elements like `[popover]`. The applied placement is exposed as
 * `data-placement` for styling (arrows, transform-origin) — see the
 * engine-differences note below for the native-mode nuance.
 *
 * ```svelte
 * <button bind:this={anchor}>Open</button>
 * <menu {@attach anchorTo(anchor, { placement: "bottom-start", offset: 4 })}>
 *   …
 * </menu>
 * ```
 *
 * Used inline like that, the attachment re-creates itself whenever `anchor`
 * or the options change — no manual update wiring. A hidden element (a
 * closed popover) positions itself the moment it becomes visible in both
 * engines.
 *
 * Engine differences kept small on purpose: `flip` maps to
 * `position-try-fallbacks` natively (so `data-placement` reports the
 * REQUESTED placement there, not the applied one the JS engine reports),
 * and `shift`/`padding` apply only in the JS engine — the native one
 * trades edge-shifting for lag-free tracking. In the JS engine size is
 * measured with `getBoundingClientRect`, so CSS transforms skew the math —
 * animate a transform on an inner wrapper.
 */
function anchorTo(
  anchor: Element | null | undefined,
  options: AnchorToOptions = {},
): Attachment<HTMLElement> {
  return (floating) => {
    if (!anchor) return;

    const native = options.engine
      ? options.engine === "native"
      : supportsAnchorPositioning;
    if (native && anchor instanceof HTMLElement) {
      const placement = options.placement ?? "bottom";
      const side = placement.split("-")[0] as Side;

      anchorSequence += 1;
      const name = `--privaty-anchor-${anchorSequence}`;
      // anchor-name takes a comma-separated LIST: append rather than
      // overwrite, and remove only this attachment's own name on cleanup —
      // an anchor hosting several overlays (a menu and a tooltip on one
      // button) must keep every still-mounted attachment anchored, in any
      // mount/unmount order.
      const previousNames = anchor.style.getPropertyValue("anchor-name");
      anchor.style.setProperty(
        "anchor-name",
        previousNames ? `${previousNames}, ${name}` : name,
      );

      // [popover] UA styles (`inset: 0; margin: auto`) must be overridden
      // here too, or the area resolution stretches the element.
      floating.style.position = "fixed";
      floating.style.inset = "auto";
      floating.style.margin = "0";
      floating.style.setProperty("position-anchor", name);
      floating.style.setProperty("position-area", positionAreas[placement]);
      floating.style.setProperty(
        offsetMargins[side],
        `${options.offset ?? 0}px`,
      );
      if (options.flip !== false) {
        floating.style.setProperty(
          "position-try-fallbacks",
          side === "top" || side === "bottom" ? "flip-block" : "flip-inline",
        );
      } else {
        // The attachment re-creates itself on the SAME element when options
        // change — a flip turned off must clear the previous run's value.
        floating.style.removeProperty("position-try-fallbacks");
      }
      floating.dataset.placement = placement;

      return () => {
        const remaining = anchor.style
          .getPropertyValue("anchor-name")
          .split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry && entry !== name);
        if (remaining.length) {
          anchor.style.setProperty("anchor-name", remaining.join(", "));
        } else {
          anchor.style.removeProperty("anchor-name");
        }
      };
    }

    const update = () => {
      const rect = floating.getBoundingClientRect();
      const position = computeAnchorPosition({
        anchor: anchor.getBoundingClientRect(),
        floating: { width: rect.width, height: rect.height },
        // documentElement.clientWidth/Height, NOT window.inner*: the inner
        // sizes include classic scrollbars, and this engine's audience
        // (browsers without anchor positioning) is exactly where those
        // exist — shift/flip must not tuck content under a scrollbar.
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
        },
        ...options,
      });

      // [popover] UA styles are `position: fixed; inset: 0; margin: auto` —
      // every one must be overridden, or the element stretches between the
      // leftover edges instead of taking its natural size.
      floating.style.position = "fixed";
      floating.style.margin = "0";
      floating.style.inset = "auto";
      floating.style.left = `${position.x}px`;
      floating.style.top = `${position.y}px`;
      floating.dataset.placement = position.placement;
    };

    update();

    // Scroll events don't bubble, but they do capture — one capture-phase
    // listener on window sees every ancestor scroller.
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);

    const observer = new ResizeObserver(update);
    observer.observe(floating);
    observer.observe(anchor);

    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  };
}

export { anchorTo, computeAnchorPosition };
export type {
  Alignment,
  AnchorPosition,
  AnchorPositionOptions,
  AnchorRect,
  AnchorSize,
  AnchorToOptions,
  ComputeAnchorPositionInput,
  Placement,
  Side,
};

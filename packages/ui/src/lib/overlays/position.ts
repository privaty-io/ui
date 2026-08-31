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
 * dependency-free. Internals can move to CSS anchor positioning once it is
 * baseline across browsers (Firefox lacked it when this was built).
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

/**
 * Svelte attachment that keeps the attached element positioned next to
 * `anchor`. Applies `position: fixed` viewport coordinates (which also work
 * for top-layer elements like `[popover]`) and re-positions on any ancestor
 * scroll, on window resize, and whenever the anchor or the element itself
 * changes size. The applied placement is exposed as `data-placement` for
 * styling (arrows, transform-origin).
 *
 * ```svelte
 * <button bind:this={anchor}>Open</button>
 * <menu {@attach anchorTo(anchor, { placement: "bottom-start", offset: 4 })}>
 *   …
 * </menu>
 * ```
 *
 * Used inline like that, the attachment re-creates itself whenever `anchor`
 * or the options change — no manual update wiring. A hidden element
 * (`display: none`, a closed popover) measures 0×0 and is re-positioned
 * automatically the moment it becomes visible, via the resize observer.
 *
 * Size is measured with `getBoundingClientRect`, so CSS transforms on the
 * element skew the math — animate a transform on an inner wrapper instead.
 */
function anchorTo(
  anchor: Element | null | undefined,
  options: AnchorPositionOptions = {},
): Attachment<HTMLElement> {
  return (floating) => {
    if (!anchor) return;

    const update = () => {
      const rect = floating.getBoundingClientRect();
      const position = computeAnchorPosition({
        anchor: anchor.getBoundingClientRect(),
        floating: { width: rect.width, height: rect.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
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
  ComputeAnchorPositionInput,
  Placement,
  Side,
};

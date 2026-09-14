<!-- @component
Two panes with a draggable gutter between them — the resizable half of
the tiling system. One pane carries a px size (`sized`, default the
start pane), the other takes the remainder; splits nest to build whole
pane trees. The gutter is the canvas showing through (same width as the
TileCanvas gaps) with a handle that fades in on hover; it is a real
`role="separator"`: focusable, arrow keys resize (Shift for big steps),
Home collapses (when `collapsible`) or goes to `min`, End to `max`, and
double-click resets to `initial`. With `collapsible`, dragging well past
`min` snaps the pane closed — the side-nav gesture. `collapsedSize`
moves that snap target off zero: the pane collapses to a compact width
(an icon rail) instead of disappearing.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props {
    /** The two panes. Put a full-height Tile (or a nested TileSplit)
     * in each. */
    start: Snippet;
    end: Snippet;

    /** Which axis the panes sit on: "horizontal" = side by side (the
     * gutter is vertical), "vertical" = stacked. */
    orientation?: "horizontal" | "vertical";
    /** Which pane carries the px size — the other takes the remainder.
     * A left nav is `sized: "start"`; a right rail `sized: "end"`. */
    sized?: "start" | "end";

    /** Starting size (px) of the sized pane — also the double-click
     * reset target. */
    initial?: number;
    /** Size bounds (px) for drag and keyboard alike. */
    min?: number;
    max?: number;
    /** Dragging clearly past `min` snaps the sized pane closed, and
     * Home collapses it — arrow keys or a drag reopen it at `min`. */
    collapsible?: boolean;
    /** Where a collapse lands (px). 0 hides the pane entirely (and the
     * gutter gives up its width); a compact width keeps a sliver open —
     * the icon-rail side nav. */
    collapsedSize?: number;

    /** Current size (px) of the sized pane — bindable, so the consumer
     * can persist and restore it. 0 = collapsed. */
    size?: number;

    /** Accessible name for the separator (e.g. "Resize navigation"). */
    label?: string;
    /** Extra classes for the split container. */
    class?: string;
  }

  let {
    start,
    end,
    orientation = "horizontal",
    sized = "start",
    initial = 240,
    min = 120,
    max = 560,
    collapsible = false,
    collapsedSize = 0,
    size = $bindable(initial),
    label,
    class: classes,
  }: Props = $props();

  const horizontal = $derived(orientation === "horizontal");

  // The sized track is a hard px; the flex track must be minmax(0, 1fr)
  // or its content would set a floor and the drag would stall.
  const template = $derived.by(() => {
    const tracks =
      sized === "start"
        ? `${size}px auto minmax(0, 1fr)`
        : `minmax(0, 1fr) auto ${size}px`;
    return horizontal
      ? `grid-template-columns: ${tracks}`
      : `grid-template-rows: ${tracks}`;
  });

  let dragging = $state(false);
  let dragOrigin = 0;
  let dragStartSize = 0;

  const coordinate = (event: PointerEvent) =>
    horizontal ? event.clientX : event.clientY;

  /** Drag clamp: continuous inside [min, max], with the collapse snap
   * once the candidate falls clearly below min. */
  function clampDrag(candidate: number): number {
    if (collapsible && candidate < min / 2) return collapsedSize;
    return Math.min(max, Math.max(min, candidate));
  }

  function onpointerdown(event: PointerEvent) {
    // Prevents text selection and stray focus while dragging; the
    // separator still takes keyboard focus via its tabindex.
    event.preventDefault();
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Capture is an optimization (keeps fast drags attached) — a
      // pointer the element can't capture must not abort the drag.
    }
    dragging = true;
    dragOrigin = coordinate(event);
    dragStartSize = size;
  }

  function onpointermove(event: PointerEvent) {
    if (!dragging) return;
    const delta = coordinate(event) - dragOrigin;
    // Moving the gutter toward the sized pane shrinks it — the sign
    // flips with which side the sized pane is on.
    size = clampDrag(dragStartSize + (sized === "start" ? delta : -delta));
  }

  function endDrag() {
    dragging = false;
  }

  function onkeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 64 : 16;
    // Arrows move the GUTTER, not the pane: left/up shrinks the start
    // side regardless of which pane carries the size.
    const towardStart =
      (horizontal && event.key === "ArrowLeft") ||
      (!horizontal && event.key === "ArrowUp");
    const towardEnd =
      (horizontal && event.key === "ArrowRight") ||
      (!horizontal && event.key === "ArrowDown");

    let next: number;
    if (towardStart) next = size + (sized === "end" ? step : -step);
    else if (towardEnd) next = size + (sized === "end" ? -step : step);
    else if (event.key === "Home") next = collapsible ? collapsedSize : min;
    else if (event.key === "End") next = max;
    else return;
    event.preventDefault();

    // Keyboard never snap-collapses on its own (Home is the deliberate
    // gesture); from collapsed, any grow reopens at min.
    size =
      next <= collapsedSize
        ? collapsible
          ? collapsedSize
          : min
        : Math.min(max, Math.max(min, next));
  }
</script>

<div
  class={cn("grid min-h-0 min-w-0", classes)}
  style={template}
  data-dragging={dragging ? "" : undefined}
>
  <!-- overflow-hidden: a collapsed pane's content must not bleed into
       the neighbouring track. -->
  <div class="min-h-0 min-w-0 overflow-hidden">{@render start()}</div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <!-- The WAI-ARIA window-splitter pattern IS a focusable separator with
       value semantics — the linter just doesn't know the role. -->
  <div
    role="separator"
    tabindex="0"
    aria-orientation={horizontal ? "vertical" : "horizontal"}
    aria-label={label}
    aria-valuemin={collapsible ? collapsedSize : min}
    aria-valuemax={max}
    aria-valuenow={size}
    class={cn(
      coreTheme.tiles.separator,
      horizontal ? "cursor-col-resize" : "cursor-row-resize",
      // Collapsed, the gutter gives up its width too: otherwise the
      // canvas padding and the gutter stack into a double edge inset.
      // The widened hit area below keeps it grabbable at the edge.
      horizontal
        ? size === 0
          ? "w-0"
          : "w-1.5"
        : size === 0
          ? "h-0"
          : "h-1.5",
    )}
    {onpointerdown}
    {onpointermove}
    onpointerup={endDrag}
    onpointercancel={endDrag}
    {onkeydown}
    ondblclick={() => (size = initial)}
  >
    <!-- Widened invisible hit area — a 6px gutter is honest to look at
         and miserable to grab. -->
    <div
      class={cn(
        "absolute",
        horizontal ? "-inset-x-1 inset-y-0" : "inset-x-0 -inset-y-1",
      )}
    ></div>
    <!-- The handle: invisible until the pointer or keyboard finds the
         gutter, solid while dragging. -->
    <div
      class={cn(
        coreTheme.tiles.separatorHandle,
        "shrink-0",
        horizontal ? "h-full w-0.5" : "h-0.5 w-full",
        dragging && "opacity-100",
      )}
    ></div>
  </div>

  <div class="min-h-0 min-w-0 overflow-hidden">{@render end()}</div>
</div>

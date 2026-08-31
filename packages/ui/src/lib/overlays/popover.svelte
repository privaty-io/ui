<!-- @component
Interactive overlay anchored to a trigger — built on the native popover
attribute, so it renders on the top layer (no z-index or overflow fights)
with light dismiss and Escape handled by the browser. The trigger snippet
must spread the given props onto a `<button>`; open/close then works with
zero JS via the native invoker, and `bind:open` adds programmatic control.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";
  import { anchorTo, type Placement } from "./position";

  interface PopoverTriggerProps {
    /** Wires the native invoker: click-to-toggle without any JS. */
    popovertarget: string;
    /** Kept explicit (not just the browser's implicit invoker semantics)
     * so every browser and assistive tech sees the same state. */
    "aria-expanded": boolean;
  }

  interface Props {
    /** Renders the trigger. Spread the given props onto a `<button>` (or a
     * component that forwards rest props to one, like Button) — the native
     * popovertarget invoker only works on buttons. */
    trigger: Snippet<[PopoverTriggerProps]>;
    /** Panel content — interactive content is fine here (unlike Tooltip). */
    children: Snippet;

    /** Open state (bindable): set it to open/close programmatically — e.g.
     * closing a picker after a selection. */
    open?: boolean;

    /** Preferred side/alignment relative to the trigger (default
     * "bottom"); flips when out of room. */
    placement?: Placement;
    /** Gap in px between trigger and panel (default 6). */
    offset?: number;
    /** Flip to the opposite side when out of room (default true). */
    flip?: boolean;
    /** Slide along the cross axis to stay in the viewport (default true). */
    shift?: boolean;
    /** Minimum px kept to the viewport edges (default 8). */
    padding?: number;

    /** Extra classes for the panel. */
    class?: string;
  }

  let {
    trigger,
    children,

    open = $bindable(false),

    placement = "bottom",
    offset = 6,
    flip = true,
    shift = true,
    padding = 8,

    class: classes,
  }: Props = $props();

  const id = $props.id();

  let wrapper = $state<HTMLSpanElement>();
  let panel = $state<HTMLDivElement>();

  // display: contents leaves the wrapper box-less — the anchor for
  // positioning is the actual trigger element the snippet rendered.
  const anchor = $derived(wrapper?.firstElementChild);

  // Programmatic control: converge the element's top-layer state onto
  // `open`. Native interactions (invoker click, light dismiss, Escape)
  // travel the other way via the toggle event; the :popover-open guard
  // keeps the two paths from re-triggering each other.
  $effect(() => {
    if (!panel) return;
    const shown = panel.matches(":popover-open");
    if (open && !shown) panel.showPopover();
    else if (!open && shown) panel.hidePopover();
  });
</script>

<span style="display: contents" bind:this={wrapper}>
  {@render trigger({ popovertarget: id, "aria-expanded": open })}
</span>

<div
  bind:this={panel}
  {id}
  popover="auto"
  ontoggle={(event) => (open = event.newState === "open")}
  class={cn(coreTheme.popover, classes)}
  {@attach anchorTo(anchor, { placement, offset, flip, shift, padding })}
>
  {@render children()}
</div>

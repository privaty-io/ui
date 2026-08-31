<!-- @component
Hover/focus tooltip — non-interactive by contract (`role="tooltip"`,
pointer-events off, never focused). Renders via popover="hint" so it sits
on the top layer without dismissing open auto popovers; browsers without
hint treat it as manual, which behaves identically here because show/hide
is driven by the trigger's hover and focus. The trigger snippet must
spread the given props onto the element being described.
-->
<script lang="ts">
  import { onDestroy, type Snippet } from "svelte";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";
  import { anchorTo, type Placement } from "./position";

  interface TooltipTriggerProps {
    /** Links the trigger to the tooltip text for assistive tech. */
    "aria-describedby": string;
    onpointerenter: () => void;
    onpointerleave: () => void;
    onfocus: () => void;
    onblur: () => void;
    onkeydown: (event: KeyboardEvent) => void;
  }

  interface Props {
    /** Renders the described element. Spread the given props onto it (or a
     * component that forwards rest props). */
    trigger: Snippet<[TooltipTriggerProps]>;
    /** Tooltip content — text or simple markup, NEVER interactive: the
     * bubble ignores pointer events and cannot be focused. */
    children: Snippet;

    /** Delay in ms before showing on hover (default 300). Keyboard focus
     * shows immediately — a keyboard user already committed to the
     * element. */
    openDelay?: number;

    /** Preferred side/alignment relative to the trigger (default "top"). */
    placement?: Placement;
    /** Gap in px between trigger and bubble (default 6). */
    offset?: number;

    /** Extra classes for the bubble. */
    class?: string;
  }

  let {
    trigger,
    children,

    openDelay = 300,

    placement = "top",
    offset = 6,

    class: classes,
  }: Props = $props();

  const id = $props.id();

  let wrapper = $state<HTMLSpanElement>();
  let panel = $state<HTMLDivElement>();

  // Same pattern as Popover: the box-less wrapper hands us the trigger
  // element as the positioning anchor.
  const anchor = $derived(wrapper?.firstElementChild);

  let timer: ReturnType<typeof setTimeout> | undefined;

  function show(delay: number) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (panel?.isConnected && !panel.matches(":popover-open")) {
        panel.showPopover();
      }
    }, delay);
  }

  function hide() {
    clearTimeout(timer);
    if (panel?.isConnected && panel.matches(":popover-open")) {
      panel.hidePopover();
    }
  }

  onDestroy(() => clearTimeout(timer));
</script>

<span style="display: contents" bind:this={wrapper}>
  {@render trigger({
    "aria-describedby": id,
    onpointerenter: () => show(openDelay),
    onpointerleave: hide,
    onfocus: () => show(0),
    onblur: hide,
    onkeydown: (event) => {
      if (event.key === "Escape") hide();
    },
  })}
</span>

<div
  bind:this={panel}
  {id}
  role="tooltip"
  popover="hint"
  class={cn(coreTheme.tooltip, classes)}
  {@attach anchorTo(anchor, { placement, offset })}
>
  {@render children()}
</div>

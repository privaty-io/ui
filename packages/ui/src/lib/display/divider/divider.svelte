<!-- @component
An in-tile hairline separator. Horizontal by default (optionally with a
small centered label — "Optional details", "or"); `vertical` renders a
self-stretching line for toolbars and header rows. Purely presentational
structure — for a RESIZABLE boundary use TileSplit.
-->
<script lang="ts">
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props {
    /** Small text centered in the line — horizontal only. */
    label?: string;
    /** A vertical line (self-stretch inside a flex row). */
    vertical?: boolean;
    /** Extra classes for the divider. */
    class?: string;
  }

  const { label, vertical = false, class: classes }: Props = $props();
</script>

{#if vertical}
  <div
    role="separator"
    aria-orientation="vertical"
    class={cn("w-px self-stretch", coreTheme.divider.line, classes)}
  ></div>
{:else if label !== undefined}
  <div role="separator" class={cn("flex items-center gap-3", classes)}>
    <span class={cn("h-px flex-1", coreTheme.divider.line)}></span>
    <span class={coreTheme.divider.label}>{label}</span>
    <span class={cn("h-px flex-1", coreTheme.divider.line)}></span>
  </div>
{:else}
  <div
    role="separator"
    class={cn("h-px w-full", coreTheme.divider.line, classes)}
  ></div>
{/if}

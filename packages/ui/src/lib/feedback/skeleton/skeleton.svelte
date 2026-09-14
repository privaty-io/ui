<!-- @component
Loading placeholder — Spinner's quieter sibling for pane-shaped waits.
One block by default (size it with `class`), or `lines` for a stack of
text-shaped bars with a naturally ragged last line. Hidden from
assistive tech: pair it with a live region (the table's veil pattern)
when the wait needs announcing.
-->
<script lang="ts">
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props {
    /** Renders this many text-line bars instead of one block. */
    lines?: number;
    /** Extra classes — sizes the single block (e.g. "h-24 w-full"), or
     * styles each line. */
    class?: string;
  }

  const { lines, class: classes }: Props = $props();
</script>

{#if lines === undefined}
  <div aria-hidden="true" class={cn(coreTheme.skeleton, classes)}></div>
{:else}
  <div aria-hidden="true" class="flex flex-col gap-2">
    {#each { length: lines }, index}
      <div
        class={cn(
          coreTheme.skeleton,
          "h-3.5",
          index === lines - 1 && lines > 1 ? "w-3/5" : "w-full",
          classes,
        )}
      ></div>
    {/each}
  </div>
{/if}

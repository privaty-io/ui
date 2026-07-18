<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "../cn";

  interface Props extends Omit<HTMLButtonAttributes, "class"> {
    class?: string;

    children?: Snippet;
  }

  const { class: classes, children, ...rest }: Props = $props();

  // No color transitions on purpose: theme switches must snap, not crossfade.
  const classDefaults = cn(
    "cursor-pointer rounded px-3 py-1.5 disabled:cursor-not-allowed",
    "bg-stone-800 text-stone-50 hover:bg-stone-700 active:bg-stone-800",
    "disabled:bg-stone-800/50",
    "dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300 dark:active:bg-stone-200",
    "dark:disabled:bg-stone-200/50",
  );
</script>

<button {...rest} class={cn(classDefaults, classes)}>
  {@render children?.()}
</button>

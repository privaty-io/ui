<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import type { ButtonVariant } from "./types";

  interface Props extends Omit<HTMLButtonAttributes, "class"> {
    variant?: ButtonVariant;

    class?: string;

    children?: Snippet;
  }

  const {
    variant = "primary",
    class: classes,
    children,
    ...rest
  }: Props = $props();

  const baseClasses = cn(
    "cursor-pointer rounded px-3 py-1.5 disabled:cursor-not-allowed",
  );

  const variantClasses: Record<ButtonVariant, string> = {
    primary: cn(
      "bg-stone-800 text-stone-50 enabled:hover:bg-stone-700 enabled:active:bg-stone-800",
      "disabled:bg-stone-800/50",
      "dark:bg-stone-200 dark:text-stone-900 dark:enabled:hover:bg-stone-300 dark:enabled:active:bg-stone-200",
      "dark:disabled:bg-stone-200/50",
    ),
    secondary: cn(
      "border border-stone-400 bg-transparent text-inherit enabled:hover:bg-stone-200/50 enabled:active:bg-transparent",
      "disabled:border-stone-400/50 disabled:text-stone-500",
      "dark:border-stone-600 dark:bg-transparent dark:enabled:hover:bg-stone-800/50 dark:enabled:active:bg-transparent",
      "dark:disabled:border-stone-600/50 dark:disabled:text-stone-400",
    ),
  };
</script>

<button {...rest} class={cn(baseClasses, variantClasses[variant], classes)}>
  {@render children?.()}
</button>

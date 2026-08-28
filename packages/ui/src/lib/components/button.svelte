<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";
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

  const baseClasses = coreTheme.button.base;

  const variantClasses: Record<ButtonVariant, string> = {
    primary: coreTheme.button.primary,
    secondary: coreTheme.button.secondary,
  };
</script>

<button {...rest} class={cn(baseClasses, variantClasses[variant], classes)}>
  {@render children?.()}
</button>

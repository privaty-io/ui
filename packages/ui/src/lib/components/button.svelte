<!-- @component
Themed button with primary and secondary variants. All native <button>
attributes pass through; classes are merged with tailwind-merge, so
conflicting consumer utilities win over the theme's.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "../cn";
  import { coreTheme } from "../theme";
  import type { ButtonVariant } from "./types";

  interface Props extends Omit<HTMLButtonAttributes, "class"> {
    /** Visual variant from the core theme. Defaults to "primary". */
    variant?: ButtonVariant;

    /** Extra classes for the <button> element — merged after the theme classes. */
    class?: string;

    /** Button content. */
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

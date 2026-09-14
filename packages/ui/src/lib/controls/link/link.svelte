<!-- @component
An `<a>` with exactly the Button skin — the same four variants from the
same theme tokens, so links and buttons are visually interchangeable and
only the semantics differ (navigation vs action). Defaults to the "text"
variant: underlined, blending into copy, a gentle wash on hover. Use
"primary"/"secondary"/"ghost" for links that should look like buttons.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";
  import type { ButtonVariant } from "../button/types";

  interface Props extends Omit<HTMLAnchorAttributes, "class"> {
    /** Visual variant from the core theme. Defaults to "text" — links
     * usually live in copy; Button defaults to "primary" for the same
     * reason in reverse. */
    variant?: ButtonVariant;

    /** Extra classes for the <a> element — merged after the theme
     * classes. */
    class?: string;

    /** Link content. */
    children?: Snippet;
  }

  const {
    variant = "text",
    class: classes,
    children,
    ...rest
  }: Props = $props();

  const variantClasses: Record<ButtonVariant, string> = {
    primary: coreTheme.button.primary,
    secondary: coreTheme.button.secondary,
    ghost: coreTheme.button.ghost,
    text: coreTheme.button.text,
  };
</script>

<a
  {...rest}
  class={cn(coreTheme.button.base, variantClasses[variant], classes)}
>
  {@render children?.()}
</a>

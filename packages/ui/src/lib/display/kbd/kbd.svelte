<!-- @component
A key-cap chip for keyboard hints — `<Kbd>⌘</Kbd><Kbd>K</Kbd>`, "press
<Kbd>Home</Kbd> to collapse". Renders a real `<kbd>` element.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../../cn/cn";
  import { coreTheme } from "../../theme";

  interface Props {
    children: Snippet;
    /** Extra classes for the chip. */
    class?: string;
  }

  const { children, class: classes }: Props = $props();
</script>

<kbd class={cn(coreTheme.kbd, classes)}>{@render children()}</kbd>

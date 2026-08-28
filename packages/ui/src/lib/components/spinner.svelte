<!-- @component
Spinning loading indicator (lucide LoaderCircle, size-4 by default).
Rendered aria-hidden — purely decorative, so pair it with visible or
sr-only text when it conveys state.
-->
<script lang="ts">
  import { LoaderCircleIcon } from "@lucide/svelte";
  import { cn } from "../cn";

  interface Props {
    /** Extra classes for the icon — e.g. a size utility to override the default size-4. */
    class?: string;
  }

  const { class: classes }: Props = $props();
</script>

<LoaderCircleIcon
  class={cn("size-4 animate-spin", classes)}
  aria-hidden={true}
/>

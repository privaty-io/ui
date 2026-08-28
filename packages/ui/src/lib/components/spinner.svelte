<script lang="ts">
  import { LoaderCircleIcon } from "@lucide/svelte";
  import { cn } from "../cn";

  interface Props {
    class?: string;
  }

  const { class: classes }: Props = $props();
</script>

<LoaderCircleIcon
  class={cn("size-4 animate-spin", classes)}
  aria-hidden={true}
/>

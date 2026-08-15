<script lang="ts">
  // Test-only host: a real form wrapping the Select, to assert what FormData
  // the browser actually constructs from it (Kit validates exactly this).
  import type { ComponentProps } from "svelte";
  import Select from "./select.svelte";

  type Props = ComponentProps<typeof Select>;

  const props: Props = $props();
</script>

<form data-testid="host-form">
  <Select {...props} />
</form>

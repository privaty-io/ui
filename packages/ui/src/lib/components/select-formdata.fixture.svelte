<script lang="ts">
  // Test-only host: a real form wrapping the Select, to assert what FormData
  // the browser actually constructs from it (Kit validates exactly this).
  import type { SelectOption } from "./types";
  import Select from "./select.svelte";

  // A local interface instead of ComponentProps<typeof Select>: the alias
  // resolves to Select's non-exported Props, which d.ts generation for this
  // fixture then "cannot name" — the one warning svelte-package printed on
  // every build.
  interface Props {
    label: string;
    name: string;
    options: readonly (string | SelectOption)[];
    placeholder?: string;
    value?: string;
  }

  const props: Props = $props();
</script>

<form data-testid="host-form">
  <Select {...props} />
</form>

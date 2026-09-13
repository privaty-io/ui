<script lang="ts">
  import MonthPicker from "./month-picker.svelte";

  interface Props {
    initial?: string;
    min?: string;
    max?: string;
    onselect?: (iso: string) => void;
  }

  const { initial = "", min, max, onselect }: Props = $props();

  // Deliberate: the fixture seeds once from the initial prop.
  // svelte-ignore state_referenced_locally
  let value = $state(initial);
</script>

<MonthPicker bind:value locale="da" {min} {max} {onselect} />
<p data-testid="value">{value}</p>

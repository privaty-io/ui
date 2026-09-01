<script lang="ts">
  import WeekPicker from "./week-picker.svelte";

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

  /** Simulates a parent writing the bound value after mount. */
  export function setValue(next: string) {
    value = next;
  }
</script>

<WeekPicker bind:value locale="da" {min} {max} {onselect} />
<p data-testid="value">{value}</p>

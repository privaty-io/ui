<script lang="ts">
  // Test-only host: deterministic Danish locale (Monday grid) and a value
  // readout — "today" comes from the real clock, so specs anchor on value.
  import DatePicker from "./date-picker.svelte";

  interface Props {
    initial?: string;
    min?: string;
    max?: string;
    showWeekNumbers?: boolean;
    isDateDisabled?: (iso: string) => boolean;
    onselect?: (iso: string) => void;
  }

  const {
    initial = "",
    min,
    max,
    showWeekNumbers,
    isDateDisabled,
    onselect,
  }: Props = $props();

  // Deliberate: the fixture seeds once from the initial prop.
  // svelte-ignore state_referenced_locally
  let value = $state(initial);
</script>

<DatePicker
  bind:value
  locale="da"
  {min}
  {max}
  {showWeekNumbers}
  {isDateDisabled}
  {onselect}
/>
<p data-testid="value">{value}</p>

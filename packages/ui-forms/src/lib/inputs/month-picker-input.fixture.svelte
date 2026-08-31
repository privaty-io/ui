<script lang="ts">
  // Test-only host — see date-picker-input.fixture.svelte.
  import { setUiConfig } from "@privaty/ui/config/context.js";
  import type { PartialUiConfig } from "@privaty/ui/config/types.js";
  import type { ComponentProps } from "svelte";
  import { setFormContext } from "../context";
  import { FormState } from "../form-state.svelte";
  import type { ValidatableForm } from "../types/form";
  import MonthPickerInput from "./month-picker-input.svelte";

  interface Props extends ComponentProps<typeof MonthPickerInput> {
    form: ValidatableForm;
    uiConfig?: PartialUiConfig;
    settled?: boolean;
    /** Mirrors Kit's form-level input listener — pass the fake's `edit`. */
    syncField?: (value: string) => void;
  }

  const {
    form,
    uiConfig,
    settled = true,
    syncField,
    ...inputProps
  }: Props = $props();

  // All fixture props are stable for the component's lifetime.
  // svelte-ignore state_referenced_locally
  if (uiConfig) setUiConfig(uiConfig);

  // svelte-ignore state_referenced_locally
  export const state = new FormState(form);
  // svelte-ignore state_referenced_locally
  setFormContext({ form, state });

  // svelte-ignore state_referenced_locally
  state.settled = settled;

  function oninput(event: Event) {
    syncField?.((event.target as HTMLInputElement).value);
  }
</script>

<div {oninput}>
  <MonthPickerInput {...inputProps} />
</div>

<script lang="ts">
  // Test-only host: sets the form + config contexts DatePickerInput needs,
  // since the real context keys are private Symbols. Never used at runtime.
  import { setUiConfig } from "@privaty/ui/config/context.js";
  import type { PartialUiConfig } from "@privaty/ui/config/types.js";
  import type { ComponentProps } from "svelte";
  import { setFormContext } from "../context";
  import { FormState } from "../form-state.svelte";
  import type { ValidatableForm } from "../types/form";
  import DatePickerInput from "./date-picker-input.svelte";

  interface Props extends ComponentProps<typeof DatePickerInput> {
    form: ValidatableForm;
    uiConfig?: PartialUiConfig;
    settled?: boolean;
    /** Mirrors Kit's form-level input listener: a bubbling input event
     * (typing or a picker pick) syncs the DOM value into the fake field's
     * state — pass the fake's `edit` here. */
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
    // Like Kit's real form-level listener, sync only NAMED controls — the
    // picker's unnamed header dropdowns must not write into the field.
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name) {
      syncField?.(target.value);
    }
  }
</script>

<div {oninput}>
  <DatePickerInput {...inputProps} />
</div>

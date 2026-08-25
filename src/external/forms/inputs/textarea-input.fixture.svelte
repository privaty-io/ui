<script lang="ts">
  // Test-only host: sets the form + config contexts TextareaInput needs,
  // since the real context keys are private Symbols. Never used at runtime.
  import { setUiConfig } from "#privaty/ui/config/context.js";
  import type { PartialUiConfig } from "#privaty/ui/config/types.js";
  import type { ComponentProps } from "svelte";
  import { setFormContext } from "../context";
  import { FormState } from "../form-state.svelte";
  import type { FieldRegistration } from "../types/field";
  import type { ValidatableForm } from "../types/form";
  import TextareaInput from "./textarea-input.svelte";

  interface Props extends ComponentProps<typeof TextareaInput> {
    form: ValidatableForm;
    uiConfig?: PartialUiConfig;
    extraRegistrations?: FieldRegistration[];
    settled?: boolean;
  }

  const {
    form,
    uiConfig,
    extraRegistrations,
    settled = true,
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
  for (const registration of extraRegistrations ?? []) {
    state.register(registration);
  }

  // svelte-ignore state_referenced_locally
  state.settled = settled;
</script>

<TextareaInput {...inputProps} />

<script lang="ts">
  // Test-only host: sets the form + config contexts TextInput needs, since
  // the real context keys are private Symbols. Never used at runtime.
  import { setUiConfig } from "@privaty/ui/config/context";
  import type { PartialUiConfig } from "@privaty/ui/config/types";
  import type { ComponentProps } from "svelte";
  import { setFormContext } from "../context";
  import { FormState } from "../form-state.svelte";
  import type { FieldRegistration } from "../types/field";
  import type { ValidatableForm } from "../types/form";
  import TextInput from "./text-input.svelte";

  interface Props extends ComponentProps<typeof TextInput> {
    form: ValidatableForm;
    uiConfig?: PartialUiConfig;
    extraRegistrations?: FieldRegistration[];
  }

  const { form, uiConfig, extraRegistrations, ...inputProps }: Props = $props();

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
</script>

<TextInput {...inputProps} />

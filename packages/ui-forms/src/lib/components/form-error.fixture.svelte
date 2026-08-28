<script lang="ts">
  // Test-only host: sets the form + config contexts FormError needs, since the
  // real context keys are private Symbols. Never used at runtime.
  import { setUiConfig } from "@privaty/ui/config/context.js";
  import type { PartialUiConfig } from "@privaty/ui/config/types.js";
  import type { ComponentProps } from "svelte";
  import { setFormContext } from "../context";
  import { FormState } from "../form-state.svelte";
  import type { ValidatableForm } from "../types/form";
  import FormError from "./form-error.svelte";

  interface Props extends ComponentProps<typeof FormError> {
    form: ValidatableForm;
    uiConfig?: PartialUiConfig;
  }

  const { form, uiConfig, ...errorProps }: Props = $props();

  // All fixture props are stable for the component's lifetime.
  // svelte-ignore state_referenced_locally
  if (uiConfig) setUiConfig(uiConfig);

  // svelte-ignore state_referenced_locally
  export const state = new FormState(form);
  // svelte-ignore state_referenced_locally
  setFormContext({ form, state });
</script>

<FormError {...errorProps} />

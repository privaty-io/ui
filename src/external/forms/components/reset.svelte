<script lang="ts">
  import Button from "#privaty/ui/components/button.svelte";
  import { getUiConfig } from "#privaty/ui/config/context.js";
  import { getFormContext } from "../context";

  interface Props {
    label?: string;

    class?: string;
  }

  const { label, class: classes }: Props = $props();

  const { state } = getFormContext();
  const config = getUiConfig();
</script>

<!-- Nothing to reset while pristine; the native reset event triggers
     FormState.reset() via the Form component's onreset handler. -->
<Button
  type="reset"
  variant="secondary"
  disabled={!state.isDirty || state.isSubmitting}
  class={classes}
>
  {label ?? config.labels.form.reset}
</Button>

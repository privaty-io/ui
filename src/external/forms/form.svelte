<script lang="ts" generics="Input extends RemoteFormInput, Output">
  import { cn } from "@privaty/ui/cn";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import type { RemoteForm, RemoteFormInput } from "@sveltejs/kit";
  import { onMount, type Snippet } from "svelte";
  import { setFormContext } from "./context";
  import { FormState } from "./form-state.svelte";

  type Props = {
    form: Omit<RemoteForm<Input, Output>, "for">;
    schema?: StandardSchemaV1<Input>;

    resetOnSuccess?: boolean;

    onsuccess?: (result: Output | undefined) => void | Promise<void>;
    onerror?: (error: unknown) => void | Promise<void>;

    class?: string;

    children: Snippet;
  };

  const {
    form,
    schema,

    resetOnSuccess = true,

    onsuccess,
    onerror,

    class: classes,

    children,
  }: Props = $props();

  // The remote form instance is stable for the component's lifetime, so
  // capturing the initial prop value is intentional. When a schema is given,
  // the preflighted instance is used for everything so client-side
  // (`preflightOnly`) validation actually has a schema to run.
  // svelte-ignore state_referenced_locally
  const instance = schema ? form.preflight(schema) : form;

  const state = new FormState(instance);
  setFormContext({ form: instance, state });

  // A parent mounts after its children, so every field has registered by now.
  onMount(() => {
    state.settled = true;
  });

  // With a schema, typing validates client-side only — the server isn't
  // involved until submission (which validates server-side regardless).
  function validate() {
    return instance.validate({
      includeUntouched: true,
      preflightOnly: schema !== undefined,
    });
  }

  const attributes = instance.enhance(async (enhanceInstance) => {
    state.submitError = undefined;

    // Validate BEFORE opening the error gates: issues must be fresh when
    // submitAttempted makes every field's issues visible.
    await validate();
    state.submitAttempted = true;
    if (!state.isValid) return;

    try {
      if (!(await enhanceInstance.submit())) return;

      if (resetOnSuccess) enhanceInstance.element.reset();

      await onsuccess?.(instance.result);
    } catch (error) {
      state.submitError = error;
      await onerror?.(error);
    }
  });

  async function handleInput(event: Event) {
    const name =
      event.target instanceof HTMLElement
        ? event.target.getAttribute("name")
        : null;

    try {
      // Same ordering rule: a newly-touched field must never flash issues
      // that are stale from the previous validation pass.
      await validate();
    } finally {
      if (name) state.markTouched(name);
    }
  }
</script>

<form
  {...attributes}
  class={cn("flex flex-col gap-3", classes)}
  oninput={handleInput}
  onreset={() => state.reset()}
>
  {@render children()}
</form>

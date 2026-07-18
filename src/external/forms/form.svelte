<script lang="ts" generics="Input extends RemoteFormInput, Output">
  import { cn } from "@privaty/ui/cn";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import type { RemoteForm, RemoteFormInput } from "@sveltejs/kit";
  import type { Snippet } from "svelte";
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
  // capturing the initial prop value is intentional.
  // svelte-ignore state_referenced_locally
  const state = new FormState(form);
  // svelte-ignore state_referenced_locally
  setFormContext({ form, state });

  // svelte-ignore state_referenced_locally
  const attributes = (schema ? form.preflight(schema) : form).enhance(
    async (instance) => {
      state.submitAttempted = true;
      state.submitError = undefined;

      await form.validate({ includeUntouched: true });
      if (!state.isValid) return;

      try {
        if (!(await instance.submit())) return;

        if (resetOnSuccess) instance.element.reset();

        await onsuccess?.(form.result);
      } catch (error) {
        state.submitError = error;
        await onerror?.(error);
      }
    },
  );

  function handleInput(event: Event) {
    const name =
      event.target instanceof HTMLElement
        ? event.target.getAttribute("name")
        : null;
    if (name) state.markTouched(name);

    void form.validate({ includeUntouched: true });
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

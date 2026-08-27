<script lang="ts" generics="Input extends RemoteFormInput, Output">
  import { cn } from "#privaty/ui/cn.js";
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import { setFormContext } from "./context";
  import { FormState } from "./form-state.svelte";

  type Props = {
    form: Omit<RemoteForm<Input, Output>, "for">;
    /** Output deliberately unconstrained: transform schemas (Output ≠ Input)
     * are Kit-legal and only the Input side matters for preflight. */
    schema?: StandardSchemaV1<Input, unknown>;

    /** Debounce (ms) for validation while typing on SCHEMA-LESS forms, where
     * each validation is a server round-trip. Schema'd forms validate
     * client-side and stay immediate. */
    validationDebounce?: number;

    resetOnSuccess?: boolean;

    onsuccess?: (result: Output | undefined) => void | Promise<void>;
    onerror?: (error: unknown) => void | Promise<void>;

    class?: string;

    children: Snippet;
  };

  const {
    form,
    schema,

    validationDebounce = 400,

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
  // svelte-ignore state_referenced_locally
  state.clientOnlyValidation = schema !== undefined;
  setFormContext({ form: instance, state });

  // A parent mounts after its children, so every field has registered by now.
  onMount(() => {
    state.settled = true;
  });

  // With a schema, typing validates client-side only — the server isn't
  // involved until submission (which validates server-side regardless).
  function validate() {
    return instance.validate({
      all: true,
      preflightOnly: schema !== undefined,
    });
  }

  const attributes = instance.enhance(async (enhanceInstance) => {
    state.submitError = undefined;

    try {
      // Validate BEFORE opening the error gates: issues must be fresh when
      // submitAttempted makes every field's issues visible. Inside the try:
      // a schema-less validate() is a server round-trip whose failure must
      // surface as submitError, not escalate to the nearest +error page.
      await validate();
      state.submitAttempted = true;
      if (!state.isValid) return;

      if (!(await enhanceInstance.submit())) return;

      if (resetOnSuccess) enhanceInstance.element.reset();

      await onsuccess?.(instance.result);
    } catch (error) {
      state.submitError = error;
      await onerror?.(error);
    }
  });

  // With a schema, Kit's preflight runs BEFORE the enhance callback and
  // silently swallows invalid submits — the callback never gets to flip
  // submitAttempted, so a rejected click would show nothing anywhere. This
  // form-level listener fires regardless of Kit's gate, validates (fresh
  // issues before the gates open — the flash rule), then opens them.
  function handleSubmit() {
    if (schema === undefined) return;

    void Promise.resolve(validate())
      .catch(() => {})
      .finally(() => {
        state.submitAttempted = true;
      });
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => clearTimeout(debounceTimer));

  async function handleInput(event: Event) {
    const name =
      event.target instanceof HTMLElement
        ? event.target.getAttribute("name")
        : null;

    if (schema !== undefined) {
      try {
        // Same ordering rule: a newly-touched field must never flash issues
        // that are stale from the previous validation pass.
        await validate();
      } catch {
        // The form can unmount mid-validation — nothing left to show on.
      } finally {
        if (name) state.markTouched(name);
      }
      return;
    }

    // Schema-less: every validation is a server round-trip, so typing is
    // debounced. The touch waits for the validation, preserving the
    // no-stale-issues ordering.
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void Promise.resolve(validate())
        .catch(() => {})
        .finally(() => {
          if (name) state.markTouched(name);
        });
    }, validationDebounce);
  }
</script>

<form
  {...attributes}
  class={cn("flex flex-col gap-3", classes)}
  oninput={handleInput}
  onsubmit={handleSubmit}
  onreset={() => state.reset()}
>
  {@render children()}
</form>

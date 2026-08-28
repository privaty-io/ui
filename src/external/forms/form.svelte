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

    /** Debounce (ms) for validation while typing wherever validation is a
     * server round-trip: always on SCHEMA-LESS forms, and on schema'd forms
     * while server-produced issues are being refreshed. Client-side-only
     * validation stays immediate. */
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

  // Kit flags issues that came from the SERVER (a rejected submission, a
  // server validation round-trip) and persists them through every client-side
  // validation pass — no edit can refresh them, only another round-trip
  // (merge_with_server_issues, verified against next.25). The flag itself is
  // stripped from the public issues shape, so their presence is tracked here:
  // set on rejection, cleared by a clean full validation, submission or
  // reset. While set, input revalidation escalates to full validation so
  // server-judged rules (a cross-field cap, a uniqueness check) stay live.
  let serverIssuesPresent = false;

  // A parent mounts after its children, so every field has registered by now.
  onMount(() => {
    state.settled = true;

    // Issues present before any client-side validation could have run are
    // server-produced — the SSR-restored rejection of a no-JS submission.
    serverIssuesPresent = (instance.fields.allIssues()?.length ?? 0) > 0;
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
      // Schema-less only: validate BEFORE opening the error gates (issues
      // must be fresh when submitAttempted makes them all visible) and gate
      // the submit on the fresh result. Inside the try: the validation is a
      // server round-trip whose failure must surface as submitError, not
      // escalate to the nearest +error page. Schema'd forms skip this — Kit's
      // preflight already gated client validity before this callback ran
      // (handleSubmit opens their gates), and lingering SERVER issues must
      // never block here: client-side validation cannot refresh them, so
      // gating on isValid would deadlock resubmission on problems the user
      // already fixed. The submission itself re-judges them authoritatively.
      if (schema === undefined) {
        await validate();
        state.submitAttempted = true;
        if (!state.isValid) return;
      }

      if (!(await enhanceInstance.submit())) {
        serverIssuesPresent = true;
        return;
      }
      serverIssuesPresent = false;

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

    // Schema'd forms validate client-side and immediately — EXCEPT while
    // server issues linger, which client-side validation can never refresh:
    // those passes escalate to full validation (client schema first, then —
    // only once it passes — the server round-trip that replaces the whole
    // issue set), so a server-judged rule updates live as its inputs change.
    if (schema !== undefined && !serverIssuesPresent) {
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

    // Every validation from here is a server round-trip, so typing is
    // debounced. The touch waits for the validation, preserving the
    // no-stale-issues ordering.
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void Promise.resolve(
        instance.validate({ all: true, preflightOnly: false }),
      )
        .then(() => {
          // An empty result proves the server issues are gone — drop back to
          // the immediate client-only cadence. Non-empty stays escalated: the
          // set may still hold server issues (their flag isn't visible here).
          serverIssuesPresent = (instance.fields.allIssues()?.length ?? 0) > 0;
        })
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
  onreset={() => {
    // Kit's own reset handler clears the whole issue set, server issues
    // included.
    serverIssuesPresent = false;
    state.reset();
  }}
>
  {@render children()}
</form>

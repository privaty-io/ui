<script lang="ts">
  // Test-only host: a minimal but realistic form. The fake remote form is cast
  // to Kit's type at this single boundary — Form's prop is deliberately Kit's
  // public type, so the fake can't satisfy it structurally.
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import type { StandardSchemaV1 } from "@standard-schema/spec";
  import FormError from "./components/form-error.svelte";
  import Form from "./form.svelte";
  import TextInput from "./inputs/text-input.svelte";
  import type { TextField } from "./types/field";

  type FormProp = Omit<RemoteForm<RemoteFormInput, unknown>, "for">;

  interface Props {
    form: unknown;
    schema?: StandardSchemaV1<RemoteFormInput>;
    validationDebounce?: number;
    resetOnSuccess?: boolean;
    onsuccess?: (result: unknown) => void;
    onerror?: (error: unknown) => void;

    field: TextField;
    initialValue?: string;
  }

  const {
    form,
    schema,
    validationDebounce,
    resetOnSuccess,
    onsuccess,
    onerror,

    field,
    initialValue,
  }: Props = $props();
</script>

<Form
  form={form as FormProp}
  {schema}
  {validationDebounce}
  {resetOnSuccess}
  {onsuccess}
  {onerror}
>
  <TextInput {field} label="Name" {initialValue} />
  <FormError />

  <button type="submit">Send</button>
  <button type="reset">Clear</button>
</Form>

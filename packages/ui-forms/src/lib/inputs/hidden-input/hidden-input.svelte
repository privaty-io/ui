<!-- @component
Hidden input wired to a remote form field — the value rides along with
every submission without rendering anything visible. For values the user
never edits: a row id on an edit form, a parent record's id, an ambient
tenant/locale. Context-free on purpose — it registers nothing with the
form state (no dirty tracking, no marker; a constant carrier is not a
user field), so it also works outside a <Form>.
-->
<script lang="ts">
  import type { HiddenField } from "../../types/field";

  interface Props {
    /** The remote form field to carry — any field's `as("hidden", ...)`
     * qualifies (structural slice; fakes work). */
    field: HiddenField;
    /** The submitted value. */
    value: string | number;
  }

  const { field, value }: Props = $props();
</script>

<input {...field.as("hidden", value)} />

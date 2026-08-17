import { fakeRemoteForm } from "#privaty/ui-forms/testing/fakes.svelte.js";
import { SvelteMap } from "svelte/reactivity";

/**
 * Test doubles for the table's remote-form surface. Only for use in specs —
 * never imported by library runtime code.
 */

/** Field handles keyed by field name, as produced by the forms field fakes
 * (fakeTextField and friends). */
type FakeFieldHandles = Record<string, { field: unknown }>;

/**
 * A fake remote form whose `fields` object is indexable by field name — the
 * way the Table reads it — while keeping `allIssues()` for the Form
 * component.
 */
function fakeEditableRemoteForm(
  fieldHandles: FakeFieldHandles,
  options: Parameters<typeof fakeRemoteForm>[0] = {},
) {
  const base = fakeRemoteForm(options);

  const fields: Record<string, unknown> = {
    allIssues: base.form.fields.allIssues,
  };
  for (const [name, handle] of Object.entries(fieldHandles)) {
    fields[name] = handle.field;
  }

  // Replace in place so the form object keeps its reactive getters.
  (base.form as { fields: unknown }).fields = fields;

  return { ...base, fieldHandles };
}

type FakeEditableRemoteForm = ReturnType<typeof fakeEditableRemoteForm>;

/** A fake keyed remote form: `.for(key)` returns one cached editable fake per
 * key, like Kit's instance cache does. */
function fakeKeyedRemoteForm(
  makeInstance: (key: string | number) => FakeEditableRemoteForm,
) {
  const instances = new SvelteMap<string | number, FakeEditableRemoteForm>();

  function instanceFor(key: string | number) {
    let instance = instances.get(key);

    if (!instance) {
      instance = makeInstance(key);
      instances.set(key, instance);
    }

    return instance;
  }

  return {
    form: { for: (key: string | number) => instanceFor(key).form },
    instanceFor,
  };
}

export { fakeEditableRemoteForm, fakeKeyedRemoteForm };

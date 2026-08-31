# @privaty/ui-forms

Form components built on **SvelteKit remote functions** (experimental):
`Form` wraps a `form(schema, handler)` instance, inputs bind to its fields,
and a small `FormState` layer adds the display semantics Kit doesn't ship —
value-based dirty tracking, touch-gated error display, submit gating.

```bash
pnpm add @privaty/ui @privaty/ui-forms
```

> Requires `@privaty/ui` as a **peerDependency** at the same lockstep version
> (single instance — Symbol-keyed contexts), `@sveltejs/kit` with
> `experimental.remoteFunctions` + `compilerOptions.experimental.async`, and
> Tailwind v4 (`@source` the package, see the core README).

Every export is also available from the package root — `import { Form,
TextInput, Submit } from "@privaty/ui-forms"` — alongside the deep
subpaths shown below; both tree-shake.

## Quickstart

```svelte
<script>
  import Form from "@privaty/ui-forms/form.svelte";
  import TextInput from "@privaty/ui-forms/inputs/text-input.svelte";
  import Submit from "@privaty/ui-forms/components/submit.svelte";
  import FormError from "@privaty/ui-forms/components/form-error.svelte";
  import { createItem } from "./data.remote";
  import { createItemSchema } from "./schema";
</script>

<Form form={createItem} schema={createItemSchema}>
  <TextInput field={createItem.fields.name} label="Name" required />
  <FormError />
  <Submit />
</Form>
```

Inputs: `TextInput` (text/email/password/search/url/tel), `TextareaInput`,
`NumberInput`, `DateInput` (date/month/week/time/datetime-local — one
component, all string-valued), `SelectInput`, `CheckboxInput`. Plus
`Submit`, `Reset`, `FormError`. Icon-style Submit/Reset: pass children; the
label stays as the accessible name.

## The validation model

- **With `schema`** (a Standard Schema, e.g. valibot): validation runs
  client-side via Kit's `preflight` — immediately on input, and on submit.
  Kit swallows invalid submits before the enhance callback runs; the Form's
  own submit listener still opens the error gates, so a rejected click shows
  its issues.
- **Without `schema`**: every validation is a server round-trip — typing is
  debounced (`validationDebounce`, default 400 ms), submits validate
  server-side. Transform schemas (Output ≠ Input) are accepted.
- Issues per field appear once the field is touched or a submit was
  attempted; `FormError` shows path-less issues and submit failures
  (`labels.form.generalError`).
- **Server issues** (a rejected submission, a server validation round-trip)
  are persisted by Kit through every client-side validation pass — no edit
  can refresh them, only another round-trip. The Form handles both
  consequences: a schema'd resubmission is never gated on them (the
  submission re-judges them authoritatively), and while they linger, input
  revalidation escalates to full validation — client schema first, then the
  server round-trip that replaces the whole issue set — debounced like
  schema-less typing. Rules that depend on server data (a cross-field cap, a
  uniqueness check) therefore belong in the **server schema** (an async check
  is fine) if they should refresh live while the user edits; issues raised in
  the _handler_ (`invalid()`) clear optimistically on the next round-trip and
  are re-judged at submit.

## Schema recipes (the footguns)

```ts
// Checkboxes: unchecked submits NOTHING — the schema supplies the false.
inStock: v.optional(v.boolean(), false),

// Placeholder selects: the disabled placeholder is skipped by submission —
// default "" so YOUR message fires instead of a raw missing-key error.
category: v.pipe(v.optional(v.string(), ""), v.picklist(categories, "required")),

// Month inputs submit "YYYY-MM"; empty submits "".
availableFrom: v.pipe(v.string(), v.nonEmpty("required"), v.regex(/^\d{4}-\d{2}$/, "invalid-month")),
```

## Rules learned the hard way

- **Never disable controls while submitting** — disabled controls are
  excluded from `FormData`, and Kit reads live form data mid-submission. The
  inputs lock via `readonly` / pointer+keyboard locks instead. Keep that
  contract in custom inputs.
- **Queries: `await getItems()` bare.** `query().current` never
  server-renders (hard-coded `undefined` on the server), and a
  `<svelte:boundary>` with a `pending` snippet makes the server render the
  snippet INSTEAD of the children. Await, no pending boundary.
- Required/optional markers follow the majority rule (the minority gets
  marked) and wait for `FormState.settled` — they cannot be SSR'd with
  self-registering fields.
- No-JS submissions are out of scope for v1 (Submit renders its gate state
  into SSR HTML).
- Browser support: Firefox has no `type="month"`/`"week"` pickers (falls
  back to a text input) — a library-owned cross-browser date picker is
  planned post-v1.

## Testing

`testing/fakes.svelte.ts` ships Kit-faithful fakes: `fakeRemoteForm`
preflight-gates its enhance callback like Kit does, and the field fakes'
`edit()` stores raw DOM values (`"5"`, `"on"`) while `set()` stores typed
ones — mirroring Kit's mid-edit behavior so dirty-tracking tests mean
something.

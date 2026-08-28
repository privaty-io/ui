import { createAttachmentKey } from "svelte/attachments";
import type {
  CheckboxField,
  DateField,
  DateFieldType,
  NumberField,
  SelectField,
  TextField,
  TextFieldType,
} from "../types/field";
import type { ValidatableForm } from "../types/form";

/**
 * Test doubles for the structural form interfaces. For use in specs and
 * consumers' own tests — never imported by library runtime code.
 */

/**
 * The minimal issue shape the library reads back from a form — a Standard
 * Schema issue narrowed to what tests need to construct.
 */
interface FakeIssue {
  /** Human-readable validation message. */
  message: string;
  /** Path segments locating the field the issue belongs to (Standard Schema
   * shape). Omit for form-level issues. */
  path?: readonly (string | number)[];
}

/**
 * Minimal `ValidatableForm` fake for FormState-level tests. `computeIssues`
 * runs on every `validate()` call and its result becomes the issue set that
 * `fields.allIssues()` exposes (default: always valid). State is reactive —
 * effects re-run on `setIssues`/`setPending`.
 */
function fakeForm(
  computeIssues: () => readonly FakeIssue[] | undefined = () => undefined,
) {
  let issues = $state<readonly FakeIssue[] | undefined>(undefined);
  let pending = $state(0);
  const validateCalls: unknown[] = [];

  const form: ValidatableForm = {
    validate: (validateOptions) => {
      validateCalls.push(validateOptions);
      issues = computeIssues();
    },
    fields: { allIssues: () => issues },
    get pending() {
      return pending;
    },
  };

  return {
    /** The fake form — pass it where a `ValidatableForm` is expected. */
    form,
    /** Arguments of every `validate()` call, in order. */
    validateCalls,
    /** Replaces the issue set directly, bypassing `validate()`. */
    setIssues: (next: readonly FakeIssue[] | undefined) => {
      issues = next;
    },
    /** Sets the form's `pending` submission count. */
    setPending: (next: number) => {
      pending = next;
    },
  };
}

/**
 * Structural `TextField` fake for TextInput/TextareaInput tests. `as()`
 * returns plain spreadable attributes (no attachment); value and issues are
 * reactive state. Pass `options.issues` to seed the field with issues.
 */
function fakeTextField(
  name: string,
  options: { issues?: readonly { message: string }[] } = {},
) {
  let value = $state<string | undefined>(undefined);
  let issues = $state<readonly { message: string }[] | undefined>(
    options.issues,
  );

  const field: TextField = {
    as: (type: TextFieldType, initialValue?: string) => ({
      name,
      type,
      value: initialValue,
    }),
    issues: () => issues,
    value: () => value,
    set: (next) => {
      value = next;
    },
  };

  return {
    /** The fake field — pass it as the input component's `field` prop. */
    field,
    /** Simulates USER typing (string fields store the same value `set()`
     * would — no raw/typed split here). */
    edit: (next: string) => {
      value = next;
    },
    /** Replaces the field's issue set. */
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

/**
 * Structural `DateField` fake for DateInput tests. The whole date family
 * (date, month, week, time, datetime-local) carries ISO-style string values,
 * so one fake covers all five. Same shape and reactivity as `fakeTextField`.
 */
function fakeDateField(
  name: string,
  options: { issues?: readonly { message: string }[] } = {},
) {
  let value = $state<string | undefined>(undefined);
  let issues = $state<readonly { message: string }[] | undefined>(
    options.issues,
  );

  const field: DateField = {
    as: (type: DateFieldType, initialValue?: string) => ({
      name,
      type,
      value: initialValue,
    }),
    issues: () => issues,
    value: () => value,
    set: (next) => {
      value = next;
    },
  };

  return {
    /** The fake field — pass it as the input component's `field` prop. */
    field,
    /** Simulates USER input — an ISO-style string, same as `set()` would
     * store. */
    edit: (next: string) => {
      value = next;
    },
    /** Replaces the field's issue set. */
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

/**
 * Structural `NumberField` fake for NumberInput tests. Mirrors Kit's mid-edit
 * behavior: `edit()` stores the raw DOM string a user's typing would produce,
 * while `set()` stores the typed number — the distinction is what makes
 * dirty-tracking tests meaningful.
 */
function fakeNumberField(
  name: string,
  options: { issues?: readonly { message: string }[] } = {},
) {
  // Kit stores raw DOM strings mid-edit; set() stores typed values.
  let value = $state<number | string | undefined>(undefined);
  let issues = $state<readonly { message: string }[] | undefined>(
    options.issues,
  );

  const field: NumberField = {
    as: (type: "number", initialValue?: number) => ({
      name,
      type,
      value: initialValue,
    }),
    issues: () => issues,
    value: () => value,
    set: (next) => {
      value = next;
    },
  };

  return {
    /** The fake field — pass it as the input component's `field` prop. */
    field,
    /** Simulates USER typing: stores the raw DOM string, like Kit does. */
    edit: (next: number | undefined) => {
      value = next === undefined ? "" : String(next);
    },
    /** Replaces the field's issue set. */
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

/**
 * Structural `SelectField` fake for SelectInput tests. Same shape and
 * reactivity as `fakeTextField` — select values are plain strings on both
 * the DOM and typed sides.
 */
function fakeSelectField(
  name: string,
  options: { issues?: readonly { message: string }[] } = {},
) {
  let value = $state<string | undefined>(undefined);
  let issues = $state<readonly { message: string }[] | undefined>(
    options.issues,
  );

  const field: SelectField = {
    as: (type: "select", initialValue?: string) => ({
      name,
      value: initialValue,
    }),
    issues: () => issues,
    value: () => value,
    set: (next) => {
      value = next;
    },
  };

  return {
    /** The fake field — pass it as the input component's `field` prop. */
    field,
    /** Simulates the USER choosing an option: stores its string value. */
    edit: (next: string) => {
      value = next;
    },
    /** Replaces the field's issue set. */
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

/**
 * Structural `CheckboxField` fake for CheckboxInput tests. Like Kit's
 * `as("checkbox", seed)`, the returned attributes expose `checked` and
 * `defaultChecked` getters (the latter is what makes native reset restore
 * the seed). `edit()` stores the raw DOM value ("on"/null) while `set()`
 * stores the typed boolean — mirroring Kit's mid-edit behavior.
 */
function fakeCheckboxField(
  name: string,
  options: { issues?: readonly { message: string }[] } = {},
) {
  // Kit stores the raw DOM value mid-edit: "on" checked, null unchecked.
  let value = $state<boolean | string | null | undefined>(undefined);
  let issues = $state<readonly { message: string }[] | undefined>(
    options.issues,
  );

  const field: CheckboxField = {
    as: (type: "checkbox", initialValue?: boolean) => ({
      name,
      type,
      get checked() {
        if (value === undefined) return initialValue ?? false;
        return value === true || value === "on";
      },
      get defaultChecked() {
        return initialValue;
      },
    }),
    issues: () => issues,
    value: () => value,
    set: (next) => {
      value = next;
    },
  };

  return {
    /** The fake field — pass it as the input component's `field` prop. */
    field,
    /** Simulates a USER toggle: raw DOM value, like Kit's input listener. */
    edit: (next: boolean) => {
      value = next ? "on" : null;
    },
    /** Replaces the field's issue set. */
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

/** The options object Kit's `validate()` accepts, as the fakes model it. */
interface FakeValidateOptions {
  /** Kit's flag to also surface issues on fields not yet edited and blurred
   * (ignored after first submission). The fake attaches no behavior to it —
   * it is only recorded in `validateCalls` and forwarded to `onValidate`. */
  all?: boolean;
  /** True for client-schema-only validation with no server round-trip. In
   * the fake it decides issue origin (preflight issues are client-flagged,
   * full validations server-flagged) and the merge-vs-replace semantics of
   * the resulting issue set. */
  preflightOnly?: boolean;
}

/** Behavior knobs for `fakeRemoteForm`. */
interface FakeRemoteFormOptions {
  /** Issues the next validation resolves with (default: none — valid). */
  onValidate?: (
    options: FakeValidateOptions | undefined,
  ) => readonly FakeIssue[] | undefined;
  /** Submission outcome: return false for "rejected by validation", throw for
   * a failed request (default: true — success). May return a promise. */
  onSubmit?: () => boolean | Promise<boolean>;
  /** Issues installed — server-flagged, replacing the whole set — when
   * onSubmit rejects, like Kit's rejected submissions do. Left unset, a
   * rejection leaves the issue set untouched. */
  serverIssues?: readonly FakeIssue[];
  /** Hold every validate() unresolved until releaseValidate() is called. */
  gateValidate?: boolean;
  /** The value exposed as `form.result` after submission. */
  result?: unknown;
}

/**
 * A full-surface fake of a SvelteKit remote form for testing the Form
 * component: `enhance` returns spreadable attributes whose attachment
 * intercepts native submits (like Kit's does), so tests drive real buttons.
 */
function fakeRemoteForm(options: FakeRemoteFormOptions = {}) {
  // Kit flags every issue with its origin (client preflight vs server) and
  // the flag drives merge semantics — but strips it from the public issues()
  // and allIssues() shapes, so the library can never read it. The fake keeps
  // both properties faithful: internal flag, stripped exposure.
  type InternalIssue = FakeIssue & { server: boolean };

  let issues = $state<readonly InternalIssue[] | undefined>(undefined);
  let pending = $state(0);

  const validateCalls: (FakeValidateOptions | undefined)[] = [];
  const preflightCalls: unknown[] = [];
  const validateGates: (() => void)[] = [];
  let submitCount = 0;

  const pathName = (issue: FakeIssue) => (issue.path ?? []).join(".");

  async function validate(validateOptions?: FakeValidateOptions) {
    validateCalls.push(validateOptions);

    if (options.gateValidate) {
      await new Promise<void>((resolve) => validateGates.push(resolve));
    }

    const computed = (options.onValidate?.(validateOptions) ?? []).map(
      (issue) => ({
        ...issue,
        server: validateOptions?.preflightOnly !== true,
      }),
    );

    if (validateOptions?.preflightOnly) {
      // Kit's merge: server issues persist through client-side validation
      // unless a client issue lands on the same path — nothing else can
      // refresh them (merge_with_server_issues, next.25).
      const clientNames = computed.map(pathName);
      issues = [
        ...(issues ?? []).filter(
          (issue) => issue.server && !clientNames.includes(pathName(issue)),
        ),
        ...computed,
      ];
    } else {
      // Full validation ends in a server round-trip whose result replaces
      // the entire issue set. (Kit short-circuits on client-schema failures
      // first — the fake folds both stages into onValidate.)
      issues = computed;
    }
  }

  function makeEnhanceInstance(node: HTMLFormElement) {
    return {
      element: node,
      submit: async () => {
        submitCount += 1;
        pending += 1;

        try {
          const succeeded = await (options.onSubmit
            ? options.onSubmit()
            : true);

          // Kit derives success from the response's issue set: a success
          // clears it, a rejection replaces it with the server's issues.
          if (succeeded) {
            issues = [];
          } else if (options.serverIssues) {
            issues = options.serverIssues.map((issue) => ({
              ...issue,
              server: true,
            }));
          }

          return succeeded;
        } finally {
          pending -= 1;
        }
      },
    };
  }

  type EnhanceCallback = (
    instance: ReturnType<typeof makeEnhanceInstance>,
  ) => unknown;

  const form = {
    method: "POST" as const,
    action: "?/fake",
    preflight: (schema: unknown) => {
      preflightCalls.push(schema);
      return form;
    },
    enhance: (callback: EnhanceCallback) => ({
      method: "POST" as const,
      action: "?/fake",
      [createAttachmentKey()]: (node: HTMLFormElement) => {
        const onSubmit = (event: SubmitEvent) => {
          event.preventDefault();
          void (async () => {
            // Kit runs preflight BEFORE the enhance callback and swallows
            // the submit entirely when the schema rejects — mirror that
            // whenever a schema was registered via preflight(). Only CLIENT
            // issues block: persisted server issues pass through, because
            // the submission itself is what re-judges them.
            if (preflightCalls.length > 0) {
              await validate({ all: true, preflightOnly: true });
              if ((issues ?? []).some((issue) => !issue.server)) return;
            }
            await callback(makeEnhanceInstance(node));
          })();
        };

        node.addEventListener("submit", onSubmit);
        return () => node.removeEventListener("submit", onSubmit);
      },
    }),
    validate,
    get result() {
      return options.result;
    },
    get pending() {
      return pending;
    },
    fields: {
      // Kit's allIssues() strips issues down to { path, message } — the
      // server flag never reaches the library.
      allIssues: () => issues?.map(({ message, path }) => ({ message, path })),
    },
  };

  return {
    /** The fake remote form — pass it as the Form component's form. */
    form,
    /** Arguments of every `validate()` call, in order. */
    validateCalls,
    /** Schemas passed to `preflight()`, in order. */
    preflightCalls,
    /** Number of enhance submissions started so far. */
    submitCount: () => submitCount,
    /** Resolves the oldest still-gated `validate()` — pairs with the
     * `gateValidate` option. */
    releaseValidate: () => validateGates.shift()?.(),
    /** Installs server-flagged issues directly — models the SSR-restored
     * issue set of a rejected no-JS submission. */
    setServerIssues: (next: readonly FakeIssue[]) => {
      issues = next.map((issue) => ({ ...issue, server: true }));
    },
  };
}

export {
  fakeCheckboxField,
  fakeDateField,
  fakeForm,
  fakeNumberField,
  fakeRemoteForm,
  fakeSelectField,
  fakeTextField,
};
// Exported so downstream fakes that wrap these (ui-tables) can emit named
// types in their generated declarations.
export type { FakeIssue, FakeRemoteFormOptions, FakeValidateOptions };

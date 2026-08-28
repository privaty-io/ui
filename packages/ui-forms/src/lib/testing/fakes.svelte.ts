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
 * Test doubles for the structural form interfaces. Only for use in specs (and
 * eventually consumers' own tests) — never imported by library runtime code.
 */

interface FakeIssue {
  message: string;
  path?: readonly (string | number)[];
}

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
    form,
    validateCalls,
    setIssues: (next: readonly FakeIssue[] | undefined) => {
      issues = next;
    },
    setPending: (next: number) => {
      pending = next;
    },
  };
}

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
    field,
    edit: (next: string) => {
      value = next;
    },
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

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
    field,
    edit: (next: string) => {
      value = next;
    },
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

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
    field,
    /** Simulates USER typing: stores the raw DOM string, like Kit does. */
    edit: (next: number | undefined) => {
      value = next === undefined ? "" : String(next);
    },
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

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
    field,
    edit: (next: string) => {
      value = next;
    },
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

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
    field,
    /** Simulates a USER toggle: raw DOM value, like Kit's input listener. */
    edit: (next: boolean) => {
      value = next ? "on" : null;
    },
    setIssues: (next: readonly { message: string }[] | undefined) => {
      issues = next;
    },
  };
}

interface FakeValidateOptions {
  all?: boolean;
  preflightOnly?: boolean;
}

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
    form,
    validateCalls,
    preflightCalls,
    submitCount: () => submitCount,
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

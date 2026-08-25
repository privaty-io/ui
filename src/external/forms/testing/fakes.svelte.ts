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
  let value = $state<number | undefined>(undefined);
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
    edit: (next: number | undefined) => {
      value = next;
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
  let value = $state<boolean | undefined>(undefined);
  let issues = $state<readonly { message: string }[] | undefined>(
    options.issues,
  );

  const field: CheckboxField = {
    as: (type: "checkbox") => ({
      name,
      type,
      get checked() {
        return value ?? false;
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
    edit: (next: boolean) => {
      value = next;
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
   * a failed request (default: true — success). */
  onSubmit?: () => boolean;
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
  let issues = $state<readonly FakeIssue[] | undefined>(undefined);
  let pending = $state(0);

  const validateCalls: (FakeValidateOptions | undefined)[] = [];
  const preflightCalls: unknown[] = [];
  const validateGates: (() => void)[] = [];
  let submitCount = 0;

  async function validate(validateOptions?: FakeValidateOptions) {
    validateCalls.push(validateOptions);

    if (options.gateValidate) {
      await new Promise<void>((resolve) => validateGates.push(resolve));
    }

    issues = options.onValidate?.(validateOptions);
  }

  function makeEnhanceInstance(node: HTMLFormElement) {
    return {
      element: node,
      submit: async () => {
        submitCount += 1;
        pending += 1;

        try {
          return options.onSubmit ? options.onSubmit() : true;
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
          void callback(makeEnhanceInstance(node));
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
    fields: { allIssues: () => issues },
  };

  return {
    form,
    validateCalls,
    preflightCalls,
    submitCount: () => submitCount,
    releaseValidate: () => validateGates.shift()?.(),
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

import type { TextField } from "../types/field";
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
    as: (type, initialValue) => ({ name, type, value: initialValue }),
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

export { fakeForm, fakeTextField };

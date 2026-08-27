import { describe, expect, test } from "vitest";

import { FormState } from "./form-state.svelte";
import { fakeForm } from "./testing/fakes.svelte";
import type { FieldRegistration } from "./types/field";

interface FakeFieldOptions {
  initialValue?: unknown;
  required?: boolean;
  seeded?: boolean;
}

interface FakeField extends FieldRegistration {
  edit: (value: unknown) => void;
}

function fakeField(name: string, options: FakeFieldOptions = {}): FakeField {
  const initialValue = options.initialValue ?? "";

  // Seeded fields mirror remote functions: value() is undefined until edited.
  let value = $state<unknown>(options.seeded ? undefined : initialValue);

  return {
    name,
    initialValue,
    required: options.required ?? false,
    getValue: () => value,
    setValue: (next) => {
      value = next;
    },
    normalize: (next) => next,
    edit: (next) => {
      value = next;
    },
  };
}

describe("isDirty", () => {
  test("starts clean and follows value changes both ways", () => {
    const state = new FormState(fakeForm().form);
    const name = fakeField("name", { initialValue: "Ost" });
    state.register(name);

    expect(state.isDirty).toBe(false);

    name.edit("Brie");
    expect(state.isDirty).toBe(true);

    name.edit("Ost");
    expect(state.isDirty).toBe(false);
  });

  test("treats undefined as still-at-initial for seeded fields", () => {
    const state = new FormState(fakeForm().form);
    const name = fakeField("name", { initialValue: "Ost", seeded: true });
    state.register(name);

    expect(name.getValue()).toBeUndefined();
    expect(state.isDirty).toBe(false);

    name.edit("Brie");
    expect(state.isDirty).toBe(true);
  });
});

describe("isValid", () => {
  test("reflects the form's issues", () => {
    const { form, setIssues } = fakeForm();
    const state = new FormState(form);

    expect(state.isValid).toBe(true);

    setIssues([{ message: "required" }]);
    expect(state.isValid).toBe(false);

    setIssues([]);
    expect(state.isValid).toBe(true);
  });
});

describe("isSubmitting", () => {
  test("tracks pending submissions", () => {
    const { form, setPending } = fakeForm();
    const state = new FormState(form);

    expect(state.isSubmitting).toBe(false);

    setPending(1);
    expect(state.isSubmitting).toBe(true);

    setPending(0);
    expect(state.isSubmitting).toBe(false);
  });
});

describe("shouldShowIssues", () => {
  test("hides issues until a field is touched or a submit was attempted", () => {
    const state = new FormState(fakeForm().form);
    state.register(fakeField("name"));
    state.register(fakeField("description"));

    expect(state.shouldShowIssues("name")).toBe(false);
    expect(state.shouldShowIssues("description")).toBe(false);

    state.markTouched("name");
    expect(state.shouldShowIssues("name")).toBe(true);
    expect(state.shouldShowIssues("description")).toBe(false);

    state.submitAttempted = true;
    expect(state.shouldShowIssues("description")).toBe(true);
  });
});

describe("majorityRequired", () => {
  test("marks the minority across every registered field", () => {
    const state = new FormState(fakeForm().form);
    state.register(fakeField("a", { required: true }));
    state.register(fakeField("b", { required: true }));
    state.register(fakeField("c"));

    expect(state.majorityRequired).toBe(true);

    state.register(fakeField("d"));
    state.register(fakeField("e"));
    expect(state.majorityRequired).toBe(false);
  });

  test("required wins ties", () => {
    const state = new FormState(fakeForm().form);
    state.register(fakeField("a", { required: true }));
    state.register(fakeField("b"));

    expect(state.majorityRequired).toBe(true);
  });
});

describe("register", () => {
  test("throws on duplicate names", () => {
    const state = new FormState(fakeForm().form);
    state.register(fakeField("name"));

    expect(() => state.register(fakeField("name"))).toThrowError(/name/);
  });

  test("unregister removes the field's state entirely", () => {
    const state = new FormState(fakeForm().form);
    const extra = fakeField("extra", { required: true });
    const unregister = state.register(extra);

    state.markTouched("extra");
    extra.edit("changed");
    expect(state.isDirty).toBe(true);

    unregister();

    expect(state.isDirty).toBe(false);
    expect(state.shouldShowIssues("extra")).toBe(false);
    expect(() => state.register(fakeField("extra"))).not.toThrow();
  });
});

describe("validate", () => {
  test("always includes untouched fields", () => {
    const { form, validateCalls } = fakeForm();
    const state = new FormState(form);

    state.validate();

    expect(validateCalls).toEqual([{ all: true, preflightOnly: false }]);
  });
});

describe("reset", () => {
  test("restores initial values", () => {
    const state = new FormState(fakeForm().form);
    const name = fakeField("name", { initialValue: "Ost" });
    const price = fakeField("price", { initialValue: 10 });
    state.register(name);
    state.register(price);

    name.edit("Brie");
    price.edit(20);
    expect(state.isDirty).toBe(true);

    state.reset();

    expect(name.getValue()).toBe("Ost");
    expect(price.getValue()).toBe(10);
    expect(state.isDirty).toBe(false);
  });

  test("returns the display state to pristine after a failed submit", () => {
    const state = new FormState(fakeForm().form);
    state.register(fakeField("name"));

    state.markTouched("name");
    state.submitAttempted = true;
    state.submitError = new Error("network");
    expect(state.shouldShowIssues("name")).toBe(true);

    state.reset();

    expect(state.submitAttempted).toBe(false);
    expect(state.submitError).toBeUndefined();
    expect(state.shouldShowIssues("name")).toBe(false);
  });

  test("re-validates so isValid reflects the restored values", () => {
    const name = fakeField("name", { initialValue: "", required: true });
    const { form } = fakeForm(() =>
      name.getValue() ? [] : [{ message: "required" }],
    );
    const state = new FormState(form);
    state.register(name);

    name.edit("Brie");
    state.validate();
    expect(state.isValid).toBe(true);

    state.reset();

    expect(state.isValid).toBe(false);
    expect(state.shouldShowIssues("name")).toBe(false);
  });
});

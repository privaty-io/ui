import type { RemoteFormInput } from "$app/server";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./form.fixture.svelte";
import { fakeRemoteForm, fakeTextField } from "./testing/fakes.svelte";

// Only its identity matters: the fake's preflight records it, nothing runs it.
const fakeSchema = {} as StandardSchemaV1<RemoteFormInput>;

describe("rendering", () => {
  test("spreads the enhanced attributes onto the form element", async () => {
    const { form } = fakeRemoteForm();
    const screen = await render(Fixture, {
      form,
      field: fakeTextField("name").field,
    });

    const element = screen.container.querySelector("form");
    expect(element?.getAttribute("method")).toBe("POST");
    expect(element?.getAttribute("action")).toBe("?/fake");
  });
});

describe("input validation", () => {
  test("validates on input, preflight-only when a schema is given", async () => {
    const { form, validateCalls, preflightCalls } = fakeRemoteForm();
    const screen = await render(Fixture, {
      form,
      schema: fakeSchema,
      field: fakeTextField("name").field,
    });

    expect(preflightCalls).toContain(fakeSchema);

    await screen.getByLabelText("Name").fill("Ost");

    await vi.waitFor(() =>
      expect(validateCalls).toContainEqual({
        all: true,
        preflightOnly: true,
      }),
    );
  });

  test("validates against the server when no schema is given", async () => {
    const { form, validateCalls } = fakeRemoteForm();
    const screen = await render(Fixture, {
      form,
      field: fakeTextField("name").field,
    });

    await screen.getByLabelText("Name").fill("Ost");

    await vi.waitFor(() =>
      expect(validateCalls).toContainEqual({
        all: true,
        preflightOnly: false,
      }),
    );
  });

  test("keeps a freshly-touched field's stale issues hidden until validation resolves", async () => {
    // The field still carries an issue from a previous validation pass (e.g.
    // "required" from when it was empty) — the flash-bug regression scenario.
    const { field, setIssues } = fakeTextField("name", {
      issues: [{ message: "required" }],
    });
    const { form, releaseValidate } = fakeRemoteForm({ gateValidate: true });
    const screen = await render(Fixture, { form, field });

    await screen.getByLabelText("Name").fill("Ost");

    // Touched must not flip while validation is in flight.
    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    // The fresh pass clears the field's issue, then resolves.
    setIssues([]);
    releaseValidate();

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();
  });

  test("shows issues once validation resolves while still invalid", async () => {
    const { field } = fakeTextField("name", {
      issues: [{ message: "required" }],
    });
    const { form, releaseValidate, validateCalls } = fakeRemoteForm({
      gateValidate: true,
    });
    const screen = await render(Fixture, {
      form,
      field,
      validationDebounce: 0,
    });

    await screen.getByLabelText("Name").fill("x");
    // Schema-less input validation is debounced — wait for the call before
    // releasing its gate.
    await vi.waitFor(() => expect(validateCalls.length).toBeGreaterThan(0));
    releaseValidate();

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });
});

describe("submission", () => {
  test("a schema'd invalid submit still opens the error gates", async () => {
    // Kit runs preflight BEFORE the enhance callback and swallows invalid
    // submits entirely — the form-level submit listener must open the gates
    // regardless (the dead-click regression).
    const { field } = fakeTextField("name", {
      issues: [{ message: "required" }],
    });
    const { form, submitCount } = fakeRemoteForm({
      onValidate: () => [{ message: "required", path: ["name"] }],
    });
    const schema = {
      "~standard": {
        version: 1,
        vendor: "fake",
        validate: (v: unknown) => ({ value: v }),
      },
    };
    const screen = await render(Fixture, {
      form,
      field,
      schema: schema as never,
    });

    await screen.getByRole("button", { name: "Send" }).click();

    // The submit was swallowed by the preflight gate...
    await vi.waitFor(() => expect(submitCount()).toBe(0));
    // ...but the gates opened and the untouched field shows its issue.
    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });

  test("a failing submit-time validation surfaces inline, not as a crash", async () => {
    // Schema-less validation is a server round-trip; its failure belongs in
    // submitError (FormError), never escalated out of the enhance callback.
    const { field } = fakeTextField("name");
    let failValidation = false;
    const { form, submitCount } = fakeRemoteForm({
      onValidate: () => {
        if (failValidation) throw new Error("network down");
        return undefined;
      },
    });
    const screen = await render(Fixture, { form, field });

    failValidation = true;
    await screen.getByRole("button", { name: "Send" }).click();

    await expect
      .element(screen.getByText("Something went wrong. Please try again."))
      .toBeInTheDocument();
    expect(submitCount()).toBe(0);
  });

  test("submits, resets, and reports the result on success", async () => {
    const { field } = fakeTextField("name");
    const onsuccess = vi.fn();
    const { form, submitCount } = fakeRemoteForm({ result: { ok: true } });
    const screen = await render(Fixture, {
      form,
      field,
      onsuccess,
      initialValue: "",
    });

    const input = screen.getByLabelText("Name");
    await input.fill("Ost");
    await screen.getByRole("button", { name: "Send" }).click();

    await vi.waitFor(() =>
      expect(onsuccess).toHaveBeenCalledWith({ ok: true }),
    );
    expect(submitCount()).toBe(1);

    // resetOnSuccess default: the native reset restored the seeded value and
    // FormState.reset() pushed the initial value back into the field.
    await expect.element(input).toHaveValue("");
    expect(field.value()).toBe("");
  });

  test("invalid data blocks submission and opens the error display", async () => {
    const { field, setIssues } = fakeTextField("name");
    const { form, submitCount } = fakeRemoteForm({
      onValidate: () => [{ message: "required", path: ["name"] }],
    });
    const screen = await render(Fixture, { form, field });

    setIssues([{ message: "required" }]);
    await screen.getByRole("button", { name: "Send" }).click();

    await expect.element(screen.getByText("required")).toBeInTheDocument();
    expect(submitCount()).toBe(0);
  });

  test("a submission rejected by the server keeps the entered values", async () => {
    const { field } = fakeTextField("name");
    const onsuccess = vi.fn();
    const { form, submitCount } = fakeRemoteForm({ onSubmit: () => false });
    const screen = await render(Fixture, { form, field, onsuccess });

    const input = screen.getByLabelText("Name");
    await input.fill("Ost");
    await screen.getByRole("button", { name: "Send" }).click();

    await vi.waitFor(() => expect(submitCount()).toBe(1));
    expect(onsuccess).not.toHaveBeenCalled();
    await expect.element(input).toHaveValue("Ost");
  });

  test("a thrown submission shows the general error and keeps values", async () => {
    const { field } = fakeTextField("name");
    const onerror = vi.fn();
    const { form } = fakeRemoteForm({
      onSubmit: () => {
        throw new Error("boom");
      },
    });
    const screen = await render(Fixture, { form, field, onerror });

    const input = screen.getByLabelText("Name");
    await input.fill("Ost");
    await screen.getByRole("button", { name: "Send" }).click();

    await expect
      .element(screen.getByText("Something went wrong. Please try again."))
      .toBeInTheDocument();
    await vi.waitFor(() => expect(onerror).toHaveBeenCalled());
    await expect.element(input).toHaveValue("Ost");
  });

  test("resetOnSuccess: false keeps the submitted values", async () => {
    const { field } = fakeTextField("name");
    const onsuccess = vi.fn();
    const { form } = fakeRemoteForm();
    const screen = await render(Fixture, {
      form,
      field,
      onsuccess,
      resetOnSuccess: false,
    });

    const input = screen.getByLabelText("Name");
    await input.fill("Ost");
    await screen.getByRole("button", { name: "Send" }).click();

    await vi.waitFor(() => expect(onsuccess).toHaveBeenCalled());
    await expect.element(input).toHaveValue("Ost");
  });
});

describe("reset", () => {
  test("a native reset re-seeds the field state", async () => {
    const { field } = fakeTextField("name");
    const { form, validateCalls } = fakeRemoteForm();
    const screen = await render(Fixture, {
      form,
      field,
      initialValue: "Ost",
    });

    await screen.getByLabelText("Name").fill("Brie");
    await screen.getByRole("button", { name: "Clear" }).click();

    // FormState.reset() pushed the initial value back into the field and
    // re-validated. Restoring the *DOM element* to the seed is the remote
    // form's own job (the `as(type, value)` reset contract) — the fake
    // doesn't emulate that, so it's covered by the sandbox, not this spec.
    await vi.waitFor(() => expect(field.value()).toBe("Ost"));
    // Reset re-validates on its own; the debounced input validation may or
    // may not have fired yet.
    expect(validateCalls.length).toBeGreaterThanOrEqual(1);
  });
});

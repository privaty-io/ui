import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeTextField } from "../testing/fakes.svelte";
import HiddenInput from "./hidden-input.svelte";
import type { HiddenField } from "../types/field";

// The text fake's as() is typed for the text family only; at runtime it
// passes any type through — cast at the spec edge, like the form fakes.
const asHidden = (handle: ReturnType<typeof fakeTextField>) =>
  handle.field as unknown as HiddenField;

describe("hidden input", () => {
  test("renders the field's hidden input with the given value", async () => {
    const handle = fakeTextField("parentId");
    // Context-free: renders without a <Form> around it.
    const screen = await render(HiddenInput, {
      field: asHidden(handle),
      value: "p1",
    });

    const input = screen.container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="parentId"]',
    );
    expect(input).not.toBeNull();
    expect(input!.value).toBe("p1");
  });

  test("number values stringify like any form value", async () => {
    const handle = fakeTextField("year");
    const screen = await render(HiddenInput, {
      field: asHidden(handle),
      value: 2026,
    });

    expect(
      screen.container.querySelector<HTMLInputElement>('input[name="year"]')!
        .value,
    ).toBe("2026");
  });
});

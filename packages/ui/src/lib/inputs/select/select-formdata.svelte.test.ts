import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./select-formdata.fixture.svelte";

const options = ["cheese", "wine", "bread"];

function formData(container: HTMLElement) {
  const form = container.querySelector("form");
  if (!form) throw new Error("no form rendered");
  return new FormData(form);
}

describe("what the browser submits for the select", () => {
  test("a seeded REQUIRED placeholder select submits nothing (disabled option)", async () => {
    const screen = await render(Fixture, {
      label: "Category",
      name: "category",
      options,
      placeholder: "Choose one",
      required: true,
      value: "",
    });

    // The disabled placeholder is selected but excluded from form data — the
    // documented reason the schema recipe must default the missing key.
    expect(formData(screen.container).get("category")).toBeNull();
  });

  test("a CLEARED optional select submits an empty string", async () => {
    // The enabled "none" row is a real option — unlike the disabled
    // prompt, it reaches FormData. Optional schemas receive "".
    const screen = await render(Fixture, {
      label: "Category",
      name: "category",
      options,
      placeholder: "No category",
      value: "",
    });

    expect(formData(screen.container).get("category")).toBe("");
  });

  test("a chosen option reaches the form data", async () => {
    const screen = await render(Fixture, {
      label: "Category",
      name: "category",
      options,
      placeholder: "Choose one",
      value: "",
    });

    await screen.getByLabelText("Category").selectOptions("cheese");

    await expect
      .element(screen.getByLabelText("Category"))
      .toHaveValue("cheese");
    expect(formData(screen.container).get("category")).toBe("cheese");
  });

  test("a parent-provided value update reaches the form data", async () => {
    const screen = await render(Fixture, {
      label: "Category",
      name: "category",
      options,
      value: "wine",
    });

    expect(formData(screen.container).get("category")).toBe("wine");
  });
});

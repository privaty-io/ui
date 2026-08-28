import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeForm } from "../testing/fakes.svelte";
import Fixture from "./form-error.fixture.svelte";

describe("form error", () => {
  test("renders nothing while the form is healthy", async () => {
    const screen = await render(Fixture, { form: fakeForm().form });

    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  test("shows the general error label when a submit threw", async () => {
    const screen = await render(Fixture, { form: fakeForm().form });

    screen.component.state.submitError = new Error("network");

    await expect
      .element(screen.getByText("Something went wrong. Please try again."))
      .toBeInTheDocument();
  });

  test("uses the configured general error label", async () => {
    const screen = await render(Fixture, {
      form: fakeForm().form,
      uiConfig: { labels: { form: { generalError: "Noget gik galt." } } },
    });

    screen.component.state.submitError = new Error("network");

    await expect
      .element(screen.getByText("Noget gik galt."))
      .toBeInTheDocument();
  });

  test("shows form-level issues through the resolver, hides field-level ones", async () => {
    const { form, setIssues } = fakeForm();
    const screen = await render(Fixture, {
      form,
      uiConfig: {
        resolveMessage: (issue) =>
          issue.message === "already-exists"
            ? "Findes allerede."
            : issue.message,
      },
    });

    setIssues([
      { message: "already-exists" },
      { message: "required", path: ["name"] },
    ]);

    await expect
      .element(screen.getByText("Findes allerede."))
      .toBeInTheDocument();
    await expect.element(screen.getByText("required")).not.toBeInTheDocument();
  });
});

import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";

import Fixture from "./filter-bar.fixture.svelte";

describe("filter bar", () => {
  test("adding a chip through the editor emits the wire format", async () => {
    const screen = await render(Fixture, {});

    await screen.getByRole("button", { name: "Filter", exact: true }).click();
    // Defaults derive from the definition: first field, first granted op.
    await screen.getByLabelText("Value").fill("Comté");
    await screen.getByRole("button", { name: "Apply" }).click();

    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { name: { eq: "Comté" } } });
    await expect.element(screen.getByText("Name = Comté")).toBeInTheDocument();
  });

  test("field and operator selection drive the value control; flags need none", async () => {
    const screen = await render(Fixture, {});

    await screen.getByRole("button", { name: "Filter", exact: true }).click();
    await screen.getByLabelText("Field").selectOptions("price");
    await screen.getByLabelText("Operator").selectOptions("isNull");
    // A flag op has no value control.
    expect(screen.container.querySelector('input[type="text"]')).toBeNull();
    await screen.getByRole("button", { name: "Apply" }).click();

    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { price: { isNull: true } } });
    await expect
      .element(screen.getByText("Price is empty"))
      .toBeInTheDocument();
  });

  test("values validate against the field schema before a chip commits", async () => {
    const screen = await render(Fixture, {});

    await screen.getByRole("button", { name: "Filter", exact: true }).click();
    await screen.getByLabelText("Field").selectOptions("price");
    await screen.getByLabelText("Operator").selectOptions("in");
    await screen.getByLabelText("Value").fill("1, x");
    await screen.getByRole("button", { name: "Apply" }).click();

    // The editor refuses: error shown, nothing emitted.
    await expect.element(screen.getByText(/invalid type/i)).toBeInTheDocument();
    expect(screen.component.currentValue()).toBeUndefined();

    // Corrected, the comma list parses by the field's kind.
    await screen.getByLabelText("Value").fill("1, 2");
    await screen.getByRole("button", { name: "Apply" }).click();
    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { price: { in: [1, 2] } } });
  });

  test("number values commit through the number input (which binds a NUMBER)", async () => {
    const screen = await render(Fixture, {});

    await screen.getByRole("button", { name: "Filter", exact: true }).click();
    await screen.getByLabelText("Field").selectOptions("price");
    await screen.getByLabelText("Operator").selectOptions("gte");
    await screen.getByLabelText("Value").fill("100");
    await screen.getByRole("button", { name: "Apply" }).click();

    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { price: { gte: 100 } } });
  });

  test("multiple chips wrap in `and`; removing one unwraps", async () => {
    const screen = await render(Fixture, {});

    await screen.getByRole("button", { name: "Filter", exact: true }).click();
    await screen.getByLabelText("Value").fill("a");
    await screen.getByRole("button", { name: "Apply" }).click();
    await screen.getByRole("button", { name: "Filter", exact: true }).click();
    await screen.getByLabelText("Value").fill("b");
    await screen.getByRole("button", { name: "Apply" }).click();

    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({
        where: { and: [{ name: { eq: "a" } }, { name: { eq: "b" } }] },
      });

    await screen
      .getByRole("button", { name: "Remove filter: Name = a" })
      .click();
    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { name: { eq: "b" } } });
  });

  test("a preset's off-fragment filters until toggled — and external state drives it", async () => {
    const screen = await render(Fixture, { withPresets: true });

    // Off state contributes the fragment immediately.
    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { hidden: { eq: false } } });

    const preset = screen.getByRole("button", { name: "Show hidden" });
    await preset.click();
    await expect.element(preset).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => screen.component.currentValue()).toBeUndefined();
    expect(screen.component.currentPresets()).toEqual({
      hidden: true,
      category: "all",
    });

    // External write (a global-filter store) flows back through.
    screen.component.setPreset("hidden", false);
    await expect.element(preset).toHaveAttribute("aria-pressed", "false");
    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { hidden: { eq: false } } });
  });

  test("a select preset picks ONE fragment; external state drives it too", async () => {
    const screen = await render(Fixture, { withPresets: true });
    // Neutralize the toggle preset so only the select contributes.
    screen.component.setPreset("hidden", true);

    const preset = screen.getByLabelText("Category preset");
    await preset.selectOptions("cheese");
    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { category: { eq: "cheese" } } });

    // The "all" option carries no fragment.
    await preset.selectOptions("all");
    await expect.poll(() => screen.component.currentValue()).toBeUndefined();

    // External write (a global-filter store) flows back through.
    screen.component.setPreset("category", "wine");
    await expect.element(preset).toHaveValue("wine");
    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({ where: { category: { eq: "wine" } } });
  });

  test("quick search commits on Enter and preserves keys other writers own", async () => {
    const screen = await render(Fixture, {
      withSearch: true,
      initialValue: { orderBy: [{ field: "name", dir: "desc" }] },
    });

    const input = screen.getByPlaceholder("Quick search");
    await input.fill("brie");
    await userEvent.keyboard("{Enter}");

    await expect
      .poll(() => screen.component.currentValue())
      .toEqual({
        orderBy: [{ field: "name", dir: "desc" }],
        where: { name: { contains: "brie" } },
      });
  });
});

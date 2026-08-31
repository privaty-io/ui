import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import { fakeDateField, fakeForm } from "../testing/fakes.svelte";
import Fixture from "./date-picker-input.fixture.svelte";
import "../testing/tailwind.css";

const day = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
const panel = () => document.querySelector<HTMLElement>("[popover]")!;

// The same Gecko-only detect the component's CSS uses: in Firefox the
// native date affordance wins (its icon cannot be hidden — Bugzilla
// 1830890), so our trigger hides for dates and the popover flow is
// Chromium-and-Safari-only.
const firefox = CSS.supports("-moz-appearance", "none");

describe("wiring", () => {
  test("renders a native date carrier with the field's attributes", async () => {
    const { field } = fakeDateField("bakedOn");
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
      min: "2026-01-05",
      max: "2026-12-24",
    });

    const input = screen.getByLabelText("Baked on");
    await expect.element(input).toHaveAttribute("name", "bakedOn");
    await expect.element(input).toHaveAttribute("type", "date");
    await expect.element(input).toHaveAttribute("min", "2026-01-05");
    await expect.element(input).toHaveAttribute("max", "2026-12-24");
  });

  test.runIf(firefox)(
    "Firefox yields the date field to the native affordance",
    async () => {
      const { field } = fakeDateField("bakedOn");
      const screen = await render(Fixture, {
        form: fakeForm().form,
        field,
        label: "Baked on",
      });

      // Our trigger steps aside (the native icon is the one affordance) and
      // the reserved padding returns to base.
      const trigger = document.querySelector<HTMLButtonElement>(
        'button[title="Open calendar"]',
      )!;
      expect(getComputedStyle(trigger).display).toBe("none");
      const input = screen.getByLabelText("Baked on").element() as HTMLElement;
      expect(getComputedStyle(input).paddingRight).toBe("8px");
    },
  );

  test.skipIf(firefox)(
    "a pick writes the input the way typing does and closes",
    async () => {
      const { field, edit } = fakeDateField("bakedOn");
      const screen = await render(Fixture, {
        form: fakeForm().form,
        field,
        label: "Baked on",
        initialValue: "2026-02-05",
        syncField: edit,
      });

      await screen.getByRole("button", { name: "Open calendar" }).click();
      await vi.waitFor(() =>
        expect(panel().matches(":popover-open")).toBe(true),
      );

      // The picker highlights the field's current value.
      expect(day("2026-02-05")?.getAttribute("aria-selected")).toBe("true");

      day("2026-02-14")!.click();

      // The DOM value plus a bubbling input event is exactly what typing
      // produces — the fixture's syncField wrapper (standing in for Kit's
      // form-level listener) proves the event escaped the component.
      await expect
        .element(screen.getByLabelText("Baked on"))
        .toHaveValue("2026-02-14");
      expect(field.value()).toBe("2026-02-14");
      await vi.waitFor(() =>
        expect(panel().matches(":popover-open")).toBe(false),
      );
      expect(screen.component.state.isDirty).toBe(true);
    },
  );

  test("locks while submitting: input readonly, trigger disabled", async () => {
    const { field } = fakeDateField("bakedOn");
    const { form, setPending } = fakeForm();
    const screen = await render(Fixture, {
      form,
      field,
      label: "Baked on",
    });

    setPending(1);

    const input = screen.getByLabelText("Baked on");
    await expect.element(input).not.toBeDisabled();
    await expect.element(input).toHaveAttribute("readonly");
    // A display: none trigger (Firefox's native-wins path) is out of the
    // a11y tree — the disabled state only matters where it renders.
    if (!firefox) {
      await expect
        .element(screen.getByRole("button", { name: "Open calendar" }))
        .toBeDisabled();
    }
  });

  test.skipIf(firefox)(
    "min/max reach the picker as disabled days",
    async () => {
      const { field } = fakeDateField("bakedOn");
      const screen = await render(Fixture, {
        form: fakeForm().form,
        field,
        label: "Baked on",
        initialValue: "2026-02-10",
        min: "2026-02-05",
        max: "2026-02-20",
      });

      await screen.getByRole("button", { name: "Open calendar" }).click();
      await vi.waitFor(() =>
        expect(panel().matches(":popover-open")).toBe(true),
      );

      expect(day("2026-02-04")?.disabled).toBe(true);
      expect(day("2026-02-05")?.disabled).toBe(false);
      expect(day("2026-02-21")?.disabled).toBe(true);
    },
  );
});

describe("issue display", () => {
  test("hides issues until the field is touched", async () => {
    const { field } = fakeDateField("bakedOn", {
      issues: [{ message: "required" }],
    });
    const screen = await render(Fixture, {
      form: fakeForm().form,
      field,
      label: "Baked on",
    });

    await expect.element(screen.getByText("required")).not.toBeInTheDocument();

    screen.component.state.markTouched("bakedOn");

    await expect.element(screen.getByText("required")).toBeInTheDocument();
  });
});

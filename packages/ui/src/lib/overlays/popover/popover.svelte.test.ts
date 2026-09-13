import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./popover.fixture.svelte";

function panel() {
  const element = document.querySelector<HTMLElement>("[popover]");
  if (!element) throw new Error("no popover rendered");
  return element;
}

const isOpen = () => panel().matches(":popover-open");

describe("popover", () => {
  test("the trigger toggles it via the native invoker", async () => {
    const screen = await render(Fixture, {});

    expect(isOpen()).toBe(false);

    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test("light dismiss: clicking outside closes it", async () => {
    const screen = await render(Fixture, {});

    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await screen.getByTestId("outside").click();
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test("Escape closes it", async () => {
    const screen = await render(Fixture, {});

    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test("bind:open controls it programmatically, and native close flows back", async () => {
    const screen = await render(Fixture, {});

    await screen.getByTestId("external").click();
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await screen.getByTestId("external").click();
    await vi.waitFor(() => expect(isOpen()).toBe(false));

    // Native open (invoker) must update the bound state too.
    await screen.getByTestId("trigger").click();
    await expect.element(screen.getByTestId("state")).toHaveTextContent("open");
  });

  test("positions against the trigger and reports aria-expanded", async () => {
    const screen = await render(Fixture, {});

    const trigger = screen.getByTestId("trigger");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");

    await vi.waitFor(() => {
      const anchorRect = document
        .querySelector('[data-testid="trigger"]')!
        .getBoundingClientRect();
      const panelRect = panel().getBoundingClientRect();
      expect(panelRect.top).toBeCloseTo(anchorRect.bottom + 8, 0);
      expect(panelRect.left).toBeCloseTo(anchorRect.left, 0);
      expect(panel().dataset.placement).toBe("bottom-start");
    });
  });
});

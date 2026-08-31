// Tailwind loaded on purpose: the non-interactivity contract is a computed
// style (pointer-events: none) that only exists with the utilities present.
import "../testing/tailwind.css";

import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./tooltip.fixture.svelte";

function bubble() {
  const element = document.querySelector<HTMLElement>('[role="tooltip"]');
  if (!element) throw new Error("no tooltip rendered");
  return element;
}

const isOpen = () => bubble().matches(":popover-open");

describe("tooltip", () => {
  test("shows on hover and hides when the pointer leaves", async () => {
    const screen = await render(Fixture, {});

    expect(isOpen()).toBe(false);

    await screen.getByTestId("trigger").hover();
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await screen.getByTestId("outside").hover();
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test("waits for openDelay on hover", async () => {
    const screen = await render(Fixture, { openDelay: 300 });

    await screen.getByTestId("trigger").hover();
    expect(isOpen()).toBe(false);

    await vi.waitFor(() => expect(isOpen()).toBe(true), { timeout: 2000 });
  });

  test("keyboard focus shows immediately and blur hides", async () => {
    // The huge openDelay is the proof: any open within the wait window can
    // only be the focus path, which bypasses the hover delay. (An earlier
    // version asserted a tight 200ms wall-clock window instead — flaky
    // under full-suite CPU contention.)
    const screen = await render(Fixture, { openDelay: 60_000 });

    // Park the pointer away from the trigger: it rests wherever an earlier
    // spec left it, and a trigger mounting under a stationary cursor makes
    // Firefox synthesize boundary events that race the show/hide timers.
    await screen.getByTestId("outside").hover();
    // Programmatic focus: Firefox does not focus buttons on click, so a
    // click-then-Tab would start tabbing from <body> there.
    document.querySelector<HTMLElement>('[data-testid="outside"]')!.focus();
    await userEvent.keyboard("{Tab}");

    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await userEvent.keyboard("{Tab}");
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test("Escape hides it for the focused trigger", async () => {
    // Keyboard path on purpose: a pointer click on the trigger races the
    // hint popover's light dismiss against the focus-triggered reopen —
    // Escape's real audience has the trigger focused via Tab anyway.
    const screen = await render(Fixture, {});

    // Pointer parked + programmatic focus — same Firefox reasoning as the
    // keyboard-focus spec above.
    await screen.getByTestId("outside").hover();
    document.querySelector<HTMLElement>('[data-testid="outside"]')!.focus();
    await userEvent.keyboard("{Tab}");
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(isOpen()).toBe(false));
  });

  test("wires role and aria-describedby, and stays non-interactive", async () => {
    const screen = await render(Fixture, {});

    const trigger = document.querySelector('[data-testid="trigger"]')!;
    expect(trigger.getAttribute("aria-describedby")).toBe(bubble().id);
    expect(bubble().id).not.toBe("");

    await screen.getByTestId("trigger").hover();
    await vi.waitFor(() => expect(isOpen()).toBe(true));

    expect(getComputedStyle(bubble()).pointerEvents).toBe("none");
  });
});

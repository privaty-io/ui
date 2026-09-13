import { userEvent } from "vitest/browser";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";

import Fixture from "./modal.fixture.svelte";

const dialog = () => document.querySelector("dialog")!;

describe("modal", () => {
  test("the trigger opens it as a modal dialog; the close button closes", async () => {
    const screen = await render(Fixture, {});

    expect(dialog().open).toBe(false);
    await screen.getByTestId("trigger").click();

    await vi.waitFor(() => expect(dialog().open).toBe(true));
    // showModal, not show: the dialog sits in the top layer with a
    // backdrop and traps focus.
    expect(dialog().matches(":modal")).toBe(true);

    await screen.getByRole("button", { name: "Close" }).click();
    await vi.waitFor(() => expect(dialog().open).toBe(false));
    expect(screen.component.isOpen()).toBe(false);
  });

  test("bind:open controls it programmatically, and native close flows back", async () => {
    const screen = await render(Fixture, {});

    screen.component.setOpen(true);
    await vi.waitFor(() => expect(dialog().open).toBe(true));

    // The native path (Escape → cancel → close) must update the binding.
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => {
      expect(dialog().open).toBe(false);
      expect(screen.component.isOpen()).toBe(false);
    });

    screen.component.setOpen(true);
    await vi.waitFor(() => expect(dialog().open).toBe(true));
    screen.component.setOpen(false);
    await vi.waitFor(() => expect(dialog().open).toBe(false));
  });

  test("backdrop clicks close it; content clicks do not", async () => {
    const screen = await render(Fixture, {});
    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(dialog().open).toBe(true));

    // A click INSIDE the panel targets a descendant (padding lives on the
    // inner wrapper) — must stay open.
    await screen.getByTestId("confirm").click();
    expect(dialog().open).toBe(true);

    // A backdrop click targets the <dialog> element itself.
    const rect = dialog().getBoundingClientRect();
    await userEvent.click(document.body, {
      position: { x: Math.max(1, rect.left - 40), y: Math.max(1, rect.top) },
    });
    await vi.waitFor(() => expect(dialog().open).toBe(false));
  });

  test("lightDismiss: false keeps backdrop clicks inert, Escape still closes", async () => {
    const screen = await render(Fixture, { lightDismiss: false });
    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(dialog().open).toBe(true));

    const rect = dialog().getBoundingClientRect();
    await userEvent.click(document.body, {
      position: { x: Math.max(1, rect.left - 40), y: Math.max(1, rect.top) },
    });
    expect(dialog().open).toBe(true);

    // Escape is the native contract — never disabled.
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(dialog().open).toBe(false));
  });

  test("the title labels the dialog", async () => {
    const screen = await render(Fixture, { title: "Delete product" });
    await screen.getByTestId("trigger").click();
    await vi.waitFor(() => expect(dialog().open).toBe(true));

    const labelledby = dialog().getAttribute("aria-labelledby");
    expect(labelledby).toBeTruthy();
    expect(document.getElementById(labelledby!)?.textContent).toBe(
      "Delete product",
    );
  });
});

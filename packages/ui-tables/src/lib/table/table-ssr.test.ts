// Server-render check: everything structural — the group header row
// included — must be in the SSR HTML, not popped in after hydration.
import { render } from "svelte/server";
import { describe, expect, test } from "vitest";

import Fixture from "./table.fixture.svelte";

describe("server rendering", () => {
  test("a loading rows source SSRs the veil, not an empty table", () => {
    // The un-awaited-query recipe: `current` is always undefined on the
    // server, so the page server-renders its loading state and the client
    // fills the rows in after hydration.
    const { body } = render(Fixture, {
      props: {
        rows: { current: undefined, loading: true },
      },
    });

    expect(body).toContain("inert");
    expect(body).toContain('role="status"');
    expect(body).toContain("Loading");
    expect(body).not.toContain("No rows");
    // The SSR veil must be VISIBLE before any client measurement: an
    // absolute cover, not the 0-sized px variant.
    expect(body).toContain("absolute inset-0");
  });

  test("the group header row and its labels are in the SSR output", () => {
    const { body } = render(Fixture, {
      props: {
        rows: [
          { id: "r1", name: "Comté", price: 89 },
          { id: "r2", name: "Rioja", price: 129 },
        ],
        withGroups: true,
        withQuarterColumns: true,
      },
    });

    expect(body).toContain('scope="colgroup"');
    expect(body).toContain(">2026<");
    expect(body).toContain("Comté");
    // Both header rows render on the server.
    expect(body.match(/<tr/g)!.length).toBeGreaterThan(3);
  });
});

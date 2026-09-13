import { describe, expect, test } from "vitest";

import { computeAnchorPosition } from "./position";

// A 100×40 anchor sitting mid-viewport, with plenty of room on every side.
const anchor = { x: 400, y: 300, width: 100, height: 40 };
const floating = { width: 200, height: 150 };
const viewport = { width: 1000, height: 800 };

describe("placement", () => {
  test("defaults to bottom, centered on the cross axis", () => {
    const position = computeAnchorPosition({ anchor, floating, viewport });

    expect(position).toEqual({
      x: 400 + (100 - 200) / 2,
      y: 300 + 40,
      placement: "bottom",
    });
  });

  test("offset adds a gap on the main axis only", () => {
    const position = computeAnchorPosition({
      anchor,
      floating,
      viewport,
      offset: 8,
    });

    expect(position.y).toBe(300 + 40 + 8);
    expect(position.x).toBe(400 + (100 - 200) / 2);
  });

  test("top places above, accounting for the floating height", () => {
    const position = computeAnchorPosition({
      anchor,
      floating,
      viewport,
      placement: "top",
      offset: 8,
    });

    expect(position.y).toBe(300 - 8 - 150);
    expect(position.placement).toBe("top");
  });

  test("start alignment matches leading edges", () => {
    const position = computeAnchorPosition({
      anchor,
      floating,
      viewport,
      placement: "bottom-start",
    });

    expect(position.x).toBe(anchor.x);
  });

  test("end alignment matches trailing edges", () => {
    const position = computeAnchorPosition({
      anchor,
      floating,
      viewport,
      placement: "bottom-end",
    });

    expect(position.x).toBe(anchor.x + anchor.width - floating.width);
  });

  test("horizontal sides place beside and align on the y axis", () => {
    const right = computeAnchorPosition({
      anchor,
      floating,
      viewport,
      placement: "right-start",
      offset: 4,
    });
    expect(right.x).toBe(anchor.x + anchor.width + 4);
    expect(right.y).toBe(anchor.y);

    const left = computeAnchorPosition({
      anchor,
      floating,
      viewport,
      placement: "left-end",
    });
    expect(left.x).toBe(anchor.x - floating.width);
    expect(left.y).toBe(anchor.y + anchor.height - floating.height);
  });
});

describe("flip", () => {
  // Anchor near the bottom edge: 20px below, plenty above.
  const lowAnchor = { x: 400, y: 740, width: 100, height: 40 };

  test("flips to the opposite side when the preferred side lacks room", () => {
    const position = computeAnchorPosition({
      anchor: lowAnchor,
      floating,
      viewport,
      placement: "bottom-start",
    });

    expect(position.placement).toBe("top-start");
    expect(position.y).toBe(740 - 150);
    // Alignment survives the flip.
    expect(position.x).toBe(lowAnchor.x);
  });

  test("stays put when the opposite side is no better", () => {
    // Neither side fits a 700px element: 300px above, 300px below. The
    // opposite side must be STRICTLY better to flip — equal room stays.
    const cramped = { x: 400, y: 300, width: 100, height: 200 };
    const tall = { width: 200, height: 700 };

    const position = computeAnchorPosition({
      anchor: cramped,
      floating: tall,
      viewport,
      placement: "bottom",
    });

    expect(position.placement).toBe("bottom");
  });

  test("flip: false keeps the preferred side regardless", () => {
    const position = computeAnchorPosition({
      anchor: lowAnchor,
      floating,
      viewport,
      placement: "bottom",
      flip: false,
    });

    expect(position.placement).toBe("bottom");
    expect(position.y).toBe(740 + 40);
  });

  test("padding counts against the available room", () => {
    // 165px below the anchor: the 150px element fits — until 20px padding
    // shrinks the room to 145px.
    const snug = { x: 400, y: 595, width: 100, height: 40 };

    const without = computeAnchorPosition({
      anchor: snug,
      floating,
      viewport,
      placement: "bottom",
    });
    expect(without.placement).toBe("bottom");

    const padded = computeAnchorPosition({
      anchor: snug,
      floating,
      viewport,
      placement: "bottom",
      padding: 20,
    });
    expect(padded.placement).toBe("top");
  });
});

describe("shift", () => {
  test("clamps the cross axis to the leading viewport edge", () => {
    const nearLeft = { x: 10, y: 300, width: 100, height: 40 };

    const position = computeAnchorPosition({
      anchor: nearLeft,
      floating,
      viewport,
      placement: "bottom",
      padding: 8,
    });

    // Centered would be x = 10 + (100-200)/2 = -40 — clamped to padding.
    expect(position.x).toBe(8);
  });

  test("clamps the cross axis to the trailing viewport edge", () => {
    const nearRight = { x: 950, y: 300, width: 40, height: 40 };

    const position = computeAnchorPosition({
      anchor: nearRight,
      floating,
      viewport,
      placement: "bottom-start",
    });

    expect(position.x).toBe(viewport.width - floating.width);
  });

  test("an oversized element pins its leading edge", () => {
    const wide = { width: 1200, height: 150 };

    const position = computeAnchorPosition({
      anchor,
      floating: wide,
      viewport,
      placement: "bottom",
      padding: 8,
    });

    // Both clamps apply; the leading edge (padding) must win so the start
    // of the content stays reachable.
    expect(position.x).toBe(8);
  });

  test("shift: false keeps the raw alignment position", () => {
    const nearLeft = { x: 10, y: 300, width: 100, height: 40 };

    const position = computeAnchorPosition({
      anchor: nearLeft,
      floating,
      viewport,
      placement: "bottom",
      shift: false,
    });

    expect(position.x).toBe(10 + (100 - 200) / 2);
  });
});

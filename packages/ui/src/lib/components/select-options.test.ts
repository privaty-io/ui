import { describe, expect, test } from "vitest";

import { toSelectOptions } from "./select-options";

describe("toSelectOptions", () => {
  const cheeses = [
    { id: 7, name: "Comté", soldOut: false },
    { id: 9, name: "Époisses", soldOut: true },
  ];

  test("maps value, label, and disabled", () => {
    expect(
      toSelectOptions(cheeses, {
        value: (cheese) => cheese.id,
        label: (cheese) => cheese.name,
        disabled: (cheese) => cheese.soldOut,
      }),
    ).toEqual([
      { value: "7", label: "Comté", disabled: false },
      { value: "9", label: "Époisses", disabled: true },
    ]);
  });

  test("label falls back to the stringified value", () => {
    expect(toSelectOptions(cheeses, { value: (cheese) => cheese.id })).toEqual([
      { value: "7", label: "7", disabled: undefined },
      { value: "9", label: "9", disabled: undefined },
    ]);
  });

  test("undefined and null items yield [] — a query's pre-fetch current", () => {
    expect(toSelectOptions(undefined, { value: String })).toEqual([]);
    expect(toSelectOptions(null, { value: String })).toEqual([]);
  });
});

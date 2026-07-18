import { flushSync } from "svelte";
import { expect, test } from "vitest";

import { Theme } from "$lib/enums/theme";

import { themeStore } from "./theme.svelte";

test("defaults to system", () => {
  expect(themeStore.current).toBe(Theme.System);
});

test("changes propagate to effects", () => {
  const observed: Theme[] = [];

  const cleanup = $effect.root(() => {
    $effect(() => {
      observed.push(themeStore.current);
    });
  });

  flushSync();
  themeStore.current = Theme.Dark;
  flushSync();

  expect(observed).toEqual([Theme.System, Theme.Dark]);

  cleanup();
  themeStore.current = Theme.System;
});

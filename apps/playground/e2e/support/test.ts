import { expect, test as base } from "@playwright/test";
import type { ConsoleMessage, Page } from "@playwright/test";

/**
 * The console guard — the harness's whole point: every test FAILS on any
 * console error, page error, or Svelte hydration warning, so state bugs
 * that only whisper to the console (the class that costs afternoons at
 * work) fail loudly here.
 *
 * Intentional messages (a deliberate library warning a flow is meant to
 * trigger) are allowlisted per test:
 *
 * ```ts
 * test.use({ allowedMessages: [/Refused to open an editor/] });
 * ```
 */
interface GuardFixtures {
  /** Patterns for console output this test EXPECTS — matched entries are
   * ignored by the guard. */
  allowedMessages: RegExp[];
  /** The guarded page (replaces the built-in `page`). */
  page: Page;
}

const test = base.extend<GuardFixtures>({
  allowedMessages: [[], { option: true }],

  page: async ({ page, allowedMessages }, run) => {
    const problems: string[] = [];
    const allowed = (text: string) =>
      allowedMessages.some((pattern) => pattern.test(text));

    const onConsole = (message: ConsoleMessage) => {
      const type = message.type();
      const text = message.text();
      if (allowed(text)) return;
      if (type === "error") {
        problems.push(`[console.error] ${text}`);
      } else if (type === "warning" && /hydration/i.test(text)) {
        // Hydration warnings are dev-only — the reason the harness runs
        // against the dev server at all.
        problems.push(`[hydration] ${text}`);
      }
    };
    const onPageError = (error: Error) => {
      if (!allowed(error.message)) {
        problems.push(`[pageerror] ${error.message}`);
      }
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    await run(page);

    expect
      .soft(problems, "the console guard caught problems during this test")
      .toEqual([]);
  },
});

export { expect, test };

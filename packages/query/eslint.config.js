import { base, library } from "@config/eslint";
import { defineConfig } from "eslint/config";

// @privaty/query is STANDALONE — it predates its own future monorepo and
// must never grow roots into the ui family. The core/converter wall is
// the package's reason to exist: the core ships to frontends, so it must
// never touch an engine.
export default defineConfig(
  ...base,
  ...library({
    group: ["@privaty/ui", "@privaty/ui-*", "**/packages/ui*/src/**"],
    message: "query is standalone — it never imports the ui family.",
  }),
  {
    files: ["src/**"],
    ignores: ["src/drizzle/**", "src/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["drizzle-orm", "drizzle-orm/*"],
              message:
                "The core is engine-free and client-safe — drizzle only inside src/drizzle/.",
            },
          ],
        },
      ],
    },
  },
);

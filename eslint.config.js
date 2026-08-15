import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import path from "node:path";
import ts from "typescript-eslint";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

// src/external contains future standalone packages (#privaty/ui, #privaty/ui-forms,
// #privaty/ui-tables). They may only import from npm, themselves (relative), and each
// other via the package aliases — never from the app.
const noAppImports = {
  group: ["#lib", "#lib/**", "$env/**"],
  message: "External packages must not import app code.",
};
const noAppRuntimeImports = {
  group: ["$app/**"],
  allowTypeImports: true,
  message: "External packages may only use $app modules as type-only imports.",
};

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
      },
    },
  },
  {
    files: ["src/external/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { patterns: [noAppImports, noAppRuntimeImports] },
      ],
    },
  },
  {
    files: ["src/external/core/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            noAppImports,
            noAppRuntimeImports,
            {
              group: [
                "#privaty/ui-forms",
                "#privaty/ui-forms/**",
                "#privaty/ui-tables",
                "#privaty/ui-tables/**",
                "**/forms/**",
                "**/tables/**",
              ],
              message: "core must not depend on forms or tables.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/external/forms/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            noAppImports,
            noAppRuntimeImports,
            {
              group: [
                "#privaty/ui-tables",
                "#privaty/ui-tables/**",
                "**/tables/**",
              ],
              message: "forms must never import tables.",
            },
            {
              group: ["**/core/**"],
              message: "Import core via the #privaty/ui alias.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/external/tables/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            noAppImports,
            noAppRuntimeImports,
            {
              group: ["**/core/**"],
              message: "Import core via the #privaty/ui alias.",
            },
            {
              group: ["**/forms/**"],
              message: "Import forms via the #privaty/ui-forms alias.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**"],
    ignores: ["src/external/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/external/**"],
              message:
                "Import UI packages via their aliases (#privaty/ui, #privaty/ui-forms, #privaty/ui-tables).",
            },
          ],
        },
      ],
    },
  },
);

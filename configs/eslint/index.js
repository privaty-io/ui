import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

/** The stack every workspace project lints with. */
const base = [
  { ignores: ["dist/", ".svelte-kit/", "build/", ".turbo/"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
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
];

// The @privaty packages may only import from npm, themselves (relative), and
// lower layers via the package names — never from an app, and never upward.
const noAppImports = {
  group: ["#lib", "#lib/**", "$env/**"],
  message: "Packages must not import app code.",
};
const noAppRuntimeImports = {
  group: ["$app/**"],
  allowTypeImports: true,
  message: "Packages may only use $app modules as type-only imports.",
};

/**
 * Layer rules for a library package: app isolation plus the package's own
 * restricted-import patterns (each `{ group, message }` shaped for
 * `no-restricted-imports`).
 */
function library(...forbid) {
  return [
    {
      rules: {
        "@typescript-eslint/no-restricted-imports": [
          "error",
          { patterns: [noAppImports, noAppRuntimeImports, ...forbid] },
        ],
      },
    },
  ];
}

/** Layer rules for an app: reach the libraries only by package name. */
const app = [
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/packages/**"],
              message:
                "Import UI packages via their package names (@privaty/ui, @privaty/ui-forms, @privaty/ui-tables).",
            },
          ],
        },
      ],
    },
  },
];

export { app, base, library };

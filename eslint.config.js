import { base } from "@config/eslint";
import { defineConfig } from "eslint/config";

// Root scope: workspace-level files and the configs/ packages. The apps and
// packages lint themselves (turbo run lint) with their own eslint.config.js.
export default defineConfig({ ignores: ["apps/", "packages/"] }, ...base);

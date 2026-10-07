import { base, library } from "@config/eslint";
import { defineConfig } from "eslint/config";

// The architecture rule this package exists under: layouts are composed
// of CORE components only — never forms, never tables.
export default defineConfig(
  ...base,
  ...library(
    {
      group: [
        "@privaty/ui-forms",
        "@privaty/ui-forms/**",
        "@privaty/ui-tables",
        "@privaty/ui-tables/**",
        "**/ui-forms/src/**",
        "**/ui-tables/src/**",
        "@privaty/query",
        "@privaty/query/**",
        "**/query/src/**",
      ],
      message:
        "layouts are composed of core only — never forms, tables, or query.",
    },
    {
      group: ["**/ui/src/**"],
      message: "Import core via its package name (@privaty/ui).",
    },
  ),
);

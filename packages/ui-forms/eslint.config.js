import { base, library } from "@config/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  ...base,
  ...library(
    {
      group: [
        "@privaty/ui-tables",
        "@privaty/ui-tables/**",
        "**/ui-tables/src/**",
      ],
      message: "forms must never import tables.",
    },
    {
      group: [
        "@privaty/ui-layouts",
        "@privaty/ui-layouts/**",
        "**/ui-layouts/src/**",
      ],
      message: "forms must never import layouts.",
    },
    {
      group: ["@privaty/query", "@privaty/query/**", "**/query/src/**"],
      message: "forms must never import query.",
    },
    {
      group: ["**/ui/src/**"],
      message: "Import core via its package name (@privaty/ui).",
    },
  ),
);

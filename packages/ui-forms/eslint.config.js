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
      group: ["**/ui/src/**"],
      message: "Import core via its package name (@privaty/ui).",
    },
  ),
);

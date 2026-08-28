import { base, library } from "@config/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  ...base,
  ...library(
    {
      group: ["**/ui/src/**"],
      message: "Import core via its package name (@privaty/ui).",
    },
    {
      group: ["**/ui-forms/src/**"],
      message: "Import forms via its package name (@privaty/ui-forms).",
    },
  ),
);

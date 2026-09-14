import { base, library } from "@config/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  ...base,
  ...library({
    group: [
      "@privaty/ui-forms",
      "@privaty/ui-forms/**",
      "@privaty/ui-tables",
      "@privaty/ui-tables/**",
      "@privaty/ui-layouts",
      "@privaty/ui-layouts/**",
      "**/ui-forms/src/**",
      "**/ui-tables/src/**",
      "**/ui-layouts/src/**",
    ],
    message: "core must not depend on the packages built on top of it.",
  }),
);

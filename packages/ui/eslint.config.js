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
      "**/ui-forms/src/**",
      "**/ui-tables/src/**",
    ],
    message: "core must not depend on forms or tables.",
  }),
);

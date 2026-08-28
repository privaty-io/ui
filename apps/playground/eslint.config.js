import { app, base } from "@config/eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(...base, ...app);

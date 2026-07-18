/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],

  overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],

  tailwindStylesheet: "./src/lib/assets/styles/app.css",
  tailwindFunctions: ["clsx", "twMerge", "cn"],
};

export default config;

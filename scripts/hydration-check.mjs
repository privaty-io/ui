// Loads playground pages in headless Chromium and captures every console
// message + page error during load — hydration warnings are dev-only, so
// this runs against the dev server.
// Usage: start the playground dev server, then
//   node scripts/hydration-check.mjs http://localhost:5173 /sandbox/table-static [...paths]
//   ENGINE=firefox node scripts/hydration-check.mjs ...
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const paths = process.argv.slice(3);
if (paths.length === 0) paths.push("/sandbox/table-static");

const engineName = process.env.ENGINE ?? "chromium";
const engine = engineName === "firefox" ? firefox : chromium;
const browser = await engine.launch();
const page = await browser.newPage();

const messages = [];
page.on("console", (message) => {
  const type = message.type();
  if (type === "warning" || type === "error") {
    messages.push(`[console.${type}] ${message.text()}`);
  }
});
page.on("pageerror", (error) => {
  messages.push(`[pageerror] ${error.message}`);
});

for (const path of paths) {
  messages.length = 0;
  await page.goto(base + path, { waitUntil: "networkidle" });
  // Give late async boundaries and deferred effects time to settle.
  await page.waitForTimeout(2500);
  console.log(`\n=== ${path} ===`);
  if (messages.length === 0) {
    console.log("(no warnings or errors)");
  } else {
    for (const entry of messages) console.log(entry);
  }
}

await browser.close();

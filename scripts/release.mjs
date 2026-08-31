// Cuts a lockstep release: runs the full gate suite, sets the same version
// in every packages/* manifest, commits, and tags v<version>. Publishing
// happens in CI when the tag is pushed (.github/workflows/publish.yml) —
// after this script, review and `git push --follow-tags`.
//
// Usage: pnpm release 0.2.0 [--skip-gates]
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const skipGates = process.argv.includes("--skip-gates");
const version = process.argv.filter((arg) => !arg.startsWith("--"))[2];

// Below 1.0.0 until SvelteKit 3 is stable; prerelease suffixes allowed.
if (!/^\d+\.\d+\.\d+(-[0-9a-z.-]+)?$/i.test(version ?? "")) {
  console.error("Usage: pnpm release <version>   e.g. pnpm release 0.2.0");
  process.exit(1);
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

if (git("status", "--porcelain") !== "") {
  console.error("Working tree is not clean — commit or stash first.");
  process.exit(1);
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main") {
  console.error(`On '${branch}', not 'main' — releases cut from main only.`);
  process.exit(1);
}

if (git("tag", "--list", `v${version}`) !== "") {
  console.error(`Tag v${version} already exists.`);
  process.exit(1);
}

// The gates run BEFORE anything is written: a tag must never point at a
// commit CI will reject (v0.1.3 died that way). --skip-gates opts out when
// the same tree just passed them.
if (skipGates) {
  console.log("Skipping gates (--skip-gates).");
} else {
  for (const gate of ["check", "lint", "test --run", "build"]) {
    console.log(`\n> pnpm ${gate}`);
    execFileSync("pnpm", gate.split(" "), { stdio: "inherit" });
  }
}

const manifests = readdirSync("packages").map((name) =>
  join("packages", name, "package.json"),
);

// Manifests already at the target version write back byte-identical — a
// commit would fail with "nothing to commit" (the first release, where the
// manifests were born at the target version, hits this). Only commit what
// actually changed; the tag is wanted either way.
const changed = [];
for (const manifest of manifests) {
  const before = readFileSync(manifest, "utf8");
  const data = JSON.parse(before);
  data.version = version;
  const after = JSON.stringify(data, null, 2) + "\n";
  if (after !== before) {
    writeFileSync(manifest, after);
    changed.push(manifest);
  }
  console.log(
    `${data.name} -> ${version}${after === before ? " (already)" : ""}`,
  );
}

if (changed.length > 0) {
  git("add", ...changed);
  git("commit", "-m", `release: v${version}`);
}
git("tag", "-a", `v${version}`, "-m", `v${version}`);

console.log(
  changed.length > 0
    ? `\nCommitted and tagged v${version}.`
    : `\nManifests already at ${version} — tagged the current commit as v${version}.`,
);
console.log("Review, then publish with: git push --follow-tags");

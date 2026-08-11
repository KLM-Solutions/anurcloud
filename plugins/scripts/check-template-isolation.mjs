#!/usr/bin/env node
/**
 * Guards the one rule that keeps the template set liftable:
 *
 *   templates/ must not import from lib/, app/, or anywhere outside itself.
 *
 * Break it and the templates stop being deliverable on their own — which
 * quietly kills the option of shipping them as a package later. It is an easy
 * mistake to make (one convenient helper import) and expensive to unpick once
 * twenty cards depend on it, so it is checked rather than remembered.
 *
 * Run: npm run check:templates   (also part of `npm run verify`)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DIR = join(ROOT, "templates");

/** Bare specifiers the template set is allowed to depend on. Keep this empty. */
const ALLOWED_PACKAGES = new Set();

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\b[^;\n]*?from\s*["']([^"']+)["']/g;
const DYNAMIC_RE = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
const REQUIRE_RE = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|mts|js|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(DIR)) {
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  for (const re of [IMPORT_RE, DYNAMIC_RE, REQUIRE_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const spec = m[1];

      // Relative imports inside templates/ are fine.
      if (spec.startsWith(".")) continue;

      // The path alias points at the app root — anything through it is outside.
      if (spec.startsWith("@/")) {
        violations.push({ rel, spec, why: 'uses the "@/" alias, which resolves outside templates/' });
        continue;
      }

      if (ALLOWED_PACKAGES.has(spec)) continue;

      violations.push({ rel, spec, why: "imports an external package" });
    }
  }
}

if (violations.length > 0) {
  console.error("\n✗ templates/ is not self-contained:\n");
  for (const v of violations) {
    console.error(`  ${v.rel}\n    → "${v.spec}" — ${v.why}`);
  }
  console.error(
    "\nMove the shared logic into lib/ and pass the result in, or duplicate the\n" +
      "small piece you need. templates/ has to stand alone. See DEV-3040.\n",
  );
  process.exit(1);
}

console.log("✓ templates/ is self-contained — no imports outside the folder.");

/**
 * Minimal resolver hook so plain `node --experimental-strip-types` can run the
 * app's TypeScript directly, without adding a bundler or a test runner just to
 * exercise a few pure functions.
 *
 * Handles the two things Node doesn't do on its own:
 *   - the "@/..." path alias from tsconfig.json
 *   - extensionless relative imports ("./guards" → guards.ts)
 *
 * Dev tooling only — never imported by application code.
 */

import { register } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");

const hooks = `
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve as resolvePath } from "node:path";

const ROOT = ${JSON.stringify(ROOT)};
const EXTS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

function firstExisting(base) {
  if (existsSync(base)) {
    try {
      if (!statSync(base).isDirectory()) return base;
    } catch {
      /* fall through to the extension probes */
    }
  }
  for (const ext of EXTS) {
    const candidate = base + ext;
    if (existsSync(candidate)) return candidate;
  }
  for (const ext of EXTS) {
    const candidate = join(base, "index" + ext);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const hit = firstExisting(join(ROOT, specifier.slice(2)));
    // Format is left unset on purpose: forcing "module" bypasses Node's
    // type-stripping, and a .ts file then gets parsed as plain JS.
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if (specifier.startsWith(".") && context.parentURL && context.parentURL.startsWith("file:")) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const hit = firstExisting(resolvePath(parentDir, specifier));
    // Format is left unset on purpose: forcing "module" bypasses Node's
    // type-stripping, and a .ts file then gets parsed as plain JS.
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

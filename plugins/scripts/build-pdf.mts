/**
 * Render ONE template to a PDF, to see how a card actually prints/exports.
 *
 *   npm run pdf -- <template>            # e.g. npm run pdf -- ticket-stub
 *   npm run pdf -- <template> --type professional
 *   npm run pdf -- <template> --level rich|typical|thin
 *   npm run pdf -- <template> --data path/to/profile.json   # a raw extracted profile
 *   npm run pdf -- <template> --width 440 --out my-card.pdf
 *
 * How it works: renders the card HTML with `renderCard`, wraps it so each
 * `.iv-page` becomes one physical sheet, then drives headless Chrome's built-in
 * print-to-PDF (the same Chrome the overflow check uses). The PDF therefore looks
 * exactly like the rendered card — this is a real "how will it view" preview, not
 * a re-implementation.
 *
 * Output goes to `public/<template>.pdf` unless --out is given.
 */

import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

import { renderCard, templates, type ProfileType } from "@/templates";
import { profileToCard } from "@/lib/profile-to-card";
import { GOLDEN } from "./eval/golden";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 9355;

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

/* ── args ─────────────────────────────────────────────────────────────────── */

function parseArgs() {
  const a = process.argv.slice(2);
  const flag = (name: string) => {
    const i = a.indexOf(`--${name}`);
    return i !== -1 ? a[i + 1] : undefined;
  };
  const template = a.find((x) => !x.startsWith("--") && a[a.indexOf(x) - 1]?.startsWith("--") !== true) ?? a[0];
  return {
    template: a[0] && !a[0].startsWith("--") ? a[0] : template,
    type: flag("type") as ProfileType | undefined,
    level: (flag("level") ?? "rich") as "rich" | "typical" | "thin",
    data: flag("data"),
    width: flag("width") ? Number(flag("width")) : 380,
    out: flag("out"),
  };
}

/** Resolve the profile to render: an explicit --data json, else a golden case. */
function resolveProfile(templateKey: string, opts: ReturnType<typeof parseArgs>) {
  const info = templates.find((t) => t.key === templateKey);
  if (!info) {
    const list = templates.map((t) => t.key).join(", ");
    throw new Error(`Unknown template "${templateKey}". Available:\n  ${list}`);
  }
  const type: ProfileType = opts.type ?? info.audience;

  if (opts.data) {
    const path = isAbsolute(opts.data) ? opts.data : join(process.cwd(), opts.data);
    const raw = JSON.parse(readFileSync(path, "utf8"));
    // Accept either a bare profile or an API/extract envelope ({ data, brand }).
    const profile = raw.data ?? raw.profile ?? raw;
    const card = profileToCard({ profile, profile_type: type, enhanced: { bio: profile.summary } });
    return { info, type, card };
  }

  const g = GOLDEN.find((c) => c.id === `${type}-${opts.level}`) ?? GOLDEN.find((c) => c.profile_type === type);
  if (!g) throw new Error(`No golden profile for type ${type}.`);
  const card = profileToCard({ profile: g.profile, profile_type: type, enhanced: { bio: g.profile.summary as string } });
  return { info, type, card };
}

/* ── print HTML ───────────────────────────────────────────────────────────── */

function printDoc(cardHtml: string, width: number): string {
  // Each `.iv-page` becomes one physical sheet. The card's own outer frame is
  // dropped for print — each sheet IS the card page, so a border wrapping all
  // sheets would be wrong. Sheet height comes from the CSS @page below; a page
  // that runs a little long simply flows onto the next sheet (which is exactly
  // the kind of thing this preview is for).
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#fff}
  .iv-pdf{width:${width}px}
  /* Drop the card's screen chrome — each sheet is the page itself. */
  .iv-pdf > div{border:none!important;box-shadow:none!important;border-radius:0!important}
  /* One sheet per page. */
  .iv-pdf .iv-page{break-after:page}
  .iv-pdf .iv-page:last-child{break-after:auto}
  </style></head><body><div class="iv-pdf">${cardHtml}</div></body></html>`;
}

/* ── chrome ───────────────────────────────────────────────────────────────── */

function findChrome() {
  return CHROME_CANDIDATES.find((p) => existsSync(p)) ?? null;
}

async function waitForTarget(): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t: { type: string }) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* still starting */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Chrome did not open a debugging port on ${PORT}.`);
}

function printPdf(wsUrl: string, fileUrl: string, width: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map<number, (m: unknown) => void>();
    const send = (method: string, params: Record<string, unknown> = {}) =>
      new Promise<{ result?: Record<string, unknown> }>((res) => {
        const i = (id += 1);
        pending.set(i, res as (m: unknown) => void);
        ws.send(JSON.stringify({ id: i, method, params }));
      });

    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)!(msg);
        pending.delete(msg.id);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", async () => {
      try {
        await send("Page.enable");
        await send("Page.navigate", { url: fileUrl });
        // Let fonts, gradients and container queries settle before printing.
        await new Promise((r) => setTimeout(r, 2500));
        const res = await send("Page.printToPDF", {
          printBackground: true,
          preferCSSPageSize: false,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          // Sheet = card width × the on-screen page height (--iv-page-h 537px).
          // 96 CSS px per inch.
          paperWidth: width / 96,
          paperHeight: 537 / 96,
          scale: 1,
        });
        const data = (res.result as { data?: string })?.data;
        if (!data) throw new Error("Chrome returned no PDF data.");
        resolve(Buffer.from(data, "base64"));
      } catch (err) {
        reject(err);
      } finally {
        ws.close();
      }
    });
  });
}

/* ── main ─────────────────────────────────────────────────────────────────── */

async function main() {
  const opts = parseArgs();
  if (!opts.template || opts.template.startsWith("--")) {
    console.error("usage: npm run pdf -- <template> [--type ..] [--level ..] [--data f.json] [--width 380] [--out f.pdf]");
    console.error("templates:\n  " + templates.map((t) => t.key).join(", "));
    process.exit(1);
  }

  const chrome = findChrome();
  if (!chrome) {
    console.error("✗ No Chrome/Chromium found — cannot render a PDF.\n  Looked in:\n    " + CHROME_CANDIDATES.join("\n    "));
    process.exit(1);
  }

  const { info, type, card } = resolveProfile(opts.template, opts);
  const html = renderCard(info.key, card);
  const doc = printDoc(html, opts.width);

  const tmp = join(ROOT, "public", `.pdf-src-${info.key}.html`);
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, doc);

  const outPath = opts.out
    ? isAbsolute(opts.out)
      ? opts.out
      : join(process.cwd(), opts.out)
    : join(ROOT, "public", `${info.key}.pdf`);

  console.log(`▶ rendering "${info.name}" (${type}, ${opts.level}) at ${opts.width}px → PDF`);

  const proc = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${join(ROOT, "node_modules", ".cache", "pdf-profile")}`,
      "--window-size=1200,1600",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    const target = await waitForTarget();
    const pdf = await printPdf(target, `file://${tmp}`, opts.width);
    writeFileSync(outPath, pdf);
    console.log(`✔ wrote ${outPath}  (${(pdf.length / 1024).toFixed(0)} KB)`);
  } finally {
    proc.kill();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

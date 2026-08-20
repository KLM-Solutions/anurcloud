/**
 * Measures public/stress.html in headless Chrome and fails on broken layout.
 *
 * Four things are checked, and all four are bugs a reader will notice before we do:
 *
 *   1. ESCAPES THE CARD — an element painted outside the card's own edges. The
 *      card root clips, so in a browser this shows up as text cut off mid-word at
 *      the border rather than as something sticking out.
 *   2. OVERFLOWS ITS OWN BOX — scrollWidth past clientWidth, i.e. content wider
 *      than the box holding it. This is the fixed-column-blown-open case.
 *   3. OVERLAPS — two text-bearing elements painting over each other. This is the
 *      failure that produced "JCATION" over an EDUCATION heading once already.
 *   4. ESCAPES THE HOST — the card wider than the column it was embedded in,
 *      which is how it will fail inside AnurCloud's layout rather than ours.
 *
 * Why a separate script from verify-foundation: this one needs a browser, so it
 * cannot run everywhere. It is a gate you run before a handover, not on every save.
 *
 * Run: npm run check:overflow      (build the page first: npm run stress)
 */

import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(ROOT, "public", "stress.html");
const PORT = 9333;

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

/**
 * Tolerance in CSS pixels.
 *
 * Not zero: sub-pixel rounding in the layout engine routinely produces 0.1–0.4px
 * differences on a box that is visually exact, and a zero tolerance turns this
 * into a test that cries wolf and then gets ignored. Anything a person could see
 * is well above 1px.
 */
const SLACK = 1;

/** Boxes that clip on purpose. Their overflow is a design decision, not a bug. */
const INTENTIONAL_CLIP = [
  "iv-si", // social circle — clips so a wide label cannot escape (see styles.ts)
  "iv-sm-k", // Skill Meters label — ellipsis, so the bars share one baseline
];

function findChrome() {
  return CHROME_CANDIDATES.find((p) => existsSync(p)) ?? null;
}

/** The measuring pass, serialised into the page. */
const MEASURE = `(() => {
  const SLACK = ${SLACK};
  const INTENTIONAL = ${JSON.stringify(INTENTIONAL_CLIP)};
  const findings = [];
  const cls = (el) => (typeof el.className === "string" ? el.className : el.tagName);
  const isDecorative = (el) =>
    el.getAttribute("aria-hidden") === "true" ||
    getComputedStyle(el).position === "absolute";
  const label = (el) => (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 30);
  // True when an INNER container (between el and the card root, exclusive) clips
  // its content — a scroll/overflow area, as the dynamic A4 cards use. Content
  // there is scrolled/clipped by design, not painted outside the card, so it must
  // not be flagged as escaping. The card root's own overflow is NOT counted — that
  // boundary is exactly what we still test against.
  const inInnerClip = (el, card) => {
    let a = el.parentElement;
    while (a && a !== card) {
      const o = getComputedStyle(a);
      if (o.overflowY !== "visible" || o.overflowX !== "visible") return true;
      a = a.parentElement;
    }
    return false;
  };

  for (const cell of document.querySelectorAll(".cell")) {
    const card = cell.querySelector("[data-iv-template]");
    if (!card) continue;
    const meta = { card: cell.dataset.card, fx: cell.dataset.fx, case: cell.dataset.case };
    const cardBox = card.getBoundingClientRect();
    const hostBox = cell.getBoundingClientRect();

    // 4. the card itself vs the column it was put in
    if (cardBox.width - hostBox.width > SLACK) {
      findings.push({ ...meta, kind: "escapes-host", el: "card root", text: "",
        by: +(cardBox.width - hostBox.width).toFixed(1) });
    }

    const texts = [];
    for (const el of card.querySelectorAll("*")) {
      if (el.tagName === "STYLE") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name = cls(el);

      // 1. painted outside the card's own edges — but not when an inner scroll
      // container clips the element (dynamic A4 cards scroll their content).
      const outRight = r.right - cardBox.right;
      const outLeft = cardBox.left - r.left;
      const outBottom = r.bottom - cardBox.bottom;
      if ((outRight > SLACK || outLeft > SLACK || outBottom > SLACK) && !inInnerClip(el, card)) {
        findings.push({ ...meta, kind: "escapes-card", el: name, text: label(el),
          by: +Math.max(outRight, outLeft, outBottom).toFixed(1) });
      }

      // 2. content wider than its own box
      if (!INTENTIONAL.some((c) => String(name).includes(c))) {
        const over = el.scrollWidth - el.clientWidth;
        if (over > SLACK && getComputedStyle(el).overflowX !== "visible") {
          findings.push({ ...meta, kind: "clipped-text", el: name, text: label(el), by: over });
        }
      }

      // collect leaf text boxes for the overlap pass
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText && !isDecorative(el)) texts.push({ el, r, name });
    }

    // 3. two pieces of text painting over each other
    for (let i = 0; i < texts.length; i += 1) {
      for (let j = i + 1; j < texts.length; j += 1) {
        const a = texts[i], b = texts[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        // Both axes must genuinely intersect, by more than a hairline, before this
        // is a collision rather than two boxes sharing an edge.
        if (ox > 2 && oy > 2) {
          findings.push({ ...meta, kind: "overlap", el: a.name + " × " + b.name,
            text: label(a.el) + " / " + label(b.el), by: +Math.min(ox, oy).toFixed(1) });
        }
      }
    }
  }
  return JSON.stringify({ cells: document.querySelectorAll(".cell").length, findings });
})()`;

async function main() {
  if (!existsSync(PAGE)) {
    console.error("✗ public/stress.html is missing. Run: npm run stress");
    process.exit(1);
  }
  const chrome = findChrome();
  if (!chrome) {
    // Not a failure: this gate needs a browser, and the rest of `verify` does not.
    console.log("• No Chrome or Chromium found — skipping the overflow check.");
    console.log("  Looked in:\n    " + CHROME_CANDIDATES.join("\n    "));
    return;
  }

  const proc = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${join(ROOT, "node_modules", ".cache", "overflow-profile")}`,
      "--window-size=1600,1200",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    const target = await waitForTarget();
    const findings = await measure(target);
    report(findings);
  } finally {
    proc.kill();
  }
}

async function waitForTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Chrome did not open a debugging port on ${PORT}.`);
}

function measure(wsUrl) {
  return new Promise((resolve, reject) => {
    // Node 22 ships a global WebSocket, so this needs no dependency.
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const send = (method, params = {}) =>
      new Promise((res) => {
        const i = (id += 1);
        pending.set(i, res);
        ws.send(JSON.stringify({ id: i, method, params }));
      });

    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    });
    ws.addEventListener("error", reject);
    ws.addEventListener("open", async () => {
      try {
        await send("Page.enable");
        await send("Runtime.enable");
        await send("Page.navigate", { url: `file://${PAGE}` });
        // Fonts and container queries need a beat to settle; measuring too early
        // reports overflow that resolves itself a frame later.
        await new Promise((r) => setTimeout(r, 3000));
        const res = await send("Runtime.evaluate", { expression: MEASURE, returnByValue: true });
        if (res.result?.exceptionDetails) {
          reject(new Error(res.result.exceptionDetails.text ?? "measure failed"));
          return;
        }
        resolve(JSON.parse(res.result.result.value));
      } catch (err) {
        reject(err);
      } finally {
        ws.close();
      }
    });
  });
}

const KIND_LABEL = {
  "escapes-card": "painted outside the card",
  "escapes-host": "wider than its host column",
  "clipped-text": "content wider than its own box",
  overlap: "two pieces of text overlapping",
};

function report({ cells, findings }) {
  console.log(`Measured ${cells} rendered cards in public/stress.html\n`);

  if (findings.length === 0) {
    console.log("✓ No overflow, clipping or overlap found.");
    return;
  }

  // Group by kind then card, so one root cause reads as one problem rather than
  // as ninety findings.
  const byKind = new Map();
  for (const f of findings) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind).push(f);
  }

  for (const [kind, list] of byKind) {
    console.log(`✗ ${list.length} × ${KIND_LABEL[kind] ?? kind}`);
    const byCard = new Map();
    for (const f of list) {
      const key = `${f.card}`;
      if (!byCard.has(key)) byCard.set(key, []);
      byCard.get(key).push(f);
    }
    for (const [card, rows] of byCard) {
      const worst = rows.reduce((a, b) => (b.by > a.by ? b : a));
      const cases = [...new Set(rows.map((r) => `${r.fx} @ ${r.case}`))];
      console.log(`    ${card} — worst ${worst.by}px  <${worst.el}>  "${worst.text}"`);
      for (const c of cases.slice(0, 4)) console.log(`        ${c}`);
      if (cases.length > 4) console.log(`        …and ${cases.length - 4} more`);
    }
    console.log("");
  }

  process.exitCode = 1;
}

await main();

/**
 * Generates a SELF-CONTAINED playground.html (open by double-click, no server):
 * a font + colour toolbar sits on top of the live cards. The compiled package is
 * bundled (esbuild → IIFE) and inlined, so window.IVT.renderCard works offline.
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Bundle the built package to an IIFE exposing `IVT` (from dist/, so build first).
const bundle = execSync(
  "npx --yes esbuild dist/index.js --bundle --format=iife --global-name=IVT --minify",
  { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);

const SAMPLES = {
  professional: {
    profileType: "professional",
    fullName: "Karthick Chandrasekaran",
    designation: "Senior Software Engineer",
    currentCompany: "KLM Solutions",
    totalYearsExperience: "7 years",
    email: "karthick@klmsolutions.in",
    phone: "+91 98765 43210",
    location: "Chennai, India",
    bio: "Backend engineer focused on distributed systems, clean APIs and shipping reliable products at scale.",
    skills: ["Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker", "Kubernetes"],
    website: "https://karthick.dev",
    socialLinks: [
      { platform: "linkedin", url: "https://linkedin.com/in/karthick" },
      { platform: "github", url: "https://github.com/karthick" },
      { platform: "x", url: "https://x.com/karthick" },
      { platform: "website", url: "https://karthick.dev" },
    ],
    education: [{ degree: "B.E.", field: "Computer Science", institution: "Anna University", year: "2018" }],
    experience: [{ role: "Senior Software Engineer", company: "KLM Solutions", duration: "2021 – present", highlights: ["Led the migration to a microservices architecture serving 2M+ users."] }],
  },
  student: {
    profileType: "student",
    fullName: "Divya Subramani",
    designation: "Final-year CSE Student",
    email: "divya.s@psgtech.ac.in",
    phone: "+91 98840 00000",
    location: "Coimbatore, India",
    bio: "Aspiring product engineer who loves building for campus communities and tinkering with AR.",
    skills: ["Python", "React", "Figma", "TensorFlow"],
    website: "https://divya.dev",
    socialLinks: [
      { platform: "linkedin", url: "https://linkedin.com/in/divya" },
      { platform: "instagram", url: "https://instagram.com/divya.builds" },
      { platform: "github", url: "https://github.com/divya" },
    ],
    education: [{ degree: "B.Tech", field: "Computer Science", institution: "PSG College of Technology", year: "2026" }],
    projects: [{ title: "Campus Navigator", description: "AR-based indoor maps that guide students across a 40-acre campus." }],
  },
};

const FONTS = ["Poppins", "Inter", "Montserrat", "Playfair Display", "Space Grotesk", "Lato", "Nunito", "Merriweather"];
const PRIMARIES = ["#4338ca", "#7c3aed", "#0f766e", "#be123c", "#2563eb", "#059669", "#ea580c", "#334155"];
const ACCENTS = ["#4f46e5", "#8b5cf6", "#f97316", "#e11d48", "#0ea5e9", "#10b981", "#f59e0b", "#64748b"];

const swatches = (list, kind) =>
  list.map((c, i) => `<button class="sw" data-kind="${kind}" data-c="${c}" style="background:${c}" title="${c}"></button>`).join("");

const fontOpts = FONTS.map((f) => `<option value="${f}">${f}</option>`).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Smart-Card Templates — Playground</title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700;800&family=Playfair+Display:wght@600;700;800&family=Space+Grotesk:wght@500;700&family=Lato:wght@400;700;900&family=Nunito:wght@400;700;800&family=Merriweather:wght@400;700;900&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box;}
  body{margin:0;font-family:Inter,system-ui,sans-serif;background:#eef1f6;color:#0f172a;}
  .bar{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid #e2e8f0;box-shadow:0 4px 16px -10px rgba(15,23,42,.3);padding:14px 22px;}
  .bar h1{margin:0 0 12px;font-family:Poppins;font-size:16px;font-weight:800;}
  .bar h1 small{font-weight:500;color:#64748b;font-size:12px;margin-left:8px;}
  .controls{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-end;}
  .ctrl{display:flex;flex-direction:column;gap:6px;}
  .ctrl label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#64748b;}
  select{padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;font-family:inherit;min-width:150px;background:#fff;}
  .swatches{display:flex;gap:6px;align-items:center;}
  .sw{width:24px;height:24px;border-radius:7px;border:2px solid #fff;box-shadow:0 0 0 1px #cbd5e1;cursor:pointer;padding:0;transition:transform .1s;}
  .sw:hover{transform:scale(1.12);}
  .sw.on{box-shadow:0 0 0 2px #0f172a;transform:scale(1.12);}
  .sw-custom{width:26px;height:26px;border:1px solid #cbd5e1;border-radius:7px;padding:1px;background:#fff;cursor:pointer;}
  .seg{display:flex;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;}
  .seg button{border:0;background:#fff;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:#475569;font-family:inherit;}
  .seg button.on{background:#0f172a;color:#fff;}
  .stage{padding:40px 24px 60px;}
  .cards{display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start;justify-content:center;}
  .slot{display:flex;flex-direction:column;align-items:center;gap:12px;}
  .slot .cap{font-size:12px;font-weight:700;color:#475569;}
</style></head>
<body>
  <div class="bar">
    <h1>Smart-Card Templates <small>pick a profile — each has its own templates; font &amp; colours update them live</small></h1>
    <div class="controls">
      <div class="ctrl"><label>Font</label><select id="font">${fontOpts}</select></div>
      <div class="ctrl"><label>Primary colour</label><div class="swatches" id="primarySw">${swatches(PRIMARIES, "primary")}<input type="color" class="sw-custom" id="primaryCustom" value="#be123c" /></div></div>
      <div class="ctrl"><label>Accent colour</label><div class="swatches" id="accentSw">${swatches(ACCENTS, "accent")}<input type="color" class="sw-custom" id="accentCustom" value="#e11d48" /></div></div>
      <div class="ctrl"><label>Profile</label><div class="seg" id="ptype"><button data-v="professional" class="on">Professional</button><button data-v="student">Student</button></div></div>
      <div class="ctrl"><label>Size</label><div class="seg" id="size"><button data-v="sm">SM</button><button data-v="md" class="on">MD</button><button data-v="lg">LG</button></div></div>
    </div>
  </div>
  <div class="stage" id="stage"></div>

  <script>${bundle}</script>
  <script>
    const SAMPLES = ${JSON.stringify(SAMPLES)};
    const state = { font: "Poppins", primary: "#be123c", accent: "#e11d48", ptype: "professional", size: "md" };
    const stage = document.getElementById("stage");

    function render(){
      const opts = { colors:{ primary: state.primary, accent: state.accent }, font: state.font, size: state.size, logo:{ text: "Your Brand" } };
      const p = SAMPLES[state.ptype];
      const pool = IVT.templatesFor(state.ptype); // only this audience's templates
      stage.innerHTML = '<div class="cards">' + pool.map(function(t){
        return '<div class="slot"><div class="cap">Template ' + t.id + ' · ' + t.name + '</div>' + IVT.renderCard(t.id, p, opts) + '</div>';
      }).join('') + '</div>';
    }

    function markOn(container, predicate){ [...container.children].forEach(el => el.classList && el.classList.toggle("on", predicate(el))); }

    document.getElementById("font").addEventListener("change", e => { state.font = e.target.value; render(); });

    function bindSwatches(id, key, customId){
      const box = document.getElementById(id);
      box.addEventListener("click", e => {
        const b = e.target.closest(".sw"); if(!b) return;
        state[key] = b.dataset.c;
        document.getElementById(customId).value = b.dataset.c;
        [...box.querySelectorAll(".sw")].forEach(s => s.classList.toggle("on", s === b));
        render();
      });
      document.getElementById(customId).addEventListener("input", e => {
        state[key] = e.target.value;
        [...box.querySelectorAll(".sw")].forEach(s => s.classList.remove("on"));
        render();
      });
    }
    bindSwatches("primarySw", "primary", "primaryCustom");
    bindSwatches("accentSw", "accent", "accentCustom");

    function bindSeg(id, key){
      const seg = document.getElementById(id);
      seg.addEventListener("click", e => {
        const b = e.target.closest("button"); if(!b) return;
        state[key] = b.dataset.v;
        markOn(seg, el => el === b);
        render();
      });
    }
    bindSeg("ptype", "ptype");
    bindSeg("size", "size");

    // mark default swatches active
    document.querySelector('#primarySw .sw[data-c="#be123c"]').classList.add("on");
    document.querySelector('#accentSw .sw[data-c="#e11d48"]').classList.add("on");
    render();
  </script>
</body></html>`;

const out = join(root, "playground.html");
writeFileSync(out, html, "utf8");
console.log("Wrote", out, "(" + Math.round(html.length / 1024) + " KB, self-contained)");

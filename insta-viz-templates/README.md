# @pxlbrain/insta-viz-templates

Insta VIZ smart-card templates — built by **PxlBrain** (pipeline Module 4, "Template").

Framework-agnostic: **call a template by number**, pass a profile + a theme, get back a
self-contained HTML string you can drop into any page (React, Vue, plain HTML — anything).

```
npm install @pxlbrain/insta-viz-templates
```

## Quick start

```js
import { renderCard } from "@pxlbrain/insta-viz-templates";

const html = renderCard(1, profile, {
  colors: { primary: "#6d28d9", accent: "#22c55e" },
  font: "Poppins",
  size: "md",
  logo: { url: "https://cdn.example.com/logo.png", position: "top-left" },
});

document.getElementById("card").innerHTML = html; // that's it
```

- `renderCard(1, …)` or `renderCard("wave", …)` — **Template 1 · Wave**
- `renderCard(2, …)` or `renderCard("split", …)` — **Template 2 · Split**

Both templates are **audience-aware**: pass `profileType: "student"` or `"professional"` in the
profile and the motifs + which sections appear adapt automatically. Every template accepts the
**same** theme options, so configurability is identical across the set.

```js
import { templates, templateCount } from "@pxlbrain/insta-viz-templates";
// templates → [{ id: 1, key: "wave", name, description }, { id: 2, key: "split", … }]
```

## The profile

Pass the Insta VIZ pipeline profile (Module 1 Extraction + Module 3 Enhancement). Every field is
optional — a template only renders the sections it has data for.

```ts
interface CardProfile {
  profileType?: "student" | "professional"; // default "professional"
  fullName?, designation?, email?, phone?, location?;
  bio?, summary?;          // bio (enhanced) preferred, falls back to summary
  photoUrl?;               // profile photo; falls back to initials
  skills?: string[];
  socialLinks?: { platform?, url? }[];
  website?;
  education?, certifications?;
  projects?, internships?;                 // student-leaning
  currentCompany?, totalYearsExperience?, experience?; // professional-leaning
}
```

## Theme options — one contract, all templates

| Option | What it does | Example |
|--------|--------------|---------|
| `colors` | Palette. Pass a hex string as shorthand for `{ primary }`. | `{ primary:"#6d28d9", accent:"#22c55e", background, surface, text, muted, onPrimary }` |
| `gradient` | Explicit header gradient `[from, to]` (else derived from `primary`). | `["#4f46e5","#312e81"]` |
| `font` | Font family. String = same for heading + body. | `"Poppins"` or `{ heading:"Poppins", body:"Inter" }` |
| `fontScale` | Scales **all** text + spacing (1 = default). | `1.1` |
| `size` | Card width: preset `"sm"`(320) `"md"`(380) `"lg"`(440) or a px number. | `"lg"` or `420` |
| `responsive` | `true` → fills its container up to `size`; `false` → fixed width. | `true` |
| `radius` | Corner radius (px). | `24` |
| `logo` | `{ url, text, position:"top-left"\|"top-right", height }`. | `{ url:"…", position:"top-left" }` |

### Configurability at a glance

| Requirement | Answer |
|--------------|--------|
| Colour / theme overrides, per render | ✅ `colors` + `gradient` per call. (Logo-derived palette: pass the extracted colours into `colors` — auto-extraction from a logo is a planned follow-up.) |
| Logo placement | ✅ `logo.url` + `logo.position` + `logo.height` |
| Typography override | ✅ `font` (heading/body) + `fontScale` |
| Fixed size vs adaptive | ✅ `size` (fixed) or `responsive:true` (adapts to container) |
| Equal configurability across templates | ✅ identical `ThemeOptions` for every template |
| Number of templates rendered | This package renders whichever number(s) you pass; the recommender decides how many |
| Template count | **2 today** (Wave, Split). More can be added as new numbers without breaking callers. |

## Live playground & preview

```
npm run playground   # builds a self-contained playground.html (open by double-click)
npm run preview      # builds a static preview.html (open by double-click)
npm run demo         # serves the sidebar demo at http://localhost:4477/demo/
```

`playground.html` puts a **font + colour toolbar on top of the cards** — pick a font, click a
colour swatch (or use the custom picker), toggle profile/size, and both templates re-render live.
It's fully self-contained (the compiled package is bundled and inlined), so it works offline with
no server.

## Notes

- **Self-contained output** — each card ships its own scoped `<style>`, so multiple cards with
  different themes coexist on one page. No global CSS to include.
- **Fonts** — the package sets the font *family*; the host page must have the font available
  (e.g. a Google Fonts `<link>`). The sandbox loads a few for preview.
- **Security** — all profile text is HTML-escaped and all URLs are scheme-checked
  (`javascript:` etc. are rejected) before rendering, since profile data originates from
  extracted résumés / crawled pages.

## Build

```
npm run build     # tsc → dist/ (ESM + .d.ts)
npm run dev       # watch mode
```

---
Private package — © PxlBrain. Not yet published to a registry.

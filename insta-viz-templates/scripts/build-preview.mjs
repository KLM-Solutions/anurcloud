/** Renders a static preview.html (no server needed) — open it directly in a browser. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderCard } from "../dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));

const pro = {
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
};

const student = {
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
};

const combos = [
  { cap: "Template 1 · Wave — Professional (default indigo)", n: 1, p: pro, o: { font: "Poppins", logo: { text: "Your Brand" } } },
  { cap: "Template 2 · Split — Professional (teal + orange)", n: 2, p: pro, o: { colors: { primary: "#0f766e", accent: "#f97316" }, font: "Montserrat", logo: { text: "Your Brand" } } },
  { cap: "Template 1 · Wave — Student (violet, larger scale)", n: 1, p: student, o: { colors: "#7c3aed", font: "Poppins", size: "lg", fontScale: 1.05, logo: { text: "Your Brand" } } },
  { cap: "Template 2 · Split — Student (rose)", n: 2, p: student, o: { colors: { primary: "#be123c", accent: "#e11d48" }, font: "Space Grotesk", logo: { text: "Your Brand" } } },
];

const cards = combos
  .map((c) => `<figure><figcaption>${c.cap}</figcaption>${renderCard(c.n, c.p, c.o)}</figure>`)
  .join("\n");

const doc = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Smart-Card Templates — Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
<style>
 body{margin:0;font-family:Inter,system-ui,sans-serif;background:#eef1f6;color:#0f172a;padding:32px;}
 h1{font-family:Poppins;font-size:20px;margin:0 0 4px;}
 p.sub{color:#64748b;margin:0 0 28px;font-size:13px;}
 .grid{display:flex;flex-wrap:wrap;gap:44px;align-items:flex-start;}
 figure{margin:0;display:flex;flex-direction:column;gap:10px;align-items:center;}
 figcaption{font-size:12px;font-weight:700;color:#475569;}
</style></head>
<body>
 <h1>Smart-Card Templates</h1>
 <p class="sub">Built by PxlBrain · same two templates (Wave &amp; Split), each rendered for a student and a professional with different colour / font / size options.</p>
 <div class="grid">${cards}</div>
</body></html>`;

const out = join(here, "..", "preview.html");
writeFileSync(out, doc, "utf8");
console.log("Wrote", out);

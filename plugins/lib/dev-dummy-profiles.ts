/**
 * DEV-ONLY dummy profiles for the card playground (`app/playground`).
 *
 * Rich, every-field-filled student and professional profiles so the playground
 * can toggle fields off (to see the missing-field look) and dial content up (to
 * see the heavy look). NOT used by any production path — only the playground
 * imports this. Safe to delete before handover if the playground is removed.
 *
 * Keys are the extraction snake_case shape (`full_name`, `social_links`, …) so
 * they feed `/api/template` exactly like a real extracted profile.
 */

export const DUMMY_STUDENT: Record<string, unknown> = {
  full_name: "Meera Nair",
  designation: "B.Tech Information Technology",
  email: "meera.nair@example.com",
  phone: "+91 90000 12345",
  location: "Kochi, Kerala",
  summary:
    "Final-year IT student who likes backend systems and platform reliability. I build small tools end to end and enjoy making infrastructure boring and dependable.",
  skills: [
    "Go", "Kubernetes", "SQL", "Terraform", "Linux", "Docker", "Python",
    "React", "PostgreSQL", "Redis", "Git", "CI/CD",
  ],
  languages: ["Malayalam", "English", "Hindi", "Tamil"],
  social_links: [
    { platform: "GitHub", url: "https://github.com/meeranair" },
    { platform: "LinkedIn", url: "https://linkedin.com/in/meeranair" },
    { platform: "X", url: "https://x.com/meeranair" },
    { platform: "WhatsApp", url: "https://wa.me/919000012345" },
    { platform: "Instagram", url: "https://instagram.com/meeranair" },
    { platform: "Portfolio", url: "https://meeranair.dev" },
    { platform: "LeetCode", url: "https://leetcode.com/meeranair" },
  ],
  education: [
    { degree: "B.Tech", field: "Information Technology", institution: "CUSAT", year: "2021–2025", grade: "9.1/10" },
    { degree: "Class XII", field: "Computer Science", institution: "Kendriya Vidyalaya", year: "2021", grade: "94%" },
    { degree: "Class X", field: null, institution: "Kendriya Vidyalaya", year: "2019", grade: "96%" },
  ],
  certifications: [
    { name: "Certified Kubernetes Administrator (CKA)", issuer: "CNCF", year: "2024" },
    { name: "AWS Cloud Practitioner", issuer: "AWS", year: "2024" },
    { name: "Google Data Analytics", issuer: "Google", year: "2023" },
    { name: "HashiCorp Terraform Associate", issuer: "HashiCorp", year: "2024" },
    { name: "MongoDB Developer", issuer: "MongoDB", year: "2023" },
  ],
  achievements: [
    { title: "Winner, Smart India Hackathon", year: "2024" },
    { title: "1st Prize, CUSAT TechFest Hack", year: "2023" },
    { title: "Top 10, Google Kick Start round", year: "2023" },
    { title: "Dean's List, all semesters", year: "2024" },
    { title: "Best Student Volunteer, FOSS Club", year: "2022" },
  ],
  projects: [
    { title: "Ledger", description: "Double-entry bookkeeping engine in Go with an append-only journal and SQLite storage.", technologies: ["Go", "SQLite"], link: "https://github.com/meeranair/ledger" },
    { title: "Kube-lite", description: "A teaching scheduler that shows how a control loop places pods across nodes.", technologies: ["Go", "Kubernetes"], link: "https://github.com/meeranair/kube-lite" },
    { title: "Campus Ride", description: "A ride-share board for hostel students with OTP login and live seats.", technologies: ["React", "Node", "PostgreSQL"], link: null },
    { title: "Paper Radar", description: "Weekly digest of new arXiv papers matched to your saved topics.", technologies: ["Python", "Redis"], link: "https://paperradar.dev" },
    { title: "Dorm Sensors", description: "IoT temperature + occupancy dashboard for the CS block.", technologies: ["MQTT", "Grafana"], link: null },
    { title: "Notes CLI", description: "A terminal notes app with full-text search and encryption at rest.", technologies: ["Rust"], link: null },
  ],
  internships: [
    { role: "SRE Intern", organization: "Freshworks", duration: "Jun–Aug 2024", description: "Cut alert noise by 40% by rewriting flappy Prometheus rules and adding SLO burn alerts." },
    { role: "Backend Intern", organization: "Zoho", duration: "Summer 2023", description: "Built an internal API gateway rate-limiter serving 2k rps." },
    { role: "Open-source Contributor", organization: "CNCF (LFX)", duration: "2023", description: "Added a retry backoff to a Kubernetes client library, merged upstream." },
  ],
  extracurriculars: [
    { activity: "FOSS Club", role: "President" },
    { activity: "College Football Team", role: "Goalkeeper" },
    { activity: "NSS Volunteer", role: "Member" },
    { activity: "TEDx CUSAT", role: "Tech Lead" },
  ],
  publications: [
    { title: "A Lightweight Scheduler for Teaching Kubernetes Internals", venue: "IEEE Student Symposium", year: "2024", link: "https://doi.org/10.0000/example" },
    { title: "Measuring Alert Fatigue in Small SRE Teams", venue: "arXiv preprint", year: "2024", link: null },
    { title: "Append-only Ledgers for Student Finance Apps", venue: "College Journal of CS", year: "2023", link: null },
  ],
};

export const DUMMY_PROFESSIONAL: Record<string, unknown> = {
  full_name: "Priya Menon",
  designation: "VP Engineering",
  email: "priya.menon@example.com",
  phone: "+91 90000 11111",
  location: "Chennai, Tamil Nadu",
  summary:
    "Platform engineering leader with a bias for boring infrastructure. Fifteen years turning fragile systems into ones on-call engineers can sleep through.",
  current_company: "Zoho",
  total_years_experience: "15 years",
  skills: [
    "Kubernetes", "Go", "Terraform", "PostgreSQL", "Linux", "AWS", "GCP",
    "Kafka", "Observability", "Python", "gRPC", "System Design",
  ],
  languages: ["Tamil", "English", "Hindi"],
  social_links: [
    { platform: "LinkedIn", url: "https://linkedin.com/in/priyamenon" },
    { platform: "GitHub", url: "https://github.com/priyamenon" },
    { platform: "X", url: "https://x.com/priyamenon" },
    { platform: "WhatsApp", url: "https://wa.me/919000000000" },
    { platform: "Facebook", url: "https://facebook.com/priyamenon" },
    { platform: "Instagram", url: "https://instagram.com/priyamenon" },
    { platform: "Portfolio", url: "https://priyamenon.dev" },
  ],
  education: [
    { degree: "M.S", field: "Computer Science", institution: "IIT Madras", year: "2008–2010", grade: "9.2/10" },
    { degree: "B.E", field: "Computer Science", institution: "Anna University", year: "2004–2008", grade: "8.6/10" },
  ],
  certifications: [
    { name: "Certified Kubernetes Administrator (CKA)", issuer: "CNCF", year: "2021" },
    { name: "AWS Solutions Architect – Professional", issuer: "AWS", year: "2022" },
    { name: "Google Professional Cloud Architect", issuer: "Google", year: "2023" },
    { name: "HashiCorp Terraform Associate", issuer: "HashiCorp", year: "2021" },
    { name: "Certified Scrum Master", issuer: "Scrum Alliance", year: "2016" },
  ],
  achievements: [
    { title: "Cut infra spend by a third with capacity planning", year: "2024" },
    { title: "Grew the platform team from 6 to 40 engineers", year: "2023" },
    { title: "Speaker, KubeCon India", year: "2024" },
    { title: "Patent: adaptive autoscaling method", year: "2022" },
    { title: "President's Award, Zoho", year: "2023" },
  ],
  experience: [
    { role: "VP Engineering", company: "Zoho", duration: "2021–present", location: "Chennai", highlights: ["Grew the platform team from 6 to 40 engineers.", "Cut infrastructure spend by a third with capacity planning.", "Set the multi-region reliability strategy for 12 products."] },
    { role: "Engineering Manager", company: "Freshworks", duration: "2017–2021", location: "Chennai", highlights: ["Led the migration to Kubernetes across twelve services.", "Built the on-call and incident-review culture from scratch."] },
    { role: "Staff Engineer", company: "Freshworks", duration: "2014–2017", location: "Chennai", highlights: ["Rebuilt the ingest path in Go, 5x throughput.", "Owned the observability stack."] },
    { role: "Senior Engineer", company: "Zoho", duration: "2012–2014", location: "Chennai", highlights: ["Sharded the PostgreSQL fleet with zero downtime."] },
    { role: "Software Engineer", company: "Zoho", duration: "2010–2012", location: "Chennai", highlights: ["Shipped the first version of the analytics pipeline."] },
    { role: "Intern", company: "CDAC", duration: "2009", location: "Chennai", highlights: ["Prototyped a parallel file-hashing tool."] },
  ],
  projects: [
    { title: "Internal PaaS", description: "Self-service deploy platform used by 40 teams; golden paths, guardrails and cost dashboards.", technologies: ["Go", "Kubernetes", "Terraform"], link: null },
    { title: "Chaos Harness", description: "Fault-injection framework wired into staging so failures are found before prod.", technologies: ["Go", "gRPC"], link: "https://github.com/priyamenon/chaos" },
    { title: "Cost Radar", description: "Per-team cloud spend attribution with weekly anomaly alerts.", technologies: ["Python", "BigQuery"], link: null },
    { title: "SLO Kit", description: "A drop-in library for SLOs and burn-rate alerts across services.", technologies: ["Go"], link: "https://github.com/priyamenon/slo-kit" },
    { title: "Migration Autopilot", description: "Tooling that moved 200+ services to Kubernetes with automated rollbacks.", technologies: ["Go", "Kubernetes"], link: null },
  ],
  portfolio_links: ["https://priyamenon.dev", "https://priyamenon.dev/talks", "https://priyamenon.dev/writing"],
  publications: [
    { title: "Adaptive Autoscaling Under Bursty B2C Load", venue: "USENIX SREcon", year: "2023", link: "https://doi.org/10.0000/example2" },
    { title: "The Economics of Boring Infrastructure", venue: "ACM Queue", year: "2022", link: null },
    { title: "Zero-downtime Postgres Sharding at Scale", venue: "VLDB Industry Track", year: "2019", link: null },
  ],
  registrations: [
    { type: "GST Consultant Registration", id: "GSTIN-29ABCDE1234F1Z5" },
    { type: "ISO 27001 Lead Auditor", id: "LA-2021-4471" },
  ],
};

export const DUMMY: Record<"student" | "professional", Record<string, unknown>> = {
  student: DUMMY_STUDENT,
  professional: DUMMY_PROFESSIONAL,
};

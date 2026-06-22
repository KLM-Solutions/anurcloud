import { NextResponse, type NextRequest } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { isProfileType } from "@/lib/validation";
import { schemaFieldKeys } from "@/lib/schema";
import { extractProfile } from "@/lib/llama";
import { fail, tokenMatches } from "@/lib/route-helpers";
import type { ExtractSuccess } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 800;

/**
 * Module 1 — URL extraction endpoint.
 *
 *   POST /api/extract-url
 *   Authorization: Bearer <auth_token>
 *   Content-Type: application/json
 *   Body: { url: string, profile_type: "student" | "professional" }
 *
 * Firecrawl renders the full page (JS included) and returns clean markdown,
 * which is then fed into the same LlamaExtract schema-driven pipeline as file uploads.
 */
export async function POST(request: NextRequest) {
  // 1. Auth
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return fail("UNAUTHORIZED", "Missing or malformed Authorization Bearer token.", 401);
  }
  if (!process.env.EXTRACT_AUTH_TOKEN) {
    return fail("AUTH_NOT_CONFIGURED", "Extraction auth is not configured.", 503);
  }
  if (!tokenMatches(token)) {
    return fail("UNAUTHORIZED", "Invalid authorization token.", 401);
  }

  // 2. Parse JSON body
  let body: { url?: unknown; profile_type?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_BODY", "Request body must be JSON.", 400);
  }

  const { url, profile_type: profileTypeRaw } = body;

  // 3. Validate URL
  if (!url || typeof url !== "string" || !url.trim()) {
    return fail("NO_URL", 'A "url" field is required.', 400);
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return fail("INVALID_URL", "The provided URL is not valid.", 400);
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return fail("INVALID_URL", "Only HTTP and HTTPS URLs are supported.", 400);
  }

  // 4. Validate profile_type
  if (!isProfileType(profileTypeRaw)) {
    return fail("INVALID_PROFILE_TYPE", '"profile_type" must be "student" or "professional".', 400);
  }

  // 5. No engine keys → stub response
  if (!process.env.LLAMA_CLOUD_API_KEY || !process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json({
      status: "received",
      message: "URL validated. Extraction engine or Firecrawl is not configured.",
      received: { url: url.trim(), profile_type: profileTypeRaw },
      schema_preview: { profile_type: profileTypeRaw, fields: schemaFieldKeys(profileTypeRaw) },
    });
  }

  // 6. Firecrawl — crawls up to 25 pages, returning markdown + all hrefs per page
  let pageText: string;
  try {
    const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
    const job = await firecrawl.crawl(url.trim(), {
      limit: 25,
      scrapeOptions: { formats: ["markdown", "links"] },
    });

    const pages = Array.isArray(job.data) ? job.data : [];
    const pageUrls = pages.map((doc) => doc.metadata?.url ?? "unknown");
    console.log(`[extract-url] pages crawled (${pageUrls.length}):`, pageUrls);

    const sections: string[] = [];
    for (const doc of pages) {
      const md = doc.markdown?.trim();
      if (!md) continue;

      // Append all hrefs found on this page as a plain list so LlamaExtract
      // can see embedded link URLs that aren't visible in the markdown text.
      const hrefs = (doc.links ?? []).filter((l): l is string => typeof l === "string" && l.startsWith("http"));
      const linkBlock = hrefs.length > 0 ? `\nLinks found on this page:\n${hrefs.join("\n")}` : "";

      sections.push(md + linkBlock);
    }

    if (sections.length === 0) {
      return fail("FETCH_FAILED", "Firecrawl could not retrieve readable content from this site.", 422);
    }
    pageText = sections.join("\n\n---\n\n");
  } catch (err) {
    console.error("[extract-url] firecrawl error:", err);
    return fail("FETCH_FAILED", "Could not retrieve content from the provided URL.", 422);
  }

  // 7. Wrap markdown in a virtual file and run the extraction pipeline.
  // Use text/plain + .txt: LlamaCloud's extract purpose accepts plain-text files
  // but not text/markdown, so this avoids an opaque engine rejection after a
  // full Firecrawl crawl has already been paid for.
  const slug = parsedUrl.hostname.replace(/[^a-z0-9]/gi, "-").slice(0, 40);
  const mdFile = new File([pageText], `${slug}.txt`, { type: "text/plain" });

  try {
    const result = await extractProfile(mdFile, profileTypeRaw);

    // Ensure the submitted URL appears in portfolio_links (professional)
    // or as a Portfolio entry in social_links (student).
    const submittedUrl = url.trim();
    const data = result.data as unknown as Record<string, unknown>;
    if (profileTypeRaw === "professional") {
      const existing = Array.isArray(data.portfolio_links) ? (data.portfolio_links as string[]) : [];
      if (!existing.includes(submittedUrl)) {
        data.portfolio_links = [submittedUrl, ...existing];
      }
    } else if (profileTypeRaw === "student") {
      const existing = Array.isArray(data.social_links)
        ? (data.social_links as { platform: string; url: string | null }[])
        : [];
      const alreadyPresent = existing.some((l) => l.url === submittedUrl);
      if (!alreadyPresent) {
        data.social_links = [{ platform: "Portfolio", url: submittedUrl }, ...existing];
      }
    }

    return NextResponse.json({
      status: "success",
      profile_type: profileTypeRaw,
      data: result.data,
      confidence_scores: result.confidence_scores,
      flagged_fields: result.flagged_fields,
    } satisfies ExtractSuccess);
  } catch (err) {
    console.error("[extract-url] engine error:", err);
    return fail("EXTRACTION_FAILED", "The extraction engine could not process this request.", 502);
  }
}

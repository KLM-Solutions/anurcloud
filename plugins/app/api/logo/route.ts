import { type NextRequest } from "next/server";
import { fetchImage } from "@/lib/brand";

export const runtime = "nodejs";

/**
 * Logo image proxy.
 *
 *   GET /api/logo?src=<absolute image url>
 *
 * Why this exists: a logo URL we discover on someone else's site is not always
 * loadable by a browser. tcs.com returns **403** to a direct image request
 * (hotlink protection), so an `<img>` pointing straight at it renders broken.
 * Fetching it server-side and re-serving it from our own origin sidesteps
 * hotlink protection, referrer policy and mixed-content blocking in one go.
 *
 * AnurCloud will need the same thing, and more: they should copy a user's logo
 * into their own storage at profile-setup time rather than hotlinking it forever,
 * otherwise cards silently break when the client redesigns their site.
 *
 * Deliberately NOT behind the Bearer token — an `<img src>` cannot send headers.
 * It is constrained instead, which is what keeps it from being an open proxy:
 *   - `fetchImage()` enforces https-only, resolves every redirect hop and refuses
 *     any that lands on a private/loopback/link-local/metadata address (SSRF),
 *     caps the body at 2 MB while reading it, and times out at 8s.
 *   - the response is only served when the fetched bytes really are an image;
 *     anything else is refused, so this cannot relay arbitrary content.
 */

/** Sniff the real type from magic bytes — never trust the upstream header alone. */
function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return "image/webp";
  }
  // SVG is text: look for an <svg root inside the first chunk, skipping any
  // XML prolog, BOM or leading comments.
  const head = buf.subarray(0, 512).toString("utf8").trimStart();
  if (/<svg[\s>]/i.test(head) || head.startsWith("<?xml")) {
    return /<svg[\s>]/i.test(buf.subarray(0, 4096).toString("utf8")) ? "image/svg+xml" : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return new Response("Missing ?src", { status: 400 });
  }

  let buf: Buffer;
  try {
    buf = await fetchImage(src);
  } catch (err) {
    console.warn("[logo] fetch refused:", err instanceof Error ? err.message : err);
    // One status for every refusal — a distinct code per reason would let a caller
    // probe our network by watching which URLs fail differently.
    return new Response("Could not fetch that image", { status: 502 });
  }

  const type = sniffImageType(buf);
  if (!type) {
    return new Response("Not an image", { status: 415 });
  }

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(buf.byteLength),
      // Logos are effectively static; cache hard so a re-render costs nothing.
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      // SVG is executable in a document context. Never let it be treated as one.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

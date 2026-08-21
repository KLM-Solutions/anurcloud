/**
 * Shared card CSS, scoped per render.
 *
 * Only the primitives every card uses live here — typography, avatar, chips,
 * contact rows, list items, section headings, timeline rows. Layout-specific
 * rules (the rail, the grid, the hero band) belong in each card file so one
 * card can never quietly restyle another.
 *
 * Sizes are in `em` so `fontScale` scales the whole card, not just text.
 */

export function cardStyles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
/* container-type lets a card react to ITS OWN width in responsive mode, rather
   than the viewport — the card may be dropped into any column. */
/* The card must read as a card on ANY surface it is dropped onto.
   A white card body on a white host page has no visible edge at all — the
   right-hand side simply stops (client feedback, 11 Aug 2026). The border is a
   real 1px line rather than only a shadow, because shadows are dropped by most
   print paths and the card has to survive being turned into a PDF. */
/* overflow-wrap:anywhere is inherited by everything on the card, and it is load
   bearing rather than tidy-up. Card columns are narrow and the content is
   extracted from documents we do not control: a 45-character institution, an
   email at a long domain, a name run together by bad OCR. Without a break
   opportunity those escape their column and get clipped at the card's edge
   mid-word. The value is anywhere and NOT break-word, because only anywhere
   shrinks the min-content size — and a flex or grid child will not narrow past
   min-content no matter what max-width says, which is why several cards blew open
   at 320px. It never breaks a word that fits; prose still wraps at spaces.
   (No backticks in this block — it is inside a template literal.) */
${s}{box-sizing:border-box;position:relative;overflow:hidden;container-type:inline-size;background:var(--iv-bg);color:var(--iv-text);font-family:var(--iv-font-b);border-radius:var(--iv-radius);line-height:1.45;overflow-wrap:anywhere;-webkit-font-smoothing:antialiased;border:1px solid var(--iv-edge);box-shadow:0 1px 2px rgba(15,23,42,.05),0 10px 28px -14px rgba(15,23,42,.16)}
${s} *,${s} *::before,${s} *::after{box-sizing:border-box;margin:0;padding:0}
${s} a{color:inherit;text-decoration:none}
${s} a:hover{text-decoration:underline}
${s} img{max-width:100%;display:block}

/* Pagination (pagination.ts). A page is a MIN-height frame, never a hard clip:
   if a line estimate is slightly off the page just runs a touch longer, so
   content is never hidden. Pages 2+ are marked with a hairline and carry a slim
   repeated header instead of the full identity chrome.
   (No backticks in this block — it is inside a template literal.) */
${s}{--iv-page-h:537px}
${s} .iv-page{position:relative;display:flow-root}
${s} .iv-page--filled{min-height:var(--iv-page-h)}
/* Continuation pages (2+) carry no page-1 chrome/wrapper, so cards that put their
   padding on an inner wrapper would leave these pages unpadded — content touching
   the card edge. This default pads every continuation page; a card may override it
   for a tighter layout (e.g. Tile Grid). */
${s} .iv-page-cont{border-top:1px dashed var(--iv-edge);padding:1.1em}
${s} .iv-page-slim{font-family:var(--iv-font-h);font-weight:700;font-size:.8em;color:var(--iv-muted);padding-bottom:.5em;margin-bottom:.5em;border-bottom:1px solid var(--iv-edge)}
/* Page number sits in normal flow, right-aligned, AFTER the content — never
   absolutely over it, or a short final page paints the number on top of the last
   line (contact row). A small muted caption that always clears the text. The
   right/bottom padding insets it on page 1, where it is a sibling of the card's
   own padded wrapper rather than inside a padded continuation page. */
${s} .iv-page-num{display:block;text-align:right;font-size:.6em;color:var(--iv-muted);opacity:.7;margin-top:.7em;padding:0 1.1em .5em 0}
${s} .iv-page-cont .iv-page-num{padding-right:0}

${s} .iv-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.25em;line-height:1.2;letter-spacing:-.01em}
${s} .iv-role{font-size:.8em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-bio{font-size:.8em;color:var(--iv-text);opacity:.85;margin-top:.5em}
${s} .iv-sec-h{font-family:var(--iv-font-h);font-size:.65em;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--iv-primary);margin:1em 0 .45em}

${s} .iv-av{width:4.5em;height:4.5em;border-radius:50%;overflow:hidden;flex:0 0 auto;background:var(--iv-surface)}
${s} .iv-av img{width:100%;height:100%;object-fit:cover}
${s} .iv-av-fallback{display:flex;align-items:center;justify-content:center;background:var(--iv-grad);color:var(--iv-onp);font-family:var(--iv-font-h);font-weight:700;font-size:1em}
${s} .iv-av-fallback span{font-size:1.35em;letter-spacing:.02em}
/* A logo dropped into the circle fills it like a photo (owner's call: cover, not
   contain) — the shared iv-av img cover rule above already does the cropping.
   (No backticks in this block — it is inside a template literal.) */

${s} .iv-crow{display:flex;gap:.5em;align-items:baseline;font-size:.75em;padding:.2em 0}
${s} .iv-clabel{flex:0 0 4.2em;color:var(--iv-muted);font-size:.85em;text-transform:uppercase;letter-spacing:.05em}
${s} .iv-cval{flex:1 1 auto;min-width:0;overflow-wrap:anywhere}
${s} .iv-cinline{font-size:.72em;color:var(--iv-muted);overflow-wrap:anywhere}

${s} .iv-chips{display:flex;flex-wrap:wrap;gap:.3em;min-width:0}
/* This used to be white-space:nowrap, which was the single worst layout bug in the
   set: a skill with no space in it — and extraction produces them, from a mangled
   bullet or a run-together tag — made the chip as wide as the text and pushed it
   up to 230px outside the card. Measured across all 20 cards by check:overflow.
   Now: normal wrapping, so a two-word skill still sits on one line whenever it
   fits, and max-width plus anywhere-breaking mean a monster breaks inside the chip
   instead of escaping it. See the note on the card root for why the value has to
   be anywhere rather than break-word.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-chip{font-size:.68em;padding:.25em .6em;border-radius:999px;background:color-mix(in srgb,var(--iv-primary) 12%,transparent);color:var(--iv-primary);max-width:100%;min-width:0;white-space:normal;overflow-wrap:anywhere}

${s} .iv-socials{display:flex;gap:.35em;flex-wrap:wrap;min-width:0;max-width:100%}
/* overflow:hidden is a GUARANTEE, not a layout choice. The circle is a fixed size
   and the label is centred in it, so a label one character too long paints itself
   outside the disc — "www" did exactly that (reported 11 Aug 2026, measured at
   25.6px of text inside a 16.9px circle). The label list in sections.ts is capped
   at two characters, and this makes a future mistake clip instead of escape.
   The font family is a caller-supplied theme option too, so the width of two
   characters is not fully ours to predict.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-si{width:1.7em;height:1.7em;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:.62em;font-weight:700;line-height:1;text-decoration:none;overflow:hidden;flex:0 0 auto}
${s} .iv-si:hover{text-decoration:none;opacity:.88}
${s} .iv-si-svg{width:58%;height:58%;display:block}
/* Hero variant — a bit bigger, for the identity/header area. */
${s} .iv-social-lg{gap:.45em}
${s} .iv-social-lg .iv-si{width:2.1em;height:2.1em;font-size:.72em}

/* Accordion — tap-to-expand section rows (used by the React cards' body). */
${s} .iv-acc-row{border-top:1px solid var(--iv-edge)}
${s} .iv-acc-row:first-child{border-top:0}
${s} .iv-acc-head{display:flex;align-items:center;justify-content:space-between;gap:.6em;width:100%;padding:.85em 0;border:0;background:none;font:inherit;color:inherit;cursor:pointer;text-align:left}
${s} .iv-acc-label{font-family:var(--iv-font-h);font-weight:700;font-size:.7em;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-text)}
${s} .iv-acc-open .iv-acc-label{color:var(--iv-primary)}
${s} .iv-acc-chev{font-size:.7em;color:var(--iv-muted);flex:0 0 auto;transition:transform .15s}
${s} .iv-acc-open .iv-acc-chev{color:var(--iv-primary)}
${s} .iv-acc-body{padding:0 0 .95em}
${s} .iv-acc-body .iv-item:first-child{padding-top:0}

${s} .iv-item{padding:.3em 0}
${s} .iv-item+.iv-item{border-top:1px solid color-mix(in srgb,var(--iv-muted) 18%,transparent)}
${s} .iv-item-t{font-size:.8em;font-weight:600;line-height:1.3}
${s} .iv-item-m{font-size:.7em;color:var(--iv-muted);margin-top:.1em}
${s} .iv-item-d{font-size:.72em;opacity:.85;margin-top:.15em}

/* Highlight bullets under a role (professional set). The marker is drawn with a
   pseudo-element rather than list-style so it can take the brand colour and sit
   on the first line's optical centre regardless of font size. */
${s} .iv-hl{list-style:none;margin-top:.25em}
${s} .iv-hl li{position:relative;padding-left:.85em;font-size:.72em;line-height:1.4;opacity:.9}
${s} .iv-hl li+li{margin-top:.2em}
${s} .iv-hl li::before{content:"";position:absolute;left:.15em;top:.52em;width:.28em;height:.28em;border-radius:50%;background:var(--iv-primary)}

${s} .iv-tl-row{position:relative;padding:0 0 .9em 1.5em}
${s} .iv-tl-row::before{content:"";position:absolute;left:.33em;top:.45em;bottom:-.45em;width:1px;background:color-mix(in srgb,var(--iv-primary) 30%,transparent)}
${s} .iv-tl-row:last-child::before{display:none}
${s} .iv-tl-dot{position:absolute;left:0;top:.3em;width:.7em;height:.7em;border-radius:50%;background:var(--iv-primary)}
${s} .iv-tl-d{font-size:.65em;font-weight:700;color:var(--iv-primary);letter-spacing:.04em}
${s} .iv-tl-body{min-width:0}

@media (prefers-reduced-motion:no-preference){${s} .iv-si{transition:opacity .15s ease}}

/* ── print ─────────────────────────────────────────────────────────────────
   A card is a thing people save and send, so a PDF is a real output, not an
   afterthought. Two things go wrong without this block, both found by actually
   printing the set rather than by reasoning about it:

   1. THE CARD GETS SLICED. A card taller than the remaining space on the page is
      broken across the page boundary — Split Halves came out with its top half on
      page 1 and its bottom half on page 2. break-inside:avoid moves the whole
      card to the next page instead. The legacy page-break-inside is kept beside
      it because Safari still wants that spelling.

   2. THE COLOUR VANISHES. Browsers treat backgrounds as ink to be saved: the
      print dialog has a "Background graphics" checkbox, and with it off every
      band, rail and chip on these cards prints white — on Split Halves that
      means white text on white paper. print-color-adjust:exact tells the browser
      these fills carry meaning and must not be dropped. Both spellings are
      needed; the prefixed one is what Safari and older Chrome read.

   Shadows are dropped on purpose. They cost ink, print as muddy grey, and the
   real 1px border is what carries the card's edge on paper anyway. */
@media print{
  ${s}{break-inside:avoid;page-break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact;box-shadow:none}
  ${s} .iv-si{box-shadow:none}
}
</style>`;
}

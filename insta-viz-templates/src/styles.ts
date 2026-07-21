/**
 * Scoped stylesheet for a single card. Everything is scoped under `.${scopeId}`
 * so multiple cards with different themes can coexist on one page. Colours, fonts,
 * radius come from CSS custom properties set on the root (see resolveTheme).
 * Text sizes use `em` so the root `font-size` (fontScale) scales the whole card.
 */
export function cardStyles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}{box-sizing:border-box;position:relative;overflow:hidden;background:var(--iv-bg);border-radius:var(--iv-radius);
  container-type:inline-size;
  font-family:var(--iv-font-b);color:var(--iv-text);line-height:1.4;
  box-shadow:0 10px 30px -12px rgba(15,23,42,.35),0 2px 6px rgba(15,23,42,.06);}
${s} *{box-sizing:border-box;}
${s} a{text-decoration:none;color:inherit;}

/* header */
${s} .iv-head{position:relative;background:var(--iv-grad);color:var(--iv-onp);padding:1em 1.15em 1.15em;overflow:hidden;}
${s} .iv-head-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:.5em;margin-bottom:1em;}
${s} .iv-logo-img{display:block;object-fit:contain;}
${s} .iv-logo-txt{font-family:var(--iv-font-h);font-weight:800;font-size:.9em;letter-spacing:.2px;}
${s} .iv-logo-empty{opacity:.7;font-weight:600;}
${s} .iv-head-main{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:.75em;}
${s} .iv-name{font-family:var(--iv-font-h);font-weight:800;font-size:1.45em;line-height:1.1;margin:0;}
${s} .iv-desig{font-size:.82em;font-weight:500;opacity:.92;margin-top:.25em;}
${s} .iv-sub{font-size:.72em;opacity:.8;margin-top:.15em;}

/* avatar */
${s} .iv-av{width:4.6em;height:4.6em;border-radius:1em;overflow:hidden;flex:none;border:3px solid rgba(255,255,255,.85);background:rgba(255,255,255,.15);
  display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.18);}
${s} .iv-av img{width:100%;height:100%;object-fit:cover;display:block;}
${s} .iv-av-fallback span{font-family:var(--iv-font-h);font-weight:800;font-size:1.4em;color:var(--iv-onp);}

/* wave divider */
${s} .iv-wave{display:block;width:100%;height:1.1em;margin-top:1em;margin-bottom:-1px;position:relative;z-index:1;}

/* body */
${s} .iv-body{background:var(--iv-bg);padding:1.05em 1.15em 1.2em;display:flex;flex-direction:column;gap:.85em;}
${s} .iv-bio{font-size:.8em;color:var(--iv-muted);line-height:1.55;margin:0;}

/* contact */
${s} .iv-contact{background:var(--iv-surface);border:1px solid rgba(15,23,42,.07);border-radius:.85em;padding:.85em .95em;box-shadow:0 1px 2px rgba(15,23,42,.04);}
${s} .iv-ctitle{font-family:var(--iv-font-h);font-weight:700;font-size:.7em;text-transform:uppercase;letter-spacing:.6px;color:var(--iv-muted);margin-bottom:.6em;}
${s} .iv-crow{display:flex;justify-content:space-between;gap:.6em;padding:.28em 0;border-top:1px dashed rgba(15,23,42,.08);}
${s} .iv-crow:first-of-type{border-top:0;}
${s} .iv-clabel{font-size:.74em;color:var(--iv-muted);font-weight:500;}
${s} .iv-cval{font-size:.76em;font-weight:600;text-align:right;word-break:break-word;}

/* chips */
${s} .iv-chips{display:flex;flex-wrap:wrap;gap:.35em;}
${s} .iv-chip{font-size:.68em;font-weight:600;color:var(--iv-primary-dark);background:color-mix(in srgb,var(--iv-primary) 12%,#fff);
  border:1px solid color-mix(in srgb,var(--iv-primary) 22%,#fff);padding:.28em .6em;border-radius:999px;}

/* social */
${s} .iv-social{display:flex;align-items:center;justify-content:space-between;gap:.5em;}
${s} .iv-scount{display:flex;flex-direction:column;}
${s} .iv-scount b{font-family:var(--iv-font-h);font-size:1em;font-weight:800;line-height:1;}
${s} .iv-scount span{font-size:.66em;color:var(--iv-muted);}
${s} .iv-si{display:flex;align-items:center;justify-content:center;width:2em;height:2em;border-radius:.55em;color:#fff;font-size:.68em;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.15);}
${s} .iv-sirow{display:flex;gap:.4em;}

/* CTA buttons */
${s} .iv-cta{display:flex;gap:.5em;}
${s} .iv-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:.35em;font-size:.76em;font-weight:700;color:#fff;
  padding:.65em .5em;border-radius:.7em;box-shadow:0 3px 8px rgba(0,0,0,.12);}
${s} .iv-btn-accent{background:var(--iv-accent);}
${s} .iv-btn-wa{background:#22C55E;}

/* sections (education / experience / projects) */
${s} .iv-sec{display:flex;flex-direction:column;gap:.5em;}
${s} .iv-sec-title{font-family:var(--iv-font-h);font-weight:700;font-size:.72em;text-transform:uppercase;letter-spacing:.6px;color:var(--iv-muted);}
${s} .iv-item{border-left:2px solid color-mix(in srgb,var(--iv-primary) 45%,#fff);padding-left:.7em;}
${s} .iv-item-h{font-family:var(--iv-font-h);font-weight:700;font-size:.82em;}
${s} .iv-item-sub{font-size:.72em;color:var(--iv-primary-dark);font-weight:600;}
${s} .iv-item-meta{font-size:.68em;color:var(--iv-muted);}
${s} .iv-item-desc{font-size:.72em;color:var(--iv-muted);line-height:1.45;margin-top:.15em;}

/* ── SPLIT layout ── */
${s}.iv-split .iv-split-head{display:flex;position:relative;}
${s}.iv-split .iv-split-left{position:relative;overflow:hidden;background:var(--iv-grad);color:var(--iv-onp);
  width:38%;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6em;padding:1.1em .6em;}
${s}.iv-split .iv-split-right{flex:1;padding:1.1em 1.1em;display:flex;flex-direction:column;gap:.3em;}
${s}.iv-split .iv-split-right .iv-name{color:var(--iv-text);}
${s}.iv-split .iv-split-right .iv-desig{color:var(--iv-primary-dark);opacity:1;}
${s}.iv-split .iv-split-right .iv-logo-txt{color:var(--iv-primary-dark);}
${s}.iv-split .iv-tags{display:flex;flex-wrap:wrap;gap:.35em;margin-top:.5em;}
${s}.iv-split .iv-tag{font-size:.66em;font-weight:700;color:#fff;background:var(--iv-accent);padding:.3em .6em;border-radius:.5em;}
${s}.iv-split .iv-tag-alt{background:#475569;}

/* credential pill (audience differentiator) */
${s} .iv-cred{display:inline-flex;align-items:center;gap:.3em;font-size:.66em;font-weight:700;
  background:color-mix(in srgb,var(--iv-primary) 12%,#fff);color:var(--iv-primary-dark);
  border:1px solid color-mix(in srgb,var(--iv-primary) 25%,#fff);padding:.32em .68em;border-radius:999px;}
${s} .iv-head .iv-cred{background:rgba(255,255,255,.2);color:var(--iv-onp);border-color:rgba(255,255,255,.3);}
${s} .iv-credrow{margin-top:.5em;}

/* ── ACADEMIC layout ── */
${s} .iv-acad-main{position:relative;z-index:1;display:flex;align-items:center;gap:.9em;}
${s}.iv-acad .iv-av{width:4.1em;height:4.1em;}
${s}.iv-acad .iv-name{font-size:1.3em;}

/* professional stat tiles (audience differentiator) */
${s} .iv-stats{display:flex;gap:.5em;}
${s} .iv-stat{flex:1;background:color-mix(in srgb,var(--iv-primary) 8%,#fff);border:1px solid color-mix(in srgb,var(--iv-primary) 18%,#fff);border-radius:.7em;padding:.55em .65em;}
${s} .iv-stat-v{font-family:var(--iv-font-h);font-weight:800;font-size:.9em;color:var(--iv-primary-dark);line-height:1.1;}
${s} .iv-stat-l{font-size:.6em;text-transform:uppercase;letter-spacing:.5px;color:var(--iv-muted);margin-top:.2em;font-weight:700;}

/* ── EDITORIAL layout (template 4) ── */
${s}.iv-ed{background:var(--iv-surface);}
${s} .iv-ed-body{padding:1.4em 1.35em 1.4em;display:flex;flex-direction:column;gap:.9em;}
${s} .iv-ed-top{display:flex;align-items:center;justify-content:space-between;gap:.8em;}
${s}.iv-ed .iv-logo-txt{color:var(--iv-primary-dark);font-size:.72em;text-transform:uppercase;letter-spacing:1.6px;}
${s}.iv-ed .iv-av{width:3.1em;height:3.1em;border-radius:.75em;border:0;box-shadow:none;}
${s}.iv-ed .iv-av-fallback{background:color-mix(in srgb,var(--iv-primary) 12%,#fff);}
${s}.iv-ed .iv-av-fallback span{color:var(--iv-primary-dark);}
${s} .iv-ed-name{font-family:var(--iv-font-h);font-weight:800;font-size:1.75em;line-height:1.06;letter-spacing:-.01em;color:var(--iv-text);margin-top:.15em;}
${s} .iv-ed-desig{font-size:.9em;font-weight:600;color:var(--iv-primary-dark);margin-top:.15em;}
${s} .iv-ed-meta{margin-top:.15em;}
${s} .iv-ed-rule{height:2px;background:var(--iv-text);opacity:.14;}
${s}.iv-ed .iv-contact{border:0;box-shadow:none;padding:0;background:transparent;}
${s}.iv-ed .iv-ctitle{margin-bottom:.4em;}
${s}.iv-ed .iv-chip{background:transparent;border-color:color-mix(in srgb,var(--iv-primary) 30%,#fff);}
${s}.iv-ed .iv-si{background:transparent !important;color:var(--iv-text);border:1px solid rgba(15,23,42,.18);box-shadow:none;}
${s}.iv-ed .iv-stat{background:transparent;}
${s}.iv-ed .iv-btn{box-shadow:none;}
${s}.iv-ed .iv-btn-wa{background:transparent;color:#16a34a;border:1px solid #16a34a;}

/* ── AUDIENCE differentiation: students get circular avatars, professionals stay squared ── */
${s}.iv-aud-stu .iv-av{border-radius:50% !important;}

/* responsive: small containers stack the split header */
@container (max-width: 300px){ ${s}.iv-split .iv-split-head{flex-direction:column;} ${s}.iv-split .iv-split-left{width:100%;} }
</style>`;
}

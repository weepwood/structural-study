/**
 * Design token pipeline — the single implementation of token generation.
 *
 * design-system/tokens.json is the ONLY source of truth. This module turns it
 * into (a) a standalone tokens.css and (b) the generated blocks inside the
 * zero-dependency design-system/index.html. verify.mjs imports the same
 * functions to prove that committed artifacts never drift from the source.
 *
 * Zero dependencies: Node built-ins only.
 */
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
export const TOKENS_PATH = new URL('design-system/tokens.json', ROOT);
export const CSS_PATH = new URL('design-system/tokens.css', ROOT);
export const PAGE_PATH = new URL('design-system/index.html', ROOT);

export const CSS_BEGIN = '/* BEGIN GENERATED CSS */';
export const CSS_END = '/* END GENERATED CSS */';
export const DATA_BEGIN = '/* BEGIN GENERATED DATA */';
export const DATA_END = '/* END GENERATED DATA */';

export function readTokens() {
  return JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
}

const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Number → CSS value with a unit; strings pass through only when they look like CSS. */
function cssValue(value, unit) {
  if (typeof value === 'number') return `${value}${unit}`;
  if (typeof value === 'string' && /^-?[\d.]+(px|em|rem|s|ms|%)$/.test(value)) return value;
  return null;
}

function declarations(src, prefix, unit = '', transform = (k) => k) {
  const out = [];
  for (const [key, value] of Object.entries(src)) {
    if (Array.isArray(value) || value === null || typeof value === 'object') continue;
    const v = cssValue(value, unit);
    if (v !== null) out.push(`  --${prefix}${transform(key)}: ${v};`);
  }
  return out;
}

/** Produce the complete standalone stylesheet (also injected verbatim into the page). */
export function buildCss(t = readTokens()) {
  const L = [];
  L.push(`/* Orthographic Blueprint Design System — v${t.$meta.version} ${t.$meta.revision} */`);
  L.push('/* Generated from design-system/tokens.json by scripts/build-tokens.mjs — DO NOT EDIT. */');
  L.push('/* Three themes share identical structure; only color tokens change. */');
  L.push('');

  for (const [key, theme] of Object.entries(t.themes)) {
    const selector = key === 'paper' ? ':root, [data-theme="paper"]' : `[data-theme="${key}"]`;
    L.push(`/* ${theme.label} — ${theme.cn} */`);
    L.push(`${selector} {`);
    for (const [name, value] of Object.entries(theme)) {
      if (typeof value !== 'string' || !/^#|rgba?\(/.test(value)) continue;
      L.push(`  --${name}: ${value};`);
    }
    L.push('}');
    L.push('');
  }

  L.push('/* Theme-independent primitives (Canvas values mirrored for CSS consumers) */');
  L.push(':root {');
  L.push(`  --font-mono: ${t.typography.family};`);
  L.push('');
  L.push('  /* type scale */');
  L.push(...declarations(t.typography.scale, 'fs-', 'px', kebab));
  L.push('  /* tracking — canvas* values are px equivalents of the Canvas sp parameter */');
  L.push(...declarations(t.typography.tracking, 'track-', 'px', kebab));
  L.push('  /* weight */');
  L.push(...declarations(t.typography.weight, 'fw-'));
  L.push('  /* linework */');
  for (const s of t.linework.strokes) {
    L.push(`  --lw-${kebab(s.id)}: ${s.width};`);
    if (s.dash && s.dash.length) L.push(`  --dash-${kebab(s.id)}: ${s.dash.join(', ')};`);
  }
  L.push('  /* space */');
  const space = { ...t.space };
  delete space.dprMax; // DPR is a unitless multiplier, not a length
  L.push(...declarations(space, 'sp-', 'px', kebab));
  L.push(`  --sp-dpr-max: ${t.space.dprMax};`);
  L.push('  /* breakpoints */');
  L.push(`  --bp-mobile: ${t.breakpoints.mobile}px;`);
  L.push(`  --bp-doc: ${t.breakpoints.doc}px;`);
  L.push('  /* motion */');
  for (const [key, value] of Object.entries(t.motion)) {
    if (key === 'panelTransition') continue;
    if (key === 'introMs') { L.push(`  --mo-intro-ms: ${value}ms;`); continue; }
    if (typeof value === 'number') L.push(`  --mo-${kebab(key)}: ${value};`);
    else if (/^[\d.]+s$/.test(value)) L.push(`  --mo-${kebab(key)}: ${value};`);
  }
  L.push(`  --mo-panel-transition: ${t.motion.panelTransition};`);
  L.push('}');
  L.push('');
  return L.join('\n');
}

/** Produce the JS constant injected into the design-system page. */
export function buildData(t = readTokens()) {
  const safe = JSON.stringify(t, null, 2).replace(/<\//g, '<\\/');
  return `const TOKENS = ${safe};`;
}

export function extractBlock(text, begin, end) {
  const i = text.indexOf(begin);
  const j = text.indexOf(end, i + begin.length);
  if (i < 0 || j < 0) throw new Error(`Generated block ${begin} … ${end} not found`);
  return text.slice(i + begin.length, j).trim();
}

/** Replace the content between two marker comments, preserving everything else. */
export function injectBlock(text, begin, end, content) {
  const i = text.indexOf(begin);
  const j = text.indexOf(end, i + begin.length);
  if (i < 0 || j < 0) throw new Error(`Generated block ${begin} … ${end} not found`);
  return text.slice(0, i + begin.length) + '\n' + content.trim() + '\n' + text.slice(j);
}

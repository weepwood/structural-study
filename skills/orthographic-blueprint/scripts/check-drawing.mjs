#!/usr/bin/env node
/**
 * Validate a single-file orthographic drawing. Zero dependencies.
 * Usage: node check-drawing.mjs [path/to/drawing.html]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const file = resolve(process.cwd(), process.argv[2] || './drawing.html');
let html;
try { html = readFileSync(file, 'utf8'); }
catch (err) { console.error('Cannot read ' + file + ': ' + err.message); process.exit(1); }

const results = [];
const check = (name, pass, detail = '') => results.push({ name, pass, detail });

// 1. Single-file, zero-dependency contract
const scripts = html.match(/<script\b/g) || [];
check('exactly one inline <script>', scripts.length === 1, `found ${scripts.length}`);
check('no external stylesheet', !/<link[^>]+rel=["']stylesheet/i.test(html));
const external = html.match(/(?:src|href)=["'](?:https?:)?\/\/[^"']+/gi) || [];
check('zero external resources', external.length === 0, external.join(', '));
check('no img/iframe/fetch/network', !/<img\b|<iframe\b|\bfetch\s*\(/i.test(html));
check('no ES module imports', !/<script[^>]+type=["']module/i.test(html));
check('under 100 KB', Buffer.byteLength(html, 'utf8') < 100 * 1024,
  `${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB`);
check('LF line endings only', !html.includes('\r\n'));
check('no unresolved placeholders', !/\{\{[A-Z_]+\}\}/.test(html));

// 2. Inline JavaScript must parse
const match = html.match(/<script>([\s\S]*?)<\/script>/);
check('inline script found', !!match);
if (match) {
  try { new vm.Script(match[1], { filename: file + ':inline' }); check('inline JS parses', true); }
  catch (err) { check('inline JS parses', false, err.message); }
}

// 3. Design contract
const required = [
  ['three themes', /data-theme="paper"[\s\S]*\[data-theme="ink"\][\s\S]*\[data-theme="cyan"\]/],
  ['orthographic projection (no divide by z)', /const proj = p => \[cx \+ p\[0\]\*S, cy - p\[1\]\*S, p\[2\]\]/],
  ['hidden dashed line work', /strokeGroup\(pr\.hidden[\s\S]*\[4,4\]/],
  ['center / assembly dash pattern', /\[12,4,2,4\]|\[9,4,2,4\]/],
  ['painter-order occlusion', /fill\('evenodd'\)/],
  ['paper / grid / frame', /function drawPaper/],
  ['exploded assembly', /EXPLODE|st\.explode/],
  ['section scan', /function drawSection/],
  ['leader labels', /function drawLeaders/],
  ['dimension lines', /function drawDimensions/],
  ['title block + live readouts', /function drawHUD/],
  ['part picking', /function pick\(/],
  ['PNG export', /function savePNG/],
  ['reduced motion', /prefers-reduced-motion/],
  ['background throttle', /document\.hidden/],
  ['wall-clock + frame intro', /Date\.now\(\)-st\.t0[\s\S]*frameCount\/CFG\.introFrames/],
  ['batched strokes', /function strokeGroup/],
  ['char width cache', /charWidthCache/],
  ['central tuning config', /const CFG = \{/],
  ['central part table', /const PARTS = \[/],
  ['URL state', /URLSearchParams/],
  ['debug / automation API', /window\.__DRAWING__/],
  ['accessibility label', /<canvas[^>]+aria-label=/],
  ['noscript fallback', /<noscript>/],
  ['canvas 2D fallback', /class="fallback"/],
  ['theme-color meta', /name="theme-color"/],
  ['favicon data URI', /rel="icon" href="data:image\/svg\+xml/]
];
for (const [name, re] of required) check(name, re.test(html));

// 4. Control surface
const ids = ['c','panel','fold','explode','section','spin','zoom','btnTheme',
  'btnReset','btnShuffle','btnPng','specId','specName','specRows'];
const missing = ids.filter(id => !new RegExp(`id="${id}"`).test(html));
check('all control element ids present', missing.length === 0, missing.join(', '));

// 5. No secrets
const secret = /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/;
check('no credential patterns', !secret.test(html));

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed — ${file}`);
if (failed) process.exit(1);

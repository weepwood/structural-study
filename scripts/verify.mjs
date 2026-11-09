/**
 * Zero-dependency project checks, used both locally and in GitHub Actions.
 * Usage: node scripts/verify.mjs
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const results = [];
const check = (name, pass, detail = '') => results.push({ name, pass, detail });

// 1. Single-file, zero-dependency contract
const scripts = html.match(/<script\b/g) || [];
check('exactly one inline <script>', scripts.length === 1, `found ${scripts.length}`);
check('no external stylesheet', !/<link[^>]+rel=["']stylesheet/i.test(html));
const external = html.match(/(?:src|href)=["'](?:https?:)?\/\/[^"']+/gi) || [];
check('zero external resources', external.length === 0, external.join(', '));
check('no <img>/<iframe>/fetch to network', !/<img\b|<iframe\b|\bfetch\s*\(/i.test(html));
check('file under 100 KB', Buffer.byteLength(html, 'utf8') < 100 * 1024,
  `${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB`);
check('LF line endings only', !html.includes('\r\n'));

// 2. Inline JavaScript must parse (compile without executing DOM code)
const match = html.match(/<script>([\s\S]*?)<\/script>/);
check('inline script found', !!match);
if (match) {
  try {
    new vm.Script(match[1], { filename: 'index.html:inline' });
    check('inline JS parses', true);
  } catch (err) {
    check('inline JS parses', false, err.message);
  }
}

// 3. Required capabilities
const required = [
  ['three themes', /data-theme="paper"[\s\S]*\[data-theme="ink"\][\s\S]*\[data-theme="cyan"\]/],
  ['orthographic projection', /const proj = p => \[cx \+ p\[0\]\*S, cy - p\[1\]\*S/],
  ['hidden / center line work', /strokeGroup\(pr\.hidden[\s\S]*\[4,4\]/],
  ['painter-order occlusion', /fill\('evenodd'\)/],
  ['exploded assembly', /EXPLODE|st\.explode/],
  ['section scan', /function drawSection/],
  ['part picking', /function pick\(/],
  ['PNG export', /function savePNG/],
  ['reduced motion', /prefers-reduced-motion/],
  ['background throttle', /document\.hidden/],
  ['wall-clock + frame intro', /Date\.now\(\)-st\.t0[\s\S]*frameCount\/CFG\.introFrames/],
  ['central tuning config', /const CFG = \{/],
  ['debug / automation API', /window\.__STRUCTURE__/],
  ['accessibility label', /<canvas[^>]+aria-label=/],
  ['noscript fallback', /<noscript>/],
  ['theme-color meta', /name="theme-color"/],
  ['favicon data URI', /rel="icon" href="data:image\/svg\+xml/],
];
for (const [name, re] of required) check(name, re.test(html));

// 4. Control surface must still be wired
const ids = ['c','panel','fold','explode','section','spin','zoom',
  'btnTheme','btnReset','btnShuffle','btnPng','specId','specName','specRows'];
const missing = ids.filter(id => !new RegExp(`id="${id}"`).test(html));
check('all control element ids present', missing.length === 0, missing.join(', '));

// 5. No secrets accidentally committed
const secret = /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/;
check('no credential patterns', !secret.test(html));

// 6. The reusable design skill is part of the published deliverable
const skill = new URL('../skills/orthographic-blueprint/', import.meta.url);
const skillFiles = ['SKILL.md', 'references/design-language.md', 'references/implementation.md',
  'assets/drawing-template.html', 'scripts/scaffold.mjs', 'scripts/check-drawing.mjs',
  'scripts/install.mjs'];
const missingSkill = skillFiles.filter(f => !existsSync(new URL(f, skill)));
check('skill package files present', missingSkill.length === 0, missingSkill.join(', '));
const skillMd = existsSync(new URL('SKILL.md', skill))
  ? readFileSync(new URL('SKILL.md', skill), 'utf8') : '';
check('skill frontmatter + agent_created',
  /^---\nname: orthographic-blueprint\n[\s\S]*?agent_created: true/.test(skillMd));
const tplPath = new URL('assets/drawing-template.html', skill);
const tpl = existsSync(tplPath) ? readFileSync(tplPath, 'utf8') : '';
check('template has one inline script', (tpl.match(/<script\b/g) || []).length === 1);
check('template has zero external resources',
  !!tpl && !/(?:src|href)=["'](?:https?:)?\/\//i.test(tpl));
const tplJs = tpl.match(/<script>([\s\S]*?)<\/script>/);
if (tplJs) {
  try { new vm.Script(tplJs[1], { filename: 'drawing-template.html:inline' }); check('template inline JS parses', true); }
  catch (err) { check('template inline JS parses', false, err.message); }
} else check('template inline JS parses', false, 'script not found');
check('template keeps three themes',
  /data-theme="paper"[\s\S]*\[data-theme="ink"\][\s\S]*\[data-theme="cyan"\]/.test(tpl));
const landingPath = new URL('../skill.html', import.meta.url);
const landing = existsSync(landingPath) ? readFileSync(landingPath, 'utf8') : '';
check('skill landing page exists', !!landing);
check('landing page links to zip and live template',
  /orthographic-blueprint\.zip/.test(landing) && /drawing-template\.html/.test(landing));
const zip = new URL('../skills/orthographic-blueprint.zip', import.meta.url);
check('distributable skill zip present', existsSync(zip) && statSync(zip).size > 10000,
  existsSync(zip) ? `${(statSync(zip).size / 1024).toFixed(1)} KB` : 'missing');
const workflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8');
check('Pages build ships skill page and assets',
  /cp index\.html skill\.html _site\//.test(workflow) && /cp -r skills _site\/skills/.test(workflow));
check('drawing links to the skill page', /href="\.\/skill\.html"/.test(html));

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed) process.exit(1);

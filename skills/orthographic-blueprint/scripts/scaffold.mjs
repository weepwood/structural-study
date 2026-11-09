#!/usr/bin/env node
/**
 * Scaffold a new single-file orthographic drawing from the skill template.
 * Zero dependencies. Usage:
 *   node scaffold.mjs --out ./drawing.html --title "STRUCTURE 02" --subject "TRUSS ASSEMBLY" --code 02
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const template = resolve(here, '../assets/drawing-template.html');

const args = process.argv.slice(2);
const opts = { out: './drawing.html', title: '', subject: '', code: '01', force: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--help' || a === '-h') {
    console.log('Usage: node scaffold.mjs --out <file.html> [--title <text>] [--subject <text>] [--code <nn>] [--force]');
    process.exit(0);
  }
  if (a === '--force') { opts.force = true; continue; }
  const key = a.replace(/^--/, '');
  const value = args[++i];
  if (!value || value.startsWith('--')) {
    console.error('Missing value for ' + a);
    process.exit(1);
  }
  if (!(key in opts)) { console.error('Unknown option: ' + a); process.exit(1); }
  opts[key] = value;
}

const out = resolve(process.cwd(), opts.out);
if (existsSync(out) && !opts.force) {
  console.error('Refusing to overwrite existing file: ' + out + '\nUse --force to replace it.');
  process.exit(1);
}

let html = readFileSync(template, 'utf8');
const values = {
  TITLE: opts.title || 'STRUCTURE ' + opts.code,
  SUBJECT: opts.subject || 'PARAMETRIC ASSEMBLY',
  CODE: opts.code
};
for (const [k, v] of Object.entries(values)) {
  html = html.split('{{' + k + '}}').join(v);
}
const leftover = html.match(/\{\{[A-Z_]+\}\}/g);
if (leftover) {
  console.error('Unresolved placeholders: ' + [...new Set(leftover)].join(', '));
  process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html, 'utf8');
console.log('Created ' + out);
console.log('Title   ' + values.TITLE + ' / ' + values.SUBJECT);
console.log('Next    edit PARTS + buildPart() (look for REPLACE: GEOMETRY), then run check-drawing.mjs');

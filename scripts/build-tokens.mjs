/**
 * Regenerate design-system artifacts from tokens.json.
 * Zero dependencies — run with: npm run tokens
 *
 *   design-system/tokens.css            full standalone stylesheet
 *   design-system/index.html            two generated blocks (CSS + JS data)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  CSS_PATH, PAGE_PATH, CSS_BEGIN, CSS_END, DATA_BEGIN, DATA_END,
  readTokens, buildCss, buildData, injectBlock
} from './tokens.mjs';

const t = readTokens();
const css = buildCss(t);
const data = buildData(t);

writeFileSync(CSS_PATH, css, 'utf8');

let page = readFileSync(PAGE_PATH, 'utf8');
if (page.includes('\r\n')) throw new Error('design-system/index.html must use LF line endings');
page = injectBlock(page, CSS_BEGIN, CSS_END, css);
page = injectBlock(page, DATA_BEGIN, DATA_END, data);
writeFileSync(PAGE_PATH, page, 'utf8');

console.log(`OK  tokens v${t.$meta.version} ${t.$meta.revision}`);
console.log(`    themes      : ${Object.keys(t.themes).join(', ')}`);
console.log(`    tokens.css  : ${(Buffer.byteLength(css, 'utf8') / 1024).toFixed(1)} KB`);
console.log(`    index.html  : ${(Buffer.byteLength(page, 'utf8') / 1024).toFixed(1)} KB`);

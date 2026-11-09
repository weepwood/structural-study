#!/usr/bin/env node
/**
 * Install this skill into WorkBuddy's user-level or project-level skills directory.
 * Zero dependencies. Usage:
 *   node install.mjs                      # ~/.workbuddy/skills/orthographic-blueprint
 *   node install.mjs --project /path/repo  # <repo>/.workbuddy/skills/orthographic-blueprint
 *   node install.mjs --force             # replace an existing installation
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(here, '..');
const name = basename(skillDir);

const args = process.argv.slice(2);
let mode = 'user', project = '', force = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project') { mode = 'project'; project = args[++i]; }
  else if (args[i] === '--force') force = true;
  else if (args[i] === '--help' || args[i] === '-h') {
    console.log('Usage: node install.mjs [--project <dir>] [--force]');
    process.exit(0);
  } else { console.error('Unknown option: ' + args[i]); process.exit(1); }
}
if (mode === 'project' && !project) { console.error('--project requires a directory'); process.exit(1); }

const base = mode === 'user' ? join(homedir(), '.workbuddy', 'skills')
                            : join(resolve(project), '.workbuddy', 'skills');
const dest = join(base, name);

if (existsSync(dest)) {
  if (!force) {
    console.error('Already installed at ' + dest + '\nUse --force to replace it.');
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(base, { recursive: true });
cpSync(skillDir, dest, {
  recursive: true,
  filter: src => !/[\\/](?:\.git|node_modules|__MACOSX)$/.test(src) && !src.endsWith('.zip')
});

const manifest = readFileSync(join(dest, 'SKILL.md'), 'utf8');
const ok = /^name:\s*orthographic-blueprint/m.test(manifest) && /agent_created:\s*true/.test(manifest);
if (!ok) { console.error('Installed copy failed manifest validation'); process.exit(1); }
console.log('Installed skill: ' + dest);
console.log('Scope: ' + (mode === 'user' ? 'user-level (all projects)' : 'project-level (' + project + ')'));
console.log('Restart the session or reload skills to make it available.');

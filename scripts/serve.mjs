/** Zero-dependency static preview server, exposing only files published by Pages. */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const published = path =>
  path === '/index.html' || path === '/skill.html' || path === '/design.md' ||
  path.startsWith('/design-system/') || path.startsWith('/skills/');

export function createPreviewServer() {
  return http.createServer(async (req, res) => {
    if(req.method !== 'GET' && req.method !== 'HEAD'){
      res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end('Bad request');
      return;
    }
    if(pathname === '/') pathname = '/index.html';
    if(pathname === '/design-system' || pathname === '/design-system/')
      pathname = '/design-system/index.html';
    // Avoid exposing .git, local env, verification scripts or paths outside the site.
    if(pathname.includes('\\') || pathname.split('/').some(s => s.startsWith('.')) || !published(pathname)){
      res.writeHead(403).end('Forbidden');
      return;
    }
    const file = resolve(root, '.' + pathname);
    if(file === root || !file.startsWith(root + sep)){
      res.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const data = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  const port = Number(process.env.PORT ?? 4173);
  const server = createPreviewServer();
  server.listen(port, '127.0.0.1', () => {
    console.log('STRUCTURE 01  ->  http://127.0.0.1:' + server.address().port + '/');
  });
}

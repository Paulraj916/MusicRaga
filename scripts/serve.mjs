import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const args = process.argv.slice(2);
const arg = (key, fallback) => args[args.lastIndexOf(key) + 1] ?? fallback;
const host = args.includes('--host') ? arg('--host', '0.0.0.0') : '0.0.0.0';
const port = Number(args.includes('--port') ? arg('--port', '4173') : (process.env.PORT ?? 4173));
const root = resolve('dist');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
};
const security = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, security);
      return res.end('Method not allowed');
    }
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403, security);
      return res.end('Forbidden');
    }
    let code = 200;
    try {
      const info = await stat(file);
      if (info.isDirectory()) {
        if (!path.endsWith('/')) {
          res.writeHead(308, { ...security, Location: path + '/' });
          return res.end();
        }
        file = resolve(file, 'index.html');
        await stat(file);
      }
    } catch {
      file = resolve(root, '404.html');
      code = 404;
    }
    const data = await readFile(file);
    res.writeHead(code, {
      ...security,
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': file.includes('/assets/') ? 'public,max-age=31536000,immutable' : 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(400, security);
    res.end('Invalid request');
  }
});
server.listen(port, host, () =>
  console.log(
    `PowerWords static preview ready at http://${host}:${port}/ (real clean-route files, 404s and security headers)`,
  ),
);
server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

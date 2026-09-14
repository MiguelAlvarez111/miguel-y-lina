import { createReadStream, realpathSync } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.ics', 'text/calendar; charset=utf-8'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.otf', 'font/otf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

const REVALIDATE = 'public, max-age=0, must-revalidate';
const IMMUTABLE = 'public, max-age=31536000, immutable';

function isWithin(root, candidate) {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot === '' ||
    (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..')
  );
}

function requestPath(rawUrl) {
  const rawPath = rawUrl.split('?', 1)[0];
  let decoded;

  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { error: 400 };
  }

  if (decoded.includes('\0')) return { error: 400 };

  const portablePath = decoded.replaceAll('\\', '/');
  const segments = portablePath.split('/').filter(Boolean);
  if (segments.includes('..')) return { error: 400 };
  if (segments.some((segment) => segment.startsWith('.'))) {
    return { error: 404 };
  }

  return { path: portablePath === '/' ? '/index.html' : portablePath };
}

function setBaselineHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function sendError(request, response, status) {
  const message = status === 400 ? 'Bad Request\n' : status === 405 ? 'Method Not Allowed\n' : 'Not Found\n';
  const body = Buffer.from(message);

  response.statusCode = status;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Content-Length', String(body.length));
  response.setHeader('Cache-Control', 'no-store');
  if (status === 405) response.setHeader('Allow', 'GET, HEAD');
  response.end(request.method === 'HEAD' ? undefined : body);
}

function cacheControl(pathname, extension) {
  if (extension === '.html') return 'no-cache';

  const basename = pathname.split('/').at(-1) ?? '';
  const isHashedAstroAsset =
    pathname.startsWith('/_astro/') && /\.[A-Za-z0-9_-]{8,}\.[^.]+$/.test(basename);

  return isHashedAstroAsset ? IMMUTABLE : REVALIDATE;
}

export function createStaticServer(rootDir) {
  const root = realpathSync(resolve(rootDir));

  return createServer(async (request, response) => {
    setBaselineHeaders(response);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendError(request, response, 405);
      return;
    }

    const parsed = requestPath(request.url ?? '/');
    if ('error' in parsed) {
      sendError(request, response, parsed.error);
      return;
    }

    const candidate = resolve(root, `.${parsed.path}`);
    if (!isWithin(root, candidate)) {
      sendError(request, response, 400);
      return;
    }

    let filePath;
    let fileStat;
    try {
      filePath = await realpath(candidate);
      if (!isWithin(root, filePath)) {
        sendError(request, response, 404);
        return;
      }
      fileStat = await stat(filePath);
    } catch {
      sendError(request, response, 404);
      return;
    }

    if (!fileStat.isFile()) {
      sendError(request, response, 404);
      return;
    }

    const extension = extname(filePath).toLowerCase();
    response.statusCode = 200;
    response.setHeader(
      'Content-Type',
      MIME_TYPES.get(extension) ?? 'application/octet-stream',
    );
    response.setHeader('Content-Length', String(fileStat.size));
    response.setHeader('Cache-Control', cacheControl(parsed.path, extension));
    if (extension === '.ics') {
      response.setHeader('Content-Disposition', 'attachment; filename="boda.ics"');
    }

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const stream = createReadStream(filePath);
    stream.once('error', () => {
      if (!response.headersSent) sendError(request, response, 404);
      else response.destroy();
    });
    stream.pipe(response);
  });
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
  const configuredPort = Number.parseInt(process.env.PORT ?? '8080', 10);
  const port = Number.isInteger(configuredPort) ? configuredPort : 8080;
  const server = createStaticServer(distDir);

  server.listen(port, '0.0.0.0', () => {
    console.log(`Wedding site listening on http://0.0.0.0:${port}`);
  });
}

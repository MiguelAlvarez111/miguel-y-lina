import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { createStaticServer } from '../scripts/start.mjs';

type Response = {
  body: Buffer;
  headers: import('node:http').IncomingHttpHeaders;
  status: number;
};

describe('static server', () => {
  let fixtureDir: string;
  let outsideDir: string;
  let server: Server;
  let port: number;

  beforeEach(async () => {
    fixtureDir = await mkdtemp(join(tmpdir(), 'wedding-server-'));
    outsideDir = await mkdtemp(join(tmpdir(), 'wedding-outside-'));
    await mkdir(join(fixtureDir, '_astro'), { recursive: true });
    await mkdir(join(fixtureDir, 'photos'), { recursive: true });
    await mkdir(join(fixtureDir, '.private'), { recursive: true });
    await Promise.all([
      writeFile(join(fixtureDir, 'index.html'), '<h1>Miguel & Lina</h1>'),
      writeFile(join(fixtureDir, 'boda.ics'), 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n'),
      writeFile(join(fixtureDir, 'favicon.svg'), '<svg/>'),
      writeFile(join(fixtureDir, '_astro', 'index.A1b2C3d4.css'), 'body{}'),
      writeFile(join(fixtureDir, '_astro', 'entry.Z9y8X7w6.js'), 'export{}'),
      writeFile(join(fixtureDir, '_astro', 'font.Q1w2E3r4.woff2'), 'font'),
      writeFile(join(fixtureDir, '_astro', 'plain.css'), 'body{}'),
      writeFile(join(fixtureDir, 'photos', 'hero-480.webp'), 'photo'),
      writeFile(join(fixtureDir, '.env'), 'SECRET=root'),
      writeFile(join(fixtureDir, '.private', 'token'), 'SECRET=nested'),
      writeFile(join(outsideDir, 'secret.txt'), 'outside'),
    ]);
    await symlink(
      join(outsideDir, 'secret.txt'),
      join(fixtureDir, 'linked-secret.txt'),
    );

    server = createStaticServer(fixtureDir);
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        server.off('error', reject);
        const address = server.address();
        if (!address || typeof address === 'string') {
          reject(new Error('Server did not bind a TCP port'));
          return;
        }
        port = address.port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await Promise.all([
      rm(fixtureDir, { recursive: true, force: true }),
      rm(outsideDir, { recursive: true, force: true }),
    ]);
  });

  function send(path: string, method = 'GET'): Promise<Response> {
    return new Promise((resolve, reject) => {
      const req = request(
        { host: '127.0.0.1', port, method, path },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          response.on('end', () => {
            resolve({
              body: Buffer.concat(chunks),
              headers: response.headers,
              status: response.statusCode ?? 0,
            });
          });
        },
      );
      req.setTimeout(2_000, () => req.destroy(new Error('Request timed out')));
      req.once('error', reject);
      req.end();
    });
  }

  test('serves index.html at the root with HTML cache policy', async () => {
    const response = await send('/?guest=Familia%20D%C3%ADaz');

    expect(response.status).toBe(200);
    expect(response.body.toString()).toBe('<h1>Miguel & Lina</h1>');
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  test.each([
    ['/favicon.svg', 'image/svg+xml'],
    ['/_astro/index.A1b2C3d4.css', 'text/css; charset=utf-8'],
    ['/_astro/entry.Z9y8X7w6.js', 'text/javascript; charset=utf-8'],
    ['/_astro/font.Q1w2E3r4.woff2', 'font/woff2'],
    ['/photos/hero-480.webp', 'image/webp'],
  ])('serves %s with its media type', async (path, mediaType) => {
    const response = await send(path);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe(mediaType);
  });

  test('downloads the calendar with the wedding filename', async () => {
    const response = await send('/boda.ics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/calendar; charset=utf-8');
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="boda.ics"',
    );
  });

  test('returns headers and no body for HEAD', async () => {
    const getResponse = await send('/photos/hero-480.webp');
    const headResponse = await send('/photos/hero-480.webp', 'HEAD');

    expect(headResponse.status).toBe(200);
    expect(headResponse.body).toHaveLength(0);
    expect(headResponse.headers['content-length']).toBe(
      String(getResponse.body.length),
    );
    expect(headResponse.headers['content-type']).toBe('image/webp');
  });

  test('allows only GET and HEAD', async () => {
    const response = await send('/', 'POST');

    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('GET, HEAD');
  });

  test('returns 404 for missing files', async () => {
    expect((await send('/missing.css')).status).toBe(404);
  });

  test.each(['/%', '/bad%00path', '/%2e%2e/secret.txt', '/.%2e/secret.txt'])(
    'rejects malformed or traversing path %s',
    async (path) => {
      expect((await send(path)).status).toBe(400);
    },
  );

  test.each(['/.env', '/.private/token'])(
    'does not expose dotfiles at %s',
    async (path) => {
      expect((await send(path)).status).toBe(404);
    },
  );

  test('does not follow symlinks outside the static root', async () => {
    expect((await send('/linked-secret.txt')).status).toBe(404);
  });

  test('uses immutable caching only for hashed Astro assets', async () => {
    const hashed = await send('/_astro/index.A1b2C3d4.css');
    const unhashedAstro = await send('/_astro/plain.css');
    const photo = await send('/photos/hero-480.webp');

    expect(hashed.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(unhashedAstro.headers['cache-control']).toBe(
      'public, max-age=0, must-revalidate',
    );
    expect(photo.headers['cache-control']).toBe(
      'public, max-age=0, must-revalidate',
    );
  });

  test('sets baseline browser security headers', async () => {
    const response = await send('/');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script = resolve('scripts/prerender.mjs');
function run(env) {
  const directory = mkdtempSync(join(tmpdir(), 'powerwords-seo-policy-'));
  mkdirSync(join(directory, 'dist'));
  writeFileSync(
    join(directory, 'dist/index.html'),
    '<html><head></head><body><div id="root"></div></body></html>',
  );
  const result = spawnSync(process.execPath, [script], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      ...process.env,
      ALLOW_INDEXING: 'true',
      SITE_URL: 'https://site.test',
      REVIEWED_INDEX_PATHS: '',
      ...env,
    },
  });
  return { directory, result, cleanup: () => rmSync(directory, { recursive: true }) };
}
test('production indexing fails without explicit reviewed routes', () => {
  const r = run({});
  try {
    assert.notEqual(r.result.status, 0);
    assert.match(r.result.stderr, /REVIEWED_INDEX_PATHS/);
  } finally {
    r.cleanup();
  }
});
test('production indexing fails for localhost', () => {
  const r = run({
    SITE_URL: 'http://localhost:4173',
    REVIEWED_INDEX_PATHS: '/songs/tirukkural-invocation/',
  });
  try {
    assert.notEqual(r.result.status, 0);
  } finally {
    r.cleanup();
  }
});
test('fictional demo route cannot be approved for indexing', () => {
  const r = run({ REVIEWED_INDEX_PATHS: '/songs/a-little-light/' });
  try {
    assert.notEqual(r.result.status, 0);
  } finally {
    r.cleanup();
  }
});
test('only explicitly reviewed substantive route is indexable and in production sitemap', () => {
  const r = run({ REVIEWED_INDEX_PATHS: '/songs/tirukkural-invocation/' });
  try {
    assert.equal(r.result.status, 0, r.result.stderr);
    const manifest = JSON.parse(
      readFileSync(join(r.directory, 'dist/build-manifest.json'), 'utf8'),
    );
    assert.equal(manifest.sitemapRoutes, 1);
    assert.match(
      readFileSync(join(r.directory, 'dist/songs/tirukkural-invocation/index.html'), 'utf8'),
      /content="index,follow"/,
    );
    assert.match(
      readFileSync(join(r.directory, 'dist/songs/munbe-vaa/index.html'), 'utf8'),
      /content="noindex,follow"/,
    );
    assert.equal(
      readFileSync(join(r.directory, 'dist/sitemap.xml'), 'utf8').includes('munbe-vaa'),
      false,
    );
  } finally {
    r.cleanup();
  }
});

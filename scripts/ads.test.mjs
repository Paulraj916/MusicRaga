import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adConfiguration, prepareAds } from './prepare-ads.mjs';
test('default config has no publisher, tracking or SDK requests', () => {
  const config = adConfiguration({});
  assert.equal(config.active, false);
  assert.equal(config.publisherId, '');
  assert.equal(config.requestsEnabled, false);
});
test('reject missing placeholder or malformed publishers', () => {
  for (const env of [
    { ADS_TXT_ENABLED: 'true' },
    { ADSENSE_PUBLISHER_ID: 'pub-0000000000000000' },
    { ADSENSE_PUBLISHER_ID: 'placeholder' },
  ])
    assert.throws(() => adConfiguration(env));
});
test('always blocks accidental live requests even with explicit flags', () =>
  assert.throws(() => adConfiguration({ ADSENSE_REQUESTS_ENABLED: 'true' })));
test('disabled ads.txt contains no fabricated publisher line', () => {
  const directory = mkdtempSync(join(tmpdir(), 'powerwords-ads-test-'));
  try {
    prepareAds(directory, {});
    assert.equal(readFileSync(join(directory, 'ads.txt'), 'utf8').includes('pub-'), false);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

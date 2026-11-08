/** Compare the recorded final mobile surface with the same real UI in a separate non-recording context. */
import { chromium, devices } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const record = JSON.parse(await readFile('artifacts/demo-recording.json', 'utf8'));
const origin = record.origin;
assert(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname));
await mkdir('artifacts/mobile-review', { recursive: true });
const final = 'artifacts/mobile-review/revised-mobile-final.png';
const reference = 'artifacts/mobile-review/revised-mobile-reference.png';
execFileSync(
  'ffmpeg',
  [
    '-nostdin',
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-sseof',
    '-0.12',
    '-i',
    record.mobileOutput,
    '-frames:v',
    '1',
    final,
  ],
  { stdio: 'inherit' },
);
const browser = await chromium.launch();
const c = await browser.newContext({
  ...devices['Pixel 7'],
  viewport: { width: 412, height: 892 },
  screen: { width: 412, height: 892 },
  deviceScaleFactor: 1,
});
const page = await c.newPage();
await page.goto(origin + '/');
await page.getByRole('button', { name: 'Switch to dark theme' }).click();
await page.goto(origin + '/songs/tirukkural-invocation/translation/');
await page.evaluate(() => document.fonts.ready);
await page.getByRole('button', { name: 'Open practice room' }).click();
await page.getByRole('dialog').getByRole('tab', { name: 'English', exact: true }).click();
const last = record.mobileMeasurements.at(-1);
await page.evaluate((y) => window.scrollTo(0, y), last.scrollY);
await page.getByRole('dialog').evaluate((el) => el.scrollTo(0, 0));
await page.waitForTimeout(450);
const geometry = await page.evaluate(() => ({
  width: innerWidth,
  height: innerHeight,
  scale: visualViewport.scale,
  dpr: devicePixelRatio,
}));
assert.equal(geometry.scale, 1);
await page.screenshot({ path: reference, scale: 'css' });
await page.screenshot({ path: 'artifacts/upgraded-demo-mobile-practice.png', scale: 'css' });
await c.close();
await browser.close();
const comparison = spawnSync(
  'ffmpeg',
  [
    '-nostdin',
    '-hide_banner',
    '-i',
    final,
    '-i',
    reference,
    '-filter_complex',
    '[0:v]crop=370:850:21:14,format=yuv420p[a];[1:v]crop=370:850:21:14,format=yuv420p[b];[a][b]ssim',
    '-f',
    'null',
    '-',
  ],
  { encoding: 'utf8' },
);
assert.equal(comparison.status, 0, comparison.stderr);
const similarity = Number(comparison.stderr.match(/All:([0-9.]+)/)?.[1]);
assert(Number.isFinite(similarity));
assert(similarity >= 0.93, `Recorded mobile UI differs from intact reference: SSIM ${similarity}`);
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', record.mobileOutput],
    { encoding: 'utf8' },
  ),
);
assert.equal(probe.streams[0].width, 412);
assert.equal(probe.streams[0].height, 892);
const result = {
  passed: true,
  similarity,
  threshold: 0.93,
  geometry,
  finalFrame: final,
  referenceFrame: reference,
  notice:
    'Independent non-recording UI reference; screenshot APIs never mutate active mobile recording; codec loss allowed, crop/zoom would fail.',
};
await writeFile(
  'artifacts/mobile-review/video-regression.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result, null, 2));

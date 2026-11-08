import { chromium, devices } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const results = [];
for (const profile of [
  { name: 'previous-device', ...devices['Pixel 7'], viewport: { width: 412, height: 915 } },
  {
    name: 'matched-capture',
    ...devices['Pixel 7'],
    viewport: { width: 412, height: 892 },
    screen: { width: 412, height: 892 },
    deviceScaleFactor: 1,
  },
]) {
  const { name, ...options } = profile;
  const c = await browser.newContext(options);
  const p = await c.newPage();
  await p.goto('http://127.0.0.1:4173/');
  await p.evaluate(() => document.fonts.ready);
  async function snap(state) {
    results.push({
      profile: name,
      state,
      ...(await p.evaluate(() => ({
        innerWidth,
        innerHeight,
        screen: { width: screen.width, height: screen.height },
        dpr: devicePixelRatio,
        scrollY,
        visualViewport: {
          width: visualViewport.width,
          height: visualViewport.height,
          scale: visualViewport.scale,
          offsetTop: visualViewport.offsetTop,
        },
        docWidth: document.documentElement.scrollWidth,
        dialog: (() => {
          const d = document.querySelector('dialog[open]');
          if (!d) return null;
          const r = d.getBoundingClientRect();
          const h = d.querySelector('.dialog-top').getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            scrollHeight: d.scrollHeight,
            clientHeight: d.clientHeight,
            scrollTop: d.scrollTop,
            header: { x: h.x, y: h.y, width: h.width, height: h.height },
          };
        })(),
      }))),
    });
    await p.screenshot({ path: `artifacts/mobile-review/${name}-${state}.png` });
  }
  await snap('home');
  await p.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await snap('drawer');
  await p.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await p.getByRole('button', { name: 'Switch to dark theme' }).click();
  await p
    .getByRole('textbox', { name: 'Search songs, artists, albums and lyrics metadata' })
    .fill('முன்பே வா lyrics');
  await snap('search-focus');
  await p.locator('.song-title').click();
  await snap('credits-top');
  await p.locator('.rights-gate').scrollIntoViewIfNeeded();
  await snap('credits-gate');
  await p.goto('http://127.0.0.1:4173/songs/tirukkural-invocation/translation/');
  await p.locator('.static-reader').scrollIntoViewIfNeeded();
  await p.getByRole('button', { name: 'Open practice room' }).click();
  await p.getByRole('dialog').getByRole('tab', { name: 'English', exact: true }).click();
  await snap('practice-top');
  await p
    .getByRole('dialog')
    .getByRole('button', { name: 'Play rehearsal', exact: true })
    .scrollIntoViewIfNeeded();
  await snap('practice-player');
  await c.close();
}
await browser.close();
await writeFile(
  'artifacts/mobile-review/viewport-diagnostics.json',
  JSON.stringify(results, null, 2) + '\n',
);
console.log(JSON.stringify(results, null, 2));

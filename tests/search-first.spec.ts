import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const search = (page: import('@playwright/test').Page) =>
  page.getByRole('searchbox', { name: 'Search songs, albums or artists' });
const rows = (page: import('@playwright/test').Page) => page.locator('a.song-result-row');
async function submit(page: import('@playwright/test').Page, q: string) {
  await search(page).fill(q);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}

test('root visibly starts with search, not dashboards; accessible and mobile safe', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your song.');
  await expect(search(page)).toBeVisible();
  const box = await search(page).boundingBox();
  expect(box!.y).toBeLessThan(450);
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.coverage-panel')).toHaveCount(0);
  await expect(page.getByText('Real-song cleared native + romanized lyric pairs:')).toContainText(
    '0',
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({
    path: `artifacts/search-first-${info.project.name}-home.png`,
    fullPage: true,
  });
});

test('Tamil title → clearly unavailable reader → text-size and local-only audio → back', async ({
  page,
}, info) => {
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url());
  });
  await page.goto('/');
  await submit(page, 'சின்ன சின்ன ஆசை songs');
  const result = rows(page)
    .filter({ has: page.getByRole('heading', { name: /சின்ன/ }) })
    .first();
  await expect(result).toContainText('Lyrics not yet available');
  await result.click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('சின்ன');
  await expect(
    page.getByRole('heading', { name: 'Lyrics not yet available.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Native script · unavailable', { exact: true })).toBeVisible();
  await expect(page.getByText('Romanized / Tanglish · unavailable', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open the album on Spotify/ })).toHaveAttribute(
    'href',
    /^https:\/\/open.spotify.com\/album\//,
  );
  await page.getByRole('slider', { name: 'Reader text size' }).fill('32');
  await expect(page.locator('.song-no-lyrics')).toHaveCSS('font-size', '32px');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: `artifacts/search-first-${info.project.name}-reader.png`,
    fullPage: true,
  });
  const wav = Buffer.alloc(1644);
  wav.write('RIFF');
  wav.writeUInt32LE(1636, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(1600, 40);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'original-silent-practice.wav', mimeType: 'audio/wav', buffer: wav });
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/);
  await expect(page.locator('audio')).toHaveAttribute('controls', '');
  await page.getByRole('button', { name: 'Remove audio', exact: true }).click();
  await expect(page.locator('audio')).toHaveCount(0);
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Back to song search', exact: true }).click();
  await expect(search(page)).toBeFocused();
});

test('real source album search → recording → fresh deep-link reload, with no pretend playback', async ({
  page,
}, info) => {
  await page.goto('/');
  await submit(page, 'Alaipayuthey songs');
  await expect(rows(page).first()).toBeVisible();
  await expect(rows(page).first()).toContainText('Alaipayuthey');
  await page.screenshot({
    path: `artifacts/search-first-${info.project.name}-results.png`,
    fullPage: true,
  });
  const title = await rows(page).first().locator('h3').innerText();
  await rows(page).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page).toHaveURL(/song=musicbrainz%3Arecording%3A/);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(
    page.getByRole('heading', { name: 'Lyrics not yet available.', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('No verified listening destination is supplied for this entry.'),
  ).toBeVisible();
  await expect(page.locator('audio,iframe')).toHaveCount(0);
  await page.getByText('Song credits & sources', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'View source record ↗' })).toHaveAttribute(
    'href',
    /^https:\/\/musicbrainz.org\/recording\//,
  );
});

test('Romanized, artist, empty and clear searches; browser back and secondary tools', async ({
  page,
}) => {
  await page.goto('/');
  await submit(page, 'Munbe Vaa lyrics');
  await expect(rows(page).filter({ hasText: 'Munbe Vaa' }).first()).toBeVisible();
  await rows(page).filter({ hasText: 'Munbe Vaa' }).first().click();
  await page.goBack();
  await expect(search(page)).toHaveValue('Munbe Vaa lyrics');
  await submit(page, 'zzqq-unmatched-title-98765');
  await expect(page.getByRole('heading', { name: 'No matching song found.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear song search', exact: true }).click();
  await expect(search(page)).toHaveValue('');
  await page.getByRole('button', { name: 'A. R. Rahman', exact: true }).click();
  await expect(rows(page).first()).toBeVisible();
  await page.getByRole('button', { name: 'More tools', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open India index', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to simple song search', exact: true }).click();
  await expect(search(page)).toBeVisible();
});

test('dark root and results stay accessible; 320px header and keyboard search fit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(search(page)).toBeFocused();
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await submit(page, 'Munbe Vaa');
  await expect(rows(page).first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});

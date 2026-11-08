import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const field = 'Search songs, artists, albums and lyrics metadata';
const overflow = async (page: import('@playwright/test').Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
test('real clean routes expose crawlable metadata before JavaScript', async ({
  request,
  browser,
}) => {
  const response = await request.get('/songs/ennadi-maayavi-nee/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<title>Ennadi Maayavi Nee — credits &amp; sources | PowerWords</title>');
  expect(html).toContain('rel="canonical" href="http://localhost:4173/songs/ennadi-maayavi-nee/"');
  expect(html).toContain('Santhosh Narayanan');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/songs/tirukkural-invocation/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tirukkural');
  await expect(page.locator('.page-poem')).toContainText('அகர முதல');
  await page.getByRole('link', { name: 'English rendering', exact: true }).click();
  await expect(page.locator('.page-poem')).toContainText('As the letters begin with A');
  await expect(page.locator('.page-poem')).toHaveAttribute('lang', 'en');
  await context.close();
});
test('real native title search and unknown Tamil quote stay honest', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: field }).fill('முன்பே வா lyrics');
  await expect(page.locator('.song-card')).toHaveCount(1);
  await expect(page.locator('.song-title')).toHaveText('Munbe Vaa');
  await page.getByRole('textbox', { name: field }).fill('Vadachennai ஏன் ஏன் கதை கேட்கிற song');
  await expect(page.locator('.song-card')).toHaveCount(2);
  await expect(page.locator('.contextual-results')).toContainText(
    'quoted words have not been verified',
  );
  await page.locator('.song-title').first().click();
  await expect(page).toHaveURL(/\/songs\//);
  await expect(
    page.getByRole('heading', { name: 'Credits open. Lyrics protected.' }),
  ).toBeVisible();
  await expect(page.locator('.page-poem')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open practice room' })).toHaveCount(0);
  await overflow(page);
});
test('Rahman artist collection chronology album and individual singer are real filters', async ({
  page,
}) => {
  await page.goto('/artists/a-r-rahman/');
  await expect(page.locator('.route-record-list article')).toHaveCount(3);
  await expect(page.locator('.route-record-list h2').first()).toHaveText('Munbe Vaa');
  await page.getByRole('combobox', { name: 'Collection chronology' }).selectOption('oldest');
  await expect(page.locator('.route-record-list h2').first()).toHaveText('Chinna Chinna Asai');
  await page.getByRole('combobox', { name: 'Collection album' }).selectOption('Roja');
  await page.getByRole('combobox', { name: 'Collection voice' }).selectOption('Sujatha Mohan');
  await expect(page.locator('.route-record-list article')).toHaveCount(1);
  await expect(page.locator('.route-record-list h2')).toHaveText('Pudhu Vellai Mazhai');
  await page.getByRole('link', { name: 'Pudhu Vellai Mazhai', exact: true }).click();
  await expect(page).toHaveTitle('Pudhu Vellai Mazhai — credits & sources | PowerWords');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A. R. Rahman');
  await overflow(page);
});
test('actual text variants have clean reloadable URLs and reciprocal hreflang', async ({
  page,
}) => {
  await page.goto('/songs/tirukkural-invocation/');
  await page.getByRole('link', { name: 'English rendering', exact: true }).click();
  await expect(page).toHaveURL(/\/translation\/$/);
  await expect(page.locator('.page-poem')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/English rendering/);
  await page.reload();
  await expect(page.locator('.page-poem')).toContainText('flawless wisdom');
  await page.getByRole('link', { name: 'Thanglish / Latin', exact: true }).click();
  await expect(page.locator('.page-poem')).toHaveAttribute('lang', 'ta-Latn');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Open practice room' }).click();
  await expect(page.getByRole('dialog')).toContainText('PUBLIC-DOMAIN VERSE');
  await expect(page.getByRole('dialog')).not.toContainText('Fictional credits');
  await overflow(page);
});
test('unknown URLs return true 404 and missing slash redirects canonically', async ({
  request,
  page,
}) => {
  const bad = await request.get('/songs/not-a-real-recording/');
  expect(bad.status()).toBe(404);
  expect(await bad.text()).toContain('A MISSING VERSE');
  const redirect = await request.get('/artists/a-r-rahman', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers()['location']).toBe('/artists/a-r-rahman/');
  await page.goto('/songs/not-a-real-recording/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('songbook');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});
test('generated sitemap robots and security headers use configured preview origin', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  expect(await sitemap.text()).toContain('http://localhost:4173/songs/munbe-vaa/');
  expect(await sitemap.text()).not.toContain('a-little-light');
  const root = await request.get('/');
  expect(root.headers()['x-content-type-options']).toBe('nosniff');
  expect(root.headers()['content-security-policy']).toContain("object-src 'none'");
});
for (const theme of ['light', 'dark'])
  test(`new source-led routes are accessible in ${theme} mode`, async ({ page }, info) => {
    await page.goto('/');
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    for (const path of [
      '/artists/a-r-rahman/',
      '/languages/tamil/',
      '/songs/ennadi-maayavi-nee/',
      '/songs/tirukkural-invocation/',
    ]) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const report = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(report.violations, `${path} ${theme}`).toEqual([]);
      await overflow(page);
    }
    await page.screenshot({
      path: `artifacts/upgraded-${info.project.name}-ancient-text-${theme}.png`,
      fullPage: true,
    });
  });
test('all page families fit a 320px mobile viewport with enlarged reading size', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of [
    '/',
    '/artists/a-r-rahman/',
    '/languages/tamil/',
    '/songs/ennadi-maayavi-nee/',
    '/songs/tirukkural-invocation/translation/',
  ]) {
    await page.goto(path);
    await overflow(page);
  }
  await page.getByRole('slider', { name: 'Page reading text size' }).fill('36');
  await overflow(page);
  await page.getByRole('button', { name: 'Open practice room' }).click();
  await overflow(page);
  await page.keyboard.press('Escape');
  await page.goto('/');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await overflow(page);
});
for (const theme of ['light', 'dark'])
  test(`library filters and karaoke studio accessibility in ${theme}`, async ({ page }) => {
    await page.goto('/');
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await page.getByRole('button', { name: 'Save A little light', exact: true }).click();
    const navigate = async (name: RegExp) => {
      if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('button', { name })
        .click();
    };
    for (const name of [/Your library/, /Karaoke studio/]) {
      await navigate(name);
      const a = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(a.violations).toEqual([]);
      await overflow(page);
    }
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(a.violations).toEqual([]);
    await overflow(page);
  });
test('real credit pages save to local library and named collections', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Your library/ })
    .click();
  await page.getByRole('textbox', { name: 'New collection name' }).fill('Real credits');
  await page.getByRole('button', { name: 'Create collection' }).click();
  await page.goto('/songs/munbe-vaa/');
  await page.getByRole('button', { name: 'Save Munbe Vaa', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Add this work to collection' })
    .selectOption('Real credits');
  await expect(page.getByRole('button', { name: 'Unsave Munbe Vaa', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Unsave Munbe Vaa', exact: true })).toBeVisible();
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Your library/ })
    .click();
  await page.getByRole('button', { name: 'Real credits · 1', exact: true }).click();
  await expect(page.locator('.song-card')).toHaveCount(1);
  await expect(page.locator('.song-title')).toHaveText('Munbe Vaa');
});
test('unpublished imported metadata has a truthful local inspector, not a fake public route', async ({
  page,
}) => {
  await page.goto('/');
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Make it yours' }).click();
  const { REAL_RECORDINGS } = await import('../src/realCatalogue');
  const song = {
    ...REAL_RECORDINGS[0],
    id: 'session-only-fact-preview',
    title: 'Session fact preview',
  };
  await page
    .getByRole('dialog')
    .locator('input[type=file]')
    .setInputFiles({
      name: 'metadata.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify([song])),
    });
  await page.keyboard.press('Escape');
  if (await page.getByRole('button', { name: 'Close navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search songs, artists, albums and lyrics metadata' })
    .fill('Session fact preview');
  await page
    .getByRole('button', { name: 'View credits for Session fact preview', exact: true })
    .click();
  await expect(page.getByRole('dialog', { name: 'Session metadata preview' })).toContainText(
    'IMPORT · UNVERIFIED',
  );
  await expect(page.getByRole('dialog')).toContainText('no public URL');
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Play rehearsal' }),
  ).toHaveCount(0);
  await expect(page).toHaveURL('/');
});

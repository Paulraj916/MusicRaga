import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { DEMO_SONGS } from '../src/catalogue';
async function nav(page: import('@playwright/test').Page, name: string) {
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('discovery search filter sort and clear work', async ({ page }) => {
  await expect(page.locator('.song-card')).toHaveCount(18);
  await page.getByRole('button', { name: 'Tamil', exact: true }).click();
  await expect(page.locator('.song-card')).toHaveCount(13);
  await page.getByRole('combobox', { name: 'Sort songs' }).selectOption('oldest');
  await expect(page.locator('.song-title').first()).toHaveText('Chinna Chinna Asai');
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Search songs, artists, albums and lyrics metadata' })
    .fill('Rahman');
  await expect(page.locator('.song-card')).toHaveCount(3);
  await page
    .getByRole('textbox', { name: 'Search songs, artists, albums and lyrics metadata' })
    .fill('unfindable-song-name');
  await expect(page.getByText('No words found. Yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset discovery' }).click();
  await expect(page.locator('.song-card')).toHaveCount(18);
});
test('advanced schema filters are honest and functional', async ({ page }) => {
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const d = page.getByRole('dialog');
  await expect(d.locator('.dimension')).toHaveCount(96);
  await expect(d.getByRole('combobox', { name: 'Raga', exact: true })).toBeDisabled();
  await d.getByRole('combobox', { name: 'Composer', exact: true }).selectOption('Mira Vaan');
  await d.getByRole('combobox', { name: 'Language', exact: true }).selectOption('Tamil');
  await d.getByRole('button', { name: /Show .* songs/ }).click();
  await expect(page.locator('.song-card')).toHaveCount(4);
});
test('reader has script tabs timed seeking and accessible dismissal', async ({ page }) => {
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  const d = page.getByRole('dialog', { name: 'The lyric room' });
  await expect(d).toBeVisible();
  await expect(d.getByRole('tabpanel')).toHaveAttribute('lang', 'ta');
  await d.getByRole('tab', { name: 'English', exact: true }).click();
  await expect(d.getByRole('tabpanel')).toContainText('In the gentle breeze');
  await d.getByRole('tab', { name: 'Thanglish', exact: true }).click();
  await expect(d.getByRole('tabpanel')).toContainText('Mella varum kaatril');
  await d.getByRole('button', { name: /Seek to 0:12/ }).click();
  await expect(d.getByRole('slider', { name: 'Playback position' })).toHaveValue('12');
  await d.getByRole('button', { name: 'Play rehearsal' }).click();
  await expect(d.getByRole('button', { name: 'Pause rehearsal' })).toBeVisible();
  await page.waitForTimeout(350);
  await expect
    .poll(async () =>
      Number(await d.getByRole('slider', { name: 'Playback position' }).inputValue()),
    )
    .toBeGreaterThan(12);
  await d.getByRole('button', { name: 'Pause rehearsal' }).click();
  await page.keyboard.press('Escape');
  await expect(d).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Read A little light', exact: true }),
  ).toBeFocused();
});
test('favorites and named collections persist', async ({ page }) => {
  await page.getByRole('button', { name: 'Save A little light', exact: true }).click();
  await nav(page, 'Your library');
  await expect(page.locator('.song-card')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'New collection name' }).fill('Quiet Sunday');
  await page.getByRole('button', { name: 'Create collection' }).click();
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  const d = page.getByRole('dialog');
  if (
    !(await d
      .locator('details')
      .getAttribute('open')
      .then((v) => v !== null))
  )
    await d.locator('summary').click();
  await d.getByRole('combobox', { name: 'Add song to collection' }).selectOption('Quiet Sunday');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Quiet Sunday · 1', exact: true }).click();
  await expect(page.locator('.song-card')).toHaveCount(1);
  await page.reload();
  await nav(page, 'Your library');
  await expect(page.locator('.song-card')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Quiet Sunday · 1' })).toBeVisible();
});
test('theme persists and no horizontal overflow', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('local LRC imports, rejects invalid text, and never uploads', async ({ page }) => {
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  const d = page.getByRole('dialog');
  const file = d.locator('input[type=file][accept=".lrc,text/plain"]');
  await file.setInputFiles({
    name: 'bad.lrc',
    mimeType: 'text/plain',
    buffer: Buffer.from('no timestamps'),
  });
  await expect(d.getByRole('status')).toContainText('No timed lines');
  await file.setInputFiles({
    name: 'original.lrc',
    mimeType: 'text/plain',
    buffer: Buffer.from('[00:00.00]My own words\n[00:08.50]Another original line'),
  });
  await expect(d.getByRole('tabpanel')).toContainText('My own words');
  await d.getByRole('button', { name: /Seek to 0:08/ }).click();
  await expect(d.getByRole('slider', { name: 'Playback position' })).toHaveValue('8.5');
});
test('catalogue import validates then filters new session content', async ({ page }) => {
  if (await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Make it yours' }).click();
  const d = page.getByRole('dialog');
  const f = d.locator('input[type=file]');
  await f.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('[{}]'),
  });
  await expect(d.getByRole('status')).toContainText('Invalid or missing');
  const song = { ...DEMO_SONGS[0], id: 'my-original-track', title: 'My original track' };
  await f.setInputFiles({
    name: 'mine.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([song])),
  });
  await expect(d.getByRole('status')).toContainText('Imported 1 songs');
  await page.keyboard.press('Escape');
  if (await page.getByRole('button', { name: 'Close navigation', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await expect(page.locator('.song-card')).toHaveCount(19);
});
test('direct song URL opens the right reader', async ({ page }) => {
  await page.goto('/#song=blue-hour');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Blue hour', exact: true }),
  ).toBeVisible();
});
test('no serious accessibility violations in discovery and reader', async ({ page }) => {
  const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(home.violations).toEqual([]);
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  const reader = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(reader.violations).toEqual([]);
});
test('captures visual QA and has no runtime errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every word');
  await page.screenshot({
    path: `artifacts/upgraded-${testInfo.project.name}-discovery.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  await page.screenshot({
    path: `artifacts/upgraded-${testInfo.project.name}-reader.png`,
    fullPage: false,
  });
  expect(errors).toEqual([]);
});

test('local audio metadata drives playback and remains private', async ({ page }) => {
  const outbound: string[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith('http') && !r.url().startsWith('http://127.0.0.1:4173'))
      outbound.push(r.url());
  });
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  const d = page.getByRole('dialog');
  // A generated silent PCM WAV is original test material, not a copyrighted recording.
  const length = 16000;
  const wav = Buffer.alloc(44 + length * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + length * 2, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(length * 2, 40);
  await d
    .locator('input[type=file][accept="audio/*"]')
    .setInputFiles({ name: 'my-silence.wav', mimeType: 'audio/wav', buffer: wav });
  await expect(d.getByRole('status')).toContainText('Local audio loaded');
  await expect(d.getByRole('slider', { name: 'Playback position' })).toHaveAttribute('max', '2');
  await d.getByRole('button', { name: 'Play rehearsal' }).click();
  await expect
    .poll(async () =>
      Number(await d.getByRole('slider', { name: 'Playback position' }).inputValue()),
    )
    .toBeGreaterThan(0);
  expect(outbound).toEqual([]);
});
test('keyboard tabs and dark-mode accessibility', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  const home = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(home.violations).toEqual([]);
  await page.getByRole('button', { name: 'Read A little light', exact: true }).click();
  const d = page.getByRole('dialog');
  await d.getByRole('tab', { name: 'Original script' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(d.getByRole('tab', { name: 'English', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('End');
  await expect(d.getByRole('tab', { name: 'Thanglish' })).toBeFocused();
  const reader = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(reader.violations).toEqual([]);
});
test('privacy clearing removes only app library and preserves other storage', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('unrelated-site-key', 'keep'));
  await page.getByRole('button', { name: 'Save A little light', exact: true }).click();
  await page.getByRole('button', { name: 'Privacy', exact: true }).click();
  await page.getByRole('button', { name: 'Clear PowerWords local data' }).click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => localStorage.getItem('pw:favorites'))).toBe(null);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-site-key'))).toBe('keep');
  await nav(page, 'Your library');
  await expect(page.getByText('Your next favourite belongs here.')).toBeVisible();
});
test('mobile navigation contains focus and supports Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile drawer behaviour');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await expect(page.locator('.main-shell')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Navigation' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused();
});

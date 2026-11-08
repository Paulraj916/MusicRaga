import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('optional index fails honestly on a static-only deployment', async ({ page }) => {
  await page.route('**/catalogue/manifest.json', (route) =>
    route.fulfill({ status: 404, body: 'not configured' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Open India index', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'optional catalogue server and static index are unavailable',
  );
  await page.getByRole('button', { name: 'Close The growing India index' }).click();
  await expect(page.getByRole('heading', { name: /Every word/ })).toBeVisible();
});

test('paged native index, contributor selection, coverage and mobile accessibility', async ({
  page,
}) => {
  const queries: string[] = [];
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('coverage'))
      return route.fulfill({
        json: {
          tracks: 2,
          resolved_artists: 1,
          unknown_language: 0,
          unknown_year: 1,
          roles: { singer: 2 },
          sources: { synthetic: 2 },
          languages: [
            { code: 'tam', name: 'Tamil', tracks: 2 },
            { code: 'ben', name: 'Bengali', tracks: 0 },
          ],
        },
      });
    queries.push(url.searchParams.get('q') ?? '');
    const second = url.searchParams.get('cursor') === 'second';
    await route.fulfill({
      json: {
        mode: 'synthetic',
        total: 2,
        next_cursor: second ? null : 'second',
        items: [
          {
            id: second ? 'synthetic-2' : 'synthetic-1',
            title: second ? 'SYNTHETIC SECOND' : 'SYNTHETIC தமிழ் வானம்',
            source: 'synthetic',
            source_url: 'https://example.invalid/synthetic-1',
            year: second ? null : 2020,
            kind: 'recording',
            album: null,
            languages: ['tam'],
            scope_basis: 'SYNTHETIC BROWSER FIXTURE ONLY',
            credits: [
              {
                name: 'SYNTHETIC ARTIST',
                artist_id: 'synthetic:artist:synthetic-1',
                role: 'singer',
              },
            ],
          },
        ],
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open India index', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The growing India index', exact: true });
  await expect(dialog.getByRole('heading', { name: 'SYNTHETIC தமிழ் வானம்' })).toBeVisible();
  await expect(dialog.getByRole('note')).toContainText('not real songs');
  await dialog.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'SYNTHETIC SECOND' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Previous page', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('தமிழ்');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await expect.poll(() => queries.includes('தமிழ்')).toBe(true);
  await dialog.getByRole('button', { name: 'SYNTHETIC ARTIST', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Clear selected artist' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Clear selected artist' }).click();
  await expect(dialog.getByRole('option', { name: /Bengali/ })).toBeDisabled();
  await expect(dialog.getByRole('heading', { name: 'SYNTHETIC தமிழ் வானம்' })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include('.dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

test('real free static shards discover native metadata, artists and linked recordings', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open India index', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The growing India index', exact: true });
  await expect(dialog.getByText(/32,226 indexed entities/)).toBeVisible();
  await expect(dialog.getByText(/Free static preview/)).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('எஞ்சாய்');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Enjoy Enjaami', exact: true })).toBeVisible();
  await page.screenshot({ path: `artifacts/bulk-${test.info().project.name}-native-search.png` });
  await dialog.getByRole('combobox', { name: 'Explore', exact: true }).selectOption('artists');
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('Rahman');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'A. R. Rahman', exact: true })).toBeVisible();
  const artist = dialog
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'A. R. Rahman', exact: true }) });
  await artist
    .getByRole('button', { name: 'Explore linked MusicBrainz credit records' })
    .first()
    .click();
  await expect(dialog.getByRole('button', { name: 'Clear selected artist' })).toBeVisible();
  await dialog.getByRole('combobox', { name: 'Entity type', exact: true }).selectOption('work');
  const linked = dialog.getByRole('button', { name: /Explore \d+ linked recordings/ }).first();
  await expect(linked).toBeVisible();
  await linked.click();
  await expect(
    dialog.getByRole('button', { name: 'Clear composition relationship' }),
  ).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'Entity type', exact: true })).toHaveValue(
    'recording',
  );
  await expect(dialog.getByText(/Language unknown/).first()).toBeVisible();
});

// Retained advanced-workspace regression. Default root search is covered separately.
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('optional index fails honestly on a static-only deployment', async ({ page }) => {
  await page.route('**/catalogue/manifest.json', (route) =>
    route.fulfill({ status: 404, body: 'not configured' }),
  );
  await page.goto('/?workspace=1');
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
  await page.goto('/?workspace=1');
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
  await page.goto('/?workspace=1');
  await page.getByRole('button', { name: 'Open India index', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The growing India index', exact: true });
  await expect(dialog.getByText(/148,372 indexed entities/)).toBeVisible();
  await expect(dialog.getByText(/Free static preview/)).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('எஞ்சாய்');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Enjoy Enjaami', exact: true })).toBeVisible();
  await page.screenshot({ path: `artifacts/bulk-${test.info().project.name}-native-search.png` });
  await dialog.getByRole('combobox', { name: 'Explore', exact: true }).selectOption('artists');
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('Rahman');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await expect(
    dialog.getByRole('heading', { name: 'A. R. Rahman', exact: true }).first(),
  ).toBeVisible();
  const artist = dialog
    .locator('article')
    .filter({ has: page.locator('a[href="https://www.wikidata.org/wiki/Q108560"]') });
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

test('preferred v2 metadata filters explicit vocals separately from generic credit and language evidence', async ({
  page,
}) => {
  await page.goto('/?workspace=1');
  await page.getByRole('button', { name: 'Open India index', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The growing India index', exact: true });
  await expect(
    dialog.getByText(/13,902 recordings with explicit vocal relationships/),
  ).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('Paarkadhe');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await dialog
    .getByRole('combobox', { name: 'Contributor role', exact: true })
    .selectOption('vocal');
  await dialog
    .getByRole('combobox', { name: 'Language association (not sung language)', exact: true })
    .selectOption('tam');
  await expect(
    dialog.getByRole('heading', { name: 'Paarkadhe Paarkadhe', exact: true }).first(),
  ).toBeVisible();
  await expect(
    dialog.getByText(/Neither proves sung language or Indian origin/).first(),
  ).toBeVisible();
  await expect(dialog.getByText(/Language unknown/).first()).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

test('actual v3 composer proofs and truthful recording-linked lyric-pair progress', async ({
  page,
}) => {
  await page.goto('/?workspace=1');
  await page.getByRole('button', { name: 'Open India index', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'The growing India index', exact: true });
  await expect(dialog.getByTestId('recording-coverage')).toHaveText('127,064');
  await expect(dialog.getByTestId('pair-coverage')).toHaveText('0');
  await expect(dialog.getByTestId('metadata-gap')).toHaveText('1,872,936');
  await expect(dialog.getByTestId('pair-gap')).toHaveText('2,000,000');
  await expect(dialog.getByText('not English translation', { exact: true })).toBeVisible();
  await dialog
    .locator('.coverage-panel')
    .screenshot({ path: `artifacts/v3-coverage-counters-${test.info().project.name}.png` });
  await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('Hengaithe');
  await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
  await dialog
    .getByRole('combobox', { name: 'Entity type', exact: true })
    .selectOption('recording');
  await dialog
    .getByRole('combobox', { name: 'Contributor role', exact: true })
    .selectOption('composer');
  const article = dialog
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Hengaithe Maige', exact: true }) })
    .first();
  await expect(article).toBeVisible();
  await article.getByText('Provenance and availability', { exact: true }).click();
  await article.getByRole('button', { name: 'View credit evidence', exact: true }).click();
  await expect(article.getByRole('status')).toContainText('source proof chains');
  await expect(article.getByText(/composer: Brodha V/).first()).toBeVisible();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const axe = await new AxeBuilder({ page })
    .include('.dialog')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: `artifacts/v3-coverage-proofs-${test.info().project.name}.png` });
});

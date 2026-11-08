/** Local public-project-prefix regression only; never drives signed-in or remote services. */
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.PROJECT_TEST_URL ?? 'http://localhost:4174/MusicRaga/';
const url = new URL(origin);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:')
  throw Error('Local project preview only');
await expect
  .poll(
    async () => {
      try {
        return (await fetch(origin)).status;
      } catch {
        return 0;
      }
    },
    { timeout: 15000 },
  )
  .toBe(200);
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 900 }],
    ['mobile', { width: 412, height: 892 }],
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every word');
    await page.getByRole('link', { name: /The Tamil reading room/ }).click();
    await expect(page).toHaveURL(new RegExp('/MusicRaga/songs/tirukkural-invocation/$'));
    const reload = await page.reload();
    assert.equal(reload.status(), 200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tirukkural');
    const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
    assert.equal(canonical, 'https://paulraj916.github.io/MusicRaga/songs/tirukkural-invocation/');
    await page.goto(origin);
    await page.getByRole('button', { name: 'Open India index', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'The growing India index', exact: true });
    await expect(dialog.getByText(/148,372 indexed entities/)).toBeVisible();
    await expect(dialog.getByTestId('recording-coverage')).toHaveText('127,064');
    await expect(dialog.getByTestId('pair-coverage')).toHaveText('0');
    await expect(dialog.getByText(/Free static preview/)).toBeVisible();
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
    await dialog
      .getByRole('combobox', { name: 'Language association (not sung language)', exact: true })
      .selectOption('');
    await dialog
      .getByRole('combobox', { name: 'Contributor role', exact: true })
      .selectOption('composer');
    await dialog
      .getByRole('combobox', { name: 'Entity type', exact: true })
      .selectOption('recording');
    await dialog.getByRole('textbox', { name: 'Native title or artist' }).fill('Hengaithe');
    await dialog.getByRole('button', { name: 'Search index', exact: true }).click();
    const evidenceArticle = dialog
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Hengaithe Maige', exact: true }) })
      .first();
    await expect(evidenceArticle).toBeVisible();
    await evidenceArticle.getByText('Provenance and availability', { exact: true }).click();
    await evidenceArticle
      .getByRole('button', { name: 'View credit evidence', exact: true })
      .click();
    await expect(evidenceArticle.getByRole('status')).toContainText('source proof chains');
    assert(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
    const accessibility = await new AxeBuilder({ page })
      .include('dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    assert.deepEqual(accessibility.violations, []);
    await mkdir('artifacts', { recursive: true });
    await dialog
      .getByRole('heading', { name: 'Hengaithe Maige', exact: true })
      .first()
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'artifacts/project-musicraga-' + name + '.png' });
    assert.deepEqual(errors, []);
    report.push({
      viewport: name,
      clean_route_reload: 200,
      canonical,
      native_source_index: true,
      explicit_vocal_and_association_filter: true,
      composer_proofs_and_zero_cleared_pair_counter: true,
      axe_violations: 0,
      runtime_errors: 0,
    });
    await context.close();
  }
  await writeFile(
    'artifacts/project-host-regression.json',
    JSON.stringify({ passed: true, local_url: origin, states: report }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ passed: true, states: report }, null, 2));
} finally {
  await browser.close();
}

/** Real local-only browser actions. No generated footage, remote service or copyrighted audio. */
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const origin = process.env.DEMO_ORIGIN ?? 'http://127.0.0.1:4173';
const url = new URL(origin);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.protocol !== 'http:')
  throw new Error('Demo recording is restricted to the local test application.');
const stamp = Date.now();
const dir = resolve(`recordings/demo-${stamp}`);
await mkdir(dir, { recursive: true });
await mkdir('artifacts', { recursive: true });
const output = resolve(`../powerwords-upgraded-20261108-demo-${stamp}.mp4`);
const mobileOutput = resolve(`../powerwords-upgraded-20261108-mobile-${stamp}.mp4`);
const browser = await chromium.launch({ headless: true });
const events = [];
const external = [];
const runtimeErrors = [];
async function context(options) {
  const c = await browser.newContext({ ...options, recordVideo: { dir, size: options.viewport } });
  c.on('page', (p) => p.on('pageerror', (error) => runtimeErrors.push(error.message)));
  await c.route('**/*', (route) => {
    const target = route.request().url();
    if (target.startsWith(origin + '/') || target.startsWith('blob:') || target.startsWith('data:'))
      return route.continue();
    external.push(target);
    return route.abort();
  });
  return c;
}
const desktop = await context({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
let page = await desktop.newPage();
page.setDefaultTimeout(12000);
const started = Date.now();
const note = (label) => {
  const entry = { seconds: Number(((Date.now() - started) / 1000).toFixed(1)), label };
  events.push(entry);
  console.log(`${entry.seconds}s ${label}`);
};
const pause = async (ms = 1800) => page.waitForTimeout(ms);
const search = () =>
  page.getByRole('textbox', { name: 'Search songs, artists, albums and lyrics metadata' });
try {
  await page.goto(origin + '/');
  await page.evaluate(() => document.fonts.ready);
  note('Desktop: warm-paper discovery with original record artwork');
  await page.screenshot({ path: 'artifacts/upgraded-demo-desktop-home.png' });
  await pause(2400);
  await page.locator('.curated-shelves').scrollIntoViewIfNeeded();
  note('Curated source-led paths: Rahman, Vada Chennai and Tamil reading room');
  await pause(2300);
  await page.locator('.rahman-shelf').click();
  note('Clean Rahman artist page: sourced works, newest to oldest');
  await pause(2200);
  await page.getByRole('combobox', { name: 'Collection chronology' }).selectOption('oldest');
  await pause(1400);
  await page.getByRole('combobox', { name: 'Collection album' }).selectOption('Roja');
  await page.getByRole('combobox', { name: 'Collection voice' }).selectOption('Sujatha Mohan');
  note('Chronology, album and individual duet-singer filters combine');
  await pause(2000);
  await page.getByRole('link', { name: 'Pudhu Vellai Mazhai', exact: true }).click();
  note('Factual recording credits and visible commercial-lyrics boundary');
  await pause(2300);
  await page.locator('.source-ledger').scrollIntoViewIfNeeded();
  note('Per-record source ledger and permission statement');
  await pause(2200);
  await page.goto(origin + '/');
  await search().fill('Vadachennai ஏன் ஏன் கதை கேட்கிற song');
  await page.locator('.contextual-results').scrollIntoViewIfNeeded();
  note('Mixed Tamil query returns explicitly RELATED album entries; unknown quote is not verified');
  await pause(2700);
  await page.getByRole('link', { name: 'Ennadi Maayavi Nee', exact: true }).click();
  note('Vada Chennai composer is Santhosh Narayanan, not Rahman');
  await pause(2300);
  await page.locator('.rights-gate').scrollIntoViewIfNeeded();
  await pause(2000);
  await page.goto(origin + '/');
  await search().fill('அகர முதல');
  await page.locator('.song-title').click();
  await page.locator('.static-reader').scrollIntoViewIfNeeded();
  note('Ancient public-domain Tamil text: actual clean reading page');
  await pause(2500);
  await page.getByRole('link', { name: 'English rendering', exact: true }).click();
  await page.locator('.static-reader').scrollIntoViewIfNeeded();
  note('Separate crawlable English rendering URL');
  await pause(2200);
  await page.getByRole('link', { name: 'Thanglish / Latin', exact: true }).click();
  await page.locator('.static-reader').scrollIntoViewIfNeeded();
  note('Separate readable Latin / Thanglish version');
  await pause(2100);
  await page.getByRole('button', { name: 'Open practice room' }).click();
  const room = page.getByRole('dialog', { name: 'The lyric room' });
  await room.getByRole('tab', { name: 'English', exact: true }).click();
  await room.getByRole('button', { name: /Seek to 0:12/ }).click();
  await room.getByRole('button', { name: 'Play rehearsal' }).click();
  note('Private silent rehearsal: line seeking and live active-line clock');
  await pause(2400);
  await room.getByRole('button', { name: 'Pause rehearsal' }).click();
  await room.getByRole('spinbutton', { name: 'Sync offset in seconds' }).fill('1');
  note('Manual sync offset without hosted copyrighted audio');
  await pause(1600);
  await page.screenshot({ path: 'artifacts/upgraded-demo-desktop-practice.png' });
  await page.keyboard.press('Escape');
  await page.goto(origin + '/');
  await page.getByRole('button', { name: 'Save A little light', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: /Your library/ })
    .click();
  note('Local favourites and personal collection');
  await pause(1800);
  await page.getByRole('textbox', { name: 'New collection name' }).fill('Words to keep');
  await page.getByRole('button', { name: 'Create collection' }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  note('After-hours theme and local saved library');
  await pause(2300);
  await page.screenshot({ path: 'artifacts/upgraded-demo-desktop-library.png', fullPage: true });
  const desktopVideo = page.video();
  await desktop.close();
  const desktopPath = await desktopVideo.path();
  const phone = await context({ ...devices['Pixel 7'], viewport: { width: 412, height: 915 } });
  page = await phone.newPage();
  page.setDefaultTimeout(12000);
  await page.goto(origin + '/');
  await page.evaluate(() => document.fonts.ready);
  note('Mobile segment: actual 412px phone viewport, responsive home');
  await page.screenshot({ path: 'artifacts/upgraded-demo-mobile-home.png' });
  await pause(2000);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  note('Mobile accessible navigation drawer');
  await pause(1700);
  await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await pause(1200);
  await search().fill('முன்பே வா lyrics');
  await page.locator('.song-title').scrollIntoViewIfNeeded();
  note('Mobile native-script search finds the sourced real recording');
  await pause(1800);
  await page.locator('.song-title').click();
  await page.locator('.rights-gate').scrollIntoViewIfNeeded();
  note('Mobile sourced credit view: honest no-lyrics gate');
  await pause(2000);
  await page.screenshot({ path: 'artifacts/upgraded-demo-mobile-credits.png', fullPage: true });
  await page.goto(origin + '/songs/tirukkural-invocation/translation/');
  await page.locator('.static-reader').scrollIntoViewIfNeeded();
  note('Mobile dark reading folio and text versions');
  await pause(2200);
  await page.getByRole('button', { name: 'Open practice room' }).click();
  await page.getByRole('dialog').getByRole('tab', { name: 'English', exact: true }).click();
  note('Mobile practice room stays ad-free and readable');
  await pause(2200);
  await page.screenshot({ path: 'artifacts/upgraded-demo-mobile-practice.png' });
  const mobileVideo = page.video();
  await phone.close();
  const mobilePath = await mobileVideo.path();
  await browser.close();
  if (runtimeErrors.length) throw new Error('Runtime errors: ' + runtimeErrors.join(', '));
  if (external.length)
    throw new Error('Unexpected non-local network request: ' + external.join(', '));
  const encode = (input, out) =>
    execFileSync(
      'ffmpeg',
      [
        '-nostdin',
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        input,
        '-vf',
        'scale=1280:900:force_original_aspect_ratio=decrease,pad=1280:900:(ow-iw)/2:(oh-ih)/2:color=0x1c201e,setsar=1',
        '-r',
        '30',
        '-c:v',
        'libx264',
        '-threads',
        '2',
        '-preset',
        'fast',
        '-crf',
        '22',
        '-pix_fmt',
        'yuv420p',
        '-an',
        '-movflags',
        '+faststart',
        out,
      ],
      { stdio: 'inherit', timeout: 180000 },
    );
  const desktopMp4 = resolve(dir, 'desktop.mp4');
  encode(desktopPath, desktopMp4);
  encode(mobilePath, mobileOutput);
  const list = resolve(dir, 'concat.txt');
  await writeFile(list, `file '${desktopMp4}'\nfile '${mobileOutput}'\n`);
  execFileSync(
    'ffmpeg',
    [
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      list,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      output,
    ],
    { stdio: 'inherit', timeout: 60000 },
  );
  const probe = JSON.parse(
    execFileSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration,size:stream=codec_name,width,height,r_frame_rate',
        '-of',
        'json',
        output,
      ],
      { encoding: 'utf8' },
    ),
  );
  const report = {
    output,
    mobileOutput,
    desktopWebm: desktopPath,
    mobileWebm: mobilePath,
    origin,
    events,
    externalRequests: external,
    runtimeErrors,
    recordedAtIst:
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date()) + ' IST',
    probe,
    notice:
      'Actual local Playwright interaction capture; silent, no generated footage, no external service or commercial media. Requires human video review; no claim of watching made.',
  };
  await writeFile('artifacts/demo-recording.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output, mobileOutput, probe }, null, 2));
} catch (error) {
  await browser.close();
  throw error;
}

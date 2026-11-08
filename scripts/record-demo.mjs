/** Real local-only browser actions. No generated footage, remote service or copyrighted audio. */
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
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
  // Even CSS/device/video dimensions, DPR 1. Never take screenshots in a live mobile
  // recording: high-DPR/full-page screenshots temporarily resize Chromium's capture surface.
  const phone = await context({
    ...devices['Pixel 7'],
    viewport: { width: 412, height: 892 },
    screen: { width: 412, height: 892 },
    deviceScaleFactor: 1,
  });
  page = await phone.newPage();
  page.setDefaultTimeout(12000);
  page.screenshot = async () => {
    throw new Error(
      'Mobile recording must not resize its capture surface. Use the separate screenshot verification pass.',
    );
  };
  const mobileMeasurements = [];
  async function settled(label) {
    await page.evaluate(() => document.fonts.ready);
    await pause(450);
    const measure = await page.evaluate(() => {
      const dialog = document.querySelector('dialog[open]');
      const h = dialog?.querySelector('.dialog-top')?.getBoundingClientRect();
      return {
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio,
        scale: visualViewport.scale,
        docWidth: document.documentElement.scrollWidth,
        scrollY,
        dialogScroll: dialog?.scrollTop ?? null,
        header: h ? { x: h.x, y: h.y, right: h.right, bottom: h.bottom } : null,
      };
    });
    assert.equal(measure.width, 412);
    assert.equal(measure.height, 892);
    assert.equal(measure.scale, 1);
    assert(measure.docWidth <= 412);
    if (measure.header) {
      assert(
        measure.header.x >= 0 &&
          measure.header.y >= 0 &&
          measure.header.right <= 412 &&
          measure.header.bottom <= 892,
      );
    }
    mobileMeasurements.push({ label, ...measure });
  }
  await page.goto(origin + '/');
  await settled('home');
  note('Mobile: full 412 × 892 CSS-pixel portrait viewport, no crop');
  await pause(1800);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await settled('drawer');
  note('Mobile accessible navigation drawer');
  await pause(1700);
  await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await settled('drawer closed / dark theme');
  await search().fill('முன்பே வா lyrics');
  await settled('native search');
  note('Mobile native-title search: real sourced recording');
  await pause(1900);
  await page.locator('.song-title').click();
  await settled('credits top');
  note('Mobile full recording heading and credited people');
  await pause(2200);
  await page.evaluate(() => window.scrollTo({ top: 620, behavior: 'smooth' }));
  await pause(900);
  await settled('rights gate');
  note('Controlled page scroll: readable commercial-lyrics rights gate');
  await pause(2100);
  await page
    .locator('.route-breadcrumb')
    .getByRole('link', { name: 'Discover', exact: true })
    .click();
  await search().fill('அகர முதல');
  await page.locator('.song-title').click();
  await settled('ancient text page');
  await page.getByRole('link', { name: 'English rendering', exact: true }).click();
  await page.locator('.static-reader').scrollIntoViewIfNeeded();
  await settled('English text folio');
  note('Mobile English rendering at its clean URL');
  await pause(2300);
  await page.getByRole('button', { name: 'Open practice room' }).click();
  await page.getByRole('dialog').getByRole('tab', { name: 'English', exact: true }).click();
  await settled('practice header');
  note('Mobile practice: intact header, artwork, language tabs and scrollable text');
  await pause(2400);
  const mobileRoom = page.getByRole('dialog');
  await mobileRoom
    .getByRole('button', { name: 'Play rehearsal', exact: true })
    .scrollIntoViewIfNeeded();
  await settled('practice playback controls');
  note('Scroll within the room: playback controls remain reachable, close stays sticky');
  await pause(2000);
  await mobileRoom.evaluate((el) => el.scrollTo({ top: 0, behavior: 'smooth' }));
  await pause(900);
  await settled('practice restored top');
  note('Return to intact reader header without zoom or clipping');
  await pause(2400);
  const mobileVideo = page.video();
  await phone.close();
  const mobilePath = await mobileVideo.path();
  await browser.close();
  if (runtimeErrors.length) throw new Error('Runtime errors: ' + runtimeErrors.join(', '));
  if (external.length)
    throw new Error('Unexpected non-local network request: ' + external.join(', '));
  const common = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y'];
  const codec = [
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-threads',
    '2',
    '-preset',
    'fast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-an',
    '-movflags',
    '+faststart',
  ];
  // Standalone mobile stays native portrait. The combined output uses contain+padding,
  // no crop/zoom, and ONE H.264 encode rather than copying mismatched segment headers.
  execFileSync(
    'ffmpeg',
    [...common, '-i', mobilePath, '-vf', 'fps=30,setsar=1', ...codec, mobileOutput],
    { stdio: 'inherit', timeout: 180000 },
  );
  const filters =
    "[0:v]fps=30,scale=1280:900:force_original_aspect_ratio=decrease,pad=1280:900:(ow-iw)/2:(oh-ih)/2:color=0x1c201e,setsar=1,setpts=PTS-STARTPTS[d];[1:v]fps=30,scale=-2:852,pad=1280:900:(ow-iw)/2:(oh-ih)/2:color=0x1c201e,setsar=1,drawbox=x=442:y=23:w=396:h=854:color=0x626456:t=1,drawtext=text='MOBILE / 412 x 892':x=65:y=78:fontsize=20:fontcolor=0xf1eee3,drawtext=text='Full portrait. Real local UI.':x=65:y=113:fontsize=14:fontcolor=0xb4b8a9,setpts=PTS-STARTPTS[m];[d][m]concat=n=2:v=1:a=0[out]";
  execFileSync(
    'ffmpeg',
    [
      ...common,
      '-i',
      desktopPath,
      '-i',
      mobilePath,
      '-filter_complex',
      filters,
      '-map',
      '[out]',
      ...codec,
      output,
    ],
    { stdio: 'inherit', timeout: 180000 },
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
    mobileMeasurements,
    composition:
      'Single H.264 encode; contain/pad only, native 412x892 mobile output; no screenshot APIs during active mobile recording.',
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

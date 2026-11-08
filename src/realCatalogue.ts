import { DEMO_SONGS } from './catalogue';
import type { Song } from './catalogue';
const checked = '2026-11-08';
const roja = 'https://open.spotify.com/album/6ZRZnsZguVEy0P7hngzsbv';
const rojaCredits = 'https://en.wikipedia.org/wiki/Roja_(soundtrack)';
const vadaCredits = 'https://en.wikipedia.org/wiki/Vada_Chennai_(soundtrack)';
const song = (s: Omit<Song, 'rights'>): Song => ({
  ...s,
  rights: {
    status: 'metadata-only',
    holder: 'Not licensed by Music Raga',
    evidence:
      'Only independently stated factual title/credit/year metadata is included. No commercial lyric text, translation, transliteration, cover photo or audio is reproduced. Source facts and disagreements are documented in docs/REAL_CATALOGUE.md.',
  },
});
/** Individually sourced facts, not scraped commercial lyrics or copied editorial descriptions. */
export const REAL_RECORDINGS: Song[] = [
  song({
    id: 'chinna-chinna-asai',
    title: 'Chinna Chinna Asai',
    nativeTitle: 'சின்ன சின்ன ஆசை',
    album: 'Roja',
    artist: 'Minmini',
    composer: 'A. R. Rahman',
    lyricist: 'Vairamuthu',
    year: 1992,
    language: 'Tamil',
    color: '#bc936e',
    artwork: 'sun',
    duration: 295,
    lyrics: {},
    kind: 'recording',
    description:
      'A Tamil recording from Roja, with music by A. R. Rahman and vocals by Minmini. This entry documents sourced credits and the 1992 album year; its commercial lyrics and audio are not licensed here.',
    credits: [
      { name: 'Minmini', role: 'singer' },
      { name: 'A. R. Rahman', role: 'composer' },
      { name: 'Vairamuthu', role: 'lyricist' },
    ],
    aliases: ['Chinna Chinna Aasai', 'ரோஜா', 'ஏ. ஆர். ரஹ்மான்', 'AR Rahman', 'ஏ. ஆர். ரகுமான்'],
    metadata: {
      film: 'Roja',
      catalogueType: 'Sourced recording',
      sourceType: 'Streaming catalogue + credit cross-check',
      rightsStatus: 'Metadata only',
      originalAvailable: 'No',
      translationAvailable: 'No',
      transliterationAvailable: 'No',
      timedLyrics: 'No',
      audioAvailable: 'Not hosted',
      decade: '1990s',
      script: 'Tamil',
    },
    sources: [
      {
        label: 'Tamil Wikipedia · Roja title cross-check',
        url: 'https://ta.wikipedia.org/wiki/ரோஜா_(திரைப்படம்)',
        supports:
          'Tamil title spelling only; singer scope follows the cited streaming/English credit listing, not a complete session-personnel claim',
        checked: '2026-11-08',
      },
      {
        label: 'Spotify · Roja',
        url: roja,
        supports: 'Title, credited artists, 1992 album listing and 4:55 duration',
        checked,
      },
      {
        label: 'Roja soundtrack · credit cross-check',
        url: rojaCredits,
        supports: 'Music by A. R. Rahman, lyricist Vairamuthu and singer Minmini',
        checked,
      },
    ],
  }),
  song({
    id: 'pudhu-vellai-mazhai',
    title: 'Pudhu Vellai Mazhai',
    nativeTitle: 'புது வெள்ளை மழை',
    album: 'Roja',
    artist: 'Unni Menon · Sujatha Mohan',
    composer: 'A. R. Rahman',
    lyricist: 'Vairamuthu',
    year: 1992,
    language: 'Tamil',
    color: '#8ea5aa',
    artwork: 'wave',
    duration: 316,
    lyrics: {},
    kind: 'recording',
    description:
      'Pudhu Vellai Mazhai is a Tamil duet from the 1992 Roja soundtrack. The sourced credits identify A. R. Rahman, Unni Menon, Sujatha Mohan and Vairamuthu. Lyrics and recordings remain with their respective rights holders.',
    credits: [
      { name: 'Unni Menon', role: 'singer' },
      { name: 'Sujatha Mohan', role: 'singer' },
      { name: 'A. R. Rahman', role: 'composer' },
      { name: 'Vairamuthu', role: 'lyricist' },
    ],
    aliases: ['ரோஜா', 'AR Rahman', 'ஏ. ஆர். ரகுமான்', 'ஏ. ஆர். ரஹ்மான்'],
    metadata: {
      film: 'Roja',
      catalogueType: 'Sourced recording',
      sourceType: 'Streaming catalogue + credit cross-check',
      rightsStatus: 'Metadata only',
      vocalArrangement: 'Duet',
      originalAvailable: 'No',
      translationAvailable: 'No',
      transliterationAvailable: 'No',
      timedLyrics: 'No',
      audioAvailable: 'Not hosted',
      decade: '1990s',
      script: 'Tamil',
    },
    sources: [
      {
        label: 'Tamil Wikipedia · Roja title cross-check',
        url: 'https://ta.wikipedia.org/wiki/ரோஜா_(திரைப்படம்)',
        supports: 'Tamil song-title spelling and album association',
        checked: '2026-11-08',
      },
      {
        label: 'Spotify · Roja',
        url: roja,
        supports: 'Song title, Unni Menon/Sujatha credits, 1992 and 5:16 duration',
        checked,
      },
      {
        label: 'Roja soundtrack · credit cross-check',
        url: rojaCredits,
        supports: 'Composer, lyricist and full singer names',
        checked,
      },
    ],
  }),
  song({
    id: 'munbe-vaa',
    title: 'Munbe Vaa',
    nativeTitle: 'முன்பே வா',
    album: 'Sillunu Oru Kaadhal',
    artist: 'Shreya Ghoshal · Naresh Iyer',
    composer: 'A. R. Rahman',
    lyricist: 'Vaali',
    year: 2006,
    language: 'Tamil',
    color: '#b99d9b',
    artwork: 'petal',
    duration: 359,
    lyrics: {},
    kind: 'recording',
    description:
      'A Tamil duet from Sillunu Oru Kaadhal, composed by A. R. Rahman and sung by Shreya Ghoshal and Naresh Iyer. This page provides sourced recording facts, not a licensed lyric reproduction.',
    credits: [
      { name: 'Shreya Ghoshal', role: 'singer' },
      { name: 'Naresh Iyer', role: 'singer' },
      { name: 'A. R. Rahman', role: 'composer' },
      { name: 'Vaali', role: 'lyricist' },
    ],
    aliases: [
      'முன்பேவா',
      'முன்பே வா என் அன்பே',
      'சில்லுனு ஒரு காதல்',
      'AR Rahman',
      'ஏ. ஆர். ரகுமான்',
      'ஏ. ஆர். ரஹ்மான்',
    ],
    metadata: {
      film: 'Sillunu Oru Kaadhal',
      catalogueType: 'Sourced recording',
      sourceType: 'Streaming catalogue + credit cross-check',
      rightsStatus: 'Metadata only',
      vocalArrangement: 'Duet',
      originalAvailable: 'No',
      translationAvailable: 'No',
      transliterationAvailable: 'No',
      timedLyrics: 'No',
      audioAvailable: 'Not hosted',
      decade: '2000s',
      script: 'Tamil',
    },
    sources: [
      {
        label: 'Tamil Wikipedia · Sillunu Oru Kaadhal',
        url: 'https://ta.wikipedia.org/wiki/சில்லுனு_ஒரு_காதல்',
        supports:
          'Tamil title spelling (listed in expanded form), duet singers and soundtrack association',
        checked: '2026-11-08',
      },
      {
        label: 'Apple Music · Munbe Vaa',
        url: 'https://music.apple.com/us/song/munbe-vaa/1706006701',
        supports: 'Title, album, credited artists and 2006 listing',
        checked,
      },
      {
        label: 'Sillunu Oru Kaadhal · soundtrack credits',
        url: 'https://en.wikipedia.org/wiki/Sillunu_Oru_Kaadhal#Soundtrack',
        supports:
          'Composer, singer roles, Vaali lyric credit and 5:59 duration; exact day differs from Apple, so only year is used',
        checked,
      },
    ],
  }),
  song({
    id: 'ennadi-maayavi-nee',
    title: 'Ennadi Maayavi Nee',
    nativeTitle: 'என்னடி மாயாவி நீ',
    album: 'Vada Chennai',
    artist: 'Sid Sriram',
    composer: 'Santhosh Narayanan',
    lyricist: 'Vivek',
    year: 2018,
    language: 'Tamil',
    color: '#899e86',
    artwork: 'moon',
    duration: 251,
    lyrics: {},
    kind: 'recording',
    description:
      'A Tamil song from Vada Chennai, composed by Santhosh Narayanan, sung by Sid Sriram and written by Vivek. Only sourced metadata is displayed. A. R. Rahman is not the composer of this soundtrack.',
    credits: [
      { name: 'Sid Sriram', role: 'singer' },
      { name: 'Santhosh Narayanan', role: 'composer' },
      { name: 'Vivek', role: 'lyricist' },
    ],
    aliases: [
      'VadaChennai',
      'Vadachennai',
      'வடசென்னை',
      'வட சென்னை',
      'சந்தோஷ் நாராயணன்',
      'என்னடி மாயாவிநீ',
    ],
    metadata: {
      film: 'Vada Chennai',
      catalogueType: 'Sourced recording',
      sourceType: 'Streaming catalogue + soundtrack credits',
      rightsStatus: 'Metadata only',
      originalAvailable: 'No',
      translationAvailable: 'No',
      transliterationAvailable: 'No',
      timedLyrics: 'No',
      audioAvailable: 'Not hosted',
      decade: '2010s',
      script: 'Tamil',
    },
    sources: [
      {
        label: 'BBC Tamil · native title and credits',
        url: 'https://www.bbc.com/tamil/articles/c2k242q77n1o',
        supports:
          'Tamil title, Vada Chennai association, Sid Sriram, Santhosh Narayanan and Vivek; no article prose or lyrics reproduced',
        checked: '2026-11-08',
      },
      {
        label: 'Apple Music · Ennadi Maayavi Nee',
        url: 'https://music.apple.com/us/song/ennadi-maayavi-nee-from-vadachennai/1702588440',
        supports:
          'Title, soundtrack, named credits and 2018; store dates differ from album launch, so no exact date is claimed',
        checked,
      },
      {
        label: 'Vada Chennai · soundtrack credit table',
        url: vadaCredits,
        supports: 'Santhosh Narayanan composer; Sid Sriram singer; Vivek lyricist; 4:11 duration',
        checked,
      },
    ],
  }),
  song({
    id: 'goindhammavaala',
    title: 'Goindhammavaala',
    nativeTitle: 'கோயிந்தம்மாவால',
    album: 'Vada Chennai',
    artist: 'Dhanush',
    composer: 'Santhosh Narayanan',
    lyricist: 'Rokesh',
    year: 2018,
    language: 'Tamil',
    color: '#b58e72',
    artwork: 'wave',
    duration: 278,
    lyrics: {},
    kind: 'recording',
    description:
      'A sourced entry for Goindhammavaala from Vada Chennai. Dhanush is the singer, Santhosh Narayanan the composer, and Rokesh the lyricist. No lyrics, translated text, commercial artwork or recording is hosted.',
    credits: [
      { name: 'Dhanush', role: 'singer' },
      { name: 'Santhosh Narayanan', role: 'composer' },
      { name: 'Rokesh', role: 'lyricist' },
    ],
    aliases: ['Goindhammavala', 'VadaChennai', 'Vadachennai', 'வடசென்னை', 'வட சென்னை'],
    metadata: {
      film: 'Vada Chennai',
      catalogueType: 'Sourced recording',
      sourceType: 'Streaming catalogue + soundtrack credits',
      rightsStatus: 'Metadata only',
      originalAvailable: 'No',
      translationAvailable: 'No',
      transliterationAvailable: 'No',
      timedLyrics: 'No',
      audioAvailable: 'Not hosted',
      decade: '2010s',
      script: 'Tamil',
    },
    sources: [
      {
        label: 'Indian Express Tamil · title cross-check',
        url: 'https://tamil.indianexpress.com/videos/news-video/actor-dhanush-starrer-vada-chennai-audio-track-list-is-out/',
        supports:
          'Tamil title spelling, soundtrack association and Santhosh Narayanan composer; no article prose or lyric quotation reproduced',
        checked: '2026-11-08',
      },
      {
        label: 'Amazon Music · Goindhammavaala',
        url: 'https://music.amazon.in/tracks/B0CFNBVM5T',
        supports: 'Title, album, named credits, year and 4:38 duration; no source lyrics copied',
        checked,
      },
      {
        label: 'Vada Chennai · soundtrack credit table',
        url: vadaCredits,
        supports: 'Dhanush singer, Rokesh lyricist and Santhosh Narayanan composer',
        checked,
      },
    ],
  }),
];
export const PUBLIC_VERSE: Song = {
  id: 'tirukkural-invocation',
  title: 'Tirukkural · The first three couplets',
  nativeTitle: 'திருக்குறள் · கடவுள் வாழ்த்து',
  album: 'Tirukkural',
  artist: 'Thiruvalluvar (attributed)',
  composer: 'Not specified — text only',
  lyricist: 'Thiruvalluvar (attributed)',
  year: null,
  language: 'Tamil',
  color: '#b4b58b',
  artwork: 'petal',
  duration: 36,
  kind: 'verse',
  description:
    'Read the first three couplets of the ancient Tamil Tirukkural in their original script, alongside a new Music Raga English rendering and readable Latin transliteration. This is a text edition, not the lyrics or audio of a modern recorded adaptation. The ancient date is uncertain and is not presented as a modern release year.',
  lyrics: {
    original: [
      { time: 0, text: 'அகர முதல எழுத்தெல்லாம் ஆதி' },
      { time: 6, text: 'பகவன் முதற்றே உலகு.' },
      { time: 12, text: 'கற்றதனால் ஆய பயனென்கொல் வாலறிவன்' },
      { time: 18, text: 'நற்றாள் தொழாஅர் எனின்.' },
      { time: 24, text: 'மலர்மிசை ஏகினான் மாணடி சேர்ந்தார்' },
      { time: 30, text: 'நிலமிசை நீடுவாழ் வார்.' },
    ],
    translation: [
      { time: 0, text: 'As the letters begin with A,' },
      { time: 6, text: 'the world begins with the primal divine.' },
      { time: 12, text: 'What fruit does learning bring, if one does not bow' },
      { time: 18, text: 'at the good feet of flawless wisdom?' },
      { time: 24, text: 'Those who reach the honoured feet of the one upon the flower' },
      { time: 30, text: 'will live enduringly upon the earth.' },
    ],
    transliteration: [
      { time: 0, text: 'Agara mudhala ezhuthellaam aadhi' },
      { time: 6, text: 'Bhagavan mudhatre ulagu.' },
      { time: 12, text: 'Katradhanaal aaya payanenkol vaalarivan' },
      { time: 18, text: 'Natraal thozhaa ar enin.' },
      { time: 24, text: 'Malarmisai eginaan maanadi serndhaar' },
      { time: 30, text: 'Nilamisai needuvaazh vaar.' },
    ],
  },
  credits: [{ name: 'Thiruvalluvar (attributed)', role: 'lyricist' }],
  aliases: ['திருவள்ளுவர்', 'திருக்குறள்', 'அகர முதல', 'Tirukural', 'Thirukkural'],
  metadata: {
    catalogueType: 'Public-domain verse',
    rightsStatus: 'Ancient underlying text: public domain',
    sourceType: 'Ancient text + scanned source',
    originalAvailable: 'Yes',
    translationAvailable: 'Yes',
    transliterationAvailable: 'Yes',
    timedLyrics: 'Practice timing only',
    audioAvailable: 'User-provided only',
    script: 'Tamil',
    translationLanguage: 'English',
    transliterationSystem: 'Music Raga readable Latin',
    readingLevel: 'Classical Tamil',
    karaoke: 'Silent recitation / local media',
  },
  rights: {
    status: 'public-domain',
    holder: 'Ancient Tamil underlying text; no modern recording rights granted',
    evidence:
      'Original ancient text predates modern copyright by centuries. Source: Tamil Wikisource scanned text page 9, cross-checked against Project Madurai. No modern commentary or existing translation is copied. New project English/Latin renderings and artificial practice timing are dedicated under CC0-1.0. India/US term analysis and source-edition caveats: docs/REAL_CATALOGUE.md.',
  },
  sources: [
    {
      label: 'Tamil Wikisource · scanned text, page 9',
      url: 'https://ta.wikisource.org/wiki/பக்கம்:திருக்குறள்,_மூலம்.pdf/9',
      supports: 'Underlying Tamil words of couplets 1–3; no modern editorial commentary copied',
      checked,
    },
    {
      label: 'Project Madurai · Tirukkural',
      url: 'https://www.projectmadurai.org/pm_etexts/utf8/pmuni0001.html',
      supports: 'Independent textual cross-check only; the electronic file is not redistributed',
      checked,
    },
    {
      label: 'Britannica · Tirukkural',
      url: 'https://kids.britannica.com/scholars/article/Tirukkural/100030',
      supports:
        'Ancient work attributed to Thiruvalluvar; dating is debated, so no fabricated year is supplied',
      checked,
    },
  ],
};
export const CATALOGUE: Song[] = [...REAL_RECORDINGS, PUBLIC_VERSE, ...DEMO_SONGS];
export const isReadable = (s: Song) =>
  Object.values(s.lyrics).some((lines) => lines && lines.length > 0);
export const isDemo = (s: Song) => s.rights.status === 'original-demo';
export const recordLabel = (s: Song) =>
  isDemo(s)
    ? 'ORIGINAL DEMO'
    : s.rights.status === 'metadata-only'
      ? 'SOURCED · METADATA ONLY'
      : s.rights.status === 'public-domain'
        ? 'PUBLIC-DOMAIN VERSE'
        : 'IMPORT · UNVERIFIED';

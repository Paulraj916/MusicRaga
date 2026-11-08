/** Original fictional demonstration catalogue. No real artist credits or commercial lyrics. */
export type Variant = 'original' | 'translation' | 'transliteration';
export interface LyricLine {
  time: number;
  text: string;
}
export interface Song {
  id: string;
  title: string;
  nativeTitle: string;
  album: string;
  artist: string;
  composer: string;
  lyricist: string;
  year: number | null;
  language: string;
  color: string;
  artwork: 'sun' | 'wave' | 'moon' | 'petal';
  duration: number;
  lyrics: Partial<Record<Variant, LyricLine[]>>;
  metadata: Record<string, string>;
  rights: {
    status: 'original-demo' | 'licensed' | 'metadata-only' | 'public-domain';
    holder: string;
    evidence: string;
  };
  kind?: 'recording' | 'verse';
  description?: string;
  credits?: { name: string; role: 'singer' | 'composer' | 'lyricist' }[];
  sources?: { label: string; url: string; supports: string; checked: string }[];
  aliases?: string[];
}
export interface FilterDimension {
  key: string;
  label: string;
  group: string;
}
const dimensions: Record<string, string[]> = {
  'People & credits': [
    'artist:Singer / artist',
    'composer:Composer',
    'lyricist:Lyricist',
    'producer:Producer',
    'arranger:Arranger',
    'conductor:Conductor',
    'featuredArtist:Featured artist',
    'vocalGroup:Vocal group',
    'instrumentalist:Instrumentalist',
    'mixEngineer:Mix engineer',
    'masteringEngineer:Mastering engineer',
    'recordingEngineer:Recording engineer',
  ],
  'Release & catalogue': [
    'album:Album',
    'year:Release year',
    'decade:Decade',
    'releaseType:Release type',
    'label:Label',
    'independent:Independent release',
    'catalogueType:Catalogue type',
    'edition:Edition',
    'series:Series',
    'trackNumber:Track number',
    'discNumber:Disc number',
    'recordingYear:Recording year',
  ],
  'Language & region': [
    'language:Language',
    'script:Writing system',
    'country:Country',
    'region:Region',
    'dialect:Dialect',
    'translationLanguage:Translation language',
    'transliterationSystem:Transliteration system',
    'multilingual:Multilingual',
    'originCity:Origin city',
    'languageFamily:Language family',
  ],
  'Sound & composition': [
    'genre:Genre',
    'subgenre:Subgenre',
    'mood:Mood',
    'energy:Energy',
    'tempo:Tempo band',
    'bpm:BPM',
    'key:Musical key',
    'mode:Mode',
    'timeSignature:Time signature',
    'raga:Raga',
    'tala:Tala',
    'instrument:Lead instrument',
    'acoustic:Acoustic / electronic',
    'vocalStyle:Vocal style',
    'vocalArrangement:Vocal arrangement',
    'productionStyle:Production style',
    'danceability:Danceability',
    'intensity:Intensity',
  ],
  'Words & reading': [
    'theme:Lyrical theme',
    'perspective:Perspective',
    'structure:Song structure',
    'rhyme:Rhyme pattern',
    'explicit:Explicit content',
    'originalAvailable:Original script',
    'translationAvailable:English translation',
    'transliterationAvailable:Transliteration',
    'timedLyrics:Timed lyrics',
    'lyricLength:Lyric length',
    'readingLevel:Reading level',
    'verified:Editorial review',
  ],
  'Context & discovery': [
    'occasion:Occasion',
    'season:Season',
    'timeOfDay:Time of day',
    'activity:Activity',
    'setting:Setting',
    'audience:Audience',
    'era:Musical era',
    'film:Film',
    'director:Film director',
    'actor:Featured actor',
    'award:Award',
    'chart:Chart',
  ],
  'Versions & access': [
    'version:Version',
    'live:Live / studio',
    'remix:Remix',
    'cover:Cover / original',
    'duet:Duet',
    'instrumental:Instrumental',
    'durationBand:Duration',
    'audioAvailable:Audio availability',
    'karaoke:Karaoke readiness',
    'musicVideo:Music video',
    'spatialAudio:Spatial audio',
    'lossless:Lossless audio',
  ],
  'Rights & provenance': [
    'rightsStatus:Rights status',
    'rightsHolder:Rights holder',
    'sourceType:Source type',
    'territory:Licensed territory',
    'commercialUse:Commercial use',
    'translationRights:Translation rights',
    'syncRights:Synchronisation rights',
    'attribution:Attribution requirement',
  ],
};
export const FILTER_DIMENSIONS: FilterDimension[] = Object.entries(dimensions).flatMap(
  ([group, values]) =>
    values.map((value) => {
      const [key, label] = value.split(':');
      return { key, label, group };
    }),
);
const original = [
  'மெல்ல வரும் காற்றில் ஒரு புதிய பாதை',
  'சின்ன ஒளி சேர்த்து நாம் நடக்கும் நேரம்',
  'வானம் வரை செல்லும் நம் கனவின் ஓசை',
  'நாளை ஒரு பாடல் இன்று அதன் வாசல்',
];
const english = [
  'In the gentle breeze, a new path appears',
  'We walk together, gathering little lights',
  'Our dreaming voices reach toward the sky',
  'Tomorrow is a song; today, its open door',
];
const tanglish = [
  'Mella varum kaatril oru pudhiya paadhai',
  'Chinna oli serththu naam nadakkum neram',
  'Vaanam varai sellum nam kanavin osai',
  'Naalai oru paadal indru adhan vaasal',
];
const hindi = [
  'धीमी हवा में नया रास्ता मिले',
  'छोटी रोशनी लेकर हम साथ चलें',
  'सपनों की आवाज़ आसमान छुए',
  'कल एक गीत है, आज उसका द्वार',
];
const hindiRoman = [
  'Dheemi hawa mein naya raasta mile',
  'Chhoti roshni lekar hum saath chalein',
  'Sapnon ki aawaaz aasmaan chhuye',
  'Kal ek geet hai, aaj uska dwaar',
];
const telugu = [
  'చల్లని గాలిలో కొత్త దారి కనిపించే',
  'చిన్న వెలుగులతో మన అడుగులు కలిసే',
  'మన కలల స్వరం ఆకాశాన్ని చేరే',
  'రేపు ఒక పాట నేడు దాని తలుపు',
];
const teluguRoman = [
  'Challani gaalilo kottha daari kanipinche',
  'Chinna velugulatho mana adugulu kalise',
  'Mana kalala swaram aakaashaanni chere',
  'Repu oka paata nedu daani thalupu',
];
const lines = (texts: string[]) => texts.map((text, i) => ({ text, time: i * 6 }));
const seeds: [string, string, string, string, string, string, number, Song['artwork'], string][] = [
  [
    'a-little-light',
    'A little light',
    'சின்ன ஒளி',
    'Paper Skies',
    'Mira Vaan',
    'Tamil',
    2026,
    'sun',
    '#e7a56b',
  ],
  [
    'blue-hour',
    'Blue hour',
    'நீல நேரம்',
    'After the Rain',
    'Kavin Sol',
    'Tamil',
    2025,
    'wave',
    '#7b9aa9',
  ],
  [
    'open-windows',
    'Open windows',
    'खुली खिड़कियाँ',
    'Small Beginnings',
    'Nila River',
    'Hindi',
    2026,
    'petal',
    '#c398a2',
  ],
  [
    'somewhere-soft',
    'Somewhere soft',
    'மென்மையான இடம்',
    'Paper Skies',
    'Mira Vaan',
    'Tamil',
    2024,
    'moon',
    '#8a86a4',
  ],
  [
    'new-path',
    'A new path',
    'కొత్త దారి',
    'Letters to Tomorrow',
    'Aadi Moss',
    'Telugu',
    2025,
    'sun',
    '#b2b783',
  ],
  [
    'first-rain',
    'First rain',
    'முதல் மழை',
    'After the Rain',
    'Kavin Sol',
    'Tamil',
    2023,
    'wave',
    '#7c9d88',
  ],
  [
    'a-sky-within',
    'A sky within',
    'एक आकाश',
    'Small Beginnings',
    'Nila River',
    'Hindi',
    2024,
    'moon',
    '#b39a80',
  ],
  [
    'soft-morning',
    'Soft morning',
    'మృదువైన ఉదయం',
    'Letters to Tomorrow',
    'Aadi Moss',
    'Telugu',
    2022,
    'petal',
    '#b8a476',
  ],
  [
    'homeward',
    'Homeward',
    'வீடு நோக்கி',
    'Quiet Cities',
    'Ira Bloom',
    'Tamil',
    2021,
    'sun',
    '#cc826d',
  ],
  [
    'little-worlds',
    'Little worlds',
    'சிறு உலகங்கள்',
    'Quiet Cities',
    'Ira Bloom',
    'Tamil',
    2020,
    'petal',
    '#989cbb',
  ],
  [
    'tomorrow-song',
    'Tomorrow’s song',
    'कल का गीत',
    'Small Beginnings',
    'Nila River',
    'Hindi',
    2023,
    'wave',
    '#799ca4',
  ],
  [
    'evening-postcard',
    'Evening postcard',
    'மாலை அஞ்சல்',
    'Paper Skies',
    'Mira Vaan',
    'Tamil',
    2019,
    'moon',
    '#b3a085',
  ],
];
export const DEMO_SONGS: Song[] = seeds.map(
  ([id, title, nativeTitle, album, artist, language, year, artwork, color], i) => ({
    id,
    title,
    nativeTitle,
    album,
    artist,
    composer: i % 3 === 0 ? 'Mira Vaan' : artist,
    lyricist: 'PowerWords Studio',
    year,
    language,
    artwork,
    color,
    duration: 24,
    lyrics: {
      original: lines(language === 'Tamil' ? original : language === 'Hindi' ? hindi : telugu),
      translation: lines(english),
      transliteration: lines(
        language === 'Tamil' ? tanglish : language === 'Hindi' ? hindiRoman : teluguRoman,
      ),
    },
    metadata: {
      genre: i % 3 === 0 ? 'Indie folk' : i % 3 === 1 ? 'Ambient pop' : 'Acoustic',
      mood: i % 2 === 0 ? 'Hopeful' : 'Reflective',
      energy: 'Gentle',
      tempo: 'Slow',
      independent: 'Yes',
      releaseType: 'Demo EP',
      catalogueType: 'Fictional demonstration',
      decade: `${Math.floor(year / 10) * 10}s`,
      script: language === 'Tamil' ? 'Tamil' : language === 'Hindi' ? 'Devanagari' : 'Telugu',
      translationLanguage: 'English',
      transliterationSystem: 'Readable Latin',
      multilingual: 'No',
      languageFamily: language === 'Hindi' ? 'Indo-Aryan' : 'Dravidian',
      instrument: i % 2 === 0 ? 'Acoustic guitar' : 'Piano',
      acoustic: 'Acoustic',
      vocalArrangement: 'Solo',
      theme: 'Hope & belonging',
      explicit: 'No',
      originalAvailable: 'Yes',
      translationAvailable: 'Yes',
      transliterationAvailable: 'Yes',
      timedLyrics: 'Yes',
      lyricLength: 'Short',
      verified: 'Original demo — not editorially reviewed',
      occasion: 'Everyday listening',
      timeOfDay: i % 2 === 0 ? 'Morning' : 'Evening',
      activity: 'Slow living',
      version: 'Original demo',
      live: 'Studio concept',
      remix: 'No',
      cover: 'Original',
      duet: 'No',
      instrumental: 'No',
      durationBand: 'Under 1 minute',
      audioAvailable: 'User-provided only',
      karaoke: 'Timed text ready',
      rightsStatus: 'Original demo',
      rightsHolder: 'PowerWords demo contributors',
      sourceType: 'Original writing',
      commercialUse: 'CC0 dedication',
      translationRights: 'Original demo — CC0',
      attribution: 'Not required',
    },
    rights: {
      status: 'original-demo',
      holder: 'PowerWords demo contributors',
      evidence:
        'Original text created for this project; CC0-1.0 dedication in docs/CONTENT_RIGHTS.md.',
    },
  }),
);

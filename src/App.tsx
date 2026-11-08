import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  FolderPlus,
  Globe2,
  Headphones,
  Heart,
  Library,
  ListFilter,
  Menu,
  Moon,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { DEMO_SONGS, FILTER_DIMENSIONS } from './catalogue';
import type { Song, Variant } from './catalogue';
import { CATALOGUE, isDemo, isReadable, recordLabel } from './realCatalogue';
import { resolveRoute, songPath, artistPath } from './routes';
import { CataloguePage, CuratedShelves, follow } from './CataloguePage';
import { applySeo } from './seoBrowser';
import {
  activeLine,
  lyricLanguage,
  discoverMatches,
  formatTime,
  optionsFor,
  parseLrc,
  safeLoad,
  saveLocal,
  validateCatalogue,
} from './lib';
import type { Filters } from './lib';

type View = 'discover' | 'library' | 'studio';
type Collection = { name: string; ids: string[] };
const STORAGE_KEYS = ['pw:favorites', 'pw:collections', 'pw:theme', 'pw:font', 'pw:privacy'];
function Cover({ song, small = false }: { song: Song; small?: boolean }) {
  return (
    <div
      className={`cover art-${song.artwork} ${small ? 'small' : ''}`}
      style={{ '--art': song.color } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="art-circle" />
      <span className="art-line" />
      <span className="cover-type">
        {song.album}
        <b>PW / {song.year === null ? 'TEXT' : String(song.year).slice(2)}</b>
      </span>
    </div>
  );
}
function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
      opener.current?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-top">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label={`Close ${title}`}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function AdSpace() {
  return (
    <aside className="ad-space" aria-label="Advertising information">
      <span>ADVERTISEMENTS</span>
      <p>Words first. Always.</p>
      <small>Optional sponsorship lives here — never between your lyrics.</small>
      <span className="ad-tag">Advertising disabled in demo</span>
    </aside>
  );
}

function Reader({
  song,
  onClose,
  saved,
  onSave,
  font,
  setFont,
  collections,
  onAdd,
}: {
  song: Song;
  onClose: () => void;
  saved: boolean;
  onSave: () => void;
  font: number;
  setFont: (n: number) => void;
  collections: Collection[];
  onAdd: (name: string, id: string) => void;
}) {
  const builtIn = DEMO_SONGS.some((item) => item.id === song.id);
  const publicDomain =
    CATALOGUE.some((item) => item.id === song.id) && song.rights.status === 'public-domain';
  const [extrasOpen, setExtrasOpen] = useState(() => window.innerWidth > 480);
  const [variant, setVariant] = useState<Variant>(
    song.lyrics.original ? 'original' : song.lyrics.translation ? 'translation' : 'transliteration',
  );
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [offset, setOffset] = useState(0);
  const [custom, setCustom] = useState<ReturnType<typeof parseLrc> | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioDuration, setAudioDuration] = useState(0);
  const [notice, setNotice] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const lrc = useRef<HTMLInputElement>(null);
  const lines = custom ?? song.lyrics[variant] ?? [];
  const current = activeLine(lines, time, offset);
  const duration =
    audioDuration > 0
      ? audioDuration
      : custom?.length
        ? Math.max(song.duration, custom[custom.length - 1].time + 6)
        : song.duration;
  useEffect(() => {
    if (!playing || audioUrl) return;
    const timer = window.setInterval(() => setTime((t) => Math.min(duration, t + 0.1)), 100);
    return () => window.clearInterval(timer);
  }, [playing, audioUrl, duration]);
  useEffect(() => {
    if (time >= duration && playing && !audioUrl) setPlaying(false);
  }, [time, duration, playing, audioUrl]);
  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );
  const toggle = async () => {
    try {
      if (time >= duration) {
        setTime(0);
        if (audio.current) audio.current.currentTime = 0;
      }
      if (audioUrl && audio.current) {
        if (playing) audio.current.pause();
        else await audio.current.play();
      }
      setPlaying(!playing);
    } catch {
      setNotice('This audio could not be played. Try a supported local audio file.');
      setPlaying(false);
    }
  };
  const seek = (n: number) => {
    const bounded = Math.max(0, Math.min(duration, n));
    setTime(bounded);
    if (audio.current) audio.current.currentTime = bounded;
  };
  async function loadFile(f: File | undefined, isLrc: boolean) {
    if (!f) return;
    if (f.size > (isLrc ? 256_000 : 50_000_000)) {
      setNotice(isLrc ? 'LRC limit is 256 KB.' : 'Audio limit is 50 MB.');
      return;
    }
    if (isLrc) {
      const parsed = parseLrc(await f.text());
      if (!parsed.length) {
        setNotice('No timed lines found. Use [00:00.00]text format.');
        return;
      }
      if (parsed.length > 500 || parsed.some((line) => line.time > 14400)) {
        setNotice('Use up to 500 lines with timestamps within 4 hours.');
        return;
      }
      setCustom(parsed);
      setPlaying(false);
      audio.current?.pause();
      seek(0);
      setNotice('Your LRC is loaded locally. It is not uploaded or saved.');
    } else {
      if (!f.type.startsWith('audio/')) {
        setNotice('Choose an audio file supported by your browser.');
        return;
      }
      setPlaying(false);
      setTime(0);
      setAudioDuration(0);
      setAudioUrl(URL.createObjectURL(f));
      setNotice('Local audio loaded. Nothing leaves your device.');
    }
  }
  return (
    <Dialog title="The lyric room" onClose={onClose} wide>
      <div className="reader-layout">
        <aside className="reader-info">
          <Cover song={song} />
          <span className="eyebrow">
            {publicDomain
              ? 'PUBLIC-DOMAIN VERSE'
              : builtIn
                ? 'ORIGINAL DEMO'
                : 'SESSION IMPORT · UNVERIFIED'}{' '}
            · {song.language.toUpperCase()}
          </span>
          <h3>{song.title}</h3>
          <p>
            {song.artist} · {song.year}
          </p>
          <button className={`button ${saved ? 'saved' : ''}`} onClick={onSave}>
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved to your library' : 'Save to library'}
          </button>
          <details
            className="reader-extras"
            open={extrasOpen}
            onToggle={(e) => setExtrasOpen(e.currentTarget.open)}
          >
            <summary>Credits, collections & music links</summary>
            <dl>
              <dt>Album</dt>
              <dd>{song.album}</dd>
              <dt>Composer</dt>
              <dd>{song.composer}</dd>
              <dt>Words</dt>
              <dd>{song.lyricist}</dd>
            </dl>
            <p className="small-note">
              {publicDomain
                ? 'Ancient original Tamil text; new project English/Latin renderings. Practice timing is artificial. See the clean text page for sources.'
                : builtIn
                  ? 'Fictional credits. These original demo words are shared across example tracks; this is not a commercial release.'
                  : 'Imported credits and rights are uploader assertions, not independently verified. This session preview is not publication.'}
            </p>
            <label className="field-label">
              Add to a collection
              <select
                aria-label="Add song to collection"
                value=""
                onChange={(e) => {
                  if (e.target.value) onAdd(e.target.value, song.id);
                  setNotice('Added to collection.');
                }}
              >
                <option value="">Choose collection</option>
                {collections.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </label>
            <div className="external-links">
              <span>Find music elsewhere</span>
              {['Spotify', 'YouTube', 'Apple Music'].map((service, i) => (
                <a
                  key={service}
                  href={
                    (i === 0
                      ? 'https://open.spotify.com/search/'
                      : i === 1
                        ? 'https://www.youtube.com/results?search_query='
                        : 'https://music.apple.com/us/search?term=') +
                    encodeURIComponent(song.title + ' ' + song.artist)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {service}
                  <ExternalLink size={12} />
                </a>
              ))}
              <small>
                Search links only. Demo titles may have no matches. No account connected.
              </small>
            </div>
          </details>
        </aside>
        <section className="reader-main">
          <div className="reader-heading">
            <div>
              <span className="eyebrow">LET THE WORDS BREATHE</span>
              <h3>{song.nativeTitle}</h3>
            </div>
            <button
              className="icon-button"
              aria-label="Copy displayed lyrics"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lines.map((l) => l.text).join('\n'));
                  setNotice('Displayed lyrics copied.');
                } catch {
                  setNotice('Clipboard is unavailable. Select the text to copy manually.');
                }
              }}
            >
              <Copy size={18} />
            </button>
          </div>
          <div
            className="reader-tabs"
            role="tablist"
            aria-label="Lyrics language"
            onKeyDown={(e) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
              e.preventDefault();
              const tabs = [
                ...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
              ];
              const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
              const next =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? tabs.length - 1
                    : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
              tabs[next]?.focus();
              tabs[next]?.click();
            }}
          >
            {(
              [
                ['original', 'Original script'],
                ['translation', 'English'],
                ['transliteration', song.language === 'Tamil' ? 'Thanglish' : 'Latin script'],
              ] as const
            ).map(([id, label]) => (
              <button
                role="tab"
                tabIndex={variant === id && !custom ? 0 : -1}
                aria-selected={variant === id && !custom}
                aria-controls="lyric-panel"
                id={`tab-${id}`}
                key={id}
                disabled={!song.lyrics[id]}
                onClick={() => {
                  setVariant(id);
                  setCustom(null);
                }}
              >
                {label}
              </button>
            ))}
            {custom && (
              <button
                role="tab"
                tabIndex={0}
                aria-selected={true}
                aria-controls="lyric-panel"
                id="tab-local"
              >
                Local LRC
              </button>
            )}
          </div>
          <div className="reading-controls">
            <label>
              Text size{' '}
              <input
                aria-label="Lyric font size"
                type="range"
                min="18"
                max="36"
                value={font}
                onChange={(e) => setFont(Number(e.target.value))}
              />
            </label>
            <span>
              {custom
                ? 'Your local LRC'
                : publicDomain
                  ? 'Ancient text · project renderings'
                  : !builtIn
                    ? 'Imported text · rights unverified'
                    : variant === 'translation'
                      ? 'Original demo translation'
                      : 'Original writing · CC0'}
            </span>
          </div>
          <div
            id="lyric-panel"
            role="tabpanel"
            aria-labelledby={custom ? 'tab-local' : `tab-${variant}`}
            aria-label={custom ? 'Your local timed lyrics' : undefined}
            className="lyric-lines"
            lang={custom ? 'und' : lyricLanguage(song.language, variant)}
            style={{ fontSize: font }}
          >
            {lines.map((line, i) => (
              <button
                key={`${i}-${line.time}`}
                onClick={() => seek(line.time)}
                className={current === i ? 'current' : ''}
                aria-label={`Seek to ${formatTime(line.time)}: ${line.text}`}
              >
                <span className="line-number">{String(i + 1).padStart(2, '0')}</span>
                {line.text}
              </button>
            ))}
            <div className="end-mark">✳</div>
          </div>
          <div className="karaoke">
            <div className="karaoke-label">
              <span>
                <AudioLines size={15} /> Karaoke practice
              </span>
              <span>
                {audioUrl ? 'Your local audio' : 'Silent text rehearsal · no audio included'}
              </span>
            </div>
            <div className="transport">
              <button
                onClick={toggle}
                className="play-button"
                aria-label={playing ? 'Pause rehearsal' : 'Play rehearsal'}
              >
                {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
              <span>{formatTime(time)}</span>
              <input
                type="range"
                aria-label="Playback position"
                min="0"
                max={duration}
                step="0.1"
                value={Math.min(time, duration)}
                onChange={(e) => seek(Number(e.target.value))}
              />
              <span>{formatTime(duration)}</span>
            </div>
            <div className="local-tools">
              <button className="text-button" onClick={() => file.current?.click()}>
                <Volume2 size={14} />
                Load your audio
              </button>
              <button className="text-button" onClick={() => lrc.current?.click()}>
                <Upload size={14} />
                Import LRC
              </button>
              <label>
                Sync offset{' '}
                <input
                  aria-label="Sync offset in seconds"
                  type="number"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={offset}
                  onChange={(e) => setOffset(Math.max(-10, Math.min(10, Number(e.target.value))))}
                />{' '}
                s
              </label>
            </div>
            <input
              hidden
              ref={file}
              type="file"
              accept="audio/*"
              onChange={(e) => void loadFile(e.target.files?.[0], false)}
            />
            <input
              hidden
              ref={lrc}
              type="file"
              accept=".lrc,text/plain"
              onChange={(e) => void loadFile(e.target.files?.[0], true)}
            />
            {audioUrl && (
              <audio
                ref={audio}
                src={audioUrl}
                onLoadedMetadata={() =>
                  setAudioDuration(
                    Number.isFinite(audio.current?.duration) ? audio.current!.duration : 0,
                  )
                }
                onTimeUpdate={() => setTime(audio.current?.currentTime ?? 0)}
                onEnded={() => setPlaying(false)}
                onError={() => {
                  setPlaying(false);
                  setNotice('Audio format not supported. Please choose another file.');
                }}
              />
            )}
          </div>
          <p className="notice" role="status">
            {notice || 'Tip: select a lyric line to jump to its timestamp.'}
          </p>
        </section>
      </div>
    </Dialog>
  );
}

export default function App({ initialPath }: { initialPath?: string } = {}) {
  const [path, setPath] = useState(
    initialPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
  );
  const route = resolveRoute(path);
  const [scope, setScope] = useState('all');
  const [view, setView] = useState<View>('discover');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selected, setSelected] = useState<Song | null>(() =>
    typeof window === 'undefined'
      ? null
      : (CATALOGUE.find(
          (song) =>
            isReadable(song) &&
            song.id === new URLSearchParams(window.location.hash.slice(1)).get('song'),
        ) ?? null),
  );
  const [favorites, setFavorites] = useState<string[]>(() => safeLoad('pw:favorites', []));
  const [theme, setTheme] = useState(() => safeLoad('pw:theme', 'light'));
  const [font, setFont] = useState(() => {
    const n = safeLoad('pw:font', 24);
    return Math.min(36, Math.max(18, n));
  });
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem('pw:collections') || '[]');
      return Array.isArray(v)
        ? v.filter(
            (c) =>
              c &&
              typeof c.name === 'string' &&
              Array.isArray(c.ids) &&
              c.ids.every((id: unknown) => typeof id === 'string'),
          )
        : [];
    } catch {
      return [];
    }
  });
  const [collectionName, setCollectionName] = useState('');
  const [activeCollection, setActiveCollection] = useState('all');
  const [info, setInfo] = useState<'guide' | 'privacy' | 'rights' | 'settings' | null>(null);
  const [menu, setMenu] = useState(false);
  const [status, setStatus] = useState('');
  const [imported, setImported] = useState<Song[]>([]);
  const [metadataPreview, setMetadataPreview] = useState<Song | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const importFile = useRef<HTMLInputElement>(null);
  const songs = [...CATALOGUE, ...imported];
  const librarySongs =
    activeCollection === 'all'
      ? songs.filter((s) => favorites.includes(s.id))
      : songs.filter((s) =>
          collections.find((c) => c.name === activeCollection)?.ids.includes(s.id),
        );
  const scoped = songs.filter((s) =>
    scope === 'sourced'
      ? CATALOGUE.some((item) => item.id === s.id) && !isDemo(s)
      : scope === 'readable'
        ? isReadable(s)
        : scope === 'demo'
          ? isDemo(s)
          : true,
  );
  const outcome = discoverMatches(
    view === 'library' ? librarySongs : view === 'studio' ? songs.filter(isReadable) : scoped,
    query,
    filters,
    sort,
  );
  const results = outcome.songs;
  const activeCount = Object.values(filters).filter(Boolean).length;
  useEffect(() => {
    const sync = () =>
      setSelected(
        CATALOGUE.find(
          (song) =>
            isReadable(song) &&
            song.id === new URLSearchParams(window.location.hash.slice(1)).get('song'),
        ) ?? null,
      );
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    const hash = selected ? `#song=${encodeURIComponent(selected.id)}` : '';
    window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
  }, [selected]);
  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname);
      setView('discover');
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    applySeo(path);
  }, [path]);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    const main = document.querySelector<HTMLElement>('.main-shell');
    const nav = document.querySelector<HTMLElement>('.sidebar');
    if (main) main.inert = true;
    nav?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(false);
        return;
      }
      if (e.key === 'Tab') {
        const elements = [...(nav?.querySelectorAll<HTMLElement>('a,button') ?? [])].filter(
          (el) => el.getClientRects().length,
        );
        const index = elements.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && index === 0) {
          e.preventDefault();
          elements.at(-1)?.focus();
        } else if (!e.shiftKey && index === elements.length - 1) {
          e.preventDefault();
          elements[0]?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      if (main) main.inert = false;
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [menu]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    saveLocal('pw:theme', theme);
  }, [theme]);
  useEffect(() => {
    saveLocal('pw:font', font);
  }, [font]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const update = (key: string, value: string) => setFilters((f) => ({ ...f, [key]: value }));
  const toggleSave = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next);
    setStatus(
      saveLocal('pw:favorites', next)
        ? next.includes(id)
          ? 'Saved to your library.'
          : 'Removed from saved songs.'
        : 'Updated for this session; browser storage is unavailable.',
    );
  };
  const persistCollections = (next: Collection[]) => {
    setCollections(next);
    if (!saveLocal('pw:collections', next))
      setStatus('Collection updated for this session; storage is unavailable.');
  };
  const addCollection = (name: string, id: string) =>
    persistCollections(
      collections.map((c) => (c.name === name ? { ...c, ids: [...new Set([...c.ids, id])] } : c)),
    );
  const openSong = (song: Song) => {
    if (isReadable(song)) setSelected(song);
    else if (CATALOGUE.some((item) => item.id === song.id)) navigatePath(songPath(song));
    else setMetadataPreview(song);
  };
  const navigatePath = (nextPath: string) => {
    window.history.pushState(null, '', nextPath);
    setPath(nextPath);
    setView('discover');
    setSelected(null);
    setMenu(false);
    setQuery('');
    setFilters({});
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true }),
    );
  };
  const navigate = (next: View) => {
    if (path !== '/') {
      window.history.pushState(null, '', '/');
      setPath('/');
    }
    setScope('all');
    setView(next);
    setMenu(false);
    setQuery('');
    setFilters({});
  };
  const reset = () => {
    setFilters({});
    setQuery('');
  };
  async function importCatalogue(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) {
      setStatus('Catalogue import limit is 2 MB.');
      return;
    }
    try {
      const parsed = validateCatalogue(JSON.parse(await file.text()));
      if (parsed.some((s) => songs.some((existing) => existing.id === s.id)))
        throw new Error('A song ID already exists. Use unique IDs.');
      setImported((old) => [...old, ...parsed]);
      setStatus(
        `Imported ${parsed.length} songs for this session. Rights assertions need human verification before publication.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read catalogue.');
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside
        className={`sidebar ${menu ? 'mobile-open' : ''}`}
        role={menu ? 'dialog' : undefined}
        aria-modal={menu ? true : undefined}
        aria-label={menu ? 'Navigation' : undefined}
      >
        <a
          href="/"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate('discover');
          }}
          aria-label="PowerWords home"
        >
          <span className="brand-symbol">
            p<span>✳</span>
          </span>
          powerwords<span className="brand-dot">.</span>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className="nav-label">YOUR MUSIC, IN WORDS</div>
        <nav aria-label="Main navigation">
          <button
            className={view === 'discover' ? 'active' : ''}
            onClick={() => navigate('discover')}
          >
            <Sparkles size={19} />
            Discover
            <span className="nav-dot" />
          </button>
          <button
            className={view === 'library' ? 'active' : ''}
            onClick={() => navigate('library')}
          >
            <Library size={19} />
            Your library<span className="nav-count">{favorites.length}</span>
          </button>
          <button className={view === 'studio' ? 'active' : ''} onClick={() => navigate('studio')}>
            <AudioLines size={19} />
            Karaoke studio<span className="new-tag">LOCAL</span>
          </button>
        </nav>
        <div className="sidebar-section">
          <div className="nav-label">EXPLORE LANGUAGES</div>
          {[
            ['Tamil', 'தமிழ்'],
            ['Hindi', 'हिन्दी'],
            ['Telugu', 'తెలుగు'],
          ].map(([language, native]) => (
            <button
              key={language}
              className={`language-nav ${filters.language === language ? 'chosen' : ''}`}
              onClick={() => {
                setView('discover');
                setFilters({ language });
                setQuery('');
                setMenu(false);
              }}
            >
              <span className="language-glyph">{native.slice(0, 1)}</span>
              <span>
                {language}
                <small>{native}</small>
              </span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="quiet-card">
            <span className="quiet-symbol">✳</span>
            <strong>
              A little less noise.
              <br />A little more music.
            </strong>
            <p>
              Made for the words
              <br />
              that stay with you.
            </p>
          </div>
          <button
            onClick={() => {
              setMenu(false);
              setInfo('settings');
            }}
          >
            <Settings2 size={17} />
            Make it yours
          </button>
          <button
            onClick={() => {
              setMenu(false);
              setInfo('guide');
            }}
          >
            <CircleHelp size={17} />A quick introduction
          </button>
          <span className="version">INDEPENDENT SPIRIT. INDIAN SOUL.</span>
        </div>
      </aside>
      {menu && (
        <button
          className="nav-scrim"
          aria-label="Dismiss navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-toggle icon-button"
            aria-label="Open navigation"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Your daily dose of <span>lyrical discovery</span>
            <span className="tiny-star">✳</span>
          </div>
          <div className="top-actions">
            <button
              className="icon-button theme-toggle"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="vertical-rule" />
            <button
              className="profile"
              onClick={() => navigate('library')}
              aria-label="Open your local library"
            >
              Y<span className="profile-dot" />
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {view === 'discover' && route.kind !== 'home' ? (
            <CataloguePage
              key={path}
              route={route}
              onNavigate={navigatePath}
              onOpen={setSelected}
              font={font}
              setFont={setFont}
              saved={route.kind === 'song' && favorites.includes(route.song.id)}
              onToggleSave={toggleSave}
              collections={collections}
              onAddCollection={addCollection}
            />
          ) : (
            <>
              {view === 'discover' && (
                <>
                  <section className="hero">
                    <div className="hero-text">
                      <div className="eyebrow">
                        <span className="orange-dot" /> A HOME FOR EVERY VERSE
                      </div>
                      <h1>
                        Every word,
                        <br />a <em>world.</em>
                      </h1>
                      <p>
                        Go beyond the song. Find the words that move you,
                        <br className="desktop-break" /> in the language that feels like home.
                      </p>
                      <div className="hero-bottom">
                        <span className="script-word">தமிழ்</span>
                        <span className="script-word">हिन्दी</span>
                        <span className="script-word">తెలుగు</span>
                        <span className="more-languages">
                          Built for every Indian language <ArrowUpRightTiny />
                        </span>
                      </div>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="hero-orbit orbit-one" />
                      <div className="hero-orbit orbit-two" />
                      <div className="floating-glyph glyph-one">அ</div>
                      <div className="floating-glyph glyph-two">आ</div>
                      <div className="record">
                        <div className="record-label">
                          <span>POWERWORDS</span>
                          <span className="record-mark">✳</span>
                          <small>SIDE A / FEEL SOMETHING</small>
                        </div>
                      </div>
                      <div className="art-caption">
                        <span className="sound-bars">
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>{' '}
                        NOT JUST LYRICS. A FEELING.
                      </div>
                    </div>
                  </section>
                  <div className="demo-banner">
                    <ShieldCheck size={15} />
                    <span>
                      <strong>Know what you’re opening.</strong> 5 sourced recordings · 1
                      public-domain verse · 12 original demos. Commercial recordings have credits,
                      not copied lyrics.
                    </span>
                    <button onClick={() => setInfo('rights')}>
                      Why this matters <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
              {view === 'library' && (
                <section className="page-intro">
                  <span className="eyebrow">YOUR PERSONAL LINER NOTES</span>
                  <h1>
                    Keep the words
                    <br />
                    that <em>stay.</em>
                  </h1>
                  <p>Your favourites and collections, saved in this browser. No account needed.</p>
                  <div className="collections">
                    <button
                      className={activeCollection === 'all' ? 'chip selected' : 'chip'}
                      onClick={() => setActiveCollection('all')}
                    >
                      <Heart size={14} />
                      Saved songs · {favorites.length}
                    </button>
                    {collections.map((c) => (
                      <button
                        key={c.name}
                        className={activeCollection === c.name ? 'chip selected' : 'chip'}
                        onClick={() => setActiveCollection(c.name)}
                      >
                        {c.name} · {c.ids.length}
                      </button>
                    ))}
                  </div>
                  <form
                    className="collection-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = collectionName.trim();
                      if (!name) return;
                      if (collections.some((c) => c.name === name)) {
                        setStatus('A collection with that name already exists.');
                        return;
                      }
                      if (collections.length >= 30) {
                        setStatus('Maximum 30 collections.');
                        return;
                      }
                      persistCollections([...collections, { name, ids: [] }]);
                      setCollectionName('');
                      setStatus('Collection created. Open a song to add it.');
                    }}
                  >
                    <input
                      aria-label="New collection name"
                      placeholder="A name for your next collection"
                      value={collectionName}
                      maxLength={50}
                      onChange={(e) => setCollectionName(e.target.value)}
                    />
                    <button className="button" type="submit">
                      <FolderPlus size={16} />
                      Create collection
                    </button>
                  </form>
                  {activeCollection !== 'all' && (
                    <button
                      className="text-button"
                      onClick={() => {
                        persistCollections(collections.filter((c) => c.name !== activeCollection));
                        setActiveCollection('all');
                        setStatus('Collection removed. Saved songs are unchanged.');
                      }}
                    >
                      Remove this collection
                    </button>
                  )}
                </section>
              )}
              {view === 'studio' && (
                <section className="page-intro studio-intro">
                  <span className="eyebrow">FIND YOUR OWN RHYTHM</span>
                  <h1>
                    Your voice.
                    <br />
                    Your <em>moment.</em>
                  </h1>
                  <p>
                    Choose a demo song for silent timed rehearsal, or bring your own audio and LRC.
                    <br />
                    Everything stays on your device. No microphone access. No uploads.
                  </p>
                  <div className="studio-features">
                    <span>
                      <Headphones size={18} />
                      Local audio
                    </span>
                    <span>
                      <AudioLines size={18} />
                      Timed lyric highlighting
                    </span>
                    <span>
                      <Settings2 size={18} />
                      Manual sync control
                    </span>
                  </div>
                </section>
              )}
              {view === 'discover' && <CuratedShelves onNavigate={navigatePath} />}
              <section className="discovery-section" aria-labelledby="discovery-heading">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      {view === 'library'
                        ? 'THE ONES YOU CAME BACK TO'
                        : view === 'studio'
                          ? 'PICK YOUR PRACTICE TRACK'
                          : 'FOLLOW YOUR CURIOSITY'}
                    </span>
                    <h2 id="discovery-heading">
                      {view === 'library'
                        ? 'Your collection'
                        : view === 'studio'
                          ? 'The rehearsal room'
                          : 'Find your next favourite'}
                      <span className="orange-dot" />
                    </h2>
                  </div>
                  <button className="text-button" onClick={() => setShowFilters(true)}>
                    Explore all {FILTER_DIMENSIONS.length} dimensions <ArrowRight size={16} />
                  </button>
                </div>
                {view === 'discover' && (
                  <div className="catalogue-scopes" aria-label="Catalogue collection">
                    {[
                      ['all', 'All entries'],
                      ['sourced', 'Sources first'],
                      ['readable', 'Read freely'],
                      ['demo', 'Original demos'],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={scope === id}
                        className={scope === id ? 'selected' : ''}
                        onClick={() => {
                          setScope(id);
                          setQuery('');
                          setFilters({});
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="search-row">
                  <div className="search-box">
                    <Search size={19} />
                    <input
                      ref={search}
                      aria-label="Search songs, artists, albums and lyrics metadata"
                      placeholder="A song, an artist, a feeling…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query ? (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery('')}
                      >
                        <X size={15} />
                      </button>
                    ) : (
                      <kbd>/</kbd>
                    )}
                  </div>
                  <button
                    className={`filter-button ${activeCount ? 'is-active' : ''}`}
                    onClick={() => setShowFilters(true)}
                  >
                    <ListFilter size={17} />
                    Filters{activeCount > 0 && <span>{activeCount}</span>}
                  </button>
                </div>
                <div className="filter-row">
                  <div className="quick-filters">
                    {['Tamil', 'Hindi', 'Telugu'].map((language) => (
                      <button
                        key={language}
                        className={`chip ${filters.language === language ? 'selected' : ''}`}
                        onClick={() =>
                          update('language', filters.language === language ? '' : language)
                        }
                      >
                        <Globe2 size={13} />
                        {language}
                      </button>
                    ))}
                    <span className="chip-divider" />
                    <button
                      className={`chip ${filters.independent ? 'selected' : ''}`}
                      onClick={() => update('independent', filters.independent ? '' : 'Yes')}
                    >
                      Independent
                    </button>
                    <button
                      className={`chip ${filters.mood ? 'selected' : ''}`}
                      onClick={() => update('mood', filters.mood ? '' : 'Hopeful')}
                    >
                      A little hopeful <Sun size={13} />
                    </button>
                    <button className="chip more-chip" onClick={() => setShowFilters(true)}>
                      <Plus size={14} />
                      More
                    </button>
                  </div>
                  <label className="sort-label">
                    <ArrowDownUp size={13} />
                    <select
                      aria-label="Sort songs"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="title">Title A–Z</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>
                </div>
                {(activeCount > 0 || query) && (
                  <div className="active-filters">
                    <span>Refining your discovery</span>
                    {Object.entries(filters)
                      .filter(([, v]) => v)
                      .map(([key, value]) => (
                        <button className="chip" key={key} onClick={() => update(key, '')}>
                          {FILTER_DIMENSIONS.find((f) => f.key === key)?.label}: {value}
                          <X size={12} />
                        </button>
                      ))}
                    <button className="text-button" onClick={reset}>
                      Clear all
                    </button>
                  </div>
                )}
                {outcome.related && (
                  <p className="contextual-results" role="status">
                    {outcome.message}
                  </p>
                )}
                <div className="results-summary" role="status">
                  <span>
                    {results.length} {view === 'library' ? 'saved' : 'catalogue'}{' '}
                    {results.length === 1 ? 'song' : 'songs'}
                    {query && ` ${outcome.related ? 'related to' : 'matching'} “${query}”`}
                  </span>
                  <span>ORIGINAL WORDS. OPEN POSSIBILITIES.</span>
                </div>
                {results.length > 0 ? (
                  <div className="song-grid">
                    {results.map((song) => (
                      <article className="song-card" key={song.id}>
                        <div className="cover-wrap">
                          <button
                            className="open-cover"
                            onClick={() => openSong(song)}
                            aria-label={`${isReadable(song) ? 'Read' : 'View credits for'} ${song.title}`}
                          >
                            <Cover song={song} />
                            <span className="cover-open">
                              <BookOpen size={17} />
                              {isReadable(song) ? 'Open lyrics' : 'View credits'}
                              <ArrowRight size={15} />
                            </span>
                          </button>
                          <button
                            className={`save-button ${favorites.includes(song.id) ? 'is-saved' : ''}`}
                            aria-label={`${favorites.includes(song.id) ? 'Unsave' : 'Save'} ${song.title}`}
                            aria-pressed={favorites.includes(song.id)}
                            onClick={() => toggleSave(song.id)}
                          >
                            <Heart
                              size={16}
                              fill={favorites.includes(song.id) ? 'currentColor' : 'none'}
                            />
                          </button>
                          <span className="demo-pill">
                            {CATALOGUE.some((item) => item.id === song.id)
                              ? recordLabel(song)
                              : 'IMPORT · UNVERIFIED'}
                          </span>
                        </div>
                        <div className="song-title-row">
                          {CATALOGUE.some((s) => s.id === song.id) ? (
                            <a
                              className="song-title"
                              href={songPath(song)}
                              onClick={(e) => follow(e, songPath(song), navigatePath)}
                            >
                              {song.title}
                            </a>
                          ) : (
                            <button className="song-title" onClick={() => openSong(song)}>
                              {song.title}
                            </button>
                          )}
                          <ArrowRight size={16} />
                        </div>
                        {CATALOGUE.some((s) => s.id === song.id) ? (
                          <a
                            className="artist-link"
                            href={artistPath(
                              song.credits?.find((c) => c.role === 'singer')?.name ??
                                song.credits?.[0]?.name ??
                                song.artist,
                            )}
                            onClick={(e) =>
                              follow(
                                e,
                                artistPath(
                                  song.credits?.find((c) => c.role === 'singer')?.name ??
                                    song.credits?.[0]?.name ??
                                    song.artist,
                                ),
                                navigatePath,
                              )
                            }
                          >
                            {song.artist}
                          </a>
                        ) : (
                          <span className="artist-link">{song.artist}</span>
                        )}
                        <div className="song-meta">
                          <span>{song.language}</span>
                          <span>·</span>
                          <span>{song.year ?? 'Ancient verse'}</span>
                          <span className="song-album">{song.album}</span>
                        </div>
                        {view === 'library' && activeCollection !== 'all' && (
                          <button
                            className="text-button"
                            onClick={() => {
                              persistCollections(
                                collections.map((c) =>
                                  c.name === activeCollection
                                    ? { ...c, ids: c.ids.filter((id) => id !== song.id) }
                                    : c,
                                ),
                              );
                              setStatus('Removed from collection. Saved songs are unchanged.');
                            }}
                          >
                            Remove from collection
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Search size={34} />
                    <h3>
                      {view === 'library' && !favorites.length
                        ? 'Your next favourite belongs here.'
                        : 'No words found. Yet.'}
                    </h3>
                    <p>
                      {view === 'library' && !favorites.length
                        ? 'Tap the heart on any song to start your personal collection.'
                        : 'Try fewer filters or a different search. This is a small sourced-and-demo catalogue, not a complete Indian music index.'}
                    </p>
                    {query.toLowerCase().includes('rahman') && (
                      <p>
                        A small sourced A. R. Rahman selection is available. Try clearing other
                        filters; a complete discography is not claimed.
                      </p>
                    )}
                    <button
                      className="button primary"
                      onClick={() => {
                        reset();
                        if (view === 'library' && !favorites.length) navigate('discover');
                      }}
                    >
                      {' '}
                      {view === 'library' && !favorites.length
                        ? 'Explore demo songs'
                        : 'Reset discovery'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
              {view === 'discover' && (
                <section className="discovery-bottom">
                  <div className="editorial-card">
                    <div className="editorial-illustration" aria-hidden="true">
                      <span>அ</span>
                      <i>आ</i>
                      <b>అ</b>
                    </div>
                    <div>
                      <span className="eyebrow">SAME FEELING. DIFFERENT WORDS.</span>
                      <h2>
                        Music doesn’t need borders.
                        <br />
                        Neither should its words.
                      </h2>
                      <p>
                        Original script, English translation, and readable transliteration.
                        <br />
                        Three ways to get a little closer to a song.
                      </p>
                      <button className="text-button" onClick={() => setSelected(DEMO_SONGS[0])}>
                        Try the multilingual reader
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                  <AdSpace />
                </section>
              )}
              {view === 'studio' && (
                <div className="studio-note">
                  <ShieldCheck size={20} />
                  <p>
                    Only import audio and timed lyrics you have permission to use. Local files are
                    temporary and are discarded when you close the reader. Recording and streaming
                    integrations are not enabled.
                  </p>
                </div>
              )}
            </>
          )}
          <footer>
            <div className="footer-brand">
              powerwords<span>.</span>
              <small>Made for a deeper listen.</small>
            </div>
            <div>
              <button onClick={() => setInfo('rights')}>Content & rights</button>
              <button onClick={() => setInfo('privacy')}>Privacy</button>
              <button onClick={() => setInfo('guide')}>About this demo</button>
            </div>
            <span>
              LESS NOISE. MORE MEANING. <span className="footer-star">✳</span>
            </span>
          </footer>
        </main>
      </div>
      <div className={`global-status ${status ? 'visible' : ''}`} role="status">
        {status && (
          <>
            <Check size={15} />
            <span>{status}</span>
            <button aria-label="Dismiss notification" onClick={() => setStatus('')}>
              <X size={15} />
            </button>
          </>
        )}
      </div>
      {selected && (
        <Reader
          key={selected.id}
          song={selected}
          onClose={() => setSelected(null)}
          saved={favorites.includes(selected.id)}
          onSave={() => toggleSave(selected.id)}
          font={font}
          setFont={setFont}
          collections={collections}
          onAdd={addCollection}
        />
      )}
      {showFilters && (
        <Dialog
          title="A thousand ways to find your song"
          onClose={() => setShowFilters(false)}
          wide
        >
          <div className="filter-intro">
            <p>
              {FILTER_DIMENSIONS.length} discovery dimensions. Populated fields filter this
              catalogue; unavailable fields are disabled rather than pretending we know.
            </p>
            <div className="search-box">
              <Search size={17} />
              <input
                aria-label="Find a filter dimension"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Find a dimension, e.g. composer, raga, decade…"
              />
            </div>
          </div>
          <div className="advanced-filters">
            {[...new Set(FILTER_DIMENSIONS.map((d) => d.group))].map((group) => {
              const fields = FILTER_DIMENSIONS.filter(
                (d) =>
                  d.group === group &&
                  `${d.label} ${d.key}`.toLowerCase().includes(filterSearch.toLowerCase()),
              );
              return (
                fields.length > 0 && (
                  <fieldset key={group}>
                    <legend>{group}</legend>
                    <div className="dimension-grid">
                      {fields.map((d) => {
                        const options = optionsFor(songs, d.key);
                        return (
                          <label
                            key={d.key}
                            className={`dimension ${!options.length ? 'unavailable' : ''}`}
                          >
                            {d.label}
                            <select
                              aria-label={d.label}
                              value={filters[d.key] || ''}
                              disabled={!options.length}
                              onChange={(e) => update(d.key, e.target.value)}
                            >
                              <option value="">
                                {options.length
                                  ? 'Any · ' + options.length + ' available'
                                  : 'Not in this catalogue'}
                              </option>
                              {options.map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )
              );
            })}
            {!FILTER_DIMENSIONS.some((d) =>
              `${d.label} ${d.key}`.toLowerCase().includes(filterSearch.toLowerCase()),
            ) && <p>No matching dimension. Try “language” or “composer”.</p>}
          </div>
          <div className="filter-footer">
            <button className="text-button" onClick={() => setFilters({})}>
              Reset filters
            </button>
            <button className="button primary" onClick={() => setShowFilters(false)}>
              Show {results.length} songs
              <ArrowRight size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {metadataPreview && (
        <Dialog title="Session metadata preview" onClose={() => setMetadataPreview(null)}>
          <div className="info-body">
            <span className="eyebrow">IMPORT · UNVERIFIED · NOT PUBLISHED</span>
            <h3>{metadataPreview.title}</h3>
            <p>
              {metadataPreview.album} · {metadataPreview.year ?? 'Date unknown'} ·{' '}
              {metadataPreview.language}
            </p>
            <p>
              Performer display: {metadataPreview.artist}
              <br />
              Composer: {metadataPreview.composer}
              <br />
              Words: {metadataPreview.lyricist}
            </p>
            <p>
              No text was supplied. Credits, sources and rights in imports are uploader assertions,
              not independently reviewed facts or a lyric licence. This session entry has no public
              URL.
            </p>
          </div>
        </Dialog>
      )}
      {info && (
        <Dialog
          title={
            info === 'guide'
              ? 'A deeper kind of listening'
              : info === 'privacy'
                ? 'Your space. Your data.'
                : info === 'rights'
                  ? 'Words deserve respect.'
                  : 'Make it yours'
          }
          onClose={() => setInfo(null)}
        >
          <div className="info-content">
            {info === 'guide' ? (
              <>
                <span className="info-hero">✳</span>
                <h3>
                  Music is a feeling.
                  <br />
                  Words help you find it.
                </h3>
                <p>
                  PowerWords is a working, local-first foundation for discovering Indian music.
                  Browse sourced credits and original demos, refine by metadata, save a collection,
                  then slow down in the lyric room.
                </p>
                <ol>
                  <li>Search titles, artists, albums, languages, and moods.</li>
                  <li>Explore original script, English, and Latin transliteration.</li>
                  <li>Practice with a silent timer, or bring your own audio and LRC.</li>
                </ol>
                <p>
                  <strong>Not a full catalogue:</strong> all demo artists, albums, years, and
                  musical descriptions on ORIGINAL DEMO entries are fictional. Sourced real credits
                  have their own citations; no streaming service, account sync, analytics, or
                  advertising network is connected.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setInfo(null);
                    setSelected(DEMO_SONGS[0]);
                  }}
                >
                  Take a look inside
                  <ArrowRight size={16} />
                </button>
              </>
            ) : info === 'rights' ? (
              <>
                <ShieldCheck className="info-hero" size={38} />
                <h3>
                  A home for music.
                  <br />
                  Not for unlicensed copies.
                </h3>
                <p>
                  Demo lyrics and translations are original project writing, dedicated under
                  CC0-1.0. The same four-line exercise is reused to illustrate the reader across
                  fictional tracks. Fictional release years are not real release claims. Five
                  separately sourced real recordings are metadata-only; the Tirukkural room contains
                  ancient text with new project renderings. Individual citations are visible on
                  their clean pages.
                </p>
                <p>
                  Production songs must carry verified credits, a source record, rights-holder
                  evidence, territories, and separate permission for translation, transliteration
                  and timed use. An import assertion is not legal verification.
                </p>
                <p>
                  Real artists including A.R. Rahman are not represented by invented catalogue
                  entries. All languages are supported by the model; only Tamil, Hindi and Telugu
                  demo text is provided alongside the ancient Tamil verse edition.
                </p>
                <p>
                  <strong>Advertising:</strong> no ad network scripts run. The optional sponsor area
                  is outside the reading flow. AdSense acceptance is not guaranteed; a licensed,
                  substantial catalogue and policy review are prerequisites.
                </p>
              </>
            ) : info === 'privacy' ? (
              <>
                <ShieldCheck className="info-hero" size={38} />
                <h3>Local by design.</h3>
                <p>
                  Favourites, collection names, theme and text size are stored in this browser’s
                  local storage. There is no account, tracking SDK, analytics, advertising cookie,
                  or server-side personal-data database.
                </p>
                <p>
                  Imported catalogue, audio and LRC stay in memory for the current session and are
                  not uploaded. Following external music search links opens a third-party website
                  with its own privacy practices. Your hosting provider may record ordinary access
                  logs.
                </p>
                <p>
                  You can clear PowerWords preferences and library without affecting other websites.
                </p>
                <button
                  className="button"
                  onClick={() => {
                    STORAGE_KEYS.forEach((k) => {
                      try {
                        localStorage.removeItem(k);
                      } catch {
                        /* storage blocked */
                      }
                    });
                    setFavorites([]);
                    setCollections([]);
                    setActiveCollection('all');
                    setTheme('light');
                    setFont(24);
                    setImported([]);
                    setStatus(
                      'PowerWords library, imports and preferences cleared. Default theme and text size may be saved again.',
                    );
                  }}
                >
                  Clear PowerWords local data
                </button>
                <p className="small-note">
                  A production deployment needs an operator identity, real contact/takedown route,
                  jurisdiction-specific privacy notice, retention policy, and appropriate consent
                  controls before adding any ad SDK.
                </p>
              </>
            ) : (
              <>
                <h3>Set the mood.</h3>
                <div className="theme-options">
                  <button
                    className={theme === 'light' ? 'selected' : ''}
                    onClick={() => setTheme('light')}
                  >
                    <Sun />
                    Warm paper{theme === 'light' && <Check size={16} />}
                  </button>
                  <button
                    className={theme === 'dark' ? 'selected' : ''}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon />
                    After hours{theme === 'dark' && <Check size={16} />}
                  </button>
                </div>
                <label className="field-label">
                  Reading text size: {font}px
                  <input
                    aria-label="Default lyric font size"
                    type="range"
                    min="18"
                    max="36"
                    value={font}
                    onChange={(e) => setFont(Number(e.target.value))}
                  />
                </label>
                <hr />
                <h3>Your catalogue, your permission.</h3>
                <p>
                  Import a JSON catalogue (up to 2 MB / 500 songs). Required credits, timestamp
                  order, IDs and rights assertions are validated. This is a session-only preview,
                  not publication or legal clearance.
                </p>
                <button className="button" onClick={() => importFile.current?.click()}>
                  <Upload size={16} />
                  Import catalogue JSON
                </button>
                <input
                  hidden
                  type="file"
                  accept=".json,application/json"
                  ref={importFile}
                  onChange={(e) => {
                    void importCatalogue(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  className="text-button export-button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(songs, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'powerwords-catalogue.json';
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  <Download size={15} />
                  Export catalogue template
                </button>
                <p role="status" className="notice">
                  {status}
                </p>
                <p className="small-note">
                  Export contains catalogue text and metadata only. Your library and local audio are
                  never included.
                </p>
              </>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
function ArrowUpRightTiny() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 9 9 3M3 3h6v6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

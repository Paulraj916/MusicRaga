import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Moon,
  Sun,
  Music2,
  X,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { staticCatalogue } from './staticCatalogue';
import { appHref } from './deployment';
import { REAL_RECORDINGS } from './realCatalogue';
import type { Song } from './catalogue';
import { songPath } from './routes';

export type SearchTrack = {
  id: string;
  title: string;
  nativeTitle?: string;
  kind: string;
  source_url: string;
  credits: { name: string | null; role: string; artist_id: string }[];
  languages: string[];
  year: number | null;
  album: string | null;
  edition_titles?: { title: string; source_url: string }[];
  role_proof_count?: number;
};
type SearchPage = { items: SearchTrack[]; total: number; next_cursor: string | null };
type Coverage = {
  entity_kinds: Record<string, number>;
  lyric_pair_coverage?: {
    cleared_native_romanized_pairs: number;
    target: number;
    metadata_gap_to_target: number;
    pair_gap_to_target: number;
  };
};
const normalize = (s: string) => s.normalize('NFC').toLocaleLowerCase().trim();
export function songSearchQuery(value: string) {
  return value
    .normalize('NFC')
    .trim()
    .split(/\s+/)
    .filter((w) => !['song', 'songs', 'lyrics', 'பாடல்', 'பாடல்கள்'].includes(w.toLowerCase()))
    .join(' ');
}
const reviewed = REAL_RECORDINGS.map(
  (s) =>
    ({
      id: 'reviewed:' + s.id,
      title: s.title,
      nativeTitle: s.nativeTitle,
      kind: 'recording',
      source_url: s.sources?.[0]?.url ?? '',
      credits: (s.credits ?? []).map((c) => ({ name: c.name, role: c.role, artist_id: '' })),
      languages: [s.language],
      year: s.year,
      album: s.album,
    }) as SearchTrack,
);
function matches(s: Song, q: string) {
  const body = normalize(
    [s.title, s.nativeTitle, s.album, s.artist, s.composer, ...(s.aliases ?? [])].join(' '),
  );
  return normalize(q)
    .split(/\s+/)
    .every((w) => body.includes(w));
}
function safeLink(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      [
        'musicbrainz.org',
        'www.wikidata.org',
        'en.wikipedia.org',
        'ta.wikipedia.org',
        'open.spotify.com',
      ].includes(u.hostname)
    );
  } catch {
    return false;
  }
}
async function request<T>(path: string, signal: AbortSignal): Promise<T> {
  return (await staticCatalogue(appHref(path), signal)) as T;
}
function localSong(id: string) {
  return REAL_RECORDINGS.find((s) => 'reviewed:' + s.id === id);
}
function LocalAudio() {
  const [audio, setAudio] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  useEffect(
    () => () => {
      if (audio) URL.revokeObjectURL(audio);
    },
    [audio],
  );
  return (
    <section className="song-own-audio" aria-labelledby="own-audio-title">
      <h3 id="own-audio-title">Have your own audio?</h3>
      <p>
        Open a file from your device. It stays on your device, is not uploaded, and does not unlock
        licensed lyrics.
      </p>
      <label className="song-file">
        <Upload size={17} /> Choose your audio file
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 100 * 1024 * 1024) {
              setError('Choose an audio file smaller than 100 MB.');
              return;
            }
            setError('');
            setAudio(URL.createObjectURL(file));
            setName(file.name);
          }}
        />
      </label>
      {audio && (
        <>
          <p className="song-file-name">{name}</p>
          <audio
            aria-label="Your local audio"
            controls
            src={audio}
            onError={() =>
              setError('This browser cannot play that file. Try another supported audio format.')
            }
          />
          <button
            className="song-text-link"
            onClick={() => {
              setAudio(null);
              setName('');
            }}
          >
            Remove audio
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export default function SongSearchHome({
  theme,
  onTheme,
  onTools,
  onExample,
  onPolicy,
}: {
  theme: string;
  onTheme: () => void;
  onTools: () => void;
  onExample: () => void;
  onPolicy: (policy: 'privacy' | 'rights') => void;
}) {
  const initial = () =>
    typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(() => initial().get('q') ?? '');
  const [applied, setApplied] = useState(() => songSearchQuery(initial().get('q') ?? ''));
  const [selectedId, setSelectedId] = useState<string | null>(() => initial().get('song'));
  const [track, setTrack] = useState<SearchTrack | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [page, setPage] = useState<SearchPage | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [font, setFont] = useState(24);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if (
        e.key !== '/' ||
        document.querySelector('[role="dialog"]') ||
        (e.target instanceof HTMLElement &&
          e.target.closest('input,textarea,[contenteditable="true"]'))
      )
        return;
      const field = document.getElementById('root-song-search') as HTMLInputElement | null;
      if (field) {
        e.preventDefault();
        field.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  const heading = useRef<HTMLHeadingElement>(null);
  const selectedReviewed = selectedId ? localSong(selectedId) : undefined;
  const curated = useMemo(
    () => (applied ? REAL_RECORDINGS.filter((s) => matches(s, applied)) : []),
    [applied],
  );
  function updateUrl(q: string, id: string | null, replace = false) {
    const u = new URL(window.location.href);
    u.searchParams.delete('workspace');
    q ? u.searchParams.set('q', q) : u.searchParams.delete('q');
    id ? u.searchParams.set('song', id) : u.searchParams.delete('song');
    u.hash = '';
    window.history[replace ? 'replaceState' : 'pushState'](null, '', u.pathname + u.search);
  }
  function searchNow(q = query) {
    setQuery(q);
    setApplied(songSearchQuery(q));
    setCursor(null);
    setSelectedId(null);
    setTrack(null);
    setError('');
    setRetry((n) => n + 1);
    updateUrl(q, null);
  }
  function open(t: SearchTrack) {
    setError('');
    setReaderLoading(false);
    setSelectedId(t.id);
    setTrack(t);
    updateUrl(query, t.id);
    window.scrollTo(0, 0);
  }
  function back() {
    setSelectedId(null);
    setTrack(null);
    setError('');
    updateUrl(query, null);
    requestAnimationFrame(() => input.current?.focus());
  }
  useEffect(() => {
    const sync = () => {
      const p = initial();
      setQuery(p.get('q') ?? '');
      setApplied(songSearchQuery(p.get('q') ?? ''));
      setSelectedId(p.get('song'));
      setCursor(null);
      setTrack(null);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    request<Coverage>('/api/v1/coverage', controller.signal)
      .then(setCoverage)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!applied) {
      setPage(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let live = true;
    const timer = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    setError('');
    const p = new URLSearchParams({ q: applied, kind: 'recording', limit: '20' });
    if (cursor) p.set('cursor', cursor);
    request<SearchPage>('/api/v1/tracks?' + p, controller.signal)
      .then((r) => {
        if (live) {
          if (!Array.isArray(r.items)) throw new Error();
          setPage(r);
        }
      })
      .catch(() => {
        if (live)
          setError(
            'The song catalogue could not load. Try again; the reviewed song entries below still work.',
          );
      })
      .finally(() => {
        clearTimeout(timer);
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [applied, cursor, retry]);
  useEffect(() => {
    if (!selectedId) {
      setReaderLoading(false);
      return;
    }
    if (selectedReviewed) {
      setTrack(reviewed.find((s) => s.id === selectedId)!);
      setReaderLoading(false);
      return;
    }
    if (track?.id === selectedId) return;
    const controller = new AbortController();
    let live = true;
    setReaderLoading(true);
    setError('');
    request<{ item: SearchTrack | null }>(
      '/api/v1/item?id=' + encodeURIComponent(selectedId),
      controller.signal,
    )
      .then((r) => {
        if (live) setTrack(r.item);
      })
      .catch(() => {
        if (live) setError('This song entry could not load. Return to search and try again.');
      })
      .finally(() => {
        if (live) setReaderLoading(false);
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [selectedId, selectedReviewed, track?.id]);
  useEffect(() => {
    if (!selectedId) {
      document.title = 'Music Raga — Search songs, albums & artists';
      return;
    }
    if (selectedId && !readerLoading) {
      heading.current?.focus();
      if (track) document.title = track.title + ' — Music Raga';
    }
  }, [selectedId, readerLoading, track]);
  const listen = selectedReviewed?.sources?.find((s) =>
    s.url.startsWith('https://open.spotify.com/album/'),
  );
  const count = coverage?.lyric_pair_coverage?.cleared_native_romanized_pairs;
  return (
    <div className="song-home">
      <header className="song-header">
        <a
          href={appHref('/')}
          onClick={(e) => {
            e.preventDefault();
            setQuery('');
            setApplied('');
            setSelectedId(null);
            setTrack(null);
            setCursor(null);
            setError('');
            updateUrl('', null);
          }}
          className="song-brand"
        >
          <span aria-hidden="true">m✳</span>Music Raga
        </a>
        <nav aria-label="Music Raga navigation">
          <button className="song-text-link" onClick={onTools}>
            More tools
          </button>
          <button
            className="icon-button"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={onTheme}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </nav>
      </header>
      {selectedId ? (
        <div className="song-reader-page">
          <button className="song-back" onClick={back}>
            <ArrowLeft size={18} />
            Back to song search
          </button>
          {readerLoading ? (
            <p role="status">Opening your song…</p>
          ) : track ? (
            <>
              <div className="song-reader-heading">
                <span className="song-type">SONG ENTRY · LYRICS AVAILABILITY</span>
                <h1 ref={heading} tabIndex={-1}>
                  {track.nativeTitle ?? track.title}
                </h1>
                {track.nativeTitle && <p className="song-roman-title">{track.title}</p>}
                <p>
                  {track.album ??
                    (track.edition_titles?.[0]
                      ? 'Appears on ' + track.edition_titles[0].title
                      : 'Album not supplied')}
                  {track.year ? ' · ' + track.year : ''}
                </p>
              </div>
              <div className="song-reader-controls">
                <div
                  className="song-language-state"
                  role="group"
                  aria-label="Lyric text availability"
                >
                  <span>Native script · unavailable</span>
                  <span>
                    {selectedReviewed?.language === 'Tamil' ? 'Romanized / Tanglish' : 'Romanized'}{' '}
                    · unavailable
                  </span>
                </div>
                <label>
                  Text size{' '}
                  <input
                    aria-label="Reader text size"
                    type="range"
                    min="20"
                    max="36"
                    value={font}
                    onChange={(e) => setFont(Number(e.target.value))}
                  />
                </label>
              </div>
              <section
                className="song-no-lyrics"
                style={{ fontSize: font }}
                aria-labelledby="missing-lyrics-title"
              >
                <div className="song-wordmark" aria-hidden="true">
                  அ · आ · Aa
                </div>
                <h2 id="missing-lyrics-title">Lyrics not yet available.</h2>
                <p>
                  We haven’t cleared the native-script lyrics or romanized words for this song. We
                  won’t show copied text or an invented translation.
                </p>
                <p className="song-reader-note">
                  Tanglish / Hinglish is the original language written in English letters — not
                  English translation. Metadata permission does not include lyric permission.
                </p>
              </section>
              <section className="song-listen" aria-labelledby="listen-title">
                <h2 id="listen-title">Listen your way</h2>
                {listen ? (
                  <>
                    <p>
                      No audio is hosted here. This verified destination opens the album, not an
                      embedded song player; availability or an account may vary.
                    </p>
                    <a
                      className="song-listen-link"
                      href={listen.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open the album on Spotify <ExternalLink size={16} />
                    </a>
                  </>
                ) : (
                  <p>
                    No verified listening destination is supplied for this entry. There is no empty
                    play button or automatic audio.
                  </p>
                )}
                <LocalAudio key={track.id} />
              </section>
              <details className="song-details">
                <summary>Song credits & sources</summary>
                <p>
                  Source assertions, not independent musicological verification. Generic credited
                  artists are not automatically singers.
                </p>
                <ul>
                  {track.credits.map((c, i) => (
                    <li key={i}>
                      <strong>{c.name ?? 'Unknown source artist'}</strong> ·{' '}
                      {c.role.replaceAll('_', ' ')}
                    </li>
                  ))}
                </ul>
                {track.edition_titles?.length ? (
                  <p>
                    Appears on source editions:{' '}
                    {track.edition_titles.map((e) => (
                      <a
                        key={e.source_url}
                        href={e.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {e.title} ↗{' '}
                      </a>
                    ))}
                    . Edition names are not proof of original album/date or sung language.
                  </p>
                ) : null}
                {safeLink(track.source_url) && (
                  <a href={track.source_url} target="_blank" rel="noopener noreferrer">
                    View source record ↗
                  </a>
                )}
                {selectedReviewed?.sources?.map((s) => (
                  <p key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label} ↗
                    </a>
                  </p>
                ))}
                <p>Metadata permission does not grant lyric or audio permission.</p>
              </details>
            </>
          ) : !error ? (
            <h1 ref={heading} tabIndex={-1}>
              This song entry isn’t in the current snapshot.
            </h1>
          ) : (
            <h1 ref={heading} tabIndex={-1}>
              This song entry could not be opened.
            </h1>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      ) : (
        <>
          <section
            className={'song-search-hero' + (applied ? ' has-query' : '')}
            aria-labelledby="song-search-heading"
          >
            <p className="song-overline">தமிழ் · हिन्दी · Indian music</p>
            <h1 id="song-search-heading">
              Find your <em>song.</em>
            </h1>
            <p className="song-search-subtitle">
              A song title, an album, an artist. Start with the words you know.
            </p>
            <form
              className="song-main-search"
              role="search"
              action={appHref('/')}
              method="get"
              onSubmit={(e) => {
                e.preventDefault();
                searchNow();
              }}
            >
              <Search size={22} aria-hidden="true" />
              <label className="sr-only" htmlFor="root-song-search">
                Search songs, albums or artists
              </label>
              <input
                id="root-song-search"
                ref={input}
                type="search"
                name="q"
                autoComplete="off"
                placeholder="Song, album or artist · பாடல் பெயர்"
                value={query}
                maxLength={200}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="song-clear"
                  aria-label="Clear song search"
                  onClick={() => {
                    searchNow('');
                    input.current?.focus();
                  }}
                >
                  <X size={18} />
                </button>
              )}
              <button className="song-search-submit" type="submit">
                Search
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="song-try">
              <span>Try</span>
              {['சின்ன சின்ன ஆசை', 'Alaipayuthey', 'A. R. Rahman'].map((q) => (
                <button key={q} onClick={() => searchNow(q)}>
                  {q}
                </button>
              ))}
            </div>
            <p className="song-availability-note">
              Real-song cleared native + romanized lyric pairs:{' '}
              <strong>{count === undefined ? '0 (this release)' : count.toLocaleString()}</strong>.
              Availability is shown before you open a result. We do not host commercial music.
            </p>
          </section>
          <section className="song-search-results" aria-label="Song search results">
            {applied && (
              <div className="song-results-heading">
                <h2>Results for “{query}”</h2>
                <p role="status">
                  {loading
                    ? 'Searching the song catalogue…'
                    : page
                      ? `${page.total.toLocaleString()} source recordings${curated.length ? ' + reviewed entries' : ''}`
                      : 'Reviewed song entries'}
                </p>
              </div>
            )}
            {error && (
              <div className="song-search-error" role="alert">
                <p>{error}</p>
                <button onClick={() => setRetry((n) => n + 1)} className="song-text-link">
                  Retry catalogue search
                </button>
              </div>
            )}
            {!!curated.length && (
              <>
                <h3 className="song-result-group">Reviewed song entries</h3>
                <ul className="song-result-list">
                  {curated.map((s) => {
                    const t = reviewed.find((t) => t.id === 'reviewed:' + s.id)!;
                    return (
                      <li key={t.id}>
                        <SongRow track={t} query={query} open={open} />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {applied && !!page?.items.length && (
              <>
                <h3 className="song-result-group">
                  {curated.length ? 'More recordings & versions' : 'Source recordings'}
                </h3>
                <ul className="song-result-list">
                  {page.items.map((t) => (
                    <li key={t.id}>
                      <SongRow track={t} query={query} open={open} />
                    </li>
                  ))}
                </ul>
                {page.next_cursor && (
                  <button
                    className="song-more"
                    onClick={() => {
                      setCursor(page.next_cursor);
                      document
                        .querySelector('.song-search-results')
                        ?.scrollIntoView({ block: 'start' });
                    }}
                  >
                    Next results <ArrowRight size={17} />
                  </button>
                )}
                {cursor && (
                  <button className="song-text-link" onClick={() => setCursor(null)}>
                    First results
                  </button>
                )}
              </>
            )}
            {applied && !loading && !error && !curated.length && !page?.items.length && (
              <div className="song-empty">
                <Music2 size={30} />
                <h2>No matching song found.</h2>
                <p>
                  Try a shorter title, another known spelling, an album or an artist. Tamil and
                  English-letter source titles are supported, but unlicensed lyric lines aren’t
                  searchable.
                </p>
                <button className="song-text-link" onClick={() => input.current?.focus()}>
                  Try another search
                </button>
              </div>
            )}
            {!applied && (
              <div className="song-start">
                <span aria-hidden="true">♪</span>
                <h2>Start with a song you love.</h2>
                <p>
                  Find a recording, check its credits, and see what’s available. Lyrics are labelled
                  clearly before you open a result.
                </p>
              </div>
            )}
          </section>
        </>
      )}
      <footer className="song-footer">
        <noscript>
          <p>
            Catalogue search requires JavaScript. The reviewed song pages below work without it;
            their lyrics are not licensed here.
          </p>
        </noscript>
        <details>
          <summary>Reviewed song pages</summary>
          <ul>
            {REAL_RECORDINGS.map((s) => (
              <li key={s.id}>
                <a href={appHref(songPath(s))}>
                  {s.nativeTitle} · {s.title} — lyrics unavailable
                </a>
              </li>
            ))}
          </ul>
        </details>
        <details>
          <summary>About lyrics availability & catalogue coverage</summary>
          <p>
            Currently {coverage?.entity_kinds.recording?.toLocaleString() ?? '…'} distinct source
            recording IDs, not a complete census of Indian music. Cleared recording-linked native +
            romanized lyric pairs: {count ?? 'checking'}. Historical text research, fictional
            examples and ancient verse do not count as song pairs.
          </p>
          <p>
            Goal {coverage?.lyric_pair_coverage?.target.toLocaleString() ?? '2,000,000'} pairs, not
            achieved. Metadata gap:{' '}
            {coverage?.lyric_pair_coverage?.metadata_gap_to_target.toLocaleString() ?? 'checking'};
            cleared-pair gap:{' '}
            {coverage?.lyric_pair_coverage?.pair_gap_to_target.toLocaleString() ?? 'checking'}. Ads
            OFF. No Google ranking or AdSense approval claim.
          </p>
          <button className="song-text-link" onClick={onTools}>
            Advanced filters, source evidence & local library
          </button>
        </details>
        <p>
          Want to try the reading controls?{' '}
          <button className="song-text-link" onClick={onExample}>
            Open an original fictional example
          </button>{' '}
          — not a real catalogue song.
        </p>
        <div className="song-legal">
          <button className="song-text-link" onClick={() => onPolicy('privacy')}>
            Privacy
          </button>
          <button className="song-text-link" onClick={() => onPolicy('rights')}>
            Content & rights
          </button>
        </div>
        <small>Music Raga · a quieter space for the words. No overlays. No automatic audio.</small>
      </footer>
    </div>
  );
}
function SongRow({
  track: t,
  query,
  open,
}: {
  track: SearchTrack;
  query: string;
  open: (t: SearchTrack) => void;
}) {
  const href = appHref('/?' + new URLSearchParams({ q: query, song: t.id }));
  const people = [
    ...new Set(
      t.credits
        .filter((c) => ['vocal', 'singer', 'composer', 'credited_artist'].includes(c.role))
        .map((c) => c.name)
        .filter(Boolean),
    ),
  ].slice(0, 3);
  return (
    <a
      className="song-result-row"
      href={href}
      onClick={(e) => {
        if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          open(t);
        }
      }}
    >
      <span className="song-result-mark" aria-hidden="true">
        {(t.nativeTitle ?? t.title).slice(0, 1)}
      </span>
      <div className="song-result-main">
        <h3>{t.nativeTitle ?? t.title}</h3>
        {t.nativeTitle && <p>{t.title}</p>}
        <p>
          {people.join(' · ') || 'Artist not supplied'}
          {t.album
            ? ' · ' + t.album
            : t.edition_titles?.[0]
              ? ' · ' + t.edition_titles[0].title
              : ''}
        </p>
        <span className="song-unavailable">Lyrics not yet available</span>
      </div>
      <ArrowRight size={19} aria-hidden="true" />
    </a>
  );
}

import { useEffect, useState } from 'react';
import { staticCatalogue } from './staticCatalogue';

type Credit = { artist_id: string; name: string | null; role: string };
type Track = {
  id: string;
  title: string;
  source: string;
  source_url: string;
  year: number | null;
  kind: string;
  album: string | null;
  languages: string[];
  scope_basis: string;
  credits: Credit[];
  linked_recordings?: number;
};
type Page = {
  items: Track[];
  total: number;
  next_cursor: string | null;
  mode: string;
  deployment?: string;
};
type ArtistProfile = {
  id: string;
  name: string;
  roles: { label: string | null; id: string }[];
  externalIds: { wikidata: string; musicbrainz: string[] };
  provenance: { sourceUrl: string }[];
};
type Profiles = {
  items: ArtistProfile[];
  total: number;
  next_cursor: string | null;
  mode: string;
  deployment?: string;
};
type Coverage = {
  tracks: number;
  artist_profiles?: number;
  entity_kinds?: Record<string, number>;
  resolved_artists: number;
  unknown_language: number;
  unknown_year: number;
  roles: Record<string, number>;
  sources: Record<string, number>;
  languages: { code: string; name: string; tracks: number }[];
};
const safeSource = (value: string) => {
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      ['musicbrainz.org', 'www.wikidata.org', 'example.invalid'].includes(u.hostname)
    );
  } catch {
    return false;
  }
};
export default function IndiaIndex() {
  const [entity, setEntity] = useState('tracks');
  const [kind, setKind] = useState('');
  const [work, setWork] = useState('');
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [language, setLanguage] = useState('');
  const [role, setRole] = useState('');
  const [source, setSource] = useState('');
  const [artist, setArtist] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const restart = () => {
    setCursor(null);
    setHistory([]);
  };
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let live = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: '20' });
    for (const [key, value] of Object.entries({
      q: applied,
      language,
      role,
      source,
      artist,
      cursor,
      kind,
      work,
    }))
      if (value) params.set(key, value);
    if (entity === 'artists')
      for (const key of ['language', 'role', 'source', 'artist', 'kind', 'work'])
        params.delete(key);
    async function get<T>(url: string): Promise<T> {
      const result = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (result.status === 404 || result.status >= 500)
        return (await staticCatalogue(url, controller.signal)) as T;
      if (!result.ok) {
        if (result.status === 409 || result.status === 400) {
          const errorBody = (await result.json()) as { error?: string };
          throw new Error(errorBody.error || 'The catalogue changed. Restart from the first page.');
        }
        throw new Error(
          'The optional catalogue server is unavailable. The curated website still works. Start the documented local Python server to connect this index.',
        );
      }
      return result.json() as Promise<T>;
    }
    Promise.all([
      get<Page | Profiles>('/api/v1/' + entity + '?' + params),
      get<Coverage>('/api/v1/coverage'),
    ])
      .then(([result, metrics]) => {
        if (!Array.isArray(result.items) || !Array.isArray(metrics.languages))
          throw new Error('Unexpected catalogue response.');
        if (live) {
          if (entity === 'artists') {
            setProfiles(result as Profiles);
            setPage(null);
          } else {
            setPage(result as Page);
            setProfiles(null);
          }
          setCoverage(metrics);
        }
      })
      .catch((e: unknown) => {
        if (live) {
          setPage(null);
          setProfiles(null);
          setError(
            e instanceof Error && e.name !== 'AbortError'
              ? e.message
              : 'The catalogue request timed out. Please retry.',
          );
        }
      })
      .finally(() => {
        if (live) setLoading(false);
        window.clearTimeout(timeout);
      });
    return () => {
      live = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [applied, language, role, source, artist, cursor, retry, entity, kind, work]);
  const activePage = page ?? profiles;
  return (
    <div className="india-index">
      <p className="eyebrow">AN INDEX THAT CAN GROW · METADATA ONLY</p>
      <p>
        Search the optional durable server index, one page at a time. This is not every Indian song,
        and artist associations do not prove Indian origin. Curated reading pages remain separate
        and may overlap.
      </p>
      {coverage && (
        <p className="index-metrics">
          {coverage.tracks.toLocaleString()} indexed entities (not unique songs) ·{' '}
          {coverage.resolved_artists.toLocaleString()} source credit identities ·{' '}
          {coverage.unknown_language.toLocaleString()} unknown-language records ·{' '}
          {coverage.unknown_year.toLocaleString()} unknown years
        </p>
      )}
      {activePage?.mode === 'synthetic' && (
        <p role="note" className="index-warning">
          SYNTHETIC BENCHMARK DATABASE — these are not real songs or artists.
        </p>
      )}
      {activePage?.deployment === 'static-shards' && (
        <p className="index-metrics">
          Free static preview · paged source data and query-specific search shards. Exact Unicode
          tokens plus final-term prefix; not semantic or lyric search.
        </p>
      )}
      <label className="index-entity-label">
        Explore
        <select
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value);
            restart();
            setPage(null);
            setProfiles(null);
          }}
        >
          <option value="tracks">Compositions and recordings</option>
          <option value="artists">Artist source profiles ({coverage?.artist_profiles ?? 0})</option>
        </select>
      </label>
      <form
        className="index-controls"
        onSubmit={(e) => {
          e.preventDefault();
          restart();
          setApplied(query);
          setRetry((n) => n + 1);
        }}
      >
        <label>
          Native title or artist
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={200}
            placeholder="தமிழ், Hindi, an artist or title…"
          />
        </label>
        <label>
          Language
          <select
            disabled={entity === 'artists'}
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              restart();
            }}
          >
            <option value="">All observed languages</option>
            {coverage?.languages.map((l) => (
              <option key={l.code} value={l.code} disabled={!l.tracks}>
                {l.name} · {l.tracks} {l.tracks ? '' : '(not observed)'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contributor role
          <select
            disabled={entity === 'artists'}
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              restart();
            }}
          >
            <option value="">All contributor roles</option>
            {Object.entries(coverage?.roles ?? {}).map(([r, n]) => (
              <option key={r} value={r}>
                {r.replaceAll('_', ' ')} · {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Provenance
          <select
            disabled={entity === 'artists'}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              restart();
            }}
          >
            <option value="">All sources</option>
            {Object.entries(coverage?.sources ?? {}).map(([s, n]) => (
              <option key={s} value={s}>
                {s} · {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Entity type
          <select
            disabled={entity === 'artists'}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              restart();
            }}
          >
            <option value="">All entity types (not unique songs)</option>
            <option value="work">Compositions</option>
            <option value="recording">Recordings</option>
            <option value="song_or_single">Wikidata song/single entities</option>
          </select>
        </label>
        <button className="button primary" type="submit">
          Search index
        </button>
      </form>
      {work && (
        <button
          className="button"
          onClick={() => {
            setWork('');
            setKind('');
            restart();
          }}
        >
          Clear composition relationship
        </button>
      )}
      {artist && (
        <button
          className="button"
          onClick={() => {
            setArtist('');
            restart();
          }}
        >
          Clear selected artist
        </button>
      )}
      {loading && <p role="status">Searching the server index…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="button"
            onClick={() => {
              restart();
              setRetry((n) => n + 1);
            }}
          >
            Retry from first page
          </button>
        </div>
      )}
      {page && !loading && (
        <>
          <p role="status">
            {page.total.toLocaleString()} matching records · newest known year first; unknown dates
            last.
          </p>
          {!page.items.length && (
            <p>No matching records. Unknown fields are never invented; try fewer filters.</p>
          )}
          <ol className="index-results">
            {page.items.map((t) => (
              <li key={t.id}>
                <article>
                  <div className="eyebrow">
                    {t.source} · {t.kind} · {t.year ?? 'Year unknown'}
                  </div>
                  <h3 dir="auto">{t.title}</h3>
                  <p>
                    {t.album ?? 'Album unknown'} ·{' '}
                    {t.languages.length ? t.languages.join(', ') : 'Language unknown'}
                  </p>
                  <p className="muted">
                    Source-asserted credits; not independently musicologically verified.
                  </p>
                  <ul className="index-credits">
                    {t.credits.map((c, i) => (
                      <li key={c.artist_id + c.role + i}>
                        <button
                          onClick={() => {
                            setArtist(c.artist_id);
                            restart();
                          }}
                        >
                          {c.name ?? 'Name unknown — source identity retained'}
                        </button>{' '}
                        <small>{c.role.replaceAll('_', ' ')}</small>
                      </li>
                    ))}
                  </ul>
                  {t.kind === 'work' && !!t.linked_recordings && (
                    <button
                      className="button"
                      onClick={() => {
                        setWork(t.id);
                        setKind('recording');
                        setLanguage('');
                        setRole('');
                        setArtist('');
                        setSource('musicbrainz');
                        setApplied('');
                        setQuery('');
                        restart();
                      }}
                    >
                      Explore {t.linked_recordings} linked recordings
                    </button>
                  )}
                  <details>
                    <summary>Provenance and availability</summary>
                    <p>{t.scope_basis}</p>
                    <p>CC0 core metadata only. No lyrics, translations or audio imported.</p>
                    {safeSource(t.source_url) && (
                      <a href={t.source_url} target="_blank" rel="noopener noreferrer">
                        View source record ↗
                      </a>
                    )}
                  </details>
                </article>
              </li>
            ))}
          </ol>
        </>
      )}
      {profiles && !loading && (
        <>
          <p role="status">
            {profiles.total.toLocaleString()} source artist profiles. Occupations below are NOT
            song-level credits or proof of nationality.
          </p>
          <ol className="index-results">
            {profiles.items.map((profile) => (
              <li key={profile.id}>
                <article>
                  <h3>{profile.name}</h3>
                  <p>
                    Source occupations:{' '}
                    {profile.roles.map((r) => r.label ?? r.id).join(', ') || 'Unknown'}
                  </p>
                  {profile.provenance[0] && safeSource(profile.provenance[0].sourceUrl) && (
                    <a
                      href={profile.provenance[0].sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Wikidata source ↗
                    </a>
                  )}
                  {profile.externalIds.musicbrainz.map((id) => (
                    <button
                      className="button"
                      key={id}
                      onClick={() => {
                        setEntity('tracks');
                        setArtist('musicbrainz:artist:' + id);
                        setWork('');
                        setRole('');
                        setKind('');
                        setSource('');
                        setLanguage('');
                        setApplied('');
                        setQuery('');
                        restart();
                      }}
                    >
                      Explore linked MusicBrainz credit records
                    </button>
                  ))}
                </article>
              </li>
            ))}
          </ol>
        </>
      )}
      {activePage && !loading && (
        <nav className="index-pagination" aria-label="Catalogue pages">
          <button
            className="button"
            disabled={!history.length}
            onClick={() => {
              setCursor(history[history.length - 1]);
              setHistory(history.slice(0, -1));
            }}
          >
            Previous page
          </button>
          <span>Page {history.length + 1}</span>
          <button
            className="button"
            disabled={!activePage.next_cursor}
            onClick={() => {
              setHistory([...history, cursor]);
              setCursor(activePage.next_cursor);
            }}
          >
            Next page
          </button>
        </nav>
      )}
      <p className="muted">
        No account sync, copyrighted lyrics, background library upload or completeness claim.
        Metadata availability is not lyric permission. See the repository’s source-pipeline and
        rights documentation.
      </p>
    </div>
  );
}

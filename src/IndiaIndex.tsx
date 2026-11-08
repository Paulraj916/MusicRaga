import { useEffect, useState } from 'react';
import { staticCatalogue } from './staticCatalogue';
import { appHref } from './deployment';

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
  role_proof_count?: number;
  association_evidence?: {
    tier: string;
    work_languages: string[];
    release_text_languages: string[];
    release_ids: string[];
    primary_artist_id?: string;
    primary_artist_area_id?: string;
  };
  credit_evidence?: {
    artist_id: string;
    role: string;
    attributes: { id: string; name: string }[];
  }[];
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
  language_associations?: { language: string; tracks: number }[];
  recording_roles?: Record<string, number>;
  role_proof_chains?: number;
  lyric_pair_coverage?: {
    real_recordings: number;
    cleared_native_romanized_pairs: number;
    recordings_without_cleared_pair: number;
    target: number;
    metadata_gap_to_target: number;
    pair_gap_to_target: number;
  };
  explicit_vocal_recordings?: number;
  explicit_vocal_artist_identities?: number;
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
type EvidencePage = {
  total: number;
  limit: number;
  items: {
    id: string;
    artist: string | null;
    role: string;
    work: string | null;
    context: string | null;
    source_urls: string[];
    evidence_ids: string[];
  }[];
};
function CreditEvidence({ recording }: { recording: string }) {
  const [result, setResult] = useState<EvidencePage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const path = appHref('/api/v1/evidence?recording=' + encodeURIComponent(recording));
      const response = await fetch(path, { signal: controller.signal, credentials: 'omit' });
      const value =
        response.status === 404 || response.status >= 500
          ? await staticCatalogue(path, controller.signal)
          : response.ok
            ? await response.json()
            : null;
      if (!value || !Array.isArray((value as EvidencePage).items))
        throw new Error('Invalid proof response');
      setResult(value as EvidencePage);
    } catch {
      setError('Credit evidence could not load. Retry or open the source record.');
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }
  return (
    <section className="credit-proof" aria-label="Versioned credit evidence">
      {!result && (
        <button type="button" className="button" onClick={load} disabled={loading}>
          {loading ? 'Loading credit evidence…' : 'View credit evidence'}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p role="status">
            Showing {result.items.length} of {result.total} source proof chains. Versioned
            assertions can overlap; not separate performances or lyric licences.
          </p>
          <ul>
            {result.items.map((p) => (
              <li key={p.id}>
                <strong>
                  {p.role}: {p.artist ?? 'Source artist identity'}
                </strong>
                {p.work && <> · composition: {p.work}</>}
                <p>{p.context}</p>
                {p.source_urls.filter(safeSource).map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    Source {i + 1} ↗{' '}
                  </a>
                ))}
                <small className="proof-identity">Proof: {p.id}</small>
              </li>
            ))}
          </ul>
          <p>
            Full qualifiers and versioned relationship IDs remain in the downloadable CC0 sidecars
            and local database. Composition credits do not establish that lyrics were sung.
          </p>
        </>
      )}
    </section>
  );
}
export default function IndiaIndex() {
  const [entity, setEntity] = useState('tracks');
  const [kind, setKind] = useState('');
  const [work, setWork] = useState('');
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [language, setLanguage] = useState('');
  const [association, setAssociation] = useState('');
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
      association_language: association,
      role,
      source,
      artist,
      cursor,
      kind,
      work,
    }))
      if (value) params.set(key, value);
    if (entity === 'artists')
      for (const key of [
        'language',
        'association_language',
        'role',
        'source',
        'artist',
        'kind',
        'work',
      ])
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
      get<Page | Profiles>(appHref('/api/v1/' + entity + '?' + params)),
      get<Coverage>(appHref('/api/v1/coverage')),
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
  }, [applied, language, association, role, source, artist, cursor, retry, entity, kind, work]);
  const activePage = page ?? profiles;
  return (
    <div className="india-index">
      <p className="eyebrow">AN INDEX THAT CAN GROW · METADATA ONLY</p>
      <p>
        Search the real source-backed India-associated catalogue, one page at a time. This is not
        every Indian song, and artist associations do not prove Indian origin. Curated reading pages
        remain separate and may overlap.
      </p>
      {coverage && (
        <p className="index-metrics">
          {coverage.tracks.toLocaleString()} indexed entities (not unique songs) ·{' '}
          {coverage.resolved_artists.toLocaleString()} source credit identities ·{' '}
          {coverage.unknown_language.toLocaleString()} unknown-language records ·{' '}
          {coverage.unknown_year.toLocaleString()} unknown years
          {coverage.explicit_vocal_recordings !== undefined && (
            <>
              {' '}
              · {coverage.explicit_vocal_recordings.toLocaleString()} recordings with explicit vocal
              relationships (not inferred from artist names)
            </>
          )}
        </p>
      )}
      {coverage?.lyric_pair_coverage && activePage?.mode !== 'synthetic' && (
        <section className="coverage-panel" aria-labelledby="coverage-heading">
          <div>
            <p className="eyebrow">Transparent progress · not a completeness claim</p>
            <h3 id="coverage-heading">The catalogue and the words are different milestones.</h3>
          </div>
          <dl className="coverage-grid">
            <div>
              <dt>Distinct real recording IDs</dt>
              <dd data-testid="recording-coverage">
                {coverage.lyric_pair_coverage.real_recordings.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt>Cleared native + romanized lyric pairs</dt>
              <dd data-testid="pair-coverage">
                {coverage.lyric_pair_coverage.cleared_native_romanized_pairs.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt>Recording-linked pair goal · not achieved</dt>
              <dd>{coverage.lyric_pair_coverage.target.toLocaleString()}</dd>
            </div>
          </dl>
          <p>
            Metadata gap to goal:{' '}
            <strong data-testid="metadata-gap">
              {coverage.lyric_pair_coverage.metadata_gap_to_target.toLocaleString()}
            </strong>{' '}
            · Cleared-pair gap:{' '}
            <strong data-testid="pair-gap">
              {coverage.lyric_pair_coverage.pair_gap_to_target.toLocaleString()}
            </strong>
            .
          </p>
          <p>
            {coverage.lyric_pair_coverage.recordings_without_cleared_pair.toLocaleString()} indexed
            recordings have no cleared pair. Text rights remain unverified or restricted. Tanglish /
            Hinglish means native words in English letters, <strong>not English translation</strong>
            . Fictional demos and ancient verse are excluded from these recording-linked counts.
          </p>
          {coverage.recording_roles && (
            <p>
              Recording-level composition evidence:{' '}
              {coverage.recording_roles.composer?.toLocaleString() ?? '0'} composer ·{' '}
              {coverage.recording_roles.lyricist?.toLocaleString() ?? '0'} lyricist. Roles overlap,
              are incomplete and do not grant lyric rights.
            </p>
          )}
        </section>
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
          Language association (not sung language)
          <select
            disabled={entity === 'artists'}
            value={association}
            onChange={(e) => {
              setAssociation(e.target.value);
              restart();
            }}
          >
            <option value="">All association evidence</option>
            {(coverage?.language_associations ?? []).map((l) => (
              <option key={l.language} value={l.language}>
                {coverage?.languages.find((v) => v.code === l.language)?.name ?? l.language} ·{' '}
                {l.tracks}
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
      {loading && <p role="status">Searching the source-backed index…</p>}
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
                    Source-asserted credits; not independently musicologically verified. Generic
                    credited artists are NOT automatically singers or composers.
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
                        setAssociation('');
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
                  {t.association_evidence?.tier && (
                    <p className="index-warning">
                      Association: {t.association_evidence.tier.replaceAll('-', ' ')}. Work
                      language:{' '}
                      {(t.association_evidence.work_languages ?? []).join(', ') || 'unknown'};
                      edition-text language:{' '}
                      {(t.association_evidence.release_text_languages ?? []).join(', ') ||
                        'unknown'}
                      . Neither proves sung language or Indian origin.
                    </p>
                  )}
                  <details>
                    <summary>Provenance and availability</summary>
                    {t.association_evidence?.primary_artist_area_id && (
                      <p>
                        Primary artist source-area association: not citizenship, recording location
                        or sung language.{' '}
                        <a
                          href={
                            'https://musicbrainz.org/area/' +
                            t.association_evidence.primary_artist_area_id
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Source area ↗
                        </a>
                      </p>
                    )}
                    {!!t.credit_evidence?.length && (
                      <ul>
                        {t.credit_evidence.map((c, i) => (
                          <li key={i}>
                            Explicit {c.role}:{' '}
                            {t.credits.find(
                              (v) => v.artist_id === 'musicbrainz:artist:' + c.artist_id,
                            )?.name ?? 'Source artist identity'}
                            {c.attributes.length
                              ? ' · ' + c.attributes.map((a) => a.name).join(', ')
                              : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!!t.association_evidence?.release_ids?.length && (
                      <p>
                        Associated editions (not original recording dates):{' '}
                        {t.association_evidence.release_ids.slice(0, 5).map((id) => (
                          <a
                            key={id}
                            href={'https://musicbrainz.org/release/' + id}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Source edition ↗{' '}
                          </a>
                        ))}
                        {t.association_evidence.release_ids.length > 5
                          ? 'Additional edition IDs retained in source metadata.'
                          : ''}
                      </p>
                    )}
                    {!!t.role_proof_count && <CreditEvidence key={t.id} recording={t.id} />}
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
                      View artist source ↗
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
                        setAssociation('');
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

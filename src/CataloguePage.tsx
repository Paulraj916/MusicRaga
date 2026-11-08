import { appHref } from './deployment';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { lyricLanguage, valuesFor } from './lib';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import type { Song } from './catalogue';
import { CATALOGUE, isDemo, isReadable, recordLabel, REAL_RECORDINGS } from './realCatalogue';
import { artistPath, contributors, languagePath, routeSongs, songPath } from './routes';
import type { Route } from './routes';
export function follow(
  e: MouseEvent<HTMLAnchorElement>,
  path: string,
  onNavigate: (path: string) => void,
) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  onNavigate(path);
}
export function Sources({ song }: { song: Song }) {
  return (
    <section className="source-ledger" aria-label="Sources and permissions">
      <div className="eyebrow">
        <ShieldCheck size={15} />
        TRACE THE RECORD
      </div>
      <h2>Sources, not assumptions.</h2>
      <p>{song.rights.evidence}</p>
      <ol>
        {song.sources?.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.label}
              <ExternalLink size={13} />
            </a>
            <p>{source.supports}</p>
            <small>Checked {source.checked} · source facts, not a lyric licence</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function CuratedShelves({ onNavigate }: { onNavigate: (p: string) => void }) {
  const links = [
    {
      path: artistPath('A. R. Rahman'),
      eyebrow: 'THE COMPOSER THREAD',
      title: 'A. R. Rahman',
      text: 'Roja to Sillunu Oru Kaadhal · 3 sourced entries',
      className: 'rahman-shelf',
      mark: 'AR',
    },
    {
      path: artistPath('Santhosh Narayanan'),
      eyebrow: 'A DIFFERENT CITY. A DISTINCT VOICE.',
      title: 'Vada Chennai',
      text: 'Santhosh Narayanan · credits, not copied lyrics',
      className: 'chennai-shelf',
      mark: 'செ',
    },
    {
      path: songPath(CATALOGUE.find((s) => s.id === 'tirukkural-invocation')!),
      eyebrow: 'A TEXT THAT OUTLIVES ITS TIME',
      title: 'The Tamil reading room',
      text: 'Ancient verse · original script & new renderings',
      className: 'verse-shelf',
      mark: 'அ',
    },
  ];
  return (
    <section className="curated-shelves" aria-label="Curated listening paths">
      {links.map((link) => (
        <a
          key={link.path}
          className={`curated-shelf ${link.className}`}
          href={appHref(link.path)}
          onClick={(e) => follow(e, link.path, onNavigate)}
        >
          <svg className="shelf-mark" aria-hidden="true" focusable="false" viewBox="0 0 240 160">
            <text x="5" y="140">
              {link.mark}
            </text>
          </svg>
          <span className="eyebrow">{link.eyebrow}</span>
          <h2>{link.title}</h2>
          <p>{link.text}</p>
          <span className="shelf-cta">
            Follow the thread
            <ArrowRight size={15} />
          </span>
        </a>
      ))}
    </section>
  );
}
export function CataloguePage({
  route,
  onNavigate,
  onOpen,
  font,
  setFont,
  saved,
  onToggleSave,
  collections,
  onAddCollection,
}: {
  route: Route;
  onNavigate: (p: string) => void;
  onOpen: (s: Song) => void;
  font: number;
  setFont: (n: number) => void;
  saved: boolean;
  onToggleSave: (id: string) => void;
  collections: { name: string; ids: string[] }[];
  onAddCollection: (name: string, id: string) => void;
}) {
  const [order, setOrder] = useState('newest');
  const [album, setAlbum] = useState('');
  const [voice, setVoice] = useState('');
  const link = (path: string, label: string) => (
    <a href={appHref(path)} onClick={(e) => follow(e, path, onNavigate)}>
      {label}
    </a>
  );
  if (route.kind === 'home') return null;
  if (route.kind === 'not-found')
    return (
      <section className="route-page not-found">
        <span className="eyebrow">404 · A MISSING VERSE</span>
        <h1>
          That page isn’t
          <br />
          in the <em>songbook.</em>
        </h1>
        <p>No invented result, no misleading redirect. Try discovery instead.</p>
        {link('/', 'Back to discovery')}
      </section>
    );
  if (route.kind === 'song') {
    const s = route.song;
    const readable = isReadable(s);
    const labels = {
      original: 'Original script',
      translation: 'English rendering',
      transliteration: s.language === 'Tamil' ? 'Thanglish / Latin' : 'Latin transliteration',
    };
    return (
      <article className="route-page song-page">
        <nav className="route-breadcrumb" aria-label="Breadcrumb">
          {link('/', 'Discover')}
          <span>/</span>
          {link(languagePath(s.language), s.language)}
          <span>/</span>
          <span>{s.title}</span>
        </nav>
        <div className={`record-intro tone-${s.artwork}`}>
          <div className="record-emblem" aria-hidden="true">
            <span>{s.kind === 'verse' ? 'அ' : s.composer === 'A. R. Rahman' ? 'AR' : '♪'}</span>
          </div>
          <div>
            <span className="eyebrow">{recordLabel(s)}</span>
            <h1>{s.title}</h1>
            <p className="native-record-title" lang={lyricLanguage(s.language, 'original')}>
              {s.nativeTitle}
            </p>
            <p>
              {s.album} · {s.year ?? 'Ancient text · date uncertain'} · {s.language}
            </p>
            <div className="rights-badge">
              <ShieldCheck size={14} />
              {readable
                ? s.rights.status === 'public-domain'
                  ? 'Ancient words. New project renderings.'
                  : 'Original fictional exercise · CC0'
                : 'Commercial lyrics and audio not reproduced'}
            </div>
          </div>
        </div>
        <p className="record-description">
          {s.description ??
            'An explicitly fictional original demo. Its credits and year describe an example, not a real release. Shared original text illustrates multilingual reading.'}
        </p>
        <section className="credit-ribbon" aria-label="Credited contributors">
          {contributors(s).map((c) => (
            <div key={`${c.role}-${c.name}`}>
              <span>
                {c.role === 'singer' ? 'Voice' : c.role === 'composer' ? 'Music' : 'Words'}
              </span>
              {link(artistPath(c.name), c.name)}
            </div>
          ))}
        </section>
        <div className="record-actions">
          <button
            className="button"
            aria-pressed={saved}
            aria-label={`${saved ? 'Unsave' : 'Save'} ${s.title}`}
            onClick={() => onToggleSave(s.id)}
          >
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved to your library' : 'Save this work'}
          </button>
          <label>
            Add to a local collection
            <select
              aria-label="Add this work to collection"
              disabled={!collections.length}
              value=""
              onChange={(e) => {
                if (e.target.value) onAddCollection(e.target.value, s.id);
              }}
            >
              <option value="">
                {collections.length
                  ? 'Choose collection…'
                  : 'Create a collection in Your library first'}
              </option>
              {collections.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {readable ? (
          <section className="static-reader" aria-labelledby="text-heading">
            <div className="static-reader-top">
              <div>
                <span className="eyebrow">THE WORDS, WITHOUT THE NOISE</span>
                <h2 id="text-heading">{labels[route.variant]}</h2>
              </div>
              <button className="button" onClick={() => onOpen(s)}>
                <BookOpen size={16} />
                Open practice room
              </button>
            </div>
            <nav className="text-variants" aria-label="Text versions">
              {(['original', 'translation', 'transliteration'] as const)
                .filter((v) => s.lyrics[v])
                .map((v) => (
                  <a
                    key={v}
                    href={appHref(songPath(s, v))}
                    aria-current={route.variant === v ? 'page' : undefined}
                    onClick={(e) => follow(e, songPath(s, v), onNavigate)}
                  >
                    {labels[v]}
                  </a>
                ))}
            </nav>
            <label className="inline-size">
              Reading size
              <input
                type="range"
                min="18"
                max="36"
                value={font}
                aria-label="Page reading text size"
                onChange={(e) => setFont(Number(e.target.value))}
              />
            </label>
            <div
              className="page-poem"
              lang={lyricLanguage(s.language, route.variant)}
              style={{ fontSize: font }}
            >
              {s.lyrics[route.variant]?.map((line, i) => (
                <p key={i}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {line.text}
                </p>
              ))}
            </div>
            <p className="text-edition-note">
              {s.rights.status === 'public-domain'
                ? 'The original is ancient public-domain verse, not a modern song adaptation. English and readable Latin are new Music Raga renderings (CC0), not quotations from modern translations. Practice timing is artificial, with no included recording.'
                : 'Original project writing, translated and romanised for this fictional demo. CC0 dedication; artificial practice timing.'}
            </p>
          </section>
        ) : (
          <section className="rights-gate">
            <ShieldCheck size={26} />
            <div>
              <h2>Credits open. Lyrics protected.</h2>
              <p>
                We can help you identify this recording, its album and credited people. We do not
                have permission to reproduce its lyrics, translated lyrics, transliteration, artwork
                or audio. There is no hidden “unlock” or misleading play button.
              </p>
              {s.sources?.find(
                (source) =>
                  source.url.includes('music.apple') ||
                  source.url.includes('spotify') ||
                  source.url.includes('music.amazon'),
              ) && (
                <a
                  className="button"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={
                    s.sources.find(
                      (source) =>
                        source.url.includes('music.apple') ||
                        source.url.includes('spotify') ||
                        source.url.includes('music.amazon'),
                    )!.url
                  }
                >
                  Open sourced catalogue listing
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </section>
        )}
        {s.sources?.length ? (
          <Sources song={s} />
        ) : (
          <section className="source-ledger">
            <h2>Original demonstration, not a real release.</h2>
            <p>{s.rights.evidence}</p>
          </section>
        )}
        <section className="related-records">
          <h2>Keep following the thread.</h2>
          {CATALOGUE.filter((item) => item.id !== s.id && item.composer === s.composer)
            .slice(0, 3)
            .map((item) => (
              <div key={item.id}>
                {link(songPath(item), item.title)}
                <span>
                  {item.album} · {item.year ?? 'Ancient text'}
                </span>
              </div>
            ))}
        </section>
      </article>
    );
  }
  const all = routeSongs(route);
  const list = all
    .filter(
      (s) => (!album || s.album === album) && (!voice || valuesFor(s, 'artist').includes(voice)),
    )
    .sort((a, b) =>
      a.year === null
        ? 1
        : b.year === null
          ? -1
          : order === 'oldest'
            ? a.year - b.year
            : b.year - a.year,
    );
  const factual = all.filter((s) => !isDemo(s));
  return (
    <section className="route-page collection-page">
      <a className="back-link" href={appHref('/')} onClick={(e) => follow(e, '/', onNavigate)}>
        <ArrowLeft size={14} />
        Back to discovery
      </a>
      <span className="eyebrow">
        {route.kind === 'artist' ? 'PEOPLE MAKE THE MUSIC' : 'MANY SCRIPTS. ONE CURIOSITY.'}
      </span>
      <h1>
        {route.name}
        <span className="orange-dot" />
      </h1>
      <p>
        {route.kind === 'artist'
          ? `${all.length} entries credit this name in our deliberately small catalogue. Explore the actual role on each work; this is not a claim to a complete discography.`
          : `Explore ${route.name} music metadata and readable texts. Rights status stays visible before you open anything.`}
      </p>
      <div className="collection-stats">
        <span>{factual.length} sourced / public-domain entries</span>
        <span>{all.length - factual.length} fictional demos</span>
      </div>
      <div className="route-refinements">
        <label>
          Chronology
          <select
            aria-label="Collection chronology"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="newest">Newest to oldest</option>
            <option value="oldest">Oldest to newest</option>
          </select>
        </label>
        <label>
          Album
          <select
            aria-label="Collection album"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
          >
            <option value="">All albums / texts</option>
            {[...new Set(all.map((s) => s.album))].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Voice
          <select
            aria-label="Collection voice"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
          >
            <option value="">All credited voices</option>
            {[...new Set(all.flatMap((s) => valuesFor(s, 'artist')))].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="route-result-count" role="status">
        {list.length} matching entries · unknown ancient dates remain last
      </p>
      {!list.length && (
        <p className="contextual-results">
          No entry combines these selections. Choose another album or voice.
        </p>
      )}
      <div className="route-record-list">
        {list.map((s) => (
          <article key={s.id}>
            <span className={`list-art tone-${s.artwork}`} aria-hidden="true">
              {s.kind === 'verse' ? 'அ' : '✳'}
            </span>
            <div>
              <span className="eyebrow">{recordLabel(s)}</span>
              <h2>{link(songPath(s), s.title)}</h2>
              <p>
                {s.album} · {s.year ?? 'Ancient text · date uncertain'}
              </p>
              <small>
                {route.kind === 'artist'
                  ? contributors(s)
                      .filter((c) => c.name === route.name)
                      .map((c) => c.role)
                      .join(' · ')
                  : s.composer}
              </small>
            </div>
            <ArrowRight size={18} />
          </article>
        ))}
      </div>
      {route.kind === 'artist' && route.name === 'Santhosh Narayanan' && (
        <p className="attribution-note">
          Vada Chennai’s composer is Santhosh Narayanan, not A. R. Rahman. Source credit tables are
          linked from each recording.
        </p>
      )}
      {route.kind === 'artist' && route.name === 'A. R. Rahman' && (
        <p className="attribution-note">
          The {REAL_RECORDINGS.filter((s) => s.composer === route.name).length} included entries
          span 1992–2006. This is a sourced starting point, not his latest release or complete
          catalogue.
        </p>
      )}
    </section>
  );
}

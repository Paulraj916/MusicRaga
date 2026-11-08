// Static fallback: bounded metadata pages and query-specific Unicode/facet shards.
// No full catalogue download, client account, cookies, or third-party requests.
type Manifest = {
  mode: 'real' | 'synthetic';
  version: string;
  page_size: number;
  coverage: unknown;
  entities: Record<string, { count: number; term_buckets: string[] }>;
};
const root = `${import.meta.env.BASE_URL}catalogue/`;
const cache = new Map<string, unknown>();
async function read<T>(url: string, signal: AbortSignal, missing = false): Promise<T> {
  const isManifest = url.endsWith('/manifest.json');
  if (!isManifest && cache.has(url)) return cache.get(url) as T;
  const response = await fetch(url, {
    signal,
    credentials: 'omit',
    cache: isManifest ? 'no-cache' : 'default',
  });
  if (!response.ok) {
    if (missing && response.status === 404) return [] as T;
    throw new Error(
      'The optional catalogue server and static index are unavailable. The curated website still works.',
    );
  }
  const result = (await response.json()) as T;
  if (cache.size >= 16) cache.delete(cache.keys().next().value!);
  if (!isManifest) cache.set(url, result);
  return result;
}
async function fingerprint(value: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))),
  )
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
function intersection(a: number[], b: number[]) {
  const set = new Set(b);
  return a.filter((n) => set.has(n));
}
export async function staticCatalogue(path: string, signal: AbortSignal): Promise<unknown> {
  const manifest = await read<Manifest>(root + 'manifest.json', signal);
  const url = new URL(path, window.location.origin);
  if (url.pathname.endsWith('/coverage')) return manifest.coverage;
  const entity = url.pathname.endsWith('/artists') ? 'artists' : 'tracks';
  const prefix = root + manifest.version + '/' + entity + '/';
  const params = url.searchParams;
  const limit = Math.max(1, Math.min(100, Number(params.get('limit') ?? 20)));
  const query = (params.get('q') ?? '').normalize('NFC').toLowerCase();
  const words = (query.match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).slice(0, 8);
  let positions: number[] | null = null;
  const combine = (values: number[]) => {
    positions = positions === null ? values : intersection(positions, values);
  };
  for (let i = 0; i < words.length; i++) {
    const word = words[i],
      bucket = word.codePointAt(0)!.toString(16);
    if (!manifest.entities[entity].term_buckets.includes(bucket)) {
      combine([]);
      break;
    }
    const index = await read<Record<string, number[]>>(
      prefix + 'terms/' + bucket + '.json',
      signal,
    );
    const keys =
      i === words.length - 1 ? Object.keys(index).filter((k) => k.startsWith(word)) : [word];
    if (keys.length > 128)
      throw new Error(
        'Use a longer search term: the static preview limits broad prefix expansion.',
      );
    combine([...new Set(keys.flatMap((k) => index[k] ?? []))].sort((a, b) => a - b));
  }
  if (query.trim() && !words.length) combine([]);
  if (entity === 'tracks') {
    async function facet(key: string, value: string) {
      const hash = await fingerprint(key + ':' + value);
      const bucket = await read<Record<string, number[]>>(
        prefix + 'facets/' + hash.slice(0, 2) + '.json',
        signal,
        true,
      );
      combine(bucket[hash] ?? []);
    }
    const sameCredit = params.get('role') && params.get('artist');
    for (const key of ['language', 'role', 'source', 'artist', 'kind', 'work']) {
      const value = params.get(key);
      if (value && !(sameCredit && ['role', 'artist'].includes(key))) await facet(key, value);
    }
    if (sameCredit) await facet('artistrole', params.get('artist') + '|' + params.get('role'));
  }
  const finalPositions = positions as number[] | null;
  const total = finalPositions === null ? manifest.entities[entity].count : finalPositions.length;
  const signature = await fingerprint(
    [...params]
      .filter(([k]) => k !== 'cursor')
      .sort()
      .map((pair) => pair.join('='))
      .join('&'),
  );
  let offset = 0;
  if (params.get('cursor')) {
    try {
      const token = JSON.parse(atob(params.get('cursor')!)) as {
        version: string;
        signature: string;
        offset: number;
      };
      if (
        token.version !== manifest.version ||
        token.signature !== signature ||
        !Number.isSafeInteger(token.offset) ||
        token.offset < 0
      )
        throw new Error();
      offset = token.offset;
    } catch {
      throw new Error('The static catalogue changed. Restart from the first page.');
    }
  }
  const selected = Array.from({ length: Math.min(limit, Math.max(0, total - offset)) }, (_, i) =>
    finalPositions === null ? offset + i : finalPositions[offset + i],
  );
  const pages = new Map<number, unknown[]>();
  await Promise.all(
    [...new Set(selected.map((n) => Math.floor(n / manifest.page_size)))].map(async (page) => {
      pages.set(page, await read<unknown[]>(prefix + 'pages/' + page + '.json', signal));
    }),
  );
  return {
    items: selected.map(
      (n) => pages.get(Math.floor(n / manifest.page_size))![n % manifest.page_size],
    ),
    total,
    mode: manifest.mode,
    deployment: 'static-shards',
    next_cursor:
      offset + limit < total
        ? btoa(JSON.stringify({ version: manifest.version, signature, offset: offset + limit }))
        : null,
  };
}

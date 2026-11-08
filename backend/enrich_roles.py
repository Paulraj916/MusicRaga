"""Atomic, offline, nondeleting CC0 v3 role-evidence overlay. No lyric permission inferred."""
import gzip
import hashlib
import json
from pathlib import Path
from .catalogue import (LANGUAGES, ROLES, SOURCES, ValidationError, canonical, connect, file_hash,
                        mode, normal, now, text, upsert, valid_id, validate)

FILES = ('role-artists-v3.jsonl.gz', 'role-works-v3.jsonl.gz',
         'artist-recording-evidence-v3.jsonl.gz', 'artist-work-evidence-v3.jsonl.gz',
         'recording-work-evidence-v3.jsonl.gz', 'recording-role-enrichment-v3.jsonl.gz',
         'role-artist-crosswalk-v3.jsonl.gz')
FIELDS = ('composerCredits', 'lyricistCredits', 'genericWriterCredits',
          'genericAuthorshipCredits', 'vocalCredits', 'genericPerformerCredits',
          'otherCompositionCredits')
ROLE_TYPES = {'composer':'d59d99ea-23d4-4a80-b066-edca32ee158f',
              'lyricist':'3e48faba-ec01-47fd-8e89-30e81161661c',
              'writer':'a255bca1-b157-4518-9108-7b147dc3fc68',
              'authorship':'cc9fcb45-7ab5-4629-bc5f-277f2592fa5a',
              'vocal':'0fdbe3c6-7700-4a31-ae54-b53f06ae1cfa',
              'performer':'628a9658-f54c-4142-b0c0-95f031b544da'}
SCHEMA = """
CREATE TABLE IF NOT EXISTS role_source_facts(id TEXT PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS role_relationships(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS role_relationship_entity0 ON role_relationships(json_extract(payload,'$.entity0'),json_extract(payload,'$.sourceTable'));
CREATE INDEX IF NOT EXISTS role_relationship_entity1 ON role_relationships(json_extract(payload,'$.entity1'),json_extract(payload,'$.sourceTable'));
CREATE TABLE IF NOT EXISTS role_credit_proofs(
 id TEXT PRIMARY KEY,recording_id TEXT NOT NULL REFERENCES tracks(id),
 artist_id TEXT NOT NULL,role TEXT NOT NULL,role_type_id TEXT,work_id TEXT,
 payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS role_proofs_recording ON role_credit_proofs(recording_id,id);
CREATE TABLE IF NOT EXISTS role_imports(digest TEXT PRIMARY KEY,report TEXT NOT NULL);
"""

def namespace(identity, kind):
    prefix = 'mb-' + kind + ':'
    if not isinstance(identity, str) or not identity.startswith(prefix) or not valid_id('musicbrainz', identity[len(prefix):]):
        raise ValidationError('invalid role source identity')
    return 'musicbrainz:' + kind + ':' + identity[len(prefix):]


def rows(path):
    with gzip.open(path, 'rb') as stream:
        for line in stream:
            if len(line) > 4 * 1024 * 1024:
                raise ValidationError('oversized role source row')
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValidationError('invalid role source object')
            yield value


def metadata_only(value):
    if isinstance(value,dict):
        for key,item in value.items():
            if key.replace('_','').casefold() in {'lyrics','lyrictext','lyricstext','translation','translationtext','transliteration','audio','audiourl','artwork','artworkurl'} and item not in (None,False,[],{}):
                raise ValidationError('media or lyric text is not permitted in metadata evidence')
            metadata_only(item)
    elif isinstance(value,list):
        for item in value:metadata_only(item)


def provenance(row):
    metadata_only(row)
    proofs = row.get('provenance', [])
    if not proofs or any(p.get('license') != 'CC0-1.0' or not p.get('sourceUrl', '').startswith(('https://musicbrainz.org/', 'https://www.wikidata.org/wiki/')) for p in proofs):
        raise ValidationError('unapproved role source or licence')
    return proofs


def verify_sources(directory, baseline):
    root = Path(directory)
    manifest = json.loads((root / 'manifest.json').read_text())
    if set(manifest) != set(FILES):
        raise ValidationError('unexpected role manifest files')
    for name in FILES:
        info = manifest[name]
        if info['license'] != 'CC0-1.0' or file_hash(root / name) != info['compressedSha256']:
            raise ValidationError('role source compressed hash/license mismatch')
        digest, count = hashlib.sha256(), 0
        with gzip.open(root / name, 'rb') as stream:
            for line in stream:
                if len(line) > 4 * 1024 * 1024:
                    raise ValidationError('oversized role source row')
                digest.update(line)
                count += 1
        if digest.hexdigest() != info['uncompressedSha256'] or count != info['records']:
            raise ValidationError('role source uncompressed hash/count mismatch')
    build = json.loads((root / 'build-manifest.json').read_text())
    base = Path(baseline)
    entry = next(e for e in json.loads((base / 'manifest.json').read_text())['files']
                 if e['file'] == 'preferred-india-associated-recordings-v2.jsonl.gz')
    if entry['uncompressed_sha256'] != build['targetSha256'] or file_hash(base / entry['file']) != entry['compressed_sha256']:
        raise ValidationError('role target does not match pinned preferred v2 source')
    target_ids, target_digest = set(), hashlib.sha256()
    with gzip.open(base / entry['file'], 'rb') as stream:
        for line in stream:
            target_digest.update(line)
            target_ids.add(namespace(json.loads(line)['id'], 'recording'))
    if target_digest.hexdigest() != build['targetSha256']:
        raise ValidationError('role target uncompressed hash mismatch')
    overlay_ids = {namespace(r['id'], 'recording') for r in rows(root / 'recording-role-enrichment-v3.jsonl.gz')}
    if overlay_ids != target_ids or len(overlay_ids) != manifest['recording-role-enrichment-v3.jsonl.gz']['records']:
        raise ValidationError('overlay recording universe differs from preferred source')
    digest = hashlib.sha256(canonical({'importer': 1, 'manifest': manifest, 'target': build['targetSha256']}).encode()).hexdigest()
    return digest, target_ids


def add_credit(db, track, artist, role, name):
    if role not in ROLES:
        raise ValidationError('unsupported explicit role')
    db.execute('INSERT OR IGNORE INTO artists VALUES(?,?,?,?)', (artist, 'musicbrainz', artist.split(':')[-1], name))
    db.execute('INSERT OR IGNORE INTO credits VALUES(?,?,?,?)', (track, artist, role, name))


def store_proof(db, identity, recording, artist, role, role_type, work, payload):
    encoded = canonical(payload)
    old = db.execute('SELECT payload FROM role_credit_proofs WHERE id=?', (identity,)).fetchone()
    if old and old[0] != encoded:
        raise ValidationError('immutable proof identity collision')
    db.execute('INSERT OR IGNORE INTO role_credit_proofs VALUES(?,?,?,?,?,?,?)',
               (identity, recording, artist, role, role_type, work, encoded))


def baseline_proofs(db):
    """Keep newer baseline composition chains, including the two absent from older v3."""
    for row in db.execute("""SELECT w.recording_id,w.work_id,c.artist_id,c.role,c.name,t.fingerprint,t.payload
        FROM work_recordings w JOIN credits c ON c.track_id=w.work_id JOIN tracks t ON t.id=w.work_id
        WHERE c.role IN ('composer','lyricist','writer')""").fetchall():
        rid, wid, aid, role, name, fingerprint, payload = tuple(row)
        identity = 'baseline:' + hashlib.sha256(canonical([rid,wid,aid,role,fingerprint]).encode()).hexdigest()
        work = json.loads(payload)
        recording = json.loads(db.execute('SELECT payload FROM tracks WHERE id=?', (rid,)).fetchone()[0])
        if not any(c['source_id'] and 'musicbrainz:artist:'+c['source_id']==aid and c['role']==role for c in work['credits']):
            continue
        if wid.split(':')[-1] not in recording['associated_work_ids']:
            continue
        proof = {'id': identity, 'role': role, 'context': 'Baseline explicit recording-to-work link and source composition credit; not proof lyrics were sung.',
                 'workId': wid, 'artistId': aid, 'workTitle': work['title'], 'artistName': name,
                 'workProvenance': work['provenance'], 'recordingProvenance': recording['provenance'],
                 'sourceUrls': [recording['source_url'], work['source_url']]}
        store_proof(db, identity, rid, aid, role, None, wid, proof)
        add_credit(db, rid, aid, role, name)


def integrate(database, directory='data/pending-v3', baseline='data/cc0'):
    digest, targets = verify_sources(directory, baseline)
    root = Path(directory)
    with connect(database) as db:
        if mode(db) != 'real':
            raise ValidationError('real role evidence cannot enter a synthetic database')
        db.executescript(SCHEMA)
        db.execute('BEGIN IMMEDIATE')
        prior = db.execute('SELECT report FROM role_imports WHERE digest=?', (digest,)).fetchone()
        if prior:
            return {**json.loads(prior[0]), 'already_imported': True}
        actual = {r[0] for r in db.execute("SELECT id FROM tracks WHERE source='musicbrainz' AND kind='recording'")}
        if not targets <= actual:
            raise ValidationError('role overlay has missing recording targets')
        initial_recordings = len(actual)
        baseline_proofs(db)  # BEFORE older snapshot sidecars add any facts.
        for raw in rows(root / FILES[0]):
            proof = provenance(raw)[0]
            identity = namespace(raw['id'], 'artist')
            name = text(raw.get('sourceName'), 'role artist name')
            old = db.execute('SELECT pk,payload FROM artist_profiles WHERE id=?', (identity,)).fetchone()
            value = json.loads(old['payload']) if old else {'id': identity, 'name': name, 'aliases': [], 'roles': [], 'countries': [],
                'countryEvidence': 'Source role graph only; no nationality or inferred occupation.',
                'externalIds': {'wikidata': None, 'musicbrainz': [identity.split(':')[-1]]},
                'provenance': [{**proof, 'licenseUrl': SOURCES['musicbrainz'][1]}]}
            # Search hints are not verified names; alias type 3 intentionally excluded here.
            aliases = [a['name'] for a in raw.get('aliases', []) if a.get('sourceAliasTypeId') != 3 and isinstance(a.get('name'), str) and 0 < len(a['name']) <= 500]
            value['aliases'] = list(dict.fromkeys([*value.get('aliases', []), *aliases]))[:40]
            db.execute('INSERT INTO artist_profiles(id,name,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload', (identity, value['name'], canonical(value)))
            pk = db.execute('SELECT pk FROM artist_profiles WHERE id=?', (identity,)).fetchone()[0]
            db.execute('DELETE FROM profile_search WHERE rowid=?', (pk,))
            db.execute('INSERT INTO profile_search(rowid,profile_id,body) VALUES(?,?,?)', (pk, identity, normal(' '.join([value['name'], *value['aliases']]))))
            db.execute('INSERT INTO role_source_facts VALUES(?,?,?)', (raw['id'], 'artist', canonical(raw)))
        for raw in rows(root / FILES[1]):
            proof = provenance(raw)[0]
            identity = namespace(raw['id'], 'work')
            db.execute('INSERT INTO role_source_facts VALUES(?,?,?)', (raw['id'], 'work', canonical(raw)))
            if not db.execute('SELECT 1 FROM tracks WHERE id=?', (identity,)).fetchone():
                record = validate({'source': 'musicbrainz', 'source_id': identity.split(':')[-1], 'source_url': proof['sourceUrl'],
                    'license': 'CC0-1.0', 'license_url': SOURCES['musicbrainz'][1], 'retrieved_at': proof['retrievedAt'],
                    'kind': 'work', 'title': raw['title'], 'aliases': [], 'languages': [x['iso639_3'] for x in raw.get('declaredWorkLanguages', []) if x.get('iso639_3') in LANGUAGES],
                    'credits': [], 'countries': [], 'year': None, 'album': None,
                    'scope_basis': 'Composition linked through explicit performance evidence; language is a source work declaration, not recording sung language or nationality.',
                    'provenance': {'unmapped_language_ids': [x['iso639_3'] for x in raw.get('declaredWorkLanguages', []) if x.get('iso639_3') and x['iso639_3'] not in LANGUAGES], 'snapshot_url': proof['snapshotUrl'], 'license_evidence_url': proof['licenseUrl'], 'input_sha256': hashlib.sha256(canonical(raw).encode()).hexdigest()}})
                upsert(db, record)
        for name in FILES[2:5]:
            for raw in rows(root / name):
                provenance(raw)
                rel=raw['relationshipType']
                if rel['name'] in ROLE_TYPES and rel['id']!=ROLE_TYPES[rel['name']]:
                    raise ValidationError('role name does not match approved source role UUID')
                expected = f"mb-rel:{raw['sourceTable']}:{raw['sourceRelationshipId']}@{raw['sourceSnapshot']}"
                if raw['id'] != expected:
                    raise ValidationError('unversioned source relationship identity')
                db.execute('INSERT INTO role_relationships VALUES(?,?)', (raw['id'], canonical(raw)))
                if name == 'recording-work-evidence-v3.jsonl.gz':
                    rid, wid = namespace(raw['entity0'], 'recording'), namespace(raw['entity1'], 'work')
                    if rid not in targets or not db.execute('SELECT 1 FROM tracks WHERE id=?', (wid,)).fetchone():
                        raise ValidationError('invalid work performance endpoint')
                    if raw['relationshipType']['id'] != 'a3005666-a872-32c3-ad06-98af558e99b0':
                        raise ValidationError('not an explicit work performance relationship')
                    db.execute('INSERT OR IGNORE INTO work_recordings VALUES(?,?)', (rid, wid))
                elif name == 'artist-work-evidence-v3.jsonl.gz':
                    aid, wid = namespace(raw['entity0'], 'artist'), namespace(raw['entity1'], 'work')
                    profile = db.execute('SELECT name FROM artist_profiles WHERE id=?', (aid,)).fetchone()
                    if not profile:
                        raise ValidationError('missing role artist sidecar')
                    role = raw['relationshipType']['name']
                    if role in ROLES:
                        add_credit(db, wid, aid, role, profile[0])
        proofs = 0
        for raw in rows(root / FILES[5]):
            proof_source = provenance(raw)
            rid = namespace(raw['id'], 'recording')
            for field in FIELDS:
                for credit in raw.get(field, []):
                    aid, role = namespace(credit['artistId'], 'artist'), credit['role']
                    wid = namespace(credit['workId'], 'work') if credit.get('workId') else None
                    keys = ([credit['artistWorkEvidenceId'], *credit['recordingWorkEvidenceIds']] if wid else [credit['artistRecordingEvidenceId']])
                    evidence = []
                    for key in keys:
                        found = db.execute('SELECT payload FROM role_relationships WHERE id=?', (key,)).fetchone()
                        if not found:
                            raise ValidationError('missing versioned role proof chain')
                        evidence.append(json.loads(found[0]))
                    relationship = evidence[0]
                    if (namespace(relationship['entity0'], 'artist') != aid or
                        namespace(relationship['entity1'], 'work' if wid else 'recording') != (wid or rid) or
                        relationship['relationshipType']['id'] != credit['roleTypeId'] or
                        relationship['relationshipType']['name'] != role):
                        raise ValidationError('role proof endpoints/type mismatch')
                    for link in evidence[1:]:
                        if namespace(link['entity0'], 'recording') != rid or namespace(link['entity1'], 'work') != wid:
                            raise ValidationError('recording performance proof mismatch')
                    if wid and len(evidence) < 2:
                        raise ValidationError('composition proof lacks recording performance')
                    profile = db.execute('SELECT name FROM artist_profiles WHERE id=?', (aid,)).fetchone()
                    if not profile:
                        raise ValidationError('missing proof artist profile')
                    store_proof(db, credit['id'], rid, aid, role, credit['roleTypeId'], wid,
                                {**credit, 'provenance': proof_source, 'evidenceIds': keys})
                    add_credit(db, rid, aid, role, profile[0])
                    proofs += 1
        for raw in rows(root / FILES[6]):
            provenance(raw)
            db.execute('INSERT INTO role_source_facts VALUES(?,?,?)', ('crosswalk:' + raw['id'], 'candidate-crosswalk-not-merged', canonical(raw)))
        # Refresh only affected FTS entries; recording payload/languages/dates remain untouched.
        affected = [r[0] for r in db.execute('SELECT DISTINCT recording_id FROM role_credit_proofs UNION SELECT DISTINCT work_id FROM work_recordings')]
        for identity in affected:
            row = db.execute('SELECT pk,payload FROM tracks WHERE id=?', (identity,)).fetchone()
            value = json.loads(row['payload'])
            names = [r[0] or '' for r in db.execute('SELECT name FROM credits WHERE track_id=?', (identity,))]
            db.execute('DELETE FROM search WHERE rowid=?', (row['pk'],))
            db.execute('INSERT INTO search(rowid,track_id,body) VALUES(?,?,?)', (row['pk'], identity, normal(' '.join([value['title'], *value['aliases'], value['album'] or '', *names]))))
        if db.execute("SELECT count(*) FROM tracks WHERE kind='recording'").fetchone()[0] != initial_recordings:
            raise ValidationError('role overlay changed recording cardinality')
        preferred = {}
        all_roles = {}
        for role in ('composer', 'lyricist', 'writer', 'vocal', 'performer'):
            identities = {r[0] for r in db.execute("SELECT DISTINCT c.track_id FROM credits c JOIN tracks t ON t.id=c.track_id WHERE t.kind='recording' AND c.role=?", (role,))}
            preferred[role], all_roles[role] = len(identities & targets), len(identities)
        report = {'digest': digest, 'preferred_recordings': len(targets), 'all_recordings': initial_recordings,
                  'v3_proofs': proofs, 'preferred_recording_roles': preferred, 'all_recording_roles': all_roles,
                  'recordings_added': 0, 'lyric_pairs_added': 0, 'network_requests': 0}
        db.execute('INSERT INTO role_imports VALUES(?,?)', (digest, canonical(report)))
        db.execute("INSERT OR REPLACE INTO meta VALUES('role_enrichment_digest',?)", (digest,))
        db.execute("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='generation'")
        return report


def evidence_summary(db, recording, limit=20):
    if not recording.startswith('musicbrainz:recording:') or not valid_id('musicbrainz', recording.split(':')[-1]):
        raise ValidationError('invalid evidence recording ID')
    exists = db.execute("SELECT 1 FROM sqlite_master WHERE name='role_credit_proofs'").fetchone()
    if not exists:
        return {'recording_id': recording, 'total': 0, 'items': [], 'limit': limit}
    total = db.execute('SELECT count(*) FROM role_credit_proofs WHERE recording_id=?', (recording,)).fetchone()[0]
    items = []
    for row in db.execute('SELECT * FROM role_credit_proofs WHERE recording_id=? ORDER BY id LIMIT ?', (recording, limit)):
        proof = json.loads(row['payload'])
        links = proof.get('sourceUrls') or [p['sourceUrl'] for p in proof.get('provenance', [])]
        if row['work_id']:
            links = list(dict.fromkeys([*links, 'https://musicbrainz.org/work/' + row['work_id'].split(':')[-1]]))
        items.append({'id': row['id'], 'artist': proof.get('artistName'), 'role': row['role'],
                      'work': proof.get('workTitle'), 'context': proof.get('context'), 'source_urls': links,
                      'evidence_ids': proof.get('evidenceIds', []), 'attributes': proof.get('attributes', [])})
    return {'recording_id': recording, 'total': total, 'items': items, 'limit': limit,
            'notice': 'Bounded source proof preview; full versioned evidence and qualifiers retained in SQLite and bundled CC0 source sidecars. Composition credits do not establish sung lyrics or text permission.'}


def restore_materialized(db, identity, kind):
    """A later base metadata revision must not silently remove separately stored proof facts."""
    if kind=='recording':
        for p in db.execute('SELECT artist_id,role,work_id,payload FROM role_credit_proofs WHERE recording_id=?',(identity,)):
            value=json.loads(p['payload'])
            profile=db.execute('SELECT name FROM artist_profiles WHERE id=?',(p['artist_id'],)).fetchone()
            add_credit(db,identity,p['artist_id'],p['role'],profile[0] if profile else value.get('artistName'))
            if p['work_id']:db.execute('INSERT OR IGNORE INTO work_recordings VALUES(?,?)',(identity,p['work_id']))
        source='mb-recording:'+identity.split(':')[-1]
        for r in db.execute("SELECT payload FROM role_relationships WHERE json_extract(payload,'$.entity0')=? AND json_extract(payload,'$.sourceTable')='l_recording_work'",(source,)):
            value=json.loads(r[0]);db.execute('INSERT OR IGNORE INTO work_recordings VALUES(?,?)',(identity,namespace(value['entity1'],'work')))
    elif kind=='work':
        source='mb-work:'+identity.split(':')[-1]
        for r in db.execute("SELECT payload FROM role_relationships WHERE json_extract(payload,'$.entity1')=? AND json_extract(payload,'$.sourceTable')='l_artist_work'",(source,)):
            value=json.loads(r[0]);role=value['relationshipType']['name'];aid=namespace(value['entity0'],'artist')
            profile=db.execute('SELECT name FROM artist_profiles WHERE id=?',(aid,)).fetchone()
            if role in ROLES and profile:add_credit(db,identity,aid,role,profile[0])

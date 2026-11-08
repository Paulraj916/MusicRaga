"""Bounded additive preferred-recording delta; never replace the v2/v3 catalogue."""
import gzip
import hashlib
import json
from pathlib import Path
from .adapt_batch import adapt, adapt_profile_v2
from .catalogue import (LANGUAGES, SOURCES, ValidationError, canonical, connect, file_hash,
                        import_profiles, upsert, validate)
from .enrich_roles import namespace, provenance, rows


def integrate_v4(database, directory='data/cc0-v4'):
    root=Path(directory)
    manifest=json.loads((root/'manifest.json').read_text())
    names={'additional-artists-v4.jsonl.gz','additional-preferred-recordings-v4.jsonl.gz',
           'recording-work-evidence-v4.jsonl.gz','india-geographic-containment-evidence-v4.jsonl.gz',
           'india-associated-areas-v4.jsonl.gz','identity-review-v4.jsonl.gz'}
    if set(manifest)!=names:
        raise ValidationError('unexpected v4 delta manifest')
    for name,info in manifest.items():
        if info['license']!='CC0-1.0' or file_hash(root/name)!=info['compressedSha256']:
            raise ValidationError('v4 compressed source hash/license mismatch')
        digest=hashlib.sha256();count=0
        with gzip.open(root/name,'rb')as stream:
            for line in stream:
                if len(line)>4*1024*1024:raise ValidationError('oversized v4 source row')
                digest.update(line);count+=1
        if digest.hexdigest()!=info['uncompressedSha256'] or count!=info['records']:
            raise ValidationError('v4 uncompressed source hash/count mismatch')
    digest=hashlib.sha256(canonical({'importer':1,'manifest':manifest}).encode()).hexdigest()
    # Profile imports are independently validated/idempotent and nondeleting; safe to resume.
    with connect(database)as db:
        db.execute('CREATE TABLE IF NOT EXISTS v4_imports(digest TEXT PRIMARY KEY,report TEXT NOT NULL)')
        previous=db.execute('SELECT report FROM v4_imports WHERE digest=?',(digest,)).fetchone()
        if previous:return {**json.loads(previous[0]),'already_imported':True}
        if not db.execute("SELECT 1 FROM meta WHERE key='role_enrichment_digest'").fetchone():
            raise ValidationError('v4 requires v3 to be integrated first')
    profiles_changed=import_profiles(database,(adapt_profile_v2(r)for r in rows(root/'additional-artists-v4.jsonl.gz')))
    with connect(database)as db:
        db.execute('BEGIN IMMEDIATE')
        initial=db.execute("SELECT count(*) FROM tracks WHERE kind='recording'").fetchone()[0]
        exclusions=list(rows(root/'identity-review-v4.jsonl.gz'))
        excluded_ids={r.get('id') or r.get('recordingId') for r in exclusions}
        # Preserve raw source facts; no name-based crosswalk merging or geographic nationality inference.
        for name in ['additional-artists-v4.jsonl.gz','india-associated-areas-v4.jsonl.gz','india-geographic-containment-evidence-v4.jsonl.gz']:
            for raw in rows(root/name):
                provenance(raw)
                db.execute('INSERT OR IGNORE INTO role_source_facts VALUES(?,?,?)',('v4:'+raw['id'],raw['entityType'],canonical(raw)))
        works_added=0
        for raw in rows(root/'recording-work-evidence-v4.jsonl.gz'):
            proof=provenance(raw)[0]
            if raw['sourceRelationshipTypeId']!='a3005666-a872-32c3-ad06-98af558e99b0':
                raise ValidationError('v4 requires explicit recording-work performance')
            wid=namespace(raw['workId'],'work');rid=namespace(raw['recordingId'],'recording')
            db.execute('INSERT OR IGNORE INTO role_source_facts VALUES(?,?,?)',('v4:'+raw['id'],'recording-work-performance',canonical(raw)))
            if not db.execute('SELECT 1 FROM tracks WHERE id=?',(wid,)).fetchone():
                languages=[v for v in raw['declaredWorkLanguages']if v in LANGUAGES]
                work=validate({'source':'musicbrainz','source_id':wid.split(':')[-1],
                    'source_url':'https://musicbrainz.org/work/'+wid.split(':')[-1],
                    'license':'CC0-1.0','license_url':SOURCES['musicbrainz'][1],'retrieved_at':proof['retrievedAt'],
                    'title':raw['workTitle'],'kind':'work','aliases':[],'credits':[],'languages':languages,
                    'countries':[],'year':None,'album':None,'scope_basis':'Source composition linked through an explicit performance relationship; not sung-language or lyric-rights proof.',
                    'provenance':{'snapshot_url':proof['snapshotUrl'],'license_evidence_url':proof['licenseUrl'],
                        'input_sha256':hashlib.sha256(canonical(raw).encode()).hexdigest()}})
                upsert(db,work);works_added+=1
        ids=set(); duration_fields_quarantined=[]
        for raw in rows(root/'additional-preferred-recordings-v4.jsonl.gz'):
            provenance(raw)
            rid=namespace(raw['id'],'recording')
            if rid in ids or raw['id'] in excluded_ids or db.execute('SELECT 1 FROM tracks WHERE id=?',(rid,)).fetchone():
                raise ValidationError('v4 delta collides with existing/ambiguous identity; no replacement permitted')
            ids.add(rid)
            if raw.get('lyricsRights')!='not-cleared' or raw.get('video') is not False:
                raise ValidationError('v4 media/rights admission gate failed')
            value=dict(raw)
            duration=value.get('durationMs')
            if duration is not None and (type(duration) is not int or not 0<=duration<=86400000):
                value['durationMs']=None
                duration_fields_quarantined.append(raw['id'])
            record=adapt(value,canonical(raw).encode())
            upsert(db,record)
            db.execute('INSERT INTO role_source_facts VALUES(?,?,?)',('v4:'+raw['id'],'recording-source-evidence',canonical(raw)))
        if len(ids)!=manifest['additional-preferred-recordings-v4.jsonl.gz']['records']:
            raise ValidationError('v4 distinct addition count mismatch')
        # Relationships remain versioned source facts; normalized work links came from recording records.
        report={'digest':digest,'recordings_added':len(ids),'all_recordings':initial+len(ids),
                'works_added':works_added,'profiles_changed':profiles_changed,
                'ambiguous_identities_excluded':len(exclusions),'duration_fields_quarantined_as_unknown':duration_fields_quarantined,'lyric_pairs_added':0,'network_requests':0}
        db.execute('INSERT INTO v4_imports VALUES(?,?)',(digest,canonical(report)))
        db.execute("INSERT OR REPLACE INTO meta VALUES('v4_expansion_digest',?)",(digest,))
        db.execute("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='generation'")
        return report

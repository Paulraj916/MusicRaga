"""Isolated bounded delta fixtures; no additional live data acquired by tests."""
import copy
import gzip
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from backend.adapt_batch import adapt
from backend.catalogue import initialize,connect,upsert,coverage,ValidationError
from backend.enrich_roles import SCHEMA
from backend.expand_v4 import integrate_v4

ROOT=Path(__file__).resolve().parents[2]

class V4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with gzip.open(ROOT/'data/cc0-v4/additional-preferred-recordings-v4.jsonl.gz','rt')as f:cls.record=json.loads(next(f))
        aid=cls.record['artistCredit'][0]['artistId']
        with gzip.open(ROOT/'data/cc0-v4/additional-artists-v4.jsonl.gz','rt')as f:
            cls.artist=next(json.loads(l)for l in f if json.loads(l)['id']=='mb-artist:'+aid)
        with gzip.open(ROOT/'data/cc0/preferred-india-associated-recordings-v2.jsonl.gz','rt')as f:cls.old=json.loads(next(f))

    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.db=self.root/'test.sqlite'
        initialize(self.db)
        with connect(self.db)as d:
            d.executescript(SCHEMA)
            d.execute("INSERT INTO meta VALUES('role_enrichment_digest','isolated-unit-fixture')")
            upsert(d,adapt(self.old,json.dumps(self.old).encode()))
            tid='musicbrainz:recording:'+self.old['externalIds']['musicbrainzRecording']
            artist=d.execute('SELECT id FROM artists LIMIT 1').fetchone()[0]
            d.execute("INSERT INTO credits VALUES(?,?,'composer','unit fixture existing role')",(tid,artist))
        self.values={'additional-artists-v4.jsonl.gz':[copy.deepcopy(self.artist)],
                     'additional-preferred-recordings-v4.jsonl.gz':[copy.deepcopy(self.record)],
                     'recording-work-evidence-v4.jsonl.gz':[],
                     'india-geographic-containment-evidence-v4.jsonl.gz':[],
                     'india-associated-areas-v4.jsonl.gz':[], 'identity-review-v4.jsonl.gz':[]}
        self.write()

    def tearDown(self):self.temp.cleanup()

    def write(self):
        manifest={}
        for name,rows in self.values.items():
            body=''.join(json.dumps(x,ensure_ascii=False)+'\n'for x in rows).encode();compressed=gzip.compress(body,mtime=0)
            (self.root/name).write_bytes(compressed)
            manifest[name]={'license':'CC0-1.0','records':len(rows),'compressedSha256':hashlib.sha256(compressed).hexdigest(),'uncompressedSha256':hashlib.sha256(body).hexdigest()}
        (self.root/'manifest.json').write_text(json.dumps(manifest))

    def test_additive_idempotent_preserves_old_roles_and_unknown_language(self):
        report=integrate_v4(self.db,self.root)
        self.assertEqual(report['recordings_added'],1)
        self.assertTrue(integrate_v4(self.db,self.root)['already_imported'])
        with connect(self.db,True)as d:
            c=coverage(d);self.assertEqual(c['entity_kinds']['recording'],2)
            self.assertEqual(c['recording_roles']['composer'],1)
            row=d.execute('SELECT payload FROM tracks WHERE source_id=?',(self.record['externalIds']['musicbrainzRecording'],)).fetchone()
            self.assertEqual(json.loads(row[0])['languages'],[])
            self.assertEqual(c['lyric_pair_coverage']['cleared_native_romanized_pairs'],0)

    def test_invalid_duration_becomes_unknown_without_guessing_units(self):
        self.values['additional-preferred-recordings-v4.jsonl.gz'][0]['durationMs']=227710832;self.write()
        report=integrate_v4(self.db,self.root)
        self.assertEqual(len(report['duration_fields_quarantined_as_unknown']),1)
        with connect(self.db,True)as d:
            row=d.execute('SELECT payload FROM tracks WHERE source_id=?',(self.record['externalIds']['musicbrainzRecording'],)).fetchone()
            self.assertIsNone(json.loads(row[0])['duration_ms'])

    def test_delta_never_overwrites_an_existing_recording(self):
        self.values['additional-preferred-recordings-v4.jsonl.gz']=[copy.deepcopy(self.old)]
        self.write()
        with self.assertRaises(ValidationError):integrate_v4(self.db,self.root)
        with connect(self.db,True)as d:self.assertEqual(coverage(d)['entity_kinds']['recording'],1)

    def test_no_text_even_when_metadata_sidecar_hashes_match(self):
        self.values['additional-preferred-recordings-v4.jsonl.gz'][0]['translation']='unlicensed unit fixture'
        self.write()
        with self.assertRaises(ValidationError):integrate_v4(self.db,self.root)

    def test_hash_mismatch_fails_closed(self):
        p=self.root/'additional-artists-v4.jsonl.gz';p.write_bytes(p.read_bytes()+b'bad')
        with self.assertRaises(ValidationError):integrate_v4(self.db,self.root)

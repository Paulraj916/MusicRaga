"""Small isolated fixtures sampled from bundled CC0 facts; never added to the public index."""
import copy
import gzip
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from backend.catalogue import (ValidationError, canonical, connect, coverage, initialize,
                               search, upsert, validate)
from backend.adapt_batch import adapt
from backend.enrich_roles import FILES, integrate, evidence_summary

ROOT=Path(__file__).resolve().parents[2]

class RoleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source=ROOT/'data/pending-v3'
        def read(name):
            with gzip.open(source/name,'rt')as stream:
                yield from (json.loads(line)for line in stream)
        overlay=next(r for r in read(FILES[5])if r['composerCredits'])
        cls.credit=copy.deepcopy(overlay['composerCredits'][0])
        cls.overlay={**overlay,**{k:[]for k in ['composerCredits','lyricistCredits','genericWriterCredits','genericAuthorshipCredits','vocalCredits','genericPerformerCredits','otherCompositionCredits']}}
        cls.overlay['composerCredits']=[cls.credit]
        cls.artist=next(r for r in read(FILES[0])if r['id']==cls.credit['artistId'])
        cls.work=next(r for r in read(FILES[1])if r['id']==cls.credit['workId'])
        cls.artist_work=next(r for r in read(FILES[3])if r['id']==cls.credit['artistWorkEvidenceId'])
        cls.recording_work=[r for r in read(FILES[4])if r['id']in cls.credit['recordingWorkEvidenceIds']]
        with gzip.open(ROOT/'data/cc0/preferred-india-associated-recordings-v2.jsonl.gz','rt')as s:
            cls.recording=next(json.loads(l)for l in s if json.loads(l)['id']==overlay['id'])

    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.db=self.root/'test.sqlite';initialize(self.db)
        self.roles=self.root/'roles';self.roles.mkdir();self.base=self.root/'base';self.base.mkdir()
        self.values={name:[]for name in FILES}
        self.values[FILES[0]]=[copy.deepcopy(self.artist)];self.values[FILES[1]]=[copy.deepcopy(self.work)]
        self.values[FILES[3]]=[copy.deepcopy(self.artist_work)];self.values[FILES[4]]=copy.deepcopy(self.recording_work)
        self.values[FILES[5]]=[copy.deepcopy(self.overlay)]
        with connect(self.db)as d:upsert(d,adapt(self.recording,canonical(self.recording).encode()))
        body=(canonical(self.recording)+'\n').encode();name='preferred-india-associated-recordings-v2.jsonl.gz'
        compressed=gzip.compress(body,mtime=0);(self.base/name).write_bytes(compressed)
        sha=hashlib.sha256(body).hexdigest()
        (self.base/'manifest.json').write_text(json.dumps({'files':[{'file':name,'compressed_sha256':hashlib.sha256(compressed).hexdigest(),'uncompressed_sha256':sha}]}))
        (self.roles/'build-manifest.json').write_text(json.dumps({'targetSha256':sha}))
        self.write_sources()

    def tearDown(self):self.temp.cleanup()

    def write_sources(self):
        manifest={}
        for name,values in self.values.items():
            body=''.join(canonical(x)+'\n'for x in values).encode();compressed=gzip.compress(body,mtime=0)
            (self.roles/name).write_bytes(compressed)
            manifest[name]={'license':'CC0-1.0','records':len(values),'compressedSha256':hashlib.sha256(compressed).hexdigest(),'uncompressedSha256':hashlib.sha256(body).hexdigest()}
        (self.roles/'manifest.json').write_text(json.dumps(manifest))

    def test_import_exact_proof_and_idempotency(self):
        report=integrate(self.db,self.roles,self.base)
        self.assertEqual(report['all_recording_roles']['composer'],1)
        self.assertTrue(integrate(self.db,self.roles,self.base)['already_imported'])
        with connect(self.db,True)as d:
            page=search(d,{'role':'composer','kind':'recording'})
            self.assertEqual(page['total'],1)
            self.assertEqual(page['items'][0]['languages'],[])
            detail=evidence_summary(d,page['items'][0]['id'])
            self.assertEqual(detail['total'],1)
            self.assertEqual(len(detail['items'][0]['evidence_ids']),2)
            self.assertEqual(coverage(d)['lyric_pair_coverage']['cleared_native_romanized_pairs'],0)

    def test_corrupt_compressed_source_fails_before_data_mutation(self):
        p=self.roles/FILES[0];p.write_bytes(p.read_bytes()+b'corrupt')
        with self.assertRaises(ValidationError):integrate(self.db,self.roles,self.base)
        with connect(self.db,True)as d:self.assertEqual(d.execute('SELECT count(*) FROM artist_profiles').fetchone()[0],0)

    def test_missing_proof_rolls_back_sidecars_and_credits(self):
        self.values[FILES[5]][0]['composerCredits'][0]['artistWorkEvidenceId']='mb-rel:l_artist_work:999999999@20261104-002222'
        self.write_sources()
        with self.assertRaises(ValidationError):integrate(self.db,self.roles,self.base)
        with connect(self.db,True)as d:
            self.assertEqual(d.execute('SELECT count(*) FROM artist_profiles').fetchone()[0],0)
            self.assertEqual(d.execute("SELECT count(*) FROM credits WHERE role='composer'").fetchone()[0],0)

    def test_role_mismatch_cannot_infer_vocalist(self):
        self.values[FILES[5]][0]['composerCredits'][0]['role']='vocal';self.write_sources()
        with self.assertRaises(ValidationError):integrate(self.db,self.roles,self.base)

    def test_empty_overlay_keeps_existing_baseline_composer(self):
        self.values[FILES[5]][0]['composerCredits']=[];self.write_sources()
        proof=self.work['provenance'][0];sid=self.work['id'].split(':')[-1]
        work=validate({'source':'musicbrainz','source_id':sid,'source_url':proof['sourceUrl'],
            'license':'CC0-1.0','license_url':'https://musicbrainz.org/doc/About/Data_License',
            'retrieved_at':proof['retrievedAt'],'kind':'work','title':self.work['title'],
            'aliases':[],'languages':[],'countries':[],'year':None,'album':None,
            'credits':[{'source_id':self.credit['artistId'].split(':')[-1],'name':self.credit['artistName'],'role':'composer'}],
            'scope_basis':'Unit fixture for existing explicit composition evidence','provenance':{}})
        with connect(self.db)as d:upsert(d,work)
        result=integrate(self.db,self.roles,self.base)
        self.assertEqual(result['all_recording_roles']['composer'],1)
        with connect(self.db,True)as d:self.assertEqual(d.execute('SELECT count(*) FROM role_credit_proofs').fetchone()[0],1)

    def test_rights_unknown_and_translation_only_not_cleared_pair(self):
        rid='musicbrainz:recording:'+self.recording['externalIds']['musicbrainzRecording']
        with connect(self.db)as d:
            d.execute('INSERT INTO lyric_pair_clearances VALUES(?,?,?,?,?)',(rid,'native-local-ref','','[]','pending'))
            c=coverage(d)['lyric_pair_coverage']
            self.assertEqual(c['cleared_native_romanized_pairs'],0)
            self.assertEqual(c['pair_gap_to_target'],2000000)
            self.assertEqual(c['metadata_gap_to_target'],1999999)

    def test_target_universe_mismatch_is_rejected(self):
        self.values[FILES[5]]=[];self.write_sources()
        with self.assertRaises(ValidationError):integrate(self.db,self.roles,self.base)

    def test_evidence_identity_validation(self):
        with connect(self.db,True)as d:
            with self.assertRaises(ValidationError):evidence_summary(d,'../../private')

    def test_lyric_payload_cannot_hide_in_metadata_proof(self):
        self.values[FILES[5]][0]['lyrics']='unlicensed test payload';self.write_sources()
        with self.assertRaises(ValidationError):integrate(self.db,self.roles,self.base)

    def test_focal_role_requires_correct_source_uuid(self):
        self.values[FILES[3]][0]['relationshipType']['id']='0fdbe3c6-7700-4a31-ae54-b53f06ae1cfa'
        self.values[FILES[5]][0]['composerCredits'][0]['roleTypeId']='0fdbe3c6-7700-4a31-ae54-b53f06ae1cfa'
        self.write_sources()
        with self.assertRaises(ValidationError):integrate(self.db,self.roles,self.base)

    def test_later_base_metadata_revision_does_not_erase_overlay_roles(self):
        integrate(self.db,self.roles,self.base)
        raw=copy.deepcopy(self.recording);raw['title']+=' [unit metadata revision]'
        raw['explicitArtistRelationships']=[];raw['associatedWorkIds']=[]
        with connect(self.db)as d:
            upsert(d,adapt(raw,canonical(raw).encode()))
            self.assertEqual(search(d,{'role':'composer','kind':'recording'})['total'],1)
            self.assertEqual(d.execute('SELECT count(*) FROM role_credit_proofs').fetchone()[0],1)
            self.assertGreater(d.execute('SELECT count(*) FROM work_recordings').fetchone()[0],0)

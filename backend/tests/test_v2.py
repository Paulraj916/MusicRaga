"""Real normalized v2 source samples: language evidence and credits must not be inferred."""
import gzip,json,tempfile,unittest
from pathlib import Path
from backend.adapt_batch import adapt,adapt_profile_v2
from backend.catalogue import initialize,connect,upsert,search,import_profiles,search_profiles,validate,ValidationError,coverage,resolve_credit_names

class V2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=[]
        with gzip.open('data/cc0/preferred-india-associated-recordings-v2.jsonl.gz','rb') as f:
            for line in f:
                raw=json.loads(line)
                if not cls.rows or any(c['role']=='vocal'for c in raw.get('explicitArtistRelationships',[])):
                    cls.rows.append(adapt(raw,line))
                if len(cls.rows)==2:break
    def test_generic_credit_not_singer_language_not_sung(self):
        row=self.rows[0]
        self.assertEqual(row['languages'],[])
        self.assertEqual(row['year'],None)
        self.assertTrue(row['association_evidence']['release_text_languages'])
        self.assertEqual({c['role'] for c in row['credits']},{'credited_artist'})
    def test_explicit_vocal_evidence_and_filters(self):
        row=self.rows[1]
        self.assertIn('vocal',{c['role']for c in row['credits']})
        self.assertTrue(row['credit_evidence'])
        with tempfile.TemporaryDirectory()as tmp:
            path=Path(tmp)/'catalogue.sqlite';initialize(path)
            with connect(path)as db:upsert(db,row)
            with connect(path,True)as db:
                self.assertEqual(search(db,{'language':'tam'})['total'],0)
                self.assertEqual(search(db,{'association_language':'tam','role':'vocal'})['total'],1)
                self.assertEqual(coverage(db)['explicit_vocal_recordings'],1)
    def test_musicbrainz_profile_pagination_and_no_occupation_inference(self):
        with gzip.open('data/cc0/preferred-india-associated-artists-v2.jsonl.gz','rt')as source:
            profiles=[adapt_profile_v2(json.loads(next(source)))for _ in range(2)]
        self.assertEqual(profiles[0]['roles'],[])
        with tempfile.TemporaryDirectory()as tmp:
            path=Path(tmp)/'catalogue.sqlite';initialize(path)
            self.assertEqual(import_profiles(path,profiles),2)
            self.assertEqual(import_profiles(path,profiles),0)
            with connect(path,True)as db:
                first=search_profiles(db,{'limit':'1'})
                second=search_profiles(db,{'limit':'1','cursor':first['next_cursor']})
                self.assertNotEqual(first['items'][0]['id'],second['items'][0]['id'])
    def test_unsupported_evidence_cannot_hide_lyric_payload(self):
        row=json.loads(json.dumps(self.rows[0]));row['association_evidence']['lyrics']='not allowed'
        with self.assertRaises(ValidationError):validate(row)

    def test_missing_names_resolve_only_exact_source_profile_identity(self):
        row=json.loads(json.dumps(self.rows[0]));name=row['credits'][0]['name'];artist=row['credits'][0]['source_id'];row['credits'][0]['name']=None
        profile={'id':'musicbrainz:artist:'+artist,'name':name,'roles':[],'countries':[],'externalIds':{'musicbrainz':[artist],'wikidata':None},'provenance':[{'sourceUrl':'https://musicbrainz.org/artist/'+artist,'license':'CC0-1.0','licenseUrl':'https://musicbrainz.org/doc/About/Data_License'}]}
        with tempfile.TemporaryDirectory()as tmp:
            path=Path(tmp)/'catalogue.sqlite';initialize(path)
            with connect(path)as db:upsert(db,row)
            import_profiles(path,[profile]);self.assertEqual(resolve_credit_names(path),1);self.assertEqual(resolve_credit_names(path),0)
            with connect(path,True)as db:self.assertEqual(search(db,{'q':name})['total'],1)

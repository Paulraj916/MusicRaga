"""Synthetic source bridge fixtures; never part of the real catalogue."""
import gzip,hashlib,json,tempfile,unittest
from pathlib import Path
from backend.build_static import load_editions
from backend.catalogue import ValidationError

class EditionTests(unittest.TestCase):
 def fixture(self,root,title='Synthetic fixture edition',license='CC0-1.0'):
  sid='00000000-0000-4000-8000-000000000001'
  raw={'id':'mb-release:'+sid,'title':title,'provenance':[{'license':license,'sourceUrl':'https://musicbrainz.org/release/'+sid}]}
  body=(json.dumps(raw)+'\n').encode();path=root/'preferred-india-associated-releases-v2.jsonl.gz';path.write_bytes(gzip.compress(body,mtime=0))
  manifest={'file':path.name,'compressed_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'uncompressed_sha256':hashlib.sha256(body).hexdigest(),'records':1,'license':'CC0-1.0'}
  (root/'manifest.json').write_text(json.dumps(manifest));return path,manifest,sid
 def test_exact_title_and_evidence_preserved_without_inferred_album_metadata(self):
  with tempfile.TemporaryDirectory()as tmp:
   root=Path(tmp);path,manifest,sid=self.fixture(root)
   values,digest=load_editions(root)
   self.assertEqual(values,{sid:{'title':'Synthetic fixture edition','source_url':'https://musicbrainz.org/release/'+sid}})
   self.assertEqual(digest,manifest['compressed_sha256'])
 def test_hash_and_uncompressed_count_fail_closed(self):
  with tempfile.TemporaryDirectory()as tmp:
   root=Path(tmp);path,manifest,sid=self.fixture(root)
   manifest['records']=2;(root/'manifest.json').write_text(json.dumps(manifest))
   with self.assertRaises(ValidationError):load_editions(root)
   path.write_bytes(b'changed')
   with self.assertRaises(ValidationError):load_editions(root)
 def test_non_cc0_source_proof_rejected_even_with_matching_hashes(self):
  with tempfile.TemporaryDirectory()as tmp:
   root=Path(tmp);self.fixture(root,license='restricted')
   with self.assertRaises(ValidationError):load_editions(root)

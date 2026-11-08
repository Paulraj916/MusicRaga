#!/usr/bin/env python3
import json,pathlib
DATA=pathlib.Path(__file__).resolve().parents[1]/'data'
BANNED={'annotation','annotations','genre','genres','rating','ratings','tag','tags'}
def check(value):
 if isinstance(value,dict):
  assert not(BANNED & value.keys()),BANNED & value.keys()
  for x in value.values():check(x)
 elif isinstance(value,list):
  for x in value:check(x)
def load(n):return [json.loads(l) for l in (DATA/n).open()]
for file in DATA.glob('*.jsonl'):
 rows=load(file.name);assert len({r['id'] for r in rows})==len(rows)
 for r in rows:
  check(r);assert r['provenance']
  for p in r['provenance']:assert p['license']=='CC0-1.0' and p['sourceUrl'].startswith('https://') and p['retrievedAt']
  if 'lyrics' in r:assert r['lyrics'] is None and r['lyricsRights']=='not-cleared'
 print(file.name,len(rows),'validated')
w=load('indian-language-song-works.jsonl');ids={x['externalIds']['musicbrainzWork'] for x in w}
for x in w:assert x['workType']=='Song' and x['indiaAssociation']['languageMatch']
for r in load('indian-language-song-recordings.jsonl'):assert set(r['associatedWorkIds'])<=ids and r['associatedWorkIds']
print('Recursive licence-field whitelist, source rights, unique IDs and preferred recording/work references all pass.')

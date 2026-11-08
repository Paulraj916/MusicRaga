#!/usr/bin/env python3
import pathlib,json,collections,hashlib,datetime
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data'
report={'generatedAt':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat(),'scope':'India-associated music metadata; not exhaustive; no lyric rights','files':{},'warnings':['Works, recordings and Wikidata song/single entities are not additive unique-song counts.','Wikidata and MusicBrainz overlap is not reconciled.','Language/citizenship association does not prove Indian origin.','Missing singer/date/language fields remain unknown; no credits are invented.']}
for file in sorted(DATA.glob('*.jsonl')):
 count=0;ids=set();languages=collections.Counter();creditroles=collections.Counter();unknown=0;artist_ids=set();examples=[];missing_title=0
 for line in file.open():
  r=json.loads(line);count+=1;assert r['id'] not in ids,(file,r['id']);ids.add(r['id']);assert r.get('provenance');missing_title+=not bool(r.get('title',r.get('name')))
  if 'lyrics' in r:assert r['lyrics'] is None and r['lyricsRights']=='not-cleared'
  for key in ('annotation','rating','ratings','tags','genres'):assert key not in r
  langs=r.get('languages')
  if not langs:unknown+=1
  for l in langs or []:languages[l if isinstance(l,str) else l.get('id','unknown')]+=1
  cs=r.get('credits')
  if isinstance(cs,list):
   for c in cs:creditroles[c.get('role') or 'unknown']+=1;artist_ids.add(c.get('artist',{}).get('id'))
  elif isinstance(cs,dict):
   for role,aa in cs.items():
    creditroles[role]+=len(aa)
    for a in aa:artist_ids.add(a.get('id'))
  if len(examples)<5:examples.append(r.get('title',r.get('name')))
 report['files'][file.name]={'records':count,'uniqueIds':len(ids),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'languageOccurrences':dict(languages.most_common()),'unknownLanguageRecords':unknown,'creditRoleOccurrences':dict(creditroles.most_common()),'referencedArtists':len(artist_ids-{None}),'missingTitle':missing_title,'examples':examples}
checkpoint=DATA/'musicbrainz-import-checkpoint.json'
if checkpoint.exists():report['musicbrainzBulkImport']=json.load(checkpoint.open())
(DATA/'coverage-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))

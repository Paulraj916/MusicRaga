#!/usr/bin/env python3
import collections,datetime,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data';STATE=ROOT/'checkpoints'
BANNED={'annotation','annotations','rating','ratings','tags','genres','images','image','notes','audioUrl','coverArt','marketplace','user','users'}
def check(o):
 if isinstance(o,dict):
  assert not(BANNED & o.keys()),BANNED & o.keys()
  for x in o.values():check(x)
 elif isinstance(o,list):
  for x in o:check(x)
report={'generatedAt':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat(),'files':{},'unitWarnings':['MusicBrainz recording IDs are distinct recording entities.','MusicBrainz/Discogs release-track IDs are appearances, NOT globally distinct recordings or songs.','Do not sum sources or overlapping tier exports as unique songs.','Community source facts and links are not independent musicological verification.','India-market release country does not prove Indian artist nationality or work origin.','Release text and linked composition language do not establish an independently verified sung language.']};sets={};refs={}
for f in sorted(DATA.glob('*.jsonl')):
 ids=set();stats={'records':0,'bytes':f.stat().st_size,'entityTypes':collections.Counter(),'associationTiers':collections.Counter(),'associatedWorkLanguageOccurrences':collections.Counter(),'releaseTextLanguageOccurrences':collections.Counter()};h=hashlib.sha256();rr=set()
 with f.open('rb') as stream:
  for raw in stream:
   h.update(raw);r=json.loads(raw);check(r);assert r['id'] not in ids,(f,r['id']);ids.add(r['id']);stats['records']+=1;stats['entityTypes'][r.get('entityType','crosswalk')]+=1
   for p in r['provenance']:assert p['license']=='CC0-1.0' and p.get('retrievedAt') and p.get('sourceUrl','').startswith('https://')
   if 'lyrics' in r:assert r['lyrics'] is None and r['lyricsRights']=='not-cleared'
   assoc=r.get('indiaAssociation',{});tier=assoc.get('tier')
   if tier:stats['associationTiers'][tier]+=1
   for l in r.get('associatedWorkLanguages',[]):stats['associatedWorkLanguageOccurrences'][l]+=1
   for l in assoc.get('releaseTextLanguages',[]):stats['releaseTextLanguageOccurrences'][l]+=1
   if r.get('recordingId'):rr.add(r['recordingId'])
   if r.get('releaseId'):rr.add(r['releaseId'])
 stats['sha256']=h.hexdigest();stats['uniqueIds']=len(ids);report['files'][f.name]=stats;sets[f.name]=ids;refs[f.name]=rr;print(f.name,len(ids),'validated',flush=True)
if 'india-release-associated-recordings-v2.jsonl' in sets:
 universe=sets['india-release-associated-recordings-v2.jsonl']
 for file in ['preferred-india-associated-recordings-v2.jsonl','indian-work-language-associated-recordings-v2.jsonl','indian-release-text-associated-recordings-v2.jsonl']:assert sets[file]<=universe
 targets=universe|sets['india-release-associated-releases-v2.jsonl'];assert refs['india-release-associated-tracks-v2.jsonl']<=targets
if 'discogs-india-market-track-occurrences.jsonl' in sets:
 assert sets['discogs-india-style-track-occurrences.jsonl']<=sets['discogs-india-market-track-occurrences.jsonl'];assert refs['discogs-india-market-track-occurrences.jsonl']<=sets['discogs-india-market-releases.jsonl']
baseline={json.loads(l)['id'] for l in (ROOT.parent/'data/indian-language-song-recordings.jsonl').open()}
for name,ids in sets.items():
 if name.endswith('recordings-v2.jsonl'):
  report['files'][name]['baselineRecordingOverlap']=len(ids & baseline);report['files'][name]['additionalDistinctRecordingIdsVsBaseline']=len(ids-baseline)
report['validation']='unique entity IDs per file, recursive excluded-field checks, CC0 provenance, null lyrics, subset and track-reference checks passed';(DATA/'v2-coverage-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(report['validation'])

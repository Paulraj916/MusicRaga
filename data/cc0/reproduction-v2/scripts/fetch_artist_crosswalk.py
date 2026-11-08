#!/usr/bin/env python3
"""Bounded Action API retrieval for existing known artists (not a world crawl)."""
import datetime,json,pathlib,time,requests
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE=ROOT.parent;RAW=ROOT/'raw/wikidata-artists';RAW.mkdir(exist_ok=True)
seed=json.load(open(BASE/'data/musicbrainz-indian-artist-seeds.json'));ids=sorted(set(seed.values()));entities={}
for index,start in enumerate(range(0,len(ids),50)):
 out=RAW/f'{index:03}.json'
 if not out.exists():
  r=requests.get('https://www.wikidata.org/w/api.php',params={'action':'wbgetentities','ids':'|'.join(ids[start:start+50]),'props':'claims|labels','languages':'en|ta|hi|te|bn|ml|kn|mr|pa|gu|or|as|ur','format':'json','maxlag':5},headers={'User-Agent':'PowerWordsMetadataResearch/2.0 (https://github.com/Paulraj916/PowerWords; bounded existing artist ID reconciliation)'},timeout=45)
  if r.status_code==429:raise SystemExit('429: stopped; honour Retry-After before later manual resume')
  r.raise_for_status();body=r.json()
  if 'error' in body:raise SystemExit(str(body['error']))
  out.write_text(json.dumps(body,ensure_ascii=False));time.sleep(1.2)
 entities.update(json.load(out.open())['entities']);print(index+1,len(entities),flush=True)
def values(e,prop):
 cs=[x for x in e.get('claims',{}).get(prop,[]) if x.get('rank')!='deprecated'];preferred=[x for x in cs if x.get('rank')=='preferred'];return [x['mainsnak']['datavalue']['value'] for x in preferred or cs if 'datavalue' in x.get('mainsnak',{})]
now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat();count=0
with (ROOT/'data/wikidata-musicbrainz-discogs-artist-crosswalk.jsonl').open('w') as out:
 for id,e in entities.items():
  mb=values(e,'P434');discogs=values(e,'P1953')
  if not(mb and discogs):continue
  labels={k:v['value'] for k,v in e.get('labels',{}).items()};r={'id':'wd:'+id,'name':labels.get('en'),'labels':labels,'externalIds':{'wikidata':id,'musicbrainzArtists':mb,'discogsArtists':discogs},'verificationStatus':'community source-asserted identifiers; not independently musicologically verified','provenance':[{'source':'Wikidata','sourceUrl':'https://www.wikidata.org/wiki/'+id,'retrievedAt':now,'license':'CC0-1.0','licenseUrl':'https://www.wikidata.org/wiki/Wikidata:Licensing'}]};out.write(json.dumps(r,ensure_ascii=False)+'\n');count+=1
(ROOT/'checkpoints/wikidata-crosswalk.json').write_text(json.dumps({'complete':True,'existingArtistIdsRequested':len(ids),'apiBatchLimit':50,'crosswalkArtists':count,'retrievedAt':now,'license':'CC0-1.0','notes':'One broader SPARQL query timed out; abandoned. Bounded Action API read for known IDs with 1.2-second pacing, maxlag=5.'},indent=2));print('crosswalk',count)

#!/usr/bin/env python3
import json,pathlib,collections,datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]; DATA=ROOT/'data'; RAW=ROOT/'raw'
NOW=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat()
rows=json.load(open(RAW/'wikidata-artists.json'))['results']['bindings'];artists={};names={}
for r in rows:
 id=r['artist']['value'].rsplit('/',1)[-1];names[id]=r['artistLabel']['value']
 a=artists.setdefault(id,{'id':'wd:'+id,'externalIds':{'wikidata':id,'musicbrainz':[]},'name':names[id],'roles':[],'countries':['Q668'],'countryEvidence':'Wikidata P27 citizenship; not language or career-region evidence','provenance':[{'source':'Wikidata','sourceUrl':'https://www.wikidata.org/wiki/'+id,'retrievedAt':NOW,'license':'CC0-1.0','licenseUrl':'https://www.wikidata.org/wiki/Wikidata:Licensing'}]})
 if 'musicbrainz' in r and r['musicbrainz']['value'] not in a['externalIds']['musicbrainz']:a['externalIds']['musicbrainz'].append(r['musicbrainz']['value'])
 role={'property':'P106','id':r['occupation']['value'].rsplit('/',1)[-1],'label':r['occupationLabel']['value']}
 if role not in a['roles']:a['roles'].append(role)
for f in RAW.glob('wikidata-*.json'):
 for r in json.load(open(f)).get('results',{}).get('bindings',[]):
  for k in ('performer','composer','language'):
   if k in r:names[r[k]['value'].rsplit('/',1)[-1]]=r.get(k+'Label',r[k])['value']
def claims(e,p):
 cs=[s for s in e.get('claims',{}).get(p,[]) if s.get('rank')!='deprecated'];preferred=[s for s in cs if s.get('rank')=='preferred'];cs=preferred or cs
 return [s['mainsnak']['datavalue']['value'] for s in cs if 'datavalue' in s.get('mainsnak',{})]
def refs(e,p):return [{'id':v['id'],'name':names.get(v['id']),'property':p} for v in claims(e,p) if isinstance(v,dict) and 'id' in v]
works=[]
for f in sorted(RAW.glob('entities-*.json')):
 for id,e in json.load(open(f))['entities'].items():
  labels={l:v['value'] for l,v in e.get('labels',{}).items()};title=labels.get('en') or next(iter(labels.values()),None)
  works.append({'id':'wd:'+id,'entityType':'song-or-single','title':title,'labels':labels,'aliases':{l:[v['value'] for v in a] for l,a in e.get('aliases',{}).items()},'externalIds':{'wikidata':id},'languages':refs(e,'P407'),'countries':refs(e,'P495'),'types':refs(e,'P31'),'credits':{'performers':refs(e,'P175'),'composers':refs(e,'P86'),'lyricists':refs(e,'P676')},'dates':[{'value':v['time'],'precision':v['precision'],'calendar':v.get('calendarmodel'),'property':'P577'} for v in claims(e,'P577') if isinstance(v,dict)],'lyrics':None,'lyricsRights':'not-cleared','provenance':[{'source':'Wikidata','sourceUrl':'https://www.wikidata.org/wiki/'+id,'retrievedAt':NOW,'revision':e.get('lastrevid'),'license':'CC0-1.0','licenseUrl':'https://www.wikidata.org/wiki/Wikidata:Licensing'}]})
for name,records in [('wikidata-artists',list(artists.values())),('wikidata-songs',works)]:
 with open(DATA/(name+'.jsonl'),'w') as out:
  for record in records:out.write(json.dumps(record,ensure_ascii=False)+'\n')
seed={mb:a['externalIds']['wikidata'] for a in artists.values() for mb in a['externalIds']['musicbrainz']}
json.dump(seed,open(DATA/'musicbrainz-indian-artist-seeds.json','w'),indent=2)
print('artists',len(artists),'MB artist seeds',len(seed),'songs',len(works))

#!/usr/bin/env python3
"""Offline, whitelist-only CC0 work importer. No API calls. Reruns are atomic/idempotent.
India-associated != India origin. A work is a composition, NOT a recording/track.
"""
import argparse,collections,datetime,hashlib,json,pathlib,tarfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
LANGUAGES={'asm','awa','ben','bfy','bho','brx','doi','gon','guj','hin','kan','kas','kfy','kha','kok','lus','mag','mai','mal','mar','mni','mwr','nep','npi','ori','pan','raj','san','sat','snd','tam','tcy','tel','urd'}
EXPECTED='a92f985819882a143629bad7c76795a114cac2d7f4266587b7371b6ba9b07650'
SOURCE='https://data.metabrainz.org/pub/musicbrainz/data/json-dumps/20261107-001001/work.tar.xz'
def main():
 ap=argparse.ArgumentParser();ap.add_argument('archive',type=pathlib.Path,nargs='?',default=ROOT/'raw/work.tar.xz');args=ap.parse_args()
 h=hashlib.sha256()
 with args.archive.open('rb') as f:
  for part in iter(lambda:f.read(1024*1024),b''):h.update(part)
 if h.hexdigest()!=EXPECTED:raise SystemExit('Snapshot SHA256 mismatch; refusing import')
 seed=json.load(open(ROOT/'data/musicbrainz-indian-artist-seeds.json'))
 now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat()
 dest=ROOT/'data/musicbrainz-india-associated-works.jsonl';temp=dest.with_suffix('.jsonl.partial');checkpoint=ROOT/'data/musicbrainz-import-checkpoint.json'
 stats={'snapshotUrl':SOURCE,'sha256':EXPECTED,'retrievedAt':now,'scannedWorks':0,'selectedWorks':0,'byLanguage':collections.Counter(),'unknownLanguage':0,'byType':collections.Counter(),'byCreditRole':collections.Counter(),'matchedByLanguage':0,'matchedByArtist':0,'complete':False}
 artist_ids=set();recordings={}
 with tarfile.open(args.archive,'r|xz') as archive,temp.open('w') as out:
  for member in archive:
   if member.name!='mbdump/work':continue
   stream=archive.extractfile(member)
   for line in stream:
    w=json.loads(line);stats['scannedWorks']+=1
    if stats['scannedWorks']%100000==0:print(stats['scannedWorks'],stats['selectedWorks'],flush=True);checkpoint.write_text(json.dumps(stats,indent=2))
    langs=w.get('languages') or ([w['language']] if w.get('language') else [])
    related=[r for r in w.get('relations',[]) if r.get('target-type')=='artist' and r.get('artist',{}).get('id') in seed]
    language_match=bool(set(langs)&LANGUAGES)
    if not(language_match or related):continue
    roles=[]
    for r in w.get('relations',[]):
     if r.get('target-type')!='artist':continue
     a=r.get('artist',{});role={'role':r.get('type'),'roleId':r.get('type-id'),'artist':{'id':a.get('id'),'name':a.get('name'),'sortName':a.get('sort-name'),'disambiguation':a.get('disambiguation')},'attributes':r.get('attributes',[]),'begin':r.get('begin'),'end':r.get('end')}
     roles.append(role);artist_ids.add(a.get('id'));stats['byCreditRole'][r.get('type') or 'unknown']+=1
    recording_ids=[]
    for rel in w.get('relations',[]):
     if rel.get('target-type')!='recording' or rel.get('type')!='performance':continue
     rec=rel.get('recording',{});rid=rec.get('id')
     if not rid:continue
     recording_ids.append(rid)
     rr=recordings.setdefault(rid,{'id':'mb-recording:'+rid,'entityType':'recording','title':rec.get('title'),'externalIds':{'musicbrainzRecording':rid},'durationMs':rec.get('length'),'video':rec.get('video'),'disambiguation':rec.get('disambiguation'),'associatedWorkIds':[],'performers':None,'releaseDate':None,'languages':None,'lyrics':None,'lyricsRights':'not-cleared','provenance':[{'source':'MusicBrainz','sourceUrl':'https://musicbrainz.org/recording/'+rid,'snapshotUrl':SOURCE,'retrievedAt':now,'license':'CC0-1.0','licenseUrl':'https://musicbrainz.org/doc/Development/JSON_Data_Dumps'}]})
     if w['id'] not in rr['associatedWorkIds']:rr['associatedWorkIds'].append(w['id'])
    record={'recordingIds':recording_ids,'id':'mb-work:'+w['id'],'entityType':'work','title':w.get('title'),'workType':w.get('type'),'externalIds':{'musicbrainzWork':w['id'],'iswcs':w.get('iswcs',[])},'languages':langs,'aliases':[{k:a.get(k) for k in ['name','sort-name','locale','type','primary'] if k in a} for a in w.get('aliases',[])],'disambiguation':w.get('disambiguation'),'credits':roles,'performers':None,'releaseDate':None,'countryOfOrigin':None,'indiaAssociation':{'languageMatch':sorted(set(langs)&LANGUAGES),'relatedIndianCitizenArtists':[{'musicbrainzArtist':r['artist']['id'],'wikidataArtist':seed[r['artist']['id']],'role':r.get('type')} for r in related],'scope':'association-only; language/citizenship does not establish work origin'},'lyrics':None,'lyricsRights':'not-cleared','provenance':[{'source':'MusicBrainz','sourceUrl':'https://musicbrainz.org/work/'+w['id'],'snapshotUrl':SOURCE,'retrievedAt':now,'license':'CC0-1.0','licenseUrl':'https://musicbrainz.org/doc/Development/JSON_Data_Dumps'}]}
    out.write(json.dumps(record,ensure_ascii=False)+'\n');stats['selectedWorks']+=1;stats['matchedByLanguage']+=language_match;stats['matchedByArtist']+=bool(related);stats['byType'][w.get('type') or 'unknown']+=1
    if not langs:stats['unknownLanguage']+=1
    for l in langs:stats['byLanguage'][l]+=1
    if stats['scannedWorks']%100000==0:print(stats['scannedWorks'],stats['selectedWorks'],flush=True);checkpoint.write_text(json.dumps(stats,indent=2))
 with (ROOT/'data/musicbrainz-india-associated-recordings.jsonl').open('w') as out:
  for rr in recordings.values():out.write(json.dumps(rr,ensure_ascii=False)+'\n')
 stats['selectedRecordings']=len(recordings)
 stats['complete']=True;stats['relatedArtistCount']=len(artist_ids-{None});temp.replace(dest);checkpoint.write_text(json.dumps(stats,indent=2));print(json.dumps(stats,indent=2))
if __name__=='__main__':main()

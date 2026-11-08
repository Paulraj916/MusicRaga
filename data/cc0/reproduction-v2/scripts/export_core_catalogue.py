#!/usr/bin/env python3
"""Export CC0 release-associated India catalogue after verified bounded extraction.
Release-market, release-text-language, sung/work-language are distinct evidence tiers.
No title-only deduplication and no asserted nationality/singer role from artist-credit.
"""
import argparse,collections,datetime,hashlib,json,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE=ROOT.parent;RAW=ROOT/'raw';DATA=ROOT/'data';SPOOL=RAW/'tables';STATE=ROOT/'checkpoints'
SNAPSHOT='https://data.metabrainz.org/pub/musicbrainz/data/fullexport/20261104-002222/mbdump.tar.bz2'
COLUMNS=json.load(open(RAW/'schema-columns.json'))
NOW=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat()
def decode(x):
 if x==r'\N':return None
 # PostgreSQL COPY text escapes, preserving UTF-8 rather than using unicode_escape.
 return re.sub(r'\\([btnvfr\\]|[0-7]{1,3}|x[0-9A-Fa-f]{1,2})',lambda m: {'b':'\b','t':'\t','n':'\n','v':'\v','f':'\f','r':'\r','\\':'\\'}.get(m[1],chr(int(m[1][1:],16)) if m[1].startswith('x') else chr(int(m[1],8)) if m[1].isdigit() else m[1]),x)
def rows(table):
 with (SPOOL/table).open() as f:
  for line in f:yield line.rstrip('\n').split('\t')
def record(table,x):
 cols=COLUMNS[table]
 if len(x)!=len(cols):raise ValueError(f'Schema mismatch {table}: actual {len(x)} vs {len(cols)}')
 return {k:decode(v) for k,v in zip(cols,x)}
def ni(v):return int(v) if v is not None else None
def provenance(kind,id):return {'source':'MusicBrainz','sourceUrl':f'https://musicbrainz.org/{kind}/{id}','snapshotUrl':SNAPSHOT,'retrievedAt':NOW,'license':'CC0-1.0','licenseUrl':'https://musicbrainz.org/doc/MusicBrainz_Database/Download'}
def progress(stage,**values):
 d={'stage':stage,'complete':False,'updatedAt':NOW,**values};(STATE/'core-export.json').write_text(json.dumps(d,indent=2));print(stage,values,flush=True)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--required-tables-ready',action='store_true');args=ap.parse_args()
 extract=json.load(open(STATE/'core-extract.json'))
 if not(extract['complete'] and extract['verified']):
  required={'artist','artist_alias','artist_credit_name','iso_3166_1','language','medium','recording','release','release_country','release_group','l_artist_recording','link','link_type','link_attribute','link_attribute_type','isrc','selected_track'}
  assert args.required_tables_ready and required <= extract['tables'].keys() and all(extract['tables'][t]['complete'] for t in required),'Required data tables not completed'
  expected='fa3ed54bb6371c1737959f3631c8e5001a79e72c2376433697950c1185470cf1';h=hashlib.sha256()
  with (RAW/'mbdump.tar.bz2').open('rb') as stream:
   for part in iter(lambda:stream.read(4*1024*1024),b''):h.update(part)
  assert h.hexdigest()==expected,'Official full archive SHA256 mismatch'
  extract['sha256']=expected
  (STATE/'core-source-verified.json').write_text(json.dumps({'verified':True,'sha256':expected,'requiredTablesComplete':True,'verificationMode':'Whole compressed archive hash plus completed exact required-table checkpoint; unused tables may still be streaming','retrievedAt':NOW},indent=2))
 evidence={int(k):v for k,v in json.load(open(STATE/'selected-release-evidence.json')).items()}
 iso={int(x[0]):decode(x[1]) for x in rows('iso_3166_1')};languages={int(x[0]):record('language',x) for x in rows('language')}
 # Confirmed work-language/performance links acquired in the earlier independently verified snapshot.
 works={w['externalIds']['musicbrainzWork']:w for l in (BASE/'data/indian-language-song-works.jsonl').open() if (w:=json.loads(l))}
 strong={r['externalIds']['musicbrainzRecording']:r['associatedWorkIds'] for l in (BASE/'data/indian-language-song-recordings.jsonl').open() if (r:=json.loads(l))}
 releases={};creditids=set();groupids=set()
 for x in rows('release'):
  id=int(x[0])
  if id in evidence:
   r=record('release',x);r['events']=[];releases[id]=r;creditids.add(int(r['artist_credit']));groupids.add(int(r['release_group']))
 for x in rows('release_country'):
  id=int(x[0])
  if id in releases:
   r=record('release_country',x);releases[id]['events'].append({'country':iso.get(int(r['country'])),'year':ni(r['date_year']),'month':ni(r['date_month']),'day':ni(r['date_day'])})
 media={}
 for x in rows('medium'):
  if int(x[1]) in releases:media[int(x[0])]=record('medium',x)
 tracks=[];excluded_data_tracks=0;recordingids=set();track_releases=collections.defaultdict(set);tracklangs=collections.defaultdict(set);countryset=set();recording_creditids=set()
 for x in rows('selected_track'):
  r=record('track',x)
  if r['is_data_track']=='t':excluded_data_tracks+=1;continue
  rid=int(r['recording']);mid=int(r['medium']);rel=int(media[mid]['release']);r['release']=rel;tracks.append(r);recordingids.add(rid);track_releases[rid].add(rel);creditids.add(int(r['artist_credit']))
  if evidence[rel]['indiaReleaseEvent']:countryset.add(rid)
  if evidence[rel]['releaseTextLanguage']:tracklangs[rid].add(evidence[rel]['releaseTextLanguage'])
 progress('tracks-loaded',tracks=len(tracks),distinctRecordingIds=len(recordingids),releases=len(releases))
 recordings={};foundstrong=set()
 for x in rows('recording'):
  id=int(x[0])
  if id in recordingids or x[1] in strong:
   r=record('recording',x);r['isrcs']=[];r['relationships']=[];recordings[id]=r;creditids.add(int(r['artist_credit']))
   if x[1] in strong:foundstrong.add(x[1])
 for x in (rows('recording_first_release_date') if (SPOOL/'recording_first_release_date').exists() else []):
  if int(x[0]) in recordings:
   r=record('recording_first_release_date',x);recordings[int(x[0])]['firstReleaseDate']={'year':ni(r['year']),'month':ni(r['month']),'day':ni(r['day'])}
 for x in rows('isrc'):
  id=int(x[1])
  if id in recordings:recordings[id]['isrcs'].append(decode(x[2]))
 progress('recordings-loaded',recordings=len(recordings),workLanguageAssociatedFound=len(foundstrong))
 credits=collections.defaultdict(list);artistids=set()
 for x in rows('artist_credit_name'):
  if int(x[0]) in creditids:
   r=record('artist_credit_name',x);credits[int(x[0])].append(r);artistids.add(int(r['artist']))
 # Exact recording-artist relationships. No inference from soundtrack album credit.
 rels=[];linkids=set()
 for x in rows('l_artist_recording'):
  if int(x[3]) in recordings:
   r=record('l_artist_recording',x);rels.append(r);linkids.add(int(r['link']));artistids.add(int(r['entity0']))
 links={}
 for x in rows('link'):
  if int(x[0]) in linkids:links[int(x[0])]=record('link',x)
 types={int(x[0]):record('link_type',x) for x in rows('link_type')}
 attrtypes={int(x[0]):record('link_attribute_type',x) for x in rows('link_attribute_type')};attributes=collections.defaultdict(list)
 for x in rows('link_attribute'):
  if int(x[0]) in linkids:
   a=attrtypes.get(int(x[1]),{});attributes[int(x[0])].append({'id':a.get('gid'),'name':a.get('name')})
 people={}
 for x in rows('artist'):
  if int(x[0]) in artistids:people[int(x[0])]=record('artist',x)
 aliases=collections.defaultdict(list)
 for x in rows('artist_alias'):
  if int(x[1]) in people:
   a=record('artist_alias',x);aliases[int(x[1])].append({'name':a['name'],'locale':a['locale'],'sortName':a['sort_name']})
 def ac(id):
  result=[]
  for c in sorted(credits.get(int(id),[]),key=lambda c:int(c['position'])):
   a=people.get(int(c['artist']),{});result.append({'artistId':a.get('gid'),'name':c['name'],'canonicalName':a.get('name'),'joinPhrase':c['join_phrase'],'role':None,'roleStatus':'credited-artist-not-inferred-singer-or-composer'})
  return result
 for rel in rels:
  link=links[int(rel['link'])];typ=types[int(link['link_type'])];a=people[int(rel['entity0'])]
  recordings[int(rel['entity1'])]['relationships'].append({'artistId':a['gid'],'artistName':a['name'],'role':typ['name'],'roleId':typ['gid'],'attributes':attributes[int(rel['link'])],'sourceRelationshipId':int(rel['id'])})
 groups={}
 for x in rows('release_group'):
  if int(x[0]) in groupids:groups[int(x[0])]=record('release_group',x)
 stats={'source':SNAPSHOT,'sourceSha256':extract['sha256'],'license':'CC0-1.0','generatedAt':NOW,'recordingFirstReleaseDateTableAvailable':(SPOOL/'recording_first_release_date').exists(),'counts':{'recordings':len(recordings),'releaseTrackOccurrences':len(tracks),'excludedDataTrackAppearances':excluded_data_tracks,'releases':len(releases),'releaseGroups':len(groups),'creditedOrRelatedArtists':len(people),'baselineSongCompositionsNotNew':len(works)},'recordingEvidenceTiers':collections.Counter(),'recordingReleaseTextLanguageOccurrences':collections.Counter(),'associatedWorkLanguageOccurrences':collections.Counter(),'recordingCreditRoles':collections.Counter(),'previousWorkLinkedRecordingIdsNotFoundInOlderCoreSnapshot':sorted(set(strong)-foundstrong),'scopeWarnings':['Release country IN is a release market, not proof of Indian artist/composition origin.','Release text language is not confirmed sung language.','Track appearances, releases, compositions and recordings must NOT be added as unique songs.','Foreign artists and non-song/spoken/instrumental recordings can be present in the release-associated tier.','Source credited artist does not establish singer/composer; explicit relationship role is separate.']}
 outputs={n:(DATA/(n+'.jsonl.partial')).open('w') for n in ['india-release-associated-recordings-v2','preferred-india-associated-recordings-v2','indian-work-language-associated-recordings-v2','indian-release-text-associated-recordings-v2','india-release-associated-tracks-v2','india-release-associated-releases-v2','india-release-associated-artists-v2']}
 def emit(file,r):outputs[file].write(json.dumps(r,ensure_ascii=False)+'\n')
 for id,r in recordings.items():
  mb=r['gid'];wi=strong.get(mb,[]);wl=sorted({l for w in wi for l in works[w]['languages']});tier='work-language-associated' if wi else 'release-text-language' if tracklangs[id] else 'india-release-market';provs=[provenance('recording',mb)]
  if wi:provs.append({'source':'MusicBrainz','snapshotUrl':works[wi[0]]['provenance'][0]['snapshotUrl'],'sourceUrl':works[wi[0]]['provenance'][0]['sourceUrl'],'retrievedAt':works[wi[0]]['provenance'][0]['retrievedAt'],'license':'CC0-1.0','licenseUrl':works[wi[0]]['provenance'][0]['licenseUrl']})
  result={'id':'mb-recording:'+mb,'entityType':'recording','title':r['name'],'externalIds':{'musicbrainzRecording':mb,'isrcs':sorted(set(r['isrcs']))},'durationMs':ni(r['length']),'video':r['video']=='t','disambiguation':r['comment'],'artistCredit':ac(r['artist_credit']),'explicitArtistRelationships':r['relationships'],'languages':None,'associatedWorkLanguages':wl,'languageEvidence':'linked Song work declared language; recording audio language not independently verified' if wi else 'unknown; release text language is not sung language','associatedWorkIds':wi,'associatedReleaseIds':sorted(releases[x]['gid'] for x in track_releases[id]),'firstReleaseDate':r.get('firstReleaseDate'),'indiaAssociation':{'tier':tier,'indiaReleaseMarket':id in countryset,'releaseTextLanguages':sorted(tracklangs[id]),'scope':'explicit source associations; not asserted artist nationality or work origin'},'lyrics':None,'lyricsRights':'not-cleared','provenance':provs}
  emit('india-release-associated-recordings-v2',result);stats['recordingEvidenceTiers'][tier]+=1
  if wi:emit('indian-work-language-associated-recordings-v2',result)
  if wi or tracklangs[id]:emit('preferred-india-associated-recordings-v2',result)
  if tracklangs[id]:emit('indian-release-text-associated-recordings-v2',result)
  for l in tracklangs[id]:stats['recordingReleaseTextLanguageOccurrences'][l]+=1
  for l in wl:stats['associatedWorkLanguageOccurrences'][l]+=1
  for c in r['relationships']:stats['recordingCreditRoles'][c['role']]+=1
 for t in tracks:
  rec=recordings[int(t['recording'])];rel=releases[t['release']];emit('india-release-associated-tracks-v2',{'id':'mb-track:'+t['gid'],'entityType':'release-track-occurrence','title':t['name'],'recordingId':'mb-recording:'+rec['gid'],'releaseId':'mb-release:'+rel['gid'],'mediumPosition':ni(media[int(t['medium'])]['position']),'trackPosition':ni(t['position']),'number':t['number'],'durationMs':ni(t['length']),'artistCredit':ac(t['artist_credit']),'isDataTrack':t['is_data_track']=='t','provenance':[provenance('release',rel['gid'])]})
 for id,r in releases.items():
  lang=languages.get(ni(r['language']),{});g=groups[int(r['release_group'])];emit('india-release-associated-releases-v2',{'id':'mb-release:'+r['gid'],'entityType':'release','title':r['name'],'releaseGroup':{'id':g['gid'],'title':g['name']},'artistCredit':ac(r['artist_credit']),'releaseEvents':r['events'],'releaseTextLanguage':{'iso639_3':lang.get('iso_code_3') or lang.get('iso_code_2t'),'iso639_1':lang.get('iso_code_1'),'name':lang.get('name')},'languageMeaning':'language of release text, NOT necessarily sung language','associationEvidence':evidence[id],'provenance':[provenance('release',r['gid'])]})
 for id,a in people.items():emit('india-release-associated-artists-v2',{'id':'mb-artist:'+a['gid'],'entityType':'artist','name':a['name'],'sortName':a['sort_name'],'aliases':aliases[id],'associatedAreaCountryCode':iso.get(ni(a['area'])),'nationality':None,'scope':'credited/related on selected recordings/releases; not automatically Indian national or singer','provenance':[provenance('artist',a['gid'])]})
 for n,f in outputs.items():f.close();(DATA/(n+'.jsonl.partial')).replace(DATA/(n+'.jsonl'))
 stats['complete']=True;(DATA/'musicbrainz-v2-coverage.json').write_text(json.dumps(stats,indent=2,ensure_ascii=False));progress('complete',**stats['counts']);(STATE/'core-export.json').write_text(json.dumps({'complete':True,**stats},indent=2,ensure_ascii=False));print(json.dumps(stats,indent=2),flush=True)
if __name__=='__main__':main()

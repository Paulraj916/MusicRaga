#!/usr/bin/env python3
"""Select only entities linked to preferred recordings; keep identity/roles/evidence unchanged."""
import collections,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data';recids=set();releaseids=set();artistids=set();roles=collections.Counter();textlangs=collections.Counter();n=0
for line in (DATA/'preferred-india-associated-recordings-v2.jsonl').open():
 r=json.loads(line);n+=1;recids.add(r['id']);releaseids.update('mb-release:'+x for x in r['associatedReleaseIds'])
 for a in r['artistCredit']:
  if a.get('artistId'):artistids.add('mb-artist:'+a['artistId'])
 for a in r['explicitArtistRelationships']:
  if a.get('artistId'):artistids.add('mb-artist:'+a['artistId'])
  roles[a['role']]+=1
 for lang in r['indiaAssociation']['releaseTextLanguages']:textlangs[lang]+=1
counts={'recordings':n};
for kind in ['tracks','releases','artists']:
 count=0
 with (DATA/f'preferred-india-associated-{kind}-v2.jsonl').open('w') as out:
  for line in (DATA/f'india-release-associated-{kind}-v2.jsonl').open():
   r=json.loads(line)
   keep=r['recordingId'] in recids if kind=='tracks' else r['id'] in releaseids if kind=='releases' else r['id'] in artistids
   if not keep:continue
   out.write(line);count+=1
   for a in r.get('artistCredit',[]):
    if a.get('artistId'):artistids.add('mb-artist:'+a['artistId'])
 counts[kind]=count
counts['recordingRelationshipRoleOccurrences']=dict(roles);counts['releaseTextLanguageRecordingOccurrences']=dict(textlangs);counts['scope']='Preferred work/release-text-language-associated graph; no nationality/audio-language assertion. Tracks are edition occurrences, counts not additive.'
(DATA/'preferred-v2-coverage.json').write_text(json.dumps(counts,indent=2));print(json.dumps(counts,indent=2))

#!/usr/bin/env python3
"""Preferred publishable metadata scope: source-labelled Song + listed Indian language.
Do not confuse this language scope with Indian origin, nationality or lyrics clearance.
"""
import pathlib,json
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data';selected=set();recordings=set()
with (DATA/'indian-language-song-works.jsonl').open('w') as out:
 for line in (DATA/'musicbrainz-india-associated-works.jsonl').open():
  w=json.loads(line)
  if w['workType']=='Song' and w['indiaAssociation']['languageMatch']:
   out.write(line);selected.add(w['externalIds']['musicbrainzWork']);recordings.update(w['recordingIds'])
with (DATA/'indian-language-song-recordings.jsonl').open('w') as out:
 for line in (DATA/'musicbrainz-india-associated-recordings.jsonl').open():
  r=json.loads(line)
  if r['externalIds']['musicbrainzRecording'] in recordings:
   r['associatedWorkIds']=[x for x in r['associatedWorkIds'] if x in selected];out.write(json.dumps(r,ensure_ascii=False)+'\n')
print('preferred song compositions',len(selected),'linked recordings',len(recordings))

#!/usr/bin/env python3
"""Bounded entity fetch: only IDs from saved SPARQL results; 50 IDs/request."""
import json,time,pathlib,requests
ROOT=pathlib.Path(__file__).resolve().parents[1]
ids=json.load(open(ROOT/'raw/song-ids.json'))
for index,start in enumerate(range(0,len(ids),50)):
    out=ROOT/f'raw/entities-{index:03}.json'
    if out.exists():continue
    r=requests.get('https://www.wikidata.org/w/api.php',params={'action':'wbgetentities','ids':'|'.join(ids[start:start+50]),'format':'json','maxlag':5},headers={'User-Agent':'PowerWordsMetadataResearch/1.0 (https://github.com/Paulraj916/PowerWords; bounded metadata research)'},timeout=45)
    if r.status_code==429:raise SystemExit('Rate limited: stopped; respect Retry-After before manual resume')
    r.raise_for_status();body=r.json()
    if 'error' in body:raise SystemExit(str(body['error']))
    out.write_text(json.dumps(body,ensure_ascii=False));print(out.name,len(body.get('entities',{})),flush=True);time.sleep(1.2)

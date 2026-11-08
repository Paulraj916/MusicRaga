#!/usr/bin/env python3
"""Reproduce only the six saved, bounded SELECT queries; cache and stop on errors."""
import pathlib,json,time,requests
ROOT=pathlib.Path(__file__).resolve().parents[1];RAW=ROOT/'raw'
SOURCES={'wikidata-query.rq':'wikidata-songs.json','wikidata-india-query.rq':'wikidata-india-songs.json','wikidata-singles-query.rq':'wikidata-india-singles.json','wikidata-language-singles-query.rq':'wikidata-language-singles.json','wikidata-artists-query.rq':'wikidata-artists.json','wikidata-selected-performers-query.rq':'wikidata-selected-performers.json'}
for query,target in SOURCES.items():
 if (RAW/target).exists():continue
 response=requests.get('https://query.wikidata.org/sparql',params={'query':(RAW/query).read_text(),'format':'json'},headers={'User-Agent':'PowerWordsMetadataResearch/1.0 (https://github.com/Paulraj916/PowerWords; bounded CC0 research)','Accept':'application/sparql-results+json'},timeout=70)
 if response.status_code==429:raise SystemExit('429: stop; honour Retry-After before a later manual resume')
 response.raise_for_status();(RAW/target).write_text(json.dumps(response.json(),ensure_ascii=False));time.sleep(1.2)

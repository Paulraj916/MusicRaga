#!/usr/bin/env python3
"""Public bulk downloads only, resumable curl, no retries, 30-minute bound per selected file."""
import argparse,datetime,hashlib,json,pathlib,shutil,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1];RAW=ROOT/'raw';STATE=ROOT/'checkpoints'
SOURCES={'musicbrainz':{'url':'https://data.metabrainz.org/pub/musicbrainz/data/fullexport/20261104-002222/mbdump.tar.bz2','file':'mbdump.tar.bz2','sha256':'fa3ed54bb6371c1737959f3631c8e5001a79e72c2376433697950c1185470cf1','size':7701074497},'discogs':{'url':'https://data.discogs.com/?download=data%2F2026%2Fdiscogs_20261101_releases.xml.gz','file':'discogs_20261101_releases.xml.gz','sha256':'1d9781c775cf6ae01c9b18e1539a19cbec25dd440c99ba797d68dee8d3f6d01f','size':None}}
def digest(f):
 h=hashlib.sha256()
 with f.open('rb') as stream:
  for x in iter(lambda:stream.read(4*1024*1024),b''):h.update(x)
 return h.hexdigest()
ap=argparse.ArgumentParser();ap.add_argument('source',choices=SOURCES);args=ap.parse_args();s=SOURCES[args.source];dest=RAW/s['file'];state=dict(s,license='CC0-1.0',complete=False)
if dest.exists() and digest(dest)==s['sha256']:print('Already complete and verified:',dest)
else:
 if shutil.disk_usage(ROOT).free<15000000000:raise SystemExit('Insufficient disk safety reserve for bulk download')
 result=subprocess.run(['curl','--fail','--location','--continue-at','-','--connect-timeout','30','--max-time','1800','--output',str(dest),s['url']])
 if result.returncode:raise SystemExit('Finite download stopped; partial file retained. No automatic retry. Resume manually when appropriate.')
 if digest(dest)!=s['sha256']:raise SystemExit('Official SHA256 mismatch; do not ingest or publish')
state.update(complete=True,verified=True,bytes=dest.stat().st_size,retrievedAt=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat());(STATE/(args.source+'-verified-download.json')).write_text(json.dumps(state,indent=2));(STATE/(args.source+'-download-complete')).touch();print(json.dumps(state,indent=2))

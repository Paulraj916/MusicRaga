#!/usr/bin/env python3
"""Create compact reproducible gzip distribution files; no upload/publication."""
import gzip,hashlib,json,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1];DATA=ROOT/'data';DEST=ROOT/'distribution';DEST.mkdir(exist_ok=True);manifest={}
assert (DATA/'v2-coverage-report.json').exists(),'Validate first'
for source in sorted(DATA.glob('*.jsonl')):
 out=DEST/(source.name+'.gz')
 with source.open('rb') as stream,out.open('wb') as raw,gzip.GzipFile(fileobj=raw,mode='wb',filename='',mtime=0,compresslevel=6) as zipped:shutil.copyfileobj(stream,zipped,length=1024*1024)
 manifest[out.name]={'uncompressedFile':source.name,'compressedBytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'license':'CC0-1.0'};print(out.name,out.stat().st_size,flush=True)
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2))

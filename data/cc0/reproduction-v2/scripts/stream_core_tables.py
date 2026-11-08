#!/usr/bin/env python3
"""Stream only needed core dump tables; filter tracks before storing, never extract all world tracks.
Can follow the single in-progress finite archive download. Final export is forbidden until SHA256 verification.
"""
import argparse,io,json,pathlib,tarfile,time,shutil,datetime,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1];RAW=ROOT/'raw';STATE=ROOT/'checkpoints';SPOOL=RAW/'tables';SPOOL.mkdir(exist_ok=True)
LANG={'asm','awa','ben','bfy','bho','bra','brx','doi','gon','guj','hin','kan','kas','kfy','kha','kok','lus','mag','mai','mal','mar','mni','mwr','nep','npi','ori','pan','raj','san','sat','snd','tam','tcy','tel','urd'}
SPOOL_TABLES={'artist','artist_alias','artist_credit_name','artist_type','area','iso_3166_1','language','medium','recording','recording_first_release_date','release','release_country','release_unknown_country','release_group','release_group_primary_type','release_group_secondary_type','release_group_secondary_type_join','release_status','script','l_artist_recording','l_artist_work','l_recording_work','link','link_type','link_attribute','link_attribute_type','work','work_language','work_type','isrc','iswc'}
EXPECTED=7701074497;HASH='fa3ed54bb6371c1737959f3631c8e5001a79e72c2376433697950c1185470cf1'
SCHEMA=json.load(open(RAW/'schema-columns.json'))
class GrowingFile:
 def __init__(self,path,follow):self.f=open(path,'rb');self.follow=follow;self.start=time.monotonic()
 def read(self,n=-1):
  while True:
   data=self.f.read(n)
   if data or not self.follow or self.f.tell()>=EXPECTED:return data
   if time.monotonic()-self.start>2100:raise TimeoutError('Finite follow deadline exceeded; keep checkpoint and resume later')
   time.sleep(1)
 def close(self):self.f.close()
def save(state):
 state['updatedAt']=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat();p=STATE/'core-extract.json';tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(state,indent=2));tmp.replace(p)
def rows(table):
 with open(SPOOL/table,'rb') as f:
  for line in f:yield line.rstrip(b'\n').split(b'\t')
def choose_releases_and_media():
 india=next(int(x[0]) for x in rows('iso_3166_1') if x[1]==b'IN')
 languages={int(x[0]):(x[6] if x[6]!=b'\\N' else x[1]).decode() for x in rows('language') if (x[6] if x[6]!=b'\\N' else x[1]).decode() in LANG}
 countries={int(x[0]) for x in rows('release_country') if int(x[1])==india}
 selected={}
 for x in rows('release'):
  id=int(x[0]);lang=int(x[7]) if x[7]!=b'\\N' else None
  if id in countries or lang in languages:selected[id]={'releaseMbid':x[1].decode(),'indiaReleaseEvent':id in countries,'releaseTextLanguage':languages.get(lang)}
 mediums={}
 for x in rows('medium'):
  if int(x[1]) in selected:mediums[int(x[0])]=int(x[1])
 (STATE/'selected-release-evidence.json').write_text(json.dumps({str(k):v for k,v in selected.items()},ensure_ascii=False))
 print('Selection',len(selected),'releases',len(mediums),'media','IN area',india,flush=True)
 return selected,mediums

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--follow',action='store_true');args=ap.parse_args()
 state={'complete':False,'verified':False,'snapshot':'20261104-002222','tables':{},'tracksScanned':0,'tracksSelected':0,'storageBudgetBytes':40000000000}
 source=GrowingFile(RAW/'mbdump.tar.bz2',args.follow)
 with tarfile.open(fileobj=source,mode='r|bz2',bufsize=1024*1024) as archive:
  for member in archive:
   table=member.name.removeprefix('mbdump/');print('TABLE',table,member.size,flush=True);state['currentTable']=table;save(state)
   if table in {'COPYING','TIMESTAMP','SCHEMA_SEQUENCE','REPLICATION_SEQUENCE','README'}:
    (RAW/('core-'+table)).write_bytes(archive.extractfile(member).read());continue
   if table=='track':
    selected,mediums=choose_releases_and_media();state['selectedReleases']=len(selected);state['selectedMedia']=len(mediums)
    outpath=SPOOL/'selected_track';part=outpath.with_suffix('.partial')
    with part.open('wb') as out:
     for line in archive.extractfile(member):
      state['tracksScanned']+=1
      # Tab-escaped COPY text: literal tab separates columns, embedded tabs are escaped as \\t.
      x=line.split(b'\t',4)
      if int(x[3]) in mediums:out.write(line);state['tracksSelected']+=1
      if state['tracksScanned']%1000000==0:print('TRACKS',state['tracksScanned'],state['tracksSelected'],flush=True);save(state)
    part.replace(outpath);state['tables']['selected_track']={'inputBytes':member.size,'outputBytes':outpath.stat().st_size,'complete':True};save(state)
   elif table in SPOOL_TABLES:
    dest=SPOOL/table
    if not dest.exists() or dest.stat().st_size!=member.size:
     if shutil.disk_usage(ROOT).free < member.size+12000000000:raise RuntimeError('Disk safety reserve would be violated')
     part=dest.with_suffix('.partial')
     with part.open('wb') as out:shutil.copyfileobj(archive.extractfile(member),out,length=4*1024*1024)
     part.replace(dest)
    state['tables'][table]={'bytes':member.size,'complete':True};save(state)
 source.close()
 archivepath=RAW/'mbdump.tar.bz2'
 if archivepath.stat().st_size!=EXPECTED:raise RuntimeError('Unexpected completed archive size')
 h=hashlib.sha256()
 with archivepath.open('rb') as f:
  for chunk in iter(lambda:f.read(4*1024*1024),b''):h.update(chunk)
 if h.hexdigest()!=HASH:raise RuntimeError('SHA256 mismatch; output MUST NOT be published')
 state['verified']=True;state['sha256']=HASH;state['complete']=True;save(state);print(json.dumps(state,indent=2),flush=True)
if __name__=='__main__':main()

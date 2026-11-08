#!/usr/bin/env python3
"""Free CC0 Discogs snapshot: explicit India release market only.
Track IDs below are RELEASE APPEARANCES, never globally unique recordings/compositions.
No images/notes/audio/user/marketplace data retained. No API calls.
"""
import argparse,gzip,hashlib,json,pathlib,time,re,datetime,xml.etree.ElementTree as ET,collections
ROOT=pathlib.Path(__file__).resolve().parents[1];RAW=ROOT/'raw';OUT=ROOT/'data';STATE=ROOT/'checkpoints'
SOURCE='https://data.discogs.com/?download=data%2F2026%2Fdiscogs_20261101_releases.xml.gz'
HASH='1d9781c775cf6ae01c9b18e1539a19cbec25dd440c99ba797d68dee8d3f6d01f'
INDIAN_STYLES={'Bollywood','Hindustani','Indian Classical','Carnatic','Bhangra','Ghazal','Qawwali'}
class GrowingFile:
 def __init__(self,path,follow):self.f=open(path,'rb');self.follow=follow;self.start=time.monotonic()
 def read(self,n=-1):
  while True:
   x=self.f.read(n)
   if x or not self.follow or (STATE/'discogs-download-complete').exists():return x
   if time.monotonic()-self.start>2100:raise TimeoutError('Finite follow deadline exceeded')
   time.sleep(1)
 def seekable(self):return False
 def close(self):self.f.close()
def text(e,k):return e.findtext(k)
def artists(e,path):
 return [{k:text(a,k) for k in ('id','name','anv','join','role','tracks') if text(a,k) is not None} for a in e.findall(path)]
def leaftracks(tracklist):
 for t in tracklist.findall('track'):
  sub=t.find('sub_tracks')
  if sub is not None:yield from leaftracks(sub)
  else:yield t

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--follow',action='store_true');args=ap.parse_args();now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat()
 state={'complete':False,'sha256Verified':False,'source':SOURCE,'releasesScanned':0,'indiaMarketReleases':0,'trackOccurrences':0,'indiaStyleTrackOccurrences':0,'excludedHeadingOrUnpositionedEntries':0,'artistIds':0,'workCount':None,'uniqueRecordingCount':None,'scope':'Release country India; NOT artist nationality or composition origin','byReleaseStyle':collections.Counter()};people={}
 files={name:(OUT/(name+'.jsonl.partial')).open('w') for name in ['discogs-india-market-releases','discogs-india-market-track-occurrences','discogs-india-style-track-occurrences']}
 def checkpoint():
  state['updatedAt']=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5,minutes=30))).isoformat();state['artistIds']=len(people);p=STATE/'discogs-import.json';tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(state,indent=2));tmp.replace(p)
 source=GrowingFile(RAW/'discogs_20261101_releases.xml.gz',args.follow);buffer=b''
 with gzip.GzipFile(fileobj=source,mode='rb') as stream:
  while chunk:=stream.read(1024*1024):
   buffer+=chunk
   while b'</release>' in buffer:
    raw,buffer=buffer.split(b'</release>',1);start=raw.find(b'<release ')
    if start<0:raise ValueError('Unexpected XML release boundary')
    raw=raw[start:]+b'</release>';state['releasesScanned']+=1
    if state['releasesScanned']%100000==0:print(state['releasesScanned'],state['indiaMarketReleases'],state['trackOccurrences'],flush=True);checkpoint()
    if not re.search(br'<country>\s*India\s*</country>',raw):continue
    e=ET.fromstring(raw)
    if (text(e,'country') or '').strip()!='India':continue
    rid=e.attrib['id'];style=[x.text for x in e.findall('styles/style') if x.text];indian=sorted(set(style)&INDIAN_STYLES)
    provenance=[{'source':'Discogs','sourceUrl':'https://www.discogs.com/release/'+rid,'snapshotUrl':SOURCE,'retrievedAt':now,'license':'CC0-1.0','licenseUrl':'https://data.discogs.com/'}]
    mainartists=artists(e,'artists/artist');extra=artists(e,'extraartists/artist');release={'id':'discogs-release:'+rid,'entityType':'release','externalIds':{'discogsRelease':rid,'discogsMaster':text(e,'master_id')},'title':text(e,'title'),'country':'India','countryMeaning':'release market; not composition/artist origin','released':text(e,'released'),'artists':mainartists,'extraCredits':extra,'styles':style,'labels':[dict(x.attrib) for x in e.findall('labels/label')],'formats':[{'name':x.attrib.get('name'),'quantity':x.attrib.get('qty'),'descriptions':[y.text for y in x.findall('descriptions/description')]} for x in e.findall('formats/format')],'languages':None,'provenance':provenance}
    files['discogs-india-market-releases'].write(json.dumps(release,ensure_ascii=False)+'\n');state['indiaMarketReleases']+=1
    for s in style:state['byReleaseStyle'][s]+=1
    tracklist=e.find('tracklist')
    if tracklist is None:continue
    for ordinal,t in enumerate(leaftracks(tracklist),1):
     title=text(t,'title');pos=text(t,'position')
     if not title or not pos or (text(t,'type_') or 'track')=='heading':state['excludedHeadingOrUnpositionedEntries']+=1;continue
     aa=artists(t,'artists/artist');credits=artists(t,'extraartists/artist')
     record={'id':'discogs-track:'+rid+':'+str(ordinal),'entityType':'release-track-occurrence','externalIds':{'discogsRelease':rid,'discogsMaster':text(e,'master_id')},'releaseId':release['id'],'title':title,'position':pos,'duration':text(t,'duration'),'creditedArtists':aa or mainartists,'artistCreditScope':'track' if aa else 'release-fallback-not-confirmed-track-performer','extraCredits':credits,'releaseCountry':'India','releaseDate':text(e,'released'),'languages':None,'indiaAssociation':{'releaseCountry':'India','sourceIndianMusicStyles':indian,'scope':'India-market track appearance; can include foreign artists/works'},'lyrics':None,'lyricsRights':'not-cleared','provenance':provenance}
     line=json.dumps(record,ensure_ascii=False)+'\n';files['discogs-india-market-track-occurrences'].write(line);state['trackOccurrences']+=1
     if indian:files['discogs-india-style-track-occurrences'].write(line);state['indiaStyleTrackOccurrences']+=1
     for a in (aa or mainartists)+credits+extra:
      if a.get('id') and a.get('name'):people.setdefault(a['id'],{'id':'discogs-artist:'+a['id'],'entityType':'artist','name':a['name'],'externalIds':{'discogsArtist':a['id']},'nationality':None,'provenance':[{'source':'Discogs','sourceUrl':'https://www.discogs.com/artist/'+a['id'],'snapshotUrl':SOURCE,'retrievedAt':now,'license':'CC0-1.0','licenseUrl':'https://data.discogs.com/'}]})
   if len(buffer)>128*1024*1024:raise RuntimeError('Single XML record exceeds bounded memory budget')
 source.close()
 if buffer.strip()!=b'</releases>':raise RuntimeError('Unexpected trailing XML: incomplete snapshot')
 for f in files.values():f.close()
 h=hashlib.sha256()
 with open(RAW/'discogs_20261101_releases.xml.gz','rb') as f:
  for part in iter(lambda:f.read(4*1024*1024),b''):h.update(part)
 if h.hexdigest()!=HASH:raise RuntimeError('Official snapshot SHA256 mismatch: no final exports published')
 for name in files:(OUT/(name+'.jsonl.partial')).replace(OUT/(name+'.jsonl'))
 with (OUT/'discogs-india-market-artists.jsonl').open('w') as out:
  for a in people.values():out.write(json.dumps(a,ensure_ascii=False)+'\n')
 state['sha256Verified']=True;state['sha256']=HASH;state['complete']=True;checkpoint();print(json.dumps(state,indent=2),flush=True)
if __name__=='__main__':main()

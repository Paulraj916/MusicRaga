"""Offline page/facet/token shards for free static hosting; never bundle all records in JS."""
import hashlib
import json
import unicodedata
from collections import defaultdict
from pathlib import Path
from .bootstrap import bootstrap
from .catalogue import canonical, connect, coverage, mode


def tokens(value):
    current=[]
    for char in unicodedata.normalize("NFC",value).lower():
        if unicodedata.category(char)[0] in {"L","N","M"}:
            current.append(char)
        elif current:
            yield "".join(current)
            current=[]
    if current:
        yield "".join(current)


def export(database, output="dist/catalogue"):
    root=Path(output)
    root.mkdir(parents=True,exist_ok=True)
    with connect(database,True) as db:
        db.execute("BEGIN")
        digest=hashlib.sha256(b"powerwords-static-index-v3")
        for row in db.execute("SELECT id,fingerprint FROM tracks ORDER BY id"):
            digest.update(canonical(list(row)).encode())
        for row in db.execute("SELECT id,payload FROM artist_profiles ORDER BY id"):
            digest.update(canonical(list(row)).encode())
        version=digest.hexdigest()[:24]
        target=root/version
        target.mkdir(exist_ok=True)
        manifest={"mode":mode(db),"version":version,"page_size":100,"coverage":coverage(db),"entities":{},
                  "search":"NFC lowercase Unicode exact tokens; final token prefix, maximum 128 expansions. Not semantic/fuzzy or lyric search."}
        def write(path,value):
            dest=target/path
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_text(canonical(value),encoding="utf-8")
        for entity in ["tracks","artists"]:
            buckets=defaultdict(lambda:defaultdict(list))
            facets=defaultdict(list)
            page=[]
            count=0
            rows=db.execute("SELECT id,payload FROM tracks ORDER BY sort_year DESC,id" if entity=="tracks" else "SELECT id,payload FROM artist_profiles ORDER BY id")
            for row in rows:
                item=json.loads(row["payload"])
                if entity=="tracks":
                    item["id"]=row["id"]
                    item["lyrics_available"]=False
                    item["credits"]=[dict(r) for r in db.execute("SELECT artist_id,name,role FROM credits WHERE track_id=? ORDER BY role,name",(row["id"],))]
                    item["linked_recordings"]=db.execute("SELECT count(*) FROM work_recordings WHERE work_id=?",(row["id"],)).fetchone()[0]
                    body=" ".join([item["title"],*item["aliases"],item["album"] or "",*(c["name"] or "" for c in item["credits"])])
                    keys={"source:"+item["source"],"kind:"+item["kind"]}
                    keys.update("language:"+v for v in item["languages"])
                    keys.update("association_language:"+v for key in ["work_languages","release_text_languages"] for v in item.get("association_evidence",{}).get(key,[]))
                    keys.update("role:"+c["role"] for c in item["credits"])
                    keys.update("artist:"+c["artist_id"] for c in item["credits"])
                    keys.update("artistrole:"+c["artist_id"]+"|"+c["role"] for c in item["credits"])
                    keys.update("work:musicbrainz:work:"+v for v in item["associated_work_ids"])
                    for key in keys:
                        facets[key].append(count)
                else:
                    body=" ".join([item["name"],*item.get("aliases",[])])
                for token in set(tokens(body)):
                    buckets[format(ord(token[0]),"x")][token].append(count)
                page.append(item)
                count+=1
                if len(page)==100:
                    write(f"{entity}/pages/{(count-1)//100}.json",page)
                    page=[]
            if page:
                write(f"{entity}/pages/{(count-1)//100}.json",page)
            for bucket,index in buckets.items():
                write(f"{entity}/terms/{bucket}.json",dict(index))
            facet_buckets=defaultdict(dict)
            for key,positions in facets.items():
                fingerprint=hashlib.sha256(key.encode()).hexdigest()[:32]
                facet_buckets[fingerprint[:2]][fingerprint]=positions
            for bucket,values in facet_buckets.items():
                write(f"{entity}/facets/{bucket}.json",values)
            manifest["entities"][entity]={"count":count,"term_buckets":sorted(buckets)}
        (root/"manifest.json").write_text(canonical(manifest),encoding="utf-8")
        size=sum(f.stat().st_size for f in root.rglob("*.json"))
        print(json.dumps({"static_catalogue_version":version,"entities":manifest["entities"],"json_bytes":size,"note":"Only query-specific postings and requested pages are fetched by the frontend; no catalogue array is bundled."}))
        return manifest


if __name__=="__main__":
    database=".catalogue-build-final/catalogue.sqlite"
    bootstrap(database,report_path=".catalogue-build-final/coverage.json")
    export(database)

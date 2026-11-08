"""SQLite/FTS5 metadata staging, publication and read API; Python 3.11+."""
from __future__ import annotations

import base64
import hashlib
import json
import re
import sqlite3
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

LANGUAGES = {
    "asm": "Assamese", "ben": "Bengali", "brx": "Bodo", "doi": "Dogri",
    "guj": "Gujarati", "hin": "Hindi", "kan": "Kannada", "kas": "Kashmiri",
    "kok": "Konkani", "mai": "Maithili", "mal": "Malayalam", "mni": "Manipuri",
    "mar": "Marathi", "nep": "Nepali", "ori": "Odia", "pan": "Punjabi",
    "san": "Sanskrit", "sat": "Santali", "snd": "Sindhi", "tam": "Tamil",
    "tel": "Telugu", "urd": "Urdu", "eng": "English", "bho": "Bhojpuri",
    "raj": "Rajasthani", "tcy": "Tulu", "gon": "Gondi", "kha": "Khasi",
    "lus": "Mizo", "trp": "Kokborok", "lbj": "Ladakhi", "sip": "Sikkimese",
    "awa": "Awadhi", "mag": "Magahi", "hne": "Chhattisgarhi",
    "gbm": "Garhwali", "kfy": "Kumaoni", "bra": "Braj", "bpy": "Bishnupriya Manipuri",
    "saz": "Saurashtra", "bgc": "Haryanvi", "bfy": "Bagheli", "lmn": "Lambadi",
    "mwr": "Marwari", "spv": "Sambalpuri", "hoc": "Ho", "unr": "Mundari",
    "bhb": "Bhili", "lep": "Lepcha", "kfa": "Kodava", "kfk": "Kinnauri",
    "kfr": "Kutchi", "skr": "Saraiki", "bal": "Baluchi", "lav": "Latvian", "deu": "German", "ara": "Arabic", "jpn": "Japanese",
    "lat": "Latin", "fas": "Persian", "rus": "Russian", "por": "Portuguese",
    "liv": "Livonian", "kor": "Korean", "spa": "Spanish", "ita": "Italian",
    "zul": "Zulu", "heb": "Hebrew", "cmn": "Mandarin Chinese", "fra": "French",
    "egy": "Ancient Egyptian", "nld": "Dutch", "mul": "Multiple languages",
    "zxx": "No linguistic content", "und": "Unknown / not supplied",
}
ROLES = {"singer", "composer", "lyricist", "producer", "arranger", "conductor",
         "instrumentalist", "performer", "credited_artist", "writer", "translator", "librettist", "orchestrator", "adapter", "vocal arranger", "instrument arranger", "publishing", "dedication", "revised by", "reconstructed by", "premiere", "unknown"}
SOURCES = {"musicbrainz": ("musicbrainz.org", "https://musicbrainz.org/doc/About/Data_License"),
           "wikidata": ("www.wikidata.org", "https://www.wikidata.org/wiki/Wikidata:Licensing"),
           "synthetic": ("example.invalid", "https://creativecommons.org/publicdomain/zero/1.0/")}
ROLES.update({"vocal", "remixer", "engineer", "instrument", "recording", "mix", "programming", "misc", "phonographic copyright", "sound", "performing orchestra", "editor", "video appearance", "video director", "choreographer", "samples from artist", "mix-DJ", "chorus master", "balance", "audio", "graphic design", "audio director", "legal representation", "artwork", "instrument technician", "artists and repertoire", "compiler", "field recordist", "animation", "cinematographer", "video copyright", "art direction", "design"})
MAX_LINE = 65536


class ValidationError(ValueError):
    pass


def now():
    return datetime.now(timezone.utc).isoformat()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def normal(value):
    return unicodedata.normalize("NFC", value).casefold()


def text(value, field, maximum=500):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValidationError(f"invalid {field}")
    if any(unicodedata.category(c) in {"Cc", "Cs"} for c in value):
        raise ValidationError(f"control character in {field}")
    return unicodedata.normalize("NFC", value.strip())


def valid_id(source, value):
    if source == "musicbrainz":
        try:
            return str(uuid.UUID(value)) == value.lower()
        except (ValueError, TypeError, AttributeError):
            return False
    if source == "wikidata":
        return isinstance(value, str) and re.fullmatch(r"Q[1-9][0-9]*", value) is not None
    return isinstance(value, str) and re.fullmatch(r"synthetic-[0-9]+", value) is not None


def validate(raw, synthetic=False):
    if not isinstance(raw, dict):
        raise ValidationError("record must be an object")
    allowed = {"source", "source_id", "source_url", "license", "license_url", "retrieved_at",
               "title", "aliases", "languages", "year", "album", "credits", "countries",
               "kind", "scope_basis", "provenance", "associated_work_ids", "duration_ms", "association_evidence", "credit_evidence"}
    if set(raw) - allowed:
        raise ValidationError("unsupported fields (lyrics/audio and arbitrary metadata are forbidden)")
    source = raw.get("source")
    if source not in SOURCES or (source == "synthetic") != synthetic:
        raise ValidationError("source not allowed in this database mode")
    sid = raw.get("source_id")
    if not valid_id(source, sid):
        raise ValidationError("invalid external identity")
    if raw.get("license") != "CC0-1.0" or raw.get("license_url") != SOURCES[source][1]:
        raise ValidationError("only allowlisted CC0 core metadata provenance is accepted")
    expected = (f"https://musicbrainz.org/{raw.get('kind')}/{sid}" if source == "musicbrainz" else
                f"https://www.wikidata.org/wiki/{sid}" if source == "wikidata" else
                f"https://example.invalid/{sid}")
    if raw.get("source_url") != expected:
        raise ValidationError("source URL must match canonical external identity")
    retrieved = text(raw.get("retrieved_at"), "retrieved_at", 64)
    try:
        dt = datetime.fromisoformat(retrieved.replace("Z", "+00:00"))
        if dt.tzinfo is None or dt > datetime.now(timezone.utc):
            raise ValueError()
    except ValueError:
        raise ValidationError("retrieved_at must be a non-future zoned ISO timestamp") from None
    year = raw.get("year")
    if year is not None and (type(year) is not int or not 1 <= year <= datetime.now().year + 1):
        raise ValidationError("year must be factual, integer or null")
    kind = raw.get("kind")
    if kind not in {"recording", "work", "song_or_single", "unknown"}:
        raise ValidationError("kind must preserve recording/work/song-or-single uncertainty")
    if source == "musicbrainz" and kind not in {"recording", "work"}:
        raise ValidationError("MusicBrainz identities must distinguish recordings from works")
    result = {"source": source, "source_id": sid, "source_url": expected,
              "license": "CC0-1.0", "license_url": raw["license_url"],
              "retrieved_at": retrieved, "title": text(raw.get("title"), "title"),
              "kind": kind, "year": year,
              "album": text(raw["album"], "album") if raw.get("album") else None,
              "scope_basis": text(raw.get("scope_basis"), "scope_basis", 1000)}
    for field, limit in [("aliases", 40), ("languages", 64), ("countries", 12)]:
        values = raw.get(field, [])
        if not isinstance(values, list) or len(values) > limit:
            raise ValidationError(f"invalid {field} array")
        values = list(dict.fromkeys(text(v, field, 500 if field == "aliases" else 3) for v in values))
        if field == "languages" and any(v not in LANGUAGES for v in values):
            raise ValidationError("unsupported language code; review taxonomy, never guess")
        if field == "countries" and any(not re.fullmatch("[A-Z]{2}", v) for v in values):
            raise ValidationError("country must be source-supplied ISO two-letter code")
        result[field] = values
    duration = raw.get("duration_ms")
    if duration is not None and (type(duration) is not int or not 0 <= duration <= 86400000):
        raise ValidationError("invalid duration_ms")
    result["duration_ms"] = duration
    links = raw.get("associated_work_ids", [])
    if not isinstance(links, list) or len(links) > 100 or any(not valid_id("musicbrainz", v) for v in links):
        raise ValidationError("invalid work relationship identities")
    if links and (source != "musicbrainz" or kind != "recording"):
        raise ValidationError("work links require MusicBrainz recording identity")
    result["associated_work_ids"] = list(dict.fromkeys(links))
    provenance = raw.get("provenance", {})
    if not isinstance(provenance, dict) or set(provenance) - {"source_revision", "snapshot_url", "input_sha256", "license_evidence_url", "unmapped_roles", "unmapped_language_ids"}:
        raise ValidationError("unsupported provenance fields")
    provenance = dict(provenance)
    for key in ["source_revision", "input_sha256"]:
        if key in provenance:
            provenance[key] = text(str(provenance[key]), key, 100)
    if "input_sha256" in provenance and not re.fullmatch("[a-f0-9]{64}", provenance["input_sha256"]):
        raise ValidationError("invalid input hash")
    for key in ["snapshot_url", "license_evidence_url"]:
        if key in provenance:
            value = text(provenance[key], key, 1000)
            url = urlsplit(value)
            if url.scheme != "https" or url.hostname not in {"data.metabrainz.org", "musicbrainz.org", "www.wikidata.org"} or url.username or url.password:
                raise ValidationError("untrusted provenance URL")
    for key in ["unmapped_language_ids"]:
        if key in provenance:
            if not isinstance(provenance[key], list) or len(provenance[key]) > 100:
                raise ValidationError("invalid unmapped language evidence")
            provenance[key] = [text(v, "source language", 100) for v in provenance[key]]
    if "unmapped_roles" in provenance:
        if not isinstance(provenance["unmapped_roles"], list) or len(provenance["unmapped_roles"]) > 100:
            raise ValidationError("invalid unmapped roles")
        provenance["unmapped_roles"] = [text(v, "source role", 100) for v in provenance["unmapped_roles"]]
    association = raw.get("association_evidence", {})
    if not isinstance(association, dict) or set(association)-{"tier","work_languages","release_text_languages","release_ids","india_release_market"}:
        raise ValidationError("unsupported language association evidence")
    if association:
        if source != "musicbrainz" or kind != "recording" or association.get("tier") not in {"work-language-associated","release-text-language"}:
            raise ValidationError("invalid association tier")
        if type(association.get("india_release_market")) is not bool:
            raise ValidationError("invalid market evidence")
        for key in ["work_languages","release_text_languages"]:
            values=association.get(key,[])
            if not isinstance(values,list) or len(values)>64 or any(v not in LANGUAGES for v in values):
                raise ValidationError("unsupported association language code")
        ids=association.get("release_ids",[])
        if not isinstance(ids,list) or len(ids)>2000 or any(not valid_id("musicbrainz",v)for v in ids):
            raise ValidationError("invalid edition release identities")
    result["association_evidence"]=association
    evidence=raw.get("credit_evidence",[])
    if not isinstance(evidence,list) or len(evidence)>100:
        raise ValidationError("invalid credit evidence")
    for item in evidence:
        if not isinstance(item,dict) or set(item)-{"artist_id","role","role_id","relationship_id","attributes"} or not valid_id(source,item.get("artist_id")) or item.get("role") not in ROLES:
            raise ValidationError("invalid relationship evidence")
        if not valid_id("musicbrainz",item.get("role_id")) or type(item.get("relationship_id")) is not int:
            raise ValidationError("invalid relationship identity")
        attributes=item.get("attributes",[])
        if not isinstance(attributes,list) or len(attributes)>40:
            raise ValidationError("invalid performance attributes")
        for attribute in attributes:
            if not isinstance(attribute,dict) or set(attribute)!={"id","name"} or not valid_id("musicbrainz",attribute["id"]):
                raise ValidationError("invalid performance attribute identity")
            text(attribute["name"],"performance attribute",200)
    result["credit_evidence"]=evidence
    result["provenance"] = provenance
    credits = raw.get("credits", [])
    if not isinstance(credits, list) or len(credits) > 100:
        raise ValidationError("invalid credits")
    result["credits"] = []
    for credit in credits:
        if not isinstance(credit, dict) or set(credit) - {"name", "source_id", "role"}:
            raise ValidationError("invalid credit fields")
        role = credit.get("role")
        if role not in ROLES:
            raise ValidationError("unsupported contributor role")
        artist_id = credit.get("source_id")
        if artist_id is not None and not valid_id(source, artist_id):
            raise ValidationError("invalid artist external identity")
        if credit.get("name") is None and artist_id is None:
            raise ValidationError("credit needs an external identity or a supplied name")
        result["credits"].append({"name": text(credit["name"], "credit name") if credit.get("name") is not None else None,
                                  "source_id": artist_id, "role": role})
    return result


SCHEMA = """
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tracks(
 pk INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, source TEXT NOT NULL, source_id TEXT NOT NULL, title TEXT NOT NULL,
 year INTEGER, sort_year INTEGER NOT NULL, kind TEXT NOT NULL, album TEXT,
 fingerprint TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(source,kind,source_id));
CREATE INDEX IF NOT EXISTS tracks_chronology ON tracks(sort_year DESC,id);
CREATE INDEX IF NOT EXISTS tracks_source ON tracks(source,sort_year DESC,id);
CREATE INDEX IF NOT EXISTS tracks_album ON tracks(album);
CREATE TABLE IF NOT EXISTS artists(
 id TEXT PRIMARY KEY, source TEXT NOT NULL, source_id TEXT, name TEXT);
CREATE INDEX IF NOT EXISTS artists_external ON artists(source,source_id);
CREATE TABLE IF NOT EXISTS credits(
 track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
 artist_id TEXT NOT NULL REFERENCES artists(id), role TEXT NOT NULL,
 name TEXT, PRIMARY KEY(track_id,artist_id,role));
CREATE INDEX IF NOT EXISTS credits_role_artist ON credits(role,artist_id,track_id);
CREATE INDEX IF NOT EXISTS credits_artist ON credits(artist_id,track_id);
CREATE TABLE IF NOT EXISTS languages(
 track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE, language TEXT NOT NULL,
 PRIMARY KEY(track_id,language));
CREATE INDEX IF NOT EXISTS languages_lookup ON languages(language,track_id);
CREATE TABLE IF NOT EXISTS language_associations(
 track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,language TEXT NOT NULL,basis TEXT NOT NULL,
 PRIMARY KEY(track_id,language,basis));
CREATE INDEX IF NOT EXISTS association_lookup ON language_associations(language,track_id);
CREATE TABLE IF NOT EXISTS countries(
 track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE, country TEXT NOT NULL,
 PRIMARY KEY(track_id,country));
CREATE INDEX IF NOT EXISTS countries_lookup ON countries(country,track_id);
CREATE VIRTUAL TABLE IF NOT EXISTS search USING fts5(
 track_id UNINDEXED, body, tokenize="unicode61 remove_diacritics 0 categories 'L* N* M*'");
CREATE TABLE IF NOT EXISTS work_recordings(
 recording_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
 work_id TEXT NOT NULL, PRIMARY KEY(recording_id,work_id));
CREATE INDEX IF NOT EXISTS work_recordings_lookup ON work_recordings(work_id,recording_id);
CREATE TABLE IF NOT EXISTS artist_profiles(
 pk INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, payload TEXT NOT NULL);
CREATE VIRTUAL TABLE IF NOT EXISTS profile_search USING fts5(profile_id UNINDEXED,body,
 tokenize="unicode61 remove_diacritics 0 categories 'L* N* M*'");
CREATE TABLE IF NOT EXISTS revisions(
 track_id TEXT NOT NULL, fingerprint TEXT NOT NULL, payload TEXT NOT NULL,
 archived_at TEXT NOT NULL, PRIMARY KEY(track_id,fingerprint));
CREATE TABLE IF NOT EXISTS runs(
 id TEXT PRIMARY KEY, file_hash TEXT NOT NULL UNIQUE, byte_offset INTEGER NOT NULL DEFAULT 0,
 next_line INTEGER NOT NULL DEFAULT 1, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staging(
 run_id TEXT NOT NULL REFERENCES runs(id), line INTEGER NOT NULL, hash TEXT NOT NULL,
 state TEXT NOT NULL, reason TEXT, payload TEXT, PRIMARY KEY(run_id,line));
CREATE INDEX IF NOT EXISTS staging_publish ON staging(run_id,state,line);
"""


class ManagedConnection(sqlite3.Connection):
    """SQLite's built-in context manager commits but does not close connections."""
    def __exit__(self, kind, value, traceback):
        try:
            return super().__exit__(kind, value, traceback)
        finally:
            self.close()


def connect(path, readonly=False):
    db = sqlite3.connect(f"file:{Path(path).resolve()}?mode=ro" if readonly else str(path),
                         uri=readonly, timeout=10, factory=ManagedConnection)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    if not readonly:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA busy_timeout=10000")
    return db


def initialize(path, synthetic=False):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with connect(path) as db:
        db.executescript(SCHEMA)
        version = db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
        if version and version[0] != "1":
            raise ValidationError("unsupported schema version; use an explicit migration")
        mode = "synthetic" if synthetic else "real"
        existing = db.execute("SELECT value FROM meta WHERE key='mode'").fetchone()
        if existing and existing[0] != mode:
            raise ValidationError("cannot mix real and synthetic databases")
        db.executemany("INSERT OR IGNORE INTO meta VALUES(?,?)",
                       [("schema_version", "1"), ("mode", mode), ("generation", "0")])


def mode(db):
    return db.execute("SELECT value FROM meta WHERE key='mode'").fetchone()[0]


def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def stage(path, input_path, maximum=10000, dry_run=False):
    if not 1 <= maximum <= 1000000:
        raise ValidationError("max-records must be 1..1000000")
    with connect(path, readonly=dry_run) as db:
        synthetic = mode(db) == "synthetic"
        digest = file_hash(input_path)
        run_id = digest[:24]
        run = db.execute("SELECT * FROM runs WHERE file_hash=?", (digest,)).fetchone()
        offset, line = (run["byte_offset"], run["next_line"]) if run else (0, 1)
        if dry_run:
            offset, line = 0, 1
        else:
            db.execute("INSERT OR IGNORE INTO runs(id,file_hash,created_at) VALUES(?,?,?)",
                       (run_id, digest, now()))
            db.commit()
        counts = {"run_id": run_id, "accepted": 0, "quarantined": 0, "processed": 0,
                  "dry_run": dry_run, "completed": False}
        with open(input_path, "rb") as file:
            file.seek(offset)
            while counts["processed"] < maximum:
                raw = file.readline(MAX_LINE + 1)
                if not raw:
                    counts["completed"] = True
                    break
                record_hash = hashlib.sha256(raw)
                too_long = len(raw) > MAX_LINE
                if too_long and not raw.endswith(b"\n"):
                    # Consume only bounded chunks; never retain rejected lyric/private text.
                    while raw and not raw.endswith(b"\n"):
                        raw = file.readline(MAX_LINE + 1)
                        record_hash.update(raw)
                try:
                    if too_long:
                        raise ValidationError("record exceeds 64 KiB limit")
                    value = validate(json.loads(raw), synthetic)
                    payload, reason, state = canonical(value), None, "valid"
                    counts["accepted"] += 1
                except (ValueError, UnicodeDecodeError, TypeError) as exc:
                    # Only fixed validation reasons are retained, not parser excerpts or raw data.
                    reason = str(exc) if isinstance(exc, ValidationError) else "invalid JSON encoding/object"
                    payload, state = None, "quarantined"
                    counts["quarantined"] += 1
                if not dry_run:
                    db.execute("INSERT OR IGNORE INTO staging VALUES(?,?,?,?,?,?)",
                               (run_id, line, record_hash.hexdigest(), state, reason, payload))
                    db.execute("UPDATE runs SET byte_offset=MAX(byte_offset,?),next_line=MAX(next_line,?) WHERE id=?",
                               (file.tell(), line + 1, run_id))
                    if counts["processed"] % 200 == 199:
                        db.commit()
                line += 1
                counts["processed"] += 1
            if not dry_run:
                db.execute("UPDATE runs SET completed=MAX(completed,?) WHERE id=?", (int(counts["completed"]), run_id))
                db.commit()
        return counts


def upsert(db, record):
    identity = record["source"] + ":" + (record["kind"] + ":" if record["source"] == "musicbrainz" else "") + record["source_id"]
    payload = canonical(record)
    fingerprint = hashlib.sha256(payload.encode()).hexdigest()
    old = db.execute("SELECT pk,fingerprint,payload FROM tracks WHERE id=?", (identity,)).fetchone()
    if old and old["fingerprint"] == fingerprint:
        return False
    if old:
        db.execute("INSERT OR IGNORE INTO revisions VALUES(?,?,?,?)",
                   (identity, old["fingerprint"], old["payload"], now()))
        for table in ["credits", "languages", "countries", "work_recordings", "language_associations"]:
            db.execute(f"DELETE FROM {table} WHERE {'recording_id' if table == 'work_recordings' else 'track_id'}=?", (identity,))
        db.execute("DELETE FROM search WHERE rowid=?", (old["pk"],))
    db.execute("""INSERT INTO tracks(id,source,source_id,title,year,sort_year,kind,album,fingerprint,payload,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title,year=excluded.year,
      sort_year=excluded.sort_year,kind=excluded.kind,album=excluded.album,
      fingerprint=excluded.fingerprint,payload=excluded.payload,updated_at=excluded.updated_at""",
               (identity, record["source"], record["source_id"], record["title"], record["year"],
                record["year"] if record["year"] is not None else -1, record["kind"],
                record["album"], fingerprint, payload, now()))
    for credit in record["credits"]:
        external = credit["source_id"]
        artist = (record["source"] + ":artist:" + external if external else
                  "unresolved:" + identity + ":" + hashlib.sha256(normal(credit["name"]).encode()).hexdigest()[:24])
        db.execute("INSERT OR IGNORE INTO artists VALUES(?,?,?,?)",
                   (artist, record["source"], external, credit["name"]))
        db.execute("INSERT OR IGNORE INTO credits VALUES(?,?,?,?)",
                   (identity, artist, credit["role"], credit["name"]))
    for field, table in [("languages", "languages"), ("countries", "countries")]:
        db.executemany(f"INSERT INTO {table} VALUES(?,?)", [(identity, v) for v in record[field]])
    db.executemany("INSERT INTO work_recordings VALUES(?,?)", [(identity, "musicbrainz:work:" + v) for v in record["associated_work_ids"]])
    for key,basis in [("work_languages","work"),("release_text_languages","release_text")]:
        db.executemany("INSERT OR IGNORE INTO language_associations VALUES(?,?,?)",[(identity,v,basis)for v in record.get("association_evidence",{}).get(key,[])])
    body = " ".join([record["title"], *record["aliases"], record["album"] or "",
                     *(c["name"] or "" for c in record["credits"])])
    pk = db.execute("SELECT pk FROM tracks WHERE id=?", (identity,)).fetchone()[0]
    db.execute("INSERT INTO search(rowid,track_id,body) VALUES(?,?,?)", (pk, identity, normal(body)))
    return True


def publish(path, run_id, maximum=1000):
    if not 1 <= maximum <= 100000:
        raise ValidationError("publish limit must be 1..100000")
    with connect(path) as db:
        db.execute("BEGIN IMMEDIATE")
        if not db.execute("SELECT 1 FROM runs WHERE id=?", (run_id,)).fetchone():
            raise ValidationError("unknown run")
        rows = db.execute("SELECT line,payload FROM staging WHERE run_id=? AND state='valid' ORDER BY line LIMIT ?",
                          (run_id, maximum)).fetchall()
        changed = 0
        for row in rows:
            record = validate(json.loads(row["payload"]), mode(db) == "synthetic")
            changed += upsert(db, record)
            db.execute("UPDATE staging SET state='published' WHERE run_id=? AND line=?", (run_id, row["line"]))
        if changed:
            db.execute("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='generation'")
        remaining = db.execute("SELECT count(*) FROM staging WHERE run_id=? AND state='valid'", (run_id,)).fetchone()[0]
        return {"processed": len(rows), "changed": changed, "remaining": remaining}


def coverage(db):
    total = db.execute("SELECT count(*) FROM tracks").fetchone()[0]
    count = lambda sql: db.execute(sql).fetchone()[0]
    lang = dict(db.execute("SELECT language,count(*) FROM languages GROUP BY language"))
    unknown = count("SELECT count(*) FROM tracks t WHERE NOT EXISTS(SELECT 1 FROM languages l WHERE l.track_id=t.id)")
    return {"schema_version": 1, "mode": mode(db), "generation": int(db.execute("SELECT value FROM meta WHERE key='generation'").fetchone()[0]),
            "tracks": total, "entity_kinds": dict(db.execute("SELECT kind,count(*) FROM tracks GROUP BY kind")),
            "language_associations": [dict(r) for r in db.execute("SELECT language,count(DISTINCT track_id) AS tracks FROM language_associations GROUP BY language")],
            "association_tiers": dict(db.execute("SELECT json_extract(payload,'$.association_evidence.tier'),count(*) FROM tracks WHERE json_extract(payload,'$.association_evidence.tier') IS NOT NULL GROUP BY 1")),
            "explicit_vocal_recordings": count("SELECT count(DISTINCT track_id) FROM credits WHERE role='vocal'"),
            "explicit_vocal_artist_identities": count("SELECT count(DISTINCT artist_id) FROM credits WHERE role='vocal'"),
            "artist_profiles": count("SELECT count(*) FROM artist_profiles"),
            "work_recording_links": count("SELECT count(*) FROM work_recordings"),
            "unresolved_work_links": count("SELECT count(*) FROM work_recordings w WHERE NOT EXISTS(SELECT 1 FROM tracks t WHERE t.id=w.work_id AND t.kind='work')"),
            "resolved_artists": count("SELECT count(DISTINCT a.id) FROM artists a JOIN credits c ON a.id=c.artist_id WHERE a.source_id IS NOT NULL"),
            "unresolved_credit_entities": count("SELECT count(DISTINCT a.id) FROM artists a JOIN credits c ON a.id=c.artist_id WHERE a.source_id IS NULL"),
            "unknown_year": count("SELECT count(*) FROM tracks WHERE year IS NULL"),
            "unknown_language": unknown + lang.get("und", 0),
            "sources": dict(db.execute("SELECT source,count(*) FROM tracks GROUP BY source")),
            "roles": dict(db.execute("SELECT role,count(DISTINCT track_id) FROM credits GROUP BY role")),
            "languages": [{"code": k, "name": v, "tracks": lang.get(k, 0),
                           "coverage": "observed" if lang.get(k, 0) else "not_observed"} for k, v in LANGUAGES.items()],
            "staging": dict(db.execute("SELECT state,count(*) FROM staging GROUP BY state")),
            "lyrics": 0, "audio": 0,
            "notice": "Metadata candidates, not a census of Indian music. Language counts overlap; unknown is not inferred from an artist or country."}


def search(db, params):
    allowed = {"q", "source", "language", "role", "artist", "year", "album", "kind", "country", "work", "association_language", "limit", "cursor"}
    if set(params) - allowed:
        raise ValidationError("unknown query parameter")
    try:
        limit = int(params.get("limit", "25"))
    except ValueError:
        raise ValidationError("invalid limit") from None
    if not 1 <= limit <= 100:
        raise ValidationError("limit must be 1..100")
    filters = {k: normal(str(v)).strip() if k == "q" else str(v) for k, v in params.items() if k not in {"limit", "cursor"} and v}
    if len(filters.get("q", "")) > 200:
        raise ValidationError("query too long")
    for key, values in [("source", SOURCES), ("language", LANGUAGES), ("association_language", LANGUAGES), ("role", ROLES), ("kind", {"work", "recording", "song_or_single", "unknown"})]:
        if key in filters and filters[key] not in values:
            raise ValidationError(f"invalid {key}")
    where, args = [], []
    for key in ["source", "year", "album", "kind"]:
        if key in filters:
            if key == "year" and not re.fullmatch(r"[0-9]{1,4}", filters[key]):
                raise ValidationError("invalid year")
            where.append(f"t.{key}=?")
            args.append(filters[key])
    for key, table, column in [("language", "languages", "language"), ("association_language", "language_associations", "language"), ("country", "countries", "country")]:
        if key in filters:
            where.append(f"EXISTS(SELECT 1 FROM {table} x WHERE x.track_id=t.id AND x.{column}=?)")
            args.append(filters[key])
    if "work" in filters:
        where.append("EXISTS(SELECT 1 FROM work_recordings w WHERE w.recording_id=t.id AND w.work_id=?)")
        args.append(filters["work"])
    if "artist" in filters or "role" in filters:
        clause = ["c.track_id=t.id"]
        for key, column in [("artist", "artist_id"), ("role", "role")]:
            if key in filters:
                clause.append(f"c.{column}=?")
                args.append(filters[key])
        where.append("EXISTS(SELECT 1 FROM credits c WHERE " + " AND ".join(clause) + ")")
    if filters.get("q"):
        terms = filters["q"].split()[:8]
        expression = " AND ".join('"' + term.replace('"', '""') + '"*' for term in terms)
        where.append("t.pk IN(SELECT rowid FROM search WHERE search MATCH ?)")
        args.append(expression)
    condition = " AND ".join(where) or "1"
    total = db.execute("SELECT count(*) FROM tracks t WHERE " + condition, args).fetchone()[0]
    generation = int(db.execute("SELECT value FROM meta WHERE key='generation'").fetchone()[0])
    signature = hashlib.sha256(canonical(filters).encode()).hexdigest()[:24]
    if params.get("cursor"):
        try:
            raw = params["cursor"]
            if len(raw) > 2048:
                raise ValueError()
            cursor = json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
            if set(cursor) != {"generation", "query", "year", "id"} or cursor["query"] != signature:
                raise ValueError()
            if type(cursor["year"]) is not int or not isinstance(cursor["id"], str):
                raise ValueError()
        except (ValueError, TypeError, KeyError):
            raise ValidationError("invalid cursor or changed filters") from None
        if cursor["generation"] != generation:
            raise ValidationError("stale cursor: catalogue changed; restart pagination")
        condition += " AND (t.sort_year < ? OR (t.sort_year=? AND t.id>?))"
        args.extend([cursor["year"], cursor["year"], cursor["id"]])
    rows = db.execute("SELECT t.id,t.payload,t.sort_year FROM tracks t WHERE " + condition +
                      " ORDER BY t.sort_year DESC,t.id LIMIT ?", [*args, limit + 1]).fetchall()
    more = len(rows) > limit
    rows = rows[:limit]
    result = []
    for row in rows:
        item = json.loads(row["payload"])
        item["id"] = row["id"]
        item["lyrics_available"] = False
        item["linked_recordings"] = db.execute("SELECT count(*) FROM work_recordings WHERE work_id=?", (row["id"],)).fetchone()[0]
        item["credits"] = [dict(c) for c in db.execute("SELECT artist_id,name,role FROM credits WHERE track_id=? ORDER BY role,name", (row["id"],))]
        result.append(item)
    next_cursor = None
    if more:
        last = rows[-1]
        value = {"generation": generation, "query": signature, "year": last["sort_year"], "id": last["id"]}
        next_cursor = base64.urlsafe_b64encode(canonical(value).encode()).decode().rstrip("=")
    return {"items": result, "total": total, "next_cursor": next_cursor, "generation": generation, "mode": mode(db)}


def import_profiles(path, records):
    """CC0 public artist statements, separate from track-level contributor roles."""
    accepted = 0
    with connect(path) as db:
        if mode(db) != "real":
            raise ValidationError("real artist profiles cannot be mixed into a synthetic benchmark database")
        db.execute("BEGIN IMMEDIATE")
        for raw in records:
            if set(raw) - {"id", "externalIds", "name", "roles", "countries", "countryEvidence", "provenance", "aliases"}:
                raise ValidationError("unsupported artist profile fields")
            sid = raw.get("externalIds", {}).get("wikidata")
            mb=raw.get("externalIds",{}).get("musicbrainz",[])
            is_mb=raw.get("id","").startswith("musicbrainz:artist:")
            if is_mb:
                sid=raw["id"]
            if not ((is_mb and len(mb)==1 and valid_id("musicbrainz",mb[0]) and sid=="musicbrainz:artist:"+mb[0]) or (not is_mb and valid_id("wikidata", sid))):
                raise ValidationError("invalid artist profile identity")
            name = text(raw.get("name"), "artist profile name")
            proof = raw.get("provenance", [])
            provider="musicbrainz" if is_mb else "wikidata"
            expected=f"https://musicbrainz.org/artist/{mb[0]}" if is_mb else f"https://www.wikidata.org/wiki/{sid}"
            if not proof or proof[0].get("license") != "CC0-1.0" or proof[0].get("sourceUrl") != expected or proof[0].get("licenseUrl") != SOURCES[provider][1]:
                raise ValidationError("unapproved artist provenance")
            links = raw.get("externalIds", {}).get("musicbrainz", [])
            if not isinstance(links, list) or len(links) > 30 or any(not valid_id("musicbrainz", v) for v in links):
                raise ValidationError("invalid artist cross-reference")
            aliases=raw.get("aliases",[])
            if not isinstance(aliases,list) or len(aliases)>40:
                raise ValidationError("invalid profile aliases")
            for alias in aliases:text(alias,"profile alias")
            payload = canonical(raw)
            if len(payload.encode()) > MAX_LINE:
                raise ValidationError("profile too large")
            old = db.execute("SELECT pk,payload FROM artist_profiles WHERE id=?", (sid,)).fetchone()
            if old and old["payload"] == payload:
                continue
            db.execute("INSERT INTO artist_profiles(id,name,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,payload=excluded.payload", (sid,name,payload))
            pk = db.execute("SELECT pk FROM artist_profiles WHERE id=?", (sid,)).fetchone()[0]
            db.execute("DELETE FROM profile_search WHERE rowid=?", (pk,))
            db.execute("INSERT INTO profile_search(rowid,profile_id,body) VALUES(?,?,?)", (pk,sid,normal(" ".join([name,*aliases]))))
            accepted += 1
        if accepted:
            db.execute("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='generation'")
    return accepted


def search_profiles(db, params):
    if set(params) - {"q", "limit", "cursor"}:
        raise ValidationError("unknown artist query field")
    try:
        limit = int(params.get("limit", "20"))
    except ValueError:
        raise ValidationError("invalid artist limit") from None
    query = normal(params.get("q", "")).strip()
    if not 1 <= limit <= 100 or len(query) > 200:
        raise ValidationError("artist query bounds exceeded")
    condition, args = "1", []
    if query:
        expression = " AND ".join('"' + term.replace('"', '""') + '"*' for term in query.split()[:8])
        condition = "id IN(SELECT profile_id FROM profile_search WHERE profile_search MATCH ?)"
        args.append(expression)
    total = db.execute("SELECT count(*) FROM artist_profiles WHERE " + condition,args).fetchone()[0]
    generation = db.execute("SELECT value FROM meta WHERE key='generation'").fetchone()[0]
    if params.get("cursor"):
        try:
            token = params["cursor"]
            if len(token) > 2048:
                raise ValueError()
            cursor = json.loads(base64.urlsafe_b64decode(token + "="*(-len(token)%4)))
            if cursor["q"] != query or cursor["generation"] != generation or not (valid_id("wikidata",cursor["id"]) or (cursor["id"].startswith("musicbrainz:artist:") and valid_id("musicbrainz",cursor["id"].removeprefix("musicbrainz:artist:")))):
                raise ValueError()
        except (ValueError,KeyError,TypeError):
            raise ValidationError("invalid artist cursor; restart search") from None
        condition += " AND id>?"
        args.append(cursor["id"])
    rows = db.execute("SELECT id,payload FROM artist_profiles WHERE " + condition + " ORDER BY id LIMIT ?",[*args,limit+1]).fetchall()
    more, rows = len(rows)>limit, rows[:limit]
    cursor = base64.urlsafe_b64encode(canonical({"q":query,"generation":generation,"id":rows[-1]["id"]}).encode()).decode().rstrip("=") if more else None
    return {"items":[json.loads(r["payload"]) for r in rows],"total":total,"next_cursor":cursor,"mode":mode(db)}


def resolve_credit_names(path):
    """Fill only missing credit names through exact same-source profile IDs; never name-match people."""
    with connect(path) as db:
        ids=[r[0] for r in db.execute("SELECT DISTINCT c.track_id FROM credits c JOIN artist_profiles p ON p.id=replace(c.artist_id,'wikidata:artist:','') WHERE c.name IS NULL")]
        db.execute("UPDATE credits SET name=(SELECT p.name FROM artist_profiles p WHERE p.id=replace(credits.artist_id,'wikidata:artist:','')) WHERE name IS NULL AND EXISTS(SELECT 1 FROM artist_profiles p WHERE p.id=replace(credits.artist_id,'wikidata:artist:',''))")
        for identity in ids:
            row=db.execute("SELECT pk,payload FROM tracks WHERE id=?",(identity,)).fetchone();record=json.loads(row['payload'])
            names=[r[0] or '' for r in db.execute("SELECT name FROM credits WHERE track_id=?",(identity,))]
            body=' '.join([record['title'],*record['aliases'],record['album'] or '',*names])
            db.execute("DELETE FROM search WHERE rowid=?",(row['pk'],))
            db.execute("INSERT INTO search(rowid,track_id,body) VALUES(?,?,?)",(row['pk'],identity,normal(body)))
        if ids:db.execute("UPDATE meta SET value=CAST(value AS INTEGER)+1 WHERE key='generation'")
        return len(ids)

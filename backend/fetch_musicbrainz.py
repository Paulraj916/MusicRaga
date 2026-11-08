"""Bounded resumable MusicBrainz core-CC0 metadata fetcher, never lyrics/audio/tags."""
import argparse
import fcntl
import hashlib
import json
import os
import time
import math
from email.utils import parsedate_to_datetime
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from .catalogue import SOURCES, ValidationError, canonical, validate

USER_AGENT = "PowerWords/0.2 (+https://github.com/Paulraj916/PowerWords)"


def atomic(path, data):
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as file:
        file.write(data)
        file.flush()
        os.fsync(file.fileno())
    os.replace(temporary, path)


def convert(record, retrieved, query):
    sid = record.get("id")
    date = record.get("first-release-date", "")
    year = int(date[:4]) if len(date) >= 4 and date[:4].isdigit() else None
    credits = []
    for item in record.get("artist-credit", []):
        artist = item.get("artist", {}) if isinstance(item, dict) else {}
        if artist.get("id") and artist.get("name"):
            credits.append({"source_id": artist["id"], "name": artist["name"], "role": "credited_artist"})
    # A release country / artist origin is not automatically a recording's country or language.
    return validate({"source": "musicbrainz", "source_id": sid,
        "source_url": f"https://musicbrainz.org/recording/{sid}", "license": "CC0-1.0",
        "license_url": SOURCES["musicbrainz"][1], "retrieved_at": retrieved,
        "title": record.get("title"), "aliases": [], "languages": [], "countries": [],
        "year": year, "album": None, "kind": "recording", "credits": credits,
        "scope_basis": "MusicBrainz source-query candidate, not verified Indian origin: " + query})


def fetch(directory, query, pages=1, interval=1.1):
    if not 1 <= pages <= 100 or len(query) > 800 or not query.strip() or interval < 1.1:
        raise ValidationError("pages 1..100; nonempty query <=800 chars; interval >=1.1 seconds")
    root = Path(directory)
    root.mkdir(parents=True, exist_ok=True)
    fingerprint = hashlib.sha256(query.encode()).hexdigest()
    with (root / "fetch.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        checkpoint = root / "checkpoint.json"
        state = json.loads(checkpoint.read_text()) if checkpoint.exists() else {"query_hash": fingerprint, "next_offset": 0, "next_request_after": 0}
        if state.get("query_hash") != fingerprint:
            raise ValidationError("output belongs to a different source query; use a separate directory")
        completed = 0
        if state.get("completed"):
            return {"pages": 0, "next_offset": state["next_offset"], "completed": True}
        for _ in range(pages):
            offset = state["next_offset"]
            journal_path = root / f"page-{offset:09}.json"
            if journal_path.exists():
                journal = json.loads(journal_path.read_text())
                if journal.get("query_hash") != fingerprint or journal.get("offset") != offset:
                    raise ValidationError("page journal identity mismatch")
            else:
                url = "https://musicbrainz.org/ws/2/recording/?" + urllib.parse.urlencode({"query": query, "fmt": "json", "limit": 100, "offset": offset})
                response = None
                for attempt in range(4):
                    time.sleep(max(0, state["next_request_after"] - time.time()))
                    # Persist before request: restart cannot bypass the per-fetcher interval.
                    state["next_request_after"] = time.time() + interval
                    atomic(checkpoint, canonical(state))
                    try:
                        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
                        with urllib.request.urlopen(request, timeout=25) as result:
                            data = result.read(8 * 1024 * 1024 + 1)
                            if len(data) > 8 * 1024 * 1024:
                                raise ValidationError("source response too large")
                            response = json.loads(data)
                        break
                    except urllib.error.HTTPError as exc:
                        if exc.code not in {429, 503} or attempt == 3:
                            raise
                        retry = exc.headers.get("Retry-After", "")
                        try:
                            delay = int(retry) if retry.isdigit() else max(0, math.ceil(parsedate_to_datetime(retry).timestamp() - time.time()))
                        except (ValueError, TypeError, OverflowError):
                            delay = 2 ** (attempt + 1)
                        # Never shorten a server's requested delay: stop if too long for this checkpoint.
                        if delay > 120:
                            state["next_request_after"] = time.time() + delay
                            atomic(checkpoint, canonical(state))
                            raise ValidationError("source requested a long pause; resume later") from None
                        state["next_request_after"] = time.time() + max(interval, delay)
                        atomic(checkpoint, canonical(state))
                if not isinstance(response, dict) or not isinstance(response.get("recordings"), list):
                    raise ValidationError("invalid source response")
                retrieved = datetime.now(timezone.utc).isoformat()
                records, rejected = [], 0
                for raw in response["recordings"]:
                    try:
                        records.append(convert(raw, retrieved, query))
                    except ValidationError:
                        rejected += 1
                journal = {"query_hash": fingerprint, "offset": offset,
                           "total": response.get("count", 0), "source_rows": len(response["recordings"]),
                           "rejected": rejected, "records": records}
                atomic(journal_path, canonical(journal))
            # Replay an existing journal after an interrupted write without an extra source request.
            atomic(root / f"page-{offset:09}.jsonl", "".join(canonical(r) + "\n" for r in journal["records"]))
            state["next_offset"] = offset + journal["source_rows"]
            state["completed"] = not journal["source_rows"] or state["next_offset"] >= journal["total"]
            atomic(checkpoint, canonical(state))
            completed += 1
            print(json.dumps({"offset": offset, "accepted": len(journal["records"]), "rejected": journal["rejected"], "completed": state["completed"]}), flush=True)
            if state["completed"]:
                break
        return {"pages": completed, "next_offset": state["next_offset"], "completed": state.get("completed", False)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--query", required=True)
    parser.add_argument("--pages", type=int, default=1)
    parser.add_argument("--acknowledge-api-terms", action="store_true", help="Confirm you have reviewed current API service terms; CC0 data rights do not grant free commercial API service. Prefer offline dumps.")
    args = parser.parse_args()
    if not args.acknowledge_api_terms:
        parser.error("review API terms and pass --acknowledge-api-terms, or use the offline bundled/dump importer")
    try:
        print(json.dumps(fetch(args.out_dir, args.query, args.pages)))
    except (ValidationError, OSError, ValueError) as exc:
        # No response bodies, credentials, query values or rejected payloads in diagnostics.
        parser.exit(1, "Fetcher stopped safely: " + type(exc).__name__ + "; checkpoint retained.\n")


if __name__ == "__main__":
    main()

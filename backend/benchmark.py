"""Measured scale fixture, explicitly SYNTHETIC; never a real catalogue claim."""
import argparse
import json
import tempfile
import time
from pathlib import Path
from .catalogue import SOURCES, canonical, connect, coverage, initialize, now, publish, search, stage


def fixture(number):
    return {"source": "synthetic", "source_id": f"synthetic-{number}",
            "source_url": f"https://example.invalid/synthetic-{number}", "license": "CC0-1.0",
            "license_url": SOURCES["synthetic"][1], "retrieved_at": "2026-01-01T00:00:00+00:00",
            "title": f"SYNTHETIC தமிழ் வானம் {number}", "aliases": [f"SYNTHETIC Hindi गीत {number}"],
            "languages": ["tam" if number % 2 else "hin"], "countries": [],
            "year": 1950 + number % 75, "album": f"SYNTHETIC ALBUM {number % 100}",
            "kind": "recording", "scope_basis": "Explicitly fictional performance fixture, not Indian music facts",
            "credits": [{"source_id": f"synthetic-{number % 1000}", "name": f"SYNTHETIC ARTIST {number % 1000}", "role": "singer"}]}


def benchmark(count=100000):
    if not 1 <= count <= 1000000:
        raise ValueError("count must be 1..1000000")
    with tempfile.TemporaryDirectory(prefix="powerwords-SYNTHETIC-") as temp:
        root = Path(temp)
        source, db = root / "SYNTHETIC.jsonl", root / "SYNTHETIC.sqlite"
        with source.open("w", encoding="utf-8") as file:
            for i in range(count):
                file.write(canonical(fixture(i)) + "\n")
        initialize(db, True)
        started = time.perf_counter()
        run = stage(db, source, count)
        staged = time.perf_counter()
        changed = 0
        while True:
            result = publish(db, run["run_id"], 1000)
            changed += result["changed"]
            if not result["remaining"]:
                break
        indexed = time.perf_counter()
        latencies = []
        with connect(db, True) as conn:
            for i in range(50):
                before = time.perf_counter()
                result = search(conn, {"q": "தமிழ் வானம்", "language": "tam", "limit": "25"})
                assert result["total"] == count // 2
                latencies.append((time.perf_counter() - before) * 1000)
            counts = coverage(conn)
        return {"label": "SYNTHETIC benchmark; zero real songs imported", "rows": count,
                "changed": changed, "stage_seconds": round(staged-started, 3),
                "publish_seconds": round(indexed-staged, 3), "query_iterations": len(latencies),
                "query_p50_ms": round(sorted(latencies)[len(latencies)//2], 3),
                "query_p95_ms": round(sorted(latencies)[int(len(latencies)*0.95)-1], 3),
                "db_bytes": db.stat().st_size, "languages": {x["code"]: x["tracks"] for x in counts["languages"] if x["tracks"]},
                "timestamp": now(), "limitations": "Single local writer, warm-cache bounded search+count; not production concurrency, network, fuzzy or all-source coverage."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=100000)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    result = benchmark(args.count)
    Path(args.out).write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))

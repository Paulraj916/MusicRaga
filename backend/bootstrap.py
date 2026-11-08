"""Verify the bundled CC0 snapshot, adapt bounded records, resume staging and publish locally. No network."""
import argparse
import gzip
import hashlib
import json
import os
from collections import Counter
from pathlib import Path
from .adapt_batch import adapt, adapt_profile_v2
from .catalogue import (ValidationError, canonical, connect, coverage, file_hash, import_profiles,
                        initialize, publish, stage, resolve_credit_names)


def prepare(root, entry, cache):
    source = (root / entry["file"]).resolve()
    if not source.is_relative_to(root.resolve()) or file_hash(source) != entry["compressed_sha256"]:
        raise ValidationError("bundled compressed source hash mismatch")
    key = entry["uncompressed_sha256"][:24] + "-adapter-v4"
    normalized, report_path = cache / (key + ".jsonl"), cache / (key + ".json")
    if normalized.exists() and report_path.exists():
        report = json.loads(report_path.read_text())
        if file_hash(normalized) == report["normalized_sha256"]:
            return normalized, report
    temporary = normalized.with_suffix(".jsonl.partial")
    digest, seen, accepted, reasons = hashlib.sha256(), 0, 0, Counter()
    quarantine_path=cache/(key+"-quarantine.jsonl")
    with gzip.open(source, "rb") as raw, temporary.open("w", encoding="utf-8") as out, quarantine_path.open("w",encoding="utf-8") as quarantine:
        while True:
            line = raw.readline(4 * 1024 * 1024 + 1)
            if not line:
                break
            digest.update(line)
            seen += 1
            if len(line) > 4 * 1024 * 1024:
                while line and not line.endswith(b"\n"):
                    line = raw.readline(65536)
                    digest.update(line)
                reasons["oversized source row"] += 1
                continue
            try:
                value = json.loads(line)
                record = value if entry["kind"] == "artist-profiles" else adapt_profile_v2(value) if entry["kind"]=="artist-profiles-v2" else adapt(value,line)
                out.write(canonical(record) + "\n")
                accepted += 1
            except (ValidationError, ValueError, TypeError, AttributeError) as exc:
                reason=str(exc) if isinstance(exc, ValidationError) else "invalid source object"
                reasons[reason] += 1
                quarantine.write(canonical({"line":seen,"sha256":hashlib.sha256(line).hexdigest(),"reason":reason})+"\n")
    if digest.hexdigest() != entry["uncompressed_sha256"] or seen != entry["records"]:
        raise ValidationError("uncompressed snapshot hash/count mismatch; no source records published")
    os.replace(temporary,normalized)
    report = {"source":entry["file"],"source_records":seen,"accepted":accepted,
              "quarantined":sum(reasons.values()),"quarantine_reasons":dict(reasons),
              "normalized_sha256":file_hash(normalized),"quarantine_file":quarantine_path.name}
    report_path.write_text(json.dumps(report,indent=2)+"\n")
    return normalized,report


def bootstrap(database="var/catalogue.sqlite", directory="data/cc0", report_path="var/coverage.json"):
    root=Path(directory)
    manifest=json.loads((root/"manifest.json").read_text())
    initialize(database)
    cache=Path(database).parent/"imports"
    cache.mkdir(parents=True,exist_ok=True)
    reports=[]
    for entry in manifest["files"]:
        normalized,report=prepare(root,entry,cache)
        if entry["kind"] in {"artist-profiles","artist-profiles-v2"}:
            with normalized.open(encoding="utf-8") as source:
                report["profiles_changed"]=import_profiles(database,(json.loads(line) for line in source))
        else:
            while True:
                run=stage(database,normalized,1000000)
                while True:
                    batch=publish(database,run["run_id"],1000)
                    if not batch["remaining"]:
                        break
                if run["completed"]:
                    break
        reports.append(report)
    from .enrich_roles import integrate
    role_report = integrate(database, baseline=directory)
    from .expand_v4 import integrate_v4
    expansion_report = integrate_v4(database)
    resolved_names=resolve_credit_names(database)
    with connect(database,True) as db:
        result={"v4_expansion":expansion_report,"role_enrichment":role_report,"batch_reports":reports,"coverage":coverage(db),"network_requests":0,"tracks_with_names_resolved_through_exact_profile_ids":resolved_names,
                "notice":"Works, linked recordings and Wikidata song/single entities overlap; never sum them as unique songs. No lyric rights granted."}
    destination=Path(report_path)
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({"batch_reports":reports,"records":result["coverage"]["tracks"],"kinds":result["coverage"]["entity_kinds"],"artist_profiles":result["coverage"]["artist_profiles"]},ensure_ascii=False,indent=2))
    return result


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db",default="var/catalogue.sqlite")
    parser.add_argument("--source",default="data/cc0")
    parser.add_argument("--report",default="var/coverage.json")
    args=parser.parse_args()
    bootstrap(args.db,args.source,args.report)

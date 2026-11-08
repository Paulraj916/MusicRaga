"""Local operator CLI. Public API has no import/write endpoint."""
import argparse
import json
import sys
from .catalogue import ValidationError, connect, coverage, initialize, publish, stage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="var/catalogue.sqlite")
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init")
    init.add_argument("--synthetic", action="store_true")
    imp = sub.add_parser("stage")
    imp.add_argument("file")
    imp.add_argument("--max-records", type=int, default=10000)
    imp.add_argument("--dry-run", action="store_true")
    pub = sub.add_parser("publish")
    pub.add_argument("run_id")
    pub.add_argument("--limit", type=int, default=1000)
    sub.add_parser("coverage")
    args = parser.parse_args()
    try:
        if args.command == "init":
            initialize(args.db, args.synthetic)
            result = {"initialized": True, "mode": "synthetic" if args.synthetic else "real"}
        elif args.command == "stage":
            result = stage(args.db, args.file, args.max_records, args.dry_run)
        elif args.command == "publish":
            result = publish(args.db, args.run_id, args.limit)
        else:
            with connect(args.db, readonly=True) as db:
                result = coverage(db)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValidationError, OSError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

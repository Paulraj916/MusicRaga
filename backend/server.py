"""Loopback-first read-only API + existing static build. No tracking/CORS/write API."""
import argparse
import json
import mimetypes
import sqlite3
from pathlib import Path
from socketserver import ThreadingMixIn
from urllib.parse import parse_qs, unquote
from wsgiref.simple_server import WSGIServer, make_server
from .catalogue import ValidationError, connect, coverage, search, search_profiles


class ThreadedServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True


def app_factory(database, static="dist"):
    root = Path(static).resolve()

    def app(environ, start_response):
        headers = [("X-Content-Type-Options", "nosniff"), ("X-Frame-Options", "DENY"),
                   ("Referrer-Policy", "strict-origin-when-cross-origin"),
                   ("Permissions-Policy", "camera=(), microphone=(), geolocation=()"),
                   ("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")]

        def send(status, body, mime="application/json; charset=utf-8", extra=()):
            if isinstance(body, dict):
                body = json.dumps(body, ensure_ascii=False).encode()
            start_response(status, [*headers, ("Content-Type", mime), ("Content-Length", str(len(body))),
                                    ("Cache-Control", "no-store" if mime.startswith("application/json") else "no-cache"), *extra])
            return [b"" if environ.get("REQUEST_METHOD") == "HEAD" else body]

        if environ.get("REQUEST_METHOD") not in {"GET", "HEAD"}:
            return send("405 Method Not Allowed", {"error": "read-only service"}, extra=[("Allow", "GET, HEAD")])
        path = environ.get("PATH_INFO", "/")
        if path.startswith("/api/"):
            headers.append(("X-Robots-Tag", "noindex, nofollow"))
            try:
                if len(environ.get("QUERY_STRING", "")) > 4096:
                    raise ValidationError("query too long")
                try:
                    parsed = parse_qs(environ.get("QUERY_STRING", ""), keep_blank_values=True, max_num_fields=20)
                except ValueError:
                    raise ValidationError("too many query parameters") from None
                if any(len(v) != 1 for v in parsed.values()):
                    raise ValidationError("duplicate query parameter")
                params = {k: v[0] for k, v in parsed.items()}
                db = connect(database, readonly=True)
                try:
                    if path == "/api/v1/health":
                        version = db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()[0]
                        result = {"status": "ok", "schema_version": int(version), "read_only": True}
                    elif path == "/api/v1/coverage":
                        if params:
                            raise ValidationError("coverage accepts no parameters")
                        db.execute("BEGIN")
                        result = coverage(db)
                    elif path == "/api/v1/artists":
                        db.execute("BEGIN")
                        result = search_profiles(db, params)
                    elif path == "/api/v1/tracks":
                        # A read transaction keeps count/generation/page internally consistent.
                        db.execute("BEGIN")
                        result = search(db, params)
                    else:
                        return send("404 Not Found", {"error": "unknown endpoint"})
                finally:
                    db.close()
                return send("200 OK", result)
            except ValidationError as exc:
                status = "409 Conflict" if str(exc).startswith("stale cursor") else "400 Bad Request"
                return send(status, {"error": str(exc)})
            except (sqlite3.Error, ValueError):
                return send("503 Service Unavailable", {"error": "catalogue unavailable; operator should inspect local database"})
        if path.startswith("/catalogue/") or path == "/ads-config.json":
            headers.append(("X-Robots-Tag", "noindex, nofollow"))
        decoded = unquote(path)
        candidate = (root / decoded.lstrip("/")).resolve()
        if not candidate.is_relative_to(root) or any(p.startswith(".") for p in Path(decoded).parts if p not in {"/", "."}):
            return send("404 Not Found", {"error": "not found"})
        if candidate.is_dir():
            if not path.endswith("/"):
                return send("308 Permanent Redirect", b"", extra=[("Location", path + "/")])
            candidate /= "index.html"
        if candidate.is_file():
            return send("200 OK", candidate.read_bytes(), mimetypes.guess_type(candidate)[0] or "application/octet-stream")
        fallback = root / "404.html"
        return send("404 Not Found", fallback.read_bytes() if fallback.exists() else b"Not found", "text/html; charset=utf-8")
    return app


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="var/catalogue.sqlite")
    parser.add_argument("--static", default="dist")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4180)
    args = parser.parse_args()
    with connect(args.db, readonly=True) as db:
        if db.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()[0] != "1":
            parser.error("unsupported database schema")
    print(f"PowerWords read-only catalogue http://{args.host}:{args.port}; no production TLS/auth/rate-limit proxy configured", flush=True)
    with make_server(args.host, args.port, app_factory(args.db, args.static), server_class=ThreadedServer) as http:
        http.serve_forever()


if __name__ == "__main__":
    main()

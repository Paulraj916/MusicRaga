import io
import json
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlencode
from unittest.mock import patch
from backend.benchmark import fixture
from backend.catalogue import (LANGUAGES, ValidationError, canonical, connect, coverage,
                               initialize, publish, search, stage, validate)
from backend.fetch_musicbrainz import convert, fetch
from backend.server import app_factory
from backend.catalogue import import_profiles, search_profiles
from backend.adapt_batch import adapt
from backend.build_static import export


class CatalogueTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.db = self.root / "test.sqlite"
        self.file = self.root / "data.jsonl"
        initialize(self.db, True)

    def tearDown(self):
        self.temp.cleanup()

    def load(self, records, publish_now=True):
        self.file.write_text("".join(canonical(r) + "\n" for r in records))
        result = stage(self.db, self.file)
        if publish_now:
            publish(self.db, result["run_id"], 1000)
        return result

    def query(self, **params):
        with connect(self.db, True) as db:
            return search(db, params)

    def test_empty_coverage(self):
        with connect(self.db, True) as db:
            result = coverage(db)
        self.assertEqual(result["tracks"], 0)
        self.assertGreaterEqual(len(result["languages"]), 40)
        self.assertTrue(all(x["coverage"] == "not_observed" for x in result["languages"]))

    def test_no_lyrics_or_audio(self):
        for field in ["lyrics", "audio", "translation", "license_override"]:
            raw = fixture(1)
            raw[field] = "must-not-be-stored"
            with self.assertRaises(ValidationError):
                validate(raw, True)

    def test_unknowns_not_inferred(self):
        raw = fixture(1)
        raw.update(languages=[], year=None, countries=[], credits=[])
        self.load([raw])
        result = self.query()["items"][0]
        self.assertEqual(result["languages"], [])
        self.assertIsNone(result["year"])
        self.assertFalse(result["lyrics_available"])
        with connect(self.db, True) as db:
            self.assertEqual(coverage(db)["unknown_language"], 1)

    def test_native_search_aliases_and_marks(self):
        self.load([fixture(1)])
        for q in ["தமிழ் வானம்", "गीत", "SYNTHETIC ARTIST", "வான"]:
            self.assertEqual(self.query(q=q)["total"], 1, q)
        self.assertEqual(self.query(q="unverified commercial lyric")["total"], 0)

    def test_search_punctuation_safe(self):
        self.load([fixture(1)])
        for q in ['" OR *', "'; DROP TABLE tracks;--", "***", "NEAR()"]:
            self.query(q=q)
        self.assertEqual(self.query()["total"], 1)

    def test_native_languages_do_not_collapse(self):
        self.assertNotEqual(self.query(q="கா")["total"], -1)
        self.load([fixture(1)])
        self.assertEqual(self.query(q="वானம்")["total"], 0)

    def test_dry_run_no_mutations(self):
        self.file.write_text(canonical(fixture(1)) + "\n")
        result = stage(self.db, self.file, dry_run=True)
        self.assertEqual(result["accepted"], 1)
        with connect(self.db, True) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM runs").fetchone()[0], 0)

    def test_resume_and_idempotency(self):
        self.file.write_text("".join(canonical(fixture(i)) + "\n" for i in range(5)))
        first = stage(self.db, self.file, 2)
        second = stage(self.db, self.file, 20)
        self.assertEqual(first["run_id"], second["run_id"])
        self.assertEqual(second["accepted"], 3)
        self.assertEqual(stage(self.db, self.file)["accepted"], 0)
        one = publish(self.db, first["run_id"], 2)
        self.assertEqual(one["remaining"], 3)
        publish(self.db, first["run_id"], 5)
        self.assertEqual(publish(self.db, first["run_id"])["changed"], 0)
        self.assertEqual(self.query()["total"], 5)

    def test_duplicate_identity_and_revisions(self):
        self.load([fixture(1), fixture(1)])
        self.assertEqual(self.query()["total"], 1)
        raw = fixture(1)
        raw["title"] = "SYNTHETIC UPDATED TITLE"
        self.load([raw])
        self.assertEqual(self.query(q="UPDATED")["total"], 1)
        self.assertEqual(self.query(q="வானம்")["total"], 0)
        with connect(self.db, True) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM revisions").fetchone()[0], 1)

    def test_same_name_not_identity_merge(self):
        a, b = fixture(1), fixture(2)
        for raw in [a, b]:
            raw["credits"] = [{"name": "SYNTHETIC SAME NAME", "source_id": None, "role": "unknown"}]
        self.load([a, b])
        with connect(self.db, True) as db:
            result = coverage(db)
        self.assertEqual(result["resolved_artists"], 0)
        self.assertEqual(result["unresolved_credit_entities"], 2)

    def test_roles_and_artist_same_credit(self):
        a = fixture(1)
        a["credits"].append({"name": "SYNTHETIC COMPOSER", "source_id": "synthetic-99", "role": "composer"})
        self.load([a])
        self.assertEqual(self.query(role="composer")["total"], 1)
        self.assertEqual(self.query(role="composer", artist="synthetic:artist:synthetic-1")["total"], 0)
        self.assertEqual(self.query(role="singer", artist="synthetic:artist:synthetic-1")["total"], 1)

    def test_filters_real_values_only(self):
        self.load([fixture(i) for i in range(8)])
        self.assertEqual(self.query(language="tam")["total"], 4)
        self.assertEqual(self.query(language="ben")["total"], 0)
        self.assertEqual(self.query(year="1951", album="SYNTHETIC ALBUM 1")["total"], 1)
        self.assertEqual(self.query(country="IN")["total"], 0)

    def test_pagination_no_duplicates_unknown_last(self):
        records = [fixture(i) for i in range(9)]
        records[0]["year"] = None
        self.load(records)
        seen, params = [], {"limit": "2"}
        while True:
            page = self.query(**params)
            seen.extend(x["id"] for x in page["items"])
            if not page["next_cursor"]:
                break
            params["cursor"] = page["next_cursor"]
        self.assertEqual(len(set(seen)), 9)
        self.assertTrue(seen[-1].endswith("synthetic-0"))

    def test_cursor_bound_to_filters_generation(self):
        self.load([fixture(i) for i in range(4)])
        cursor = self.query(limit="1")["next_cursor"]
        with self.assertRaises(ValidationError):
            self.query(cursor=cursor, language="tam")
        self.load([fixture(9)])
        with self.assertRaisesRegex(ValidationError, "stale cursor"):
            self.query(cursor=cursor)

    def test_invalid_pagination(self):
        for params in [{"limit": "0"}, {"limit": "101"}, {"limit": "bad"}, {"cursor": "%%%"}, {"q": "a" * 201}, {"genre": "invented"}]:
            with self.assertRaises(ValidationError):
                self.query(**params)

    def test_quarantine_never_stores_rejected_text(self):
        self.file.write_text('{"lyrics":"PRIVATE-TEST-SENTINEL"}\nnot-json\n' + canonical(fixture(1)) + "\n")
        result = stage(self.db, self.file)
        self.assertEqual((result["accepted"], result["quarantined"]), (1, 2))
        with connect(self.db, True) as db:
            rows = db.execute("SELECT reason,payload FROM staging WHERE state='quarantined'").fetchall()
            self.assertTrue(all(row["payload"] is None for row in rows))
            self.assertNotIn("PRIVATE-TEST-SENTINEL", canonical([dict(row) for row in rows]))

    def test_oversized_record_bounded_and_resumes(self):
        self.file.write_bytes(b'x' * 150000 + b'\n' + (canonical(fixture(1)) + '\n').encode())
        result = stage(self.db, self.file)
        self.assertEqual((result["accepted"], result["quarantined"]), (1, 1))

    def test_mode_isolation_and_source_provenance(self):
        with self.assertRaises(ValidationError):
            initialize(self.db, False)
        raw = fixture(1)
        for key, value in [("source_url", "https://evil.invalid/"), ("license", "unknown"), ("license_url", "https://evil.invalid/"), ("source_id", "made-up")]:
            invalid = dict(raw, **{key: value})
            with self.assertRaises(ValidationError):
                validate(invalid, True)

    def test_musicbrainz_credit_not_singer_or_language(self):
        raw = {"id": "11111111-1111-4111-8111-111111111111", "title": "TEST ONLY",
               "first-release-date": "2000-01-01", "artist-credit": [{"artist": {"id": "22222222-2222-4222-8222-222222222222", "name": "TEST ARTIST"}}]}
        result = convert(raw, "2026-01-01T00:00:00Z", "country:IN")
        self.assertEqual(result["credits"][0]["role"], "credited_artist")
        self.assertEqual(result["languages"], [])
        self.assertEqual(result["countries"], [])

    def request(self, path, params=None, method="GET"):
        status, headers = [], []
        def start(s, h):
            status.append(s)
            headers.extend(h)
        body = b"".join(app_factory(self.db, self.root)({"PATH_INFO": path, "QUERY_STRING": urlencode(params or {}), "REQUEST_METHOD": method}, start))
        return status[0], dict(headers), body

    def test_api_readonly_and_native(self):
        self.load([fixture(1)])
        status, headers, data = self.request("/api/v1/tracks", {"q": "தமிழ்"})
        self.assertEqual(status, "200 OK")
        self.assertEqual(json.loads(data)["total"], 1)
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(self.request("/api/v1/tracks", method="POST")[0], "405 Method Not Allowed")
        self.assertEqual(self.request("/api/v1/health")[0], "200 OK")
        self.assertEqual(self.request("/api/v1/coverage")[0], "200 OK")

    def test_api_error_states_and_traversal(self):
        self.assertEqual(self.request("/api/v1/tracks", {"cursor": "bad"})[0], "400 Bad Request")
        self.assertEqual(self.request("/api/v1/not-found")[0], "404 Not Found")
        self.assertEqual(self.request("/../.git/config")[0], "404 Not Found")
        self.assertEqual(self.request("/%2e%2e/secret")[0], "404 Not Found")
        self.assertNotIn("Access-Control-Allow-Origin", self.request("/api/v1/health")[1])

    def test_taxonomy_scheduled_and_unknown(self):
        self.assertTrue({"tam", "hin", "urd", "sat", "mni", "brx", "doi", "kok", "mai", "und"}.issubset(LANGUAGES))

    def test_fetch_bounds_no_network(self):
        with patch("urllib.request.urlopen", side_effect=AssertionError("network forbidden")):
            with self.assertRaises(ValidationError):
                fetch(self.root / "fetch", "India", pages=101)
            with self.assertRaises(ValidationError):
                fetch(self.root / "fetch", "India", interval=0)

    def test_fetch_journal_replay_no_network(self):
        import hashlib
        root = self.root / "journal"
        root.mkdir()
        query = "country:IN"
        journal = {"offset": 0, "query_hash": hashlib.sha256(query.encode()).hexdigest(), "source_rows": 1,
                   "total": 1, "records": [], "rejected": 1}
        (root / "page-000000000.json").write_text(canonical(journal))
        with patch("urllib.request.urlopen", side_effect=AssertionError("network forbidden")):
            result = fetch(root, query)
        self.assertTrue(result["completed"])
        self.assertTrue((root / "page-000000000.jsonl").exists())
        with self.assertRaises(ValidationError):
            fetch(root, "different-query")

    def test_work_recording_graph_and_unknown_names(self):
        work=fixture(1)
        work["kind"]="work"
        recording=fixture(2)
        recording["associated_work_ids"]=[]
        # Real-mode source relationships use UUIDs; test actual canonical namespaces.
        source="11111111-1111-4111-8111-111111111111"
        work.update(source="musicbrainz",source_id=source,source_url="https://musicbrainz.org/work/"+source,license_url="https://musicbrainz.org/doc/About/Data_License")
        work["credits"]=[{"source_id":"22222222-2222-4222-8222-222222222222","name":None,"role":"writer"}]
        real=self.root/"real.sqlite"
        initialize(real)
        self.file.write_text(canonical(work)+"\n")
        run=stage(real,self.file)
        publish(real,run["run_id"])
        with connect(real,True) as db:
            item=search(db,{})["items"][0]
            self.assertIsNone(item["credits"][0]["name"])
            self.assertEqual(item["credits"][0]["role"],"writer")
        self.assertEqual(validate(work)["kind"],"work")
        recording.update(source="musicbrainz",source_id=source,source_url="https://musicbrainz.org/recording/"+source,license_url="https://musicbrainz.org/doc/About/Data_License",credits=[],associated_work_ids=[source])
        self.file.write_text(canonical(recording)+"\n")
        run=stage(real,self.file)
        publish(real,run["run_id"])
        with connect(real,True)as db:
            self.assertEqual(search(db,{})["total"],2)
            linked=search(db,{"work":"musicbrainz:work:"+source})
            self.assertEqual(linked["total"],1)
            self.assertEqual(linked["items"][0]["kind"],"recording")
            self.assertEqual(coverage(db)["unresolved_work_links"],0)

    def test_artist_occupations_not_track_roles(self):
        self.db=self.root/"profiles.sqlite"
        initialize(self.db)
        raw={"id":"wd:Q1","name":"TEST PROFILE","externalIds":{"wikidata":"Q1","musicbrainz":[]},"roles":[{"property":"P106","id":"Q177220","label":"singer"}],"countries":["Q668"],"countryEvidence":"source claim only","provenance":[{"source":"Wikidata","sourceUrl":"https://www.wikidata.org/wiki/Q1","license":"CC0-1.0","licenseUrl":"https://www.wikidata.org/wiki/Wikidata:Licensing"}]}
        self.assertEqual(import_profiles(self.db,[raw]),1)
        self.assertEqual(import_profiles(self.db,[raw]),0)
        with connect(self.db,True) as db:
            self.assertEqual(search_profiles(db,{"q":"PROFILE"})["total"],1)
            self.assertEqual(coverage(db)["roles"],{})
        self.assertEqual(self.request("/api/v1/artists")[0],"200 OK")

    def test_static_export_paged_no_lyrics(self):
        self.load([fixture(i) for i in range(105)])
        out=self.root/"static"
        manifest=export(self.db,out)
        self.assertEqual(manifest["entities"]["tracks"]["count"],105)
        self.assertEqual(manifest["mode"],"synthetic")
        folder=out/manifest["version"]
        first=json.loads((folder/"tracks/pages/0.json").read_text())
        second=json.loads((folder/"tracks/pages/1.json").read_text())
        self.assertEqual((len(first),len(second)),(100,5))
        self.assertTrue(all(not record["lyrics_available"] for record in first))
        self.assertTrue((folder/"tracks/terms/ba4.json").exists())

    def test_source_adapter_keeps_recording_unknowns(self):
        sid="11111111-1111-4111-8111-111111111111"
        raw={"entityType":"recording","title":"TEST RECORDING","externalIds":{"musicbrainzRecording":sid},"associatedWorkIds":[],"durationMs":1000,"lyrics":None,"provenance":[{"source":"MusicBrainz","sourceUrl":"https://musicbrainz.org/recording/"+sid,"retrievedAt":"2026-01-01T00:00:00Z","license":"CC0-1.0","licenseUrl":"https://musicbrainz.org/doc/Development/JSON_Data_Dumps"}]}
        result=adapt(raw,canonical(raw).encode())
        self.assertEqual(result["languages"],[])
        self.assertEqual(result["credits"],[])
        self.assertEqual(result["kind"],"recording")

    def test_whitespace_search_and_surrogate_quarantine(self):
        self.assertEqual(self.query(q="   ")["total"],0)
        raw=fixture(1)
        raw["title"]="\ud800"
        with self.assertRaises(ValidationError):
            validate(raw,True)


if __name__ == "__main__":
    unittest.main()

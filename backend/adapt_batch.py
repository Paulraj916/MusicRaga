"""Conservative adapter for the independently sourced CC0 worker batch, streaming JSONL."""
import argparse
import hashlib
import json
from pathlib import Path
from .catalogue import LANGUAGES, ROLES, SOURCES, ValidationError, canonical, validate


NAME_TO_LANGUAGE = {name.casefold(): code for code, name in LANGUAGES.items()}
NAME_TO_LANGUAGE.update({"oriya": "ori", "meitei": "mni", "punjabi language": "pan", "odia language": "ori", "bangla": "ben"})


def adapt(raw, original_line):
    provenance = raw.get("provenance", [])
    if not provenance or raw.get("lyrics") is not None:
        raise ValidationError("missing provenance or nonempty lyric field")
    proof = provenance[0]
    provider = proof.get("source", "").casefold()
    if provider not in {"musicbrainz", "wikidata"} or proof.get("license") != "CC0-1.0":
        raise ValidationError("unapproved source/license")
    title = raw.get("title")
    evidence = {"input_sha256": hashlib.sha256(original_line).hexdigest()}
    for source, target in [("snapshotUrl", "snapshot_url"), ("revision", "source_revision"), ("licenseUrl", "license_evidence_url")]:
        if proof.get(source) is not None:
            evidence[target] = proof[source]
    aliases, credits, languages, unmapped = [], [], [], []
    if provider == "wikidata":
        sid = raw.get("externalIds", {}).get("wikidata")
        kind = "song_or_single"
        aliases = list(raw.get("labels", {}).values())
        for values in raw.get("aliases", {}).values():
            aliases.extend(values)
        for language in raw.get("languages", []):
            code = NAME_TO_LANGUAGE.get((language.get("name") or "").casefold())
            if code:
                languages.append(code)
            else:
                unmapped.append(language.get("id") or "unresolved-source-language")
        countries = ["IN"] if any(c.get("id") == "Q668" for c in raw.get("countries", [])) else []
        years = []
        for date in raw.get("dates", []):
            value = date.get("value", "")
            if date.get("property") == "P577" and date.get("precision", 0) >= 9 and value.startswith("+") and value[1:5].isdigit() and int(value[1:5]) > 0:
                years.append(int(value[1:5]))
        year = min(years) if years else None
        for field, role in [("performers", "performer"), ("composers", "composer"), ("lyricists", "lyricist")]:
            for artist in raw.get("credits", {}).get(field, []):
                if artist.get("id") or artist.get("name"):
                    credits.append({"source_id": artist.get("id"), "name": artist.get("name"), "role": role})
        scope = "Wikidata query candidate; source assertions only. Indian language, performer association or country selection is not a complete Indian-song census."
    else:
        sid = raw.get("externalIds", {}).get("musicbrainzWork")
        if raw.get("entityType") == "recording":
            sid = raw.get("externalIds", {}).get("musicbrainzRecording")
            recording_credits=[]
            relationship_evidence=[]
            for artist in raw.get("artistCredit",[]):
                recording_credits.append({"source_id":artist.get("artistId"),"name":artist.get("name"),"role":"credited_artist"})
            for relationship in raw.get("explicitArtistRelationships",[]):
                role=relationship.get("role")
                if role not in ROLES:
                    evidence.setdefault("unmapped_roles",[]).append(role)
                    continue
                recording_credits.append({"source_id":relationship.get("artistId"),"name":relationship.get("artistName"),"role":role})
                relationship_evidence.append({"artist_id":relationship.get("artistId"),"role":role,"role_id":relationship.get("roleId"),"relationship_id":relationship.get("sourceRelationshipId"),"attributes":relationship.get("attributes",[])})
            association=raw.get("indiaAssociation",{})
            association_evidence={"tier":association.get("tier"),"work_languages":raw.get("associatedWorkLanguages",[]),"release_text_languages":association.get("releaseTextLanguages",[]),"release_ids":raw.get("associatedReleaseIds",[]),"india_release_market":bool(association.get("indiaReleaseMarket"))} if association.get("tier") else {}
            return validate({"source": provider,"source_id":sid,"source_url":proof.get("sourceUrl"),
                "license":"CC0-1.0","license_url":SOURCES[provider][1],"retrieved_at":proof.get("retrievedAt"),
                "title":title,"aliases":[],"languages":[],"countries":[],"credits":recording_credits,"credit_evidence":relationship_evidence,"association_evidence":association_evidence,"year":None,"album":None,
                "kind":"recording","duration_ms":raw.get("durationMs"),"associated_work_ids":raw.get("associatedWorkIds",[]),
                "scope_basis":"Preferred source-associated recording; work language and edition-text language are evidence, NOT sung language or nationality. Generic credited artists are not inferred singers/composers; only explicit relationships carry roles. Recording first release date remains unknown.","provenance":evidence})
        if raw.get("entityType") != "work":
            raise ValidationError("unsupported source entity type")
        kind, countries, year = "work", [], None
        for code in raw.get("languages", []):
            if code in LANGUAGES:
                languages.append(code)
            else:
                unmapped.append(str(code))
        for alias in raw.get("aliases", []):
            aliases.append(alias.get("name") if isinstance(alias, dict) else alias)
        unknown_roles = []
        for credit in raw.get("credits", []):
            artist = credit.get("artist", {})
            if not artist.get("id") and not artist.get("name"):
                continue
            source_role = credit.get("role", "unknown")
            role = source_role if source_role in ROLES else "unknown"
            if role == "unknown" and source_role != "unknown":
                unknown_roles.append(source_role)
            credits.append({"name": artist.get("name"), "source_id": artist.get("id"), "role": role})
        if unknown_roles:
            evidence["unmapped_roles"] = sorted(set(unknown_roles))
        association = raw.get("indiaAssociation", {})
        matches = association.get("languageMatch", [])
        scope = "MusicBrainz work candidate: " + ("source Indian-language association" if matches else "artist-association only, NOT verified Indian origin") + ". Works and linked recordings are not counted as the same entity; source citizenship claims require editorial review."
    if unmapped:
        evidence["unmapped_language_ids"] = sorted(set(unmapped))
    # Keep a bounded real alias set, without inventing a translation or lyric association.
    aliases = list(dict.fromkeys(a for a in aliases if isinstance(a, str) and a and a != title))[:40]
    return validate({"source": provider, "source_id": sid, "source_url": proof.get("sourceUrl"),
                     "license": "CC0-1.0", "license_url": SOURCES[provider][1],
                     "retrieved_at": proof.get("retrievedAt"), "title": title,
                     "aliases": aliases, "languages": list(dict.fromkeys(languages)), "countries": countries,
                     "credits": credits, "year": year, "album": None, "kind": kind,
                     "scope_basis": scope, "provenance": evidence})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    destination = Path(args.out)
    if destination.exists():
        parser.error("refusing to overwrite existing normalized output")
    accepted, rejected = 0, 0
    with open(args.input, "rb") as source, destination.open("x", encoding="utf-8") as out:
        for line in source:
            try:
                result = adapt(json.loads(line), line)
                out.write(canonical(result) + "\n")
                accepted += 1
            except (ValidationError, ValueError, TypeError, AttributeError):
                rejected += 1
    print(json.dumps({"accepted": accepted, "rejected": rejected, "note": "Rejected source rows omitted; source input hash retained per accepted record. No lyric rights granted."}))


if __name__ == "__main__":
    main()


def adapt_profile_v2(raw):
    """Source aliases and generic credited-artist identity, never inferred occupation/nationality."""
    sid=raw.get("id","").removeprefix("mb-artist:")
    proof=raw.get("provenance",[{}])[0]
    if proof.get("license")!="CC0-1.0" or proof.get("sourceUrl")!="https://musicbrainz.org/artist/"+sid:
        raise ValidationError("invalid v2 profile provenance")
    aliases=[]
    for value in raw.get("aliases",[]):
        name=value.get("name") if isinstance(value,dict) else value
        if isinstance(name,str) and name and len(name)<=500:aliases.append(name)
    return {"id":"musicbrainz:artist:"+sid,"name":raw.get("name"),"aliases":list(dict.fromkeys(aliases))[:40],"roles":[],"countries":[],"countryEvidence":"Source credit/relationship association only, not nationality or inferred singer occupation.","externalIds":{"wikidata":None,"musicbrainz":[sid]},"provenance":[{**proof,"licenseUrl":SOURCES["musicbrainz"][1]}]}

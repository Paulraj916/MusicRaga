# Corrected GitHub owner / exact target research

Updated 2026-11-08 23:21 IST. The owner explicitly corrected “Not nabina”; the parent independently verified the connected GitHub identity **Paulraj916 / Paul Raj**, https://github.com/Paulraj916. Paulraj916 is now the established owner/account, not a guessed public search result. The earlier Navina0 investigation was the wrong account and must not guide target ownership.

## Read-only CLI checks (existing account; no account change here)

```sh
gh api user --jq '{login,name,html_url}'
```

Exit 0: `{"html_url":"https://github.com/Navina0","login":"Navina0","name":null}`.

```sh
gh api repos/Paulraj916/PowerWords --jq '{full_name,html_url,default_branch,private,size,permissions}'
```

Exit **1**:

```text
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/repos#get-a-repository","status":"404"}
gh: Not Found (HTTP 404)
```

```sh
gh repo list Paulraj916 --limit 1000 --json name,nameWithOwner,url,isPrivate --jq '[.[]|select((.name|ascii_downcase|gsub("[-_ ]";""))=="powerwords")]'
```

Exit 0: `[]` (empty stderr).

```sh
gh search repos 'PowerWords paulraj' --limit 100 --json fullName,url,description
```

Exit 0: `[]` (empty stderr). Broader public-name search results are not proof of ownership; no unrelated source was cloned or changed. The parent is handling the authorised CLI switch/login. This executor initiates no duplicate login, switches/removes no account and reads no credential/token file.

## Correct-account sanctioned connector checks

The connected identity is Paulraj916, independently of the CLI still being Navina0 when last read.

- `search_repositories(query="user:Paulraj916 PowerWords in:name", perPage=100)` → **0** matches.
- `search_repositories(query="user:Paulraj916 power in:name", perPage=100)` → **0** matches.
- `search_repositories(query="user:Paulraj916", perPage=100, minimal_output=true)` → **45** total / **45** returned. Case/hyphen/underscore/space-normalised exact PowerWords matches: **0**; names containing power/word/lyric: **0**. Only repository metadata was examined, not unrelated source.
- Direct `get_file_contents(owner="Paulraj916", repo="PowerWords", path="/")` returned the literal error:

```text
failed to resolve git reference: failed to get repository info: GET https://api.github.com/repos/Paulraj916/PowerWords: 404 Not Found []
```

A correct-account 404 can still mean unavailable repository permission or an incorrect/nonexistent exact slug; it is not a licence to create a repo, scrape tokens, switch accounts independently or guess another owner's project.

## Same-name public results are not selected targets

Global connected `PowerWords in:name` search returned these exact-normalised names, none owned by verified Paulraj916:

- https://github.com/ConnorB26/PowerWords — World of Warcraft addon.
- https://github.com/User719-blip/PowerWords — C++ command launcher.
- https://github.com/davi-francisco-rodrigues/PowerWords — C# project.
- https://github.com/UDbean125/PowerWords — executive-communications analysis.
- https://github.com/jtligon/PowerWords — Objective-C project.

No candidate is assumed to belong to this user; no unrelated clone or write occurred. **No matching existing target with authenticated write permission has been established, so no push or PR is attempted.** The parent needs the exact existing repository URL/access, or separate explicit authorisation if a new repository is actually wanted. Once established, inspect its existing work and integrate on a non-destructive feature branch; never force push/reset hard/skip hooks or overwrite an existing project.

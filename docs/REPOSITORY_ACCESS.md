# Exact repository discovery retry

2026-11-08 22:50:31 Asia/Kolkata

Read-only retry. Name matching removes hyphens, underscores and spaces and ignores case. No unrelated repository is cloned or edited. Accessible affiliations include owner, collaborator and organisation membership. A 404 is not proof that the repo does not exist privately under another account.

```sh
gh api user --jq .login
```

Exit status: 0

```text
Navina0
(empty stderr)
```

```sh
gh repo list Navina0 --limit 1000 --json name,nameWithOwner,url --jq '[.[] | select((.name | ascii_downcase | gsub("[-_ ]"; "")) == "powerwords")]'
```

Exit status: 0

```text
[]
(empty stderr)
```

```sh
gh api --paginate 'user/repos?per_page=100&affiliation=owner,collaborator,organization_member' --jq '.[] | select((.name | ascii_downcase | gsub("[-_ ]"; "")) == "powerwords") | {full_name,html_url,default_branch,permissions}'
```

Exit status: 0

```text
(empty stdout)
(empty stderr)
```

```sh
gh search repos PowerWords --owner Navina0 --limit 100 --json fullName,url
```

Exit status: 0

```text
[]
(empty stderr)
```

```sh
gh api repos/Navina0/PowerWords --jq '{full_name,html_url,default_branch}'
```

Exit status: 1

```text
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/repos#get-a-repository","status":"404"}
gh: Not Found (HTTP 404)
```

## Local commit attribution (not an authentication change)

The ordinary local `git commit -m "Add sourced catalogue, crawlable multilingual SEO and recorded mobile demo"` exited **128**: `Author identity unknown` / `fatal: unable to auto-detect email address`. This is missing local attribution configuration, not a remote authentication or push failure. The commit is retried with the **same Git operation** and a command-scoped honest build identity: `git -c user.name='Grok Bot' -c user.email='grok-bot@localhost' commit -m "Add sourced catalogue, crawlable multilingual SEO and recorded mobile demo"`. The email is deliberately non-deliverable local commit metadata, not a claimed inbox or the owner's verified GitHub identity. No global Git configuration, credential, remote or hook bypass is changed.

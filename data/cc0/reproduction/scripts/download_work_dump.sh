#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Fixed snapshot, resumable partial download, 4-minute network bound. Verify before parsing.
curl --fail --location --continue-at - --max-time 240 --output raw/work.tar.xz https://data.metabrainz.org/pub/musicbrainz/data/json-dumps/20261107-001001/work.tar.xz
printf '%s  %s\n' a92f985819882a143629bad7c76795a114cac2d7f4266587b7371b6ba9b07650 raw/work.tar.xz | sha256sum --check

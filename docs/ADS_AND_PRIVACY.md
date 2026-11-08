# Reader-first monetisation and privacy

## Current behaviour

Advertising is **off**. No publisher ID, ad unit, ads.txt claim, ad-network request, cookie banner, analytics or consent record is fabricated. A static placeholder is labelled “Advertisements” and “Advertising disabled in demo”. This demo’s noindex/robots state and tiny fictional catalogue are **not an AdSense application-ready property**.

Ads must never appear in the lyric modal, between verse lines, over search/navigation, around seek/play/import/copy controls, as anchor/sticky overlays, or as audio interruptions. No automatic ad refresh, click encouragement, false download buttons or pre-roll gating. Reserve ad dimensions to avoid layout shift and separate an eventual ad unit clearly from editorial material. The placeholder copy must be replaced with the legitimate ad implementation; do not disguise live ads under editorial slogans.

## Before enabling any ad SDK

- Establish the operating publisher, substantial original/licensed content, ownership, real contact/takedown route and privacy policy.
- Read current Google Publisher/AdSense policies, including copyright/content restrictions and placement policy. Approval and revenue are not guaranteed by any code.
- Complete jurisdiction-specific consent assessment. Use an appropriate consent platform and certified CMP where Google’s requirements apply. Obtain required choices **before** third-party advertising requests; provide equally accessible refusal/withdrawal.
- Treat “non-personalised” ads as still potentially using storage/transmitting data. Do not bypass consent requirements by changing a label.
- Load any ad script only through a consent-gated isolated component, never inside `Reader`. Configure CSP deliberately to the reviewed network domains, not wildcards.
- Add an owner-supplied verified publisher/account ID and real ads.txt only after approval. Do not commit secret credentials or use another publisher’s ID.
- Test offline, no-fill, consent-denied, script-blocked, slow network, keyboard navigation and layout shift. Keep the reading task fully functional when ads fail.
- Review density rather than trying to maximise impressions at the expense of users.

## Current data inventory

`pw:favorites`: song IDs. `pw:collections`: user-entered names and song IDs. `pw:theme`: light/dark. `pw:font`: numeric reader size. `pw:privacy` is reserved/cleared but not written. These are local browser storage, not synced. Default theme/font may be written again after resetting preferences; personal saved songs/collections are cleared. No ad consent is implied by a theme setting.

Audio, LRC, and imported catalogues live only in memory and are not submitted. Export downloads the catalogue, not preferences/media. External music search links transfer the search text to the chosen provider only after a user follows the link; that provider has separate privacy terms. Static hosting operators can have access logs; do not promise those never exist. Production must document these and legal retention/removal requirements.

## Official references checked 8 November 2026 (Asia/Kolkata)

- https://support.google.com/adsense/answer/1346295?hl=en — placement; accidental clicks, ad labels, navigation/playback separation.
- https://support.google.com/adsense/answer/48182?hl=en — AdSense program policies; deceptive placements, invalid traffic, user navigation.
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — modal focus containment, initial focus, Escape and restoration.

Re-read policies at launch; these references are not a promise of compliance or legal advice.

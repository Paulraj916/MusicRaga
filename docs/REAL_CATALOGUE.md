# Reviewed real catalogue and text rights

Sources checked 8 November 2026. These are independently stated **facts**, not scraped lyric text or copied editorial prose. Names/titles/years can differ between reissues and original launches. Exact dates, ISRCs, labels, instrumentation, raga, popularity and other unsupported fields are intentionally absent. No source's availability is treated as permission to reproduce its protected lyrics/art/audio.

## Recording metadata only (5)

| Recording / native title              | Album · year               | Composer               | Singer(s)                   | Lyricist   | Duration |
| ------------------------------------- | -------------------------- | ---------------------- | --------------------------- | ---------- | -------- |
| Chinna Chinna Asai · சின்ன சின்ன ஆசை  | Roja · 1992                | A. R. Rahman           | Minmini                     | Vairamuthu | 4:55     |
| Pudhu Vellai Mazhai · புது வெள்ளை மழை | Roja · 1992                | A. R. Rahman           | Unni Menon; Sujatha Mohan   | Vairamuthu | 5:16     |
| Munbe Vaa · முன்பே வா                 | Sillunu Oru Kaadhal · 2006 | A. R. Rahman           | Shreya Ghoshal; Naresh Iyer | Vaali      | 5:59     |
| Ennadi Maayavi Nee · என்னடி மாயாவி நீ | Vada Chennai · 2018        | **Santhosh Narayanan** | Sid Sriram                  | Vivek      | 4:11     |
| Goindhammavaala · கோயிந்தம்மாவால      | Vada Chennai · 2018        | **Santhosh Narayanan** | Dhanush                     | Rokesh     | 4:38     |

Individual source ledgers also live in `src/realCatalogue.ts` and on the respective pages:

- **Both Roja entries:** https://open.spotify.com/album/6ZRZnsZguVEy0P7hngzsbv — title/credited artists/1992 album listing/duration. https://en.wikipedia.org/wiki/Roja_(soundtrack) — cross-check role-specific singer, composer and lyricist table. Titles are Tamil versions, not the Hindi adaptations of the album. Native title spellings are cross-checked against the Tamil song table at https://ta.wikipedia.org/wiki/ரோஜா_(திரைப்படம்) (title facts only). The English/streaming listing scopes the singer field to Minmini; the Tamil reference also mentions Rahman on a version, so this is not a complete session/humming-personnel claim.
- **Munbe Vaa:** https://music.apple.com/us/song/munbe-vaa/1706006701 — title, album, credited people, 2006 listing. https://en.wikipedia.org/wiki/Sillunu_Oru_Kaadhal#Soundtrack — composer, duet singer roles, Vaali and duration. Native title/expanded title form is cross-checked at https://ta.wikipedia.org/wiki/சில்லுனு_ஒரு_காதல் . The streaming date and soundtrack launch day differ; only the corroborated year is stored.
- **Ennadi Maayavi Nee:** https://music.apple.com/us/song/ennadi-maayavi-nee-from-vadachennai/1702588440 — title, Vada Chennai, names and 2018 listing. https://en.wikipedia.org/wiki/Vada_Chennai_(soundtrack) — composer/performer/lyricist and duration cross-check. https://www.bbc.com/tamil/articles/c2k242q77n1o independently confirms the Tamil title and the same composer/singer/lyricist roles. No article prose or lyric excerpts are reused. Store/reissue day is not asserted as original album launch.
- **Goindhammavaala:** https://music.amazon.in/tracks/B0CFNBVM5T — title/album/credits/year/duration. https://en.wikipedia.org/wiki/Vada_Chennai_(soundtrack) — Dhanush, Rokesh and Santhosh Narayanan credit table. Tamil title and composer are independently checked at https://tamil.indianexpress.com/videos/news-video/actor-dhanush-starrer-vada-chennai-audio-track-list-is-out/ . Any lyric text in a source page or headline is **not copied** into this project.

These 5 entries have `rights.status: metadata-only` and **empty `lyrics: {}`**. The validator forbids text under that status. No translation/transliteration tab, practice/play control, art claim or hidden lyric “unlock” is shown. Original geometric art is project-created, not album artwork. Links open the actual cited catalogue, not an implied streaming integration. Rights/licences for names, trademarks and source databases remain separate; launch-scale metadata sourcing needs source-terms review.

**Vada Chennai is not an A. R. Rahman soundtrack.** Its two included entries credit Santhosh Narayanan. The query `Vadachennai ஏன் ஏன் கதை கேட்கிற song` is not verified as a lyric identification: the interface explicitly returns related album entries and warns that the quoted words are unverified. The quote is not added as an SEO alias or lyric. No external search rank/coverage guarantee is made.

## Reusable text: Tirukkural, first three couplets

This is a **text/verse edition**, not a sixth commercial recording or a claim to the lyrics of a modern musical setting. The traditional attribution is Thiruvalluvar; the date is uncertain. `year: null` and `kind: verse` prevent a fabricated release year/composer/performer. No modern adaptation, recording, arrangement or commentary is reproduced.

### Text/source checks

- https://ta.wikisource.org/wiki/பக்கம்:திருக்குறள்,_மூலம்.pdf/9 — scan and transcription of the Tamil text; only the underlying first three ancient couplets are used. No modern footnotes/commentary/layout/scan image are bundled.
- https://www.projectmadurai.org/pm_etexts/utf8/pmuni0001.html — independent textual cross-check. Its electronic edition carries a notice allowing distribution provided its header remains intact. **This project does not redistribute that file, strip its header, claim its electronic edition is CC0, or copy its modern translation.** The underlying ancient words were checked against the scan, and are distinct from the electronic-file licence.
- https://kids.britannica.com/scholars/article/Tirukkural/100030 — attribution and antiquity: commonly a sixth-century author, with some scholars giving first century BCE; no exact date is invented.

### Jurisdiction reasoning (not legal advice)

- India: Copyright Act section 22, official text https://copyright.gov.in/Copyright_Act_1957/chapter_v.html — generally author life plus 60 years for published literary works; additional rules exist for posthumous works/editions. The underlying ancient Tirukkural predates these terms by many centuries. This does **not** make a modern translation, commentary, arrangement, song adaptation or recording free.
- United States: official term/expired-work explanation https://copyright.gov/history/copyright-exhibit/lifecycle/ . The underlying ancient work's term is exhausted, while new original derivative contributions may have their own protection.
- This is a reasoned **India/US underlying-text** assessment, not a promise that every modern edition or every jurisdiction has identical rules. New jurisdictions, source-edition questions and any modern adaptation must receive operator/legal review before production distribution. Do not import modern Bharathi/other songs just by guessing an author's death date; publication/territory/derivative details matter.

The English rendering and readable Latin transliteration here were **newly written for PowerWords**; they do not quote an existing modern translation or authorised song lyric. To the extent rights arise, project contributors dedicate these new renderings and artificial recitation timestamps under **CC0-1.0**: https://creativecommons.org/publicdomain/zero/1.0/legalcode . The ancient words need no new ownership assertion. The English rendering is interpretive, not a scholarly critical edition; a native/classical Tamil editor should review fidelity and romanisation before broad publication. Artificial 0/6/12/18/24/30-second timings and the 36-second silent clock do not derive from a recording.

## Publication discipline

Adding a real item requires a reviewed source ledger, source-specific supported facts, separate rights for each text/translation/transliteration/audio/art asset, and explicit unknowns. Uploader claims in local JSON are never verified merely because the schema accepts them. Contracts/private rights evidence belong in a future server-side editorial system, not public JSON. No fact/source reading constitutes endorsement, partnership or a licence to commercial music.

# Shared archive data

Cases, researcher notes and hearts are stored in the connected private Vercel Blob store. All API routes require the existing archive session; writes require a matching Origin.

- `/api/cases`: GET shared case records; PUT `{item, revision}`. A case record has `item`, a UUID revision and `updatedAt`. Conflicting edits return 409 and preserve the form.
- `/api/media`: POST a supported raster image data URL (1.5 MB maximum per image); GET uploaded media by SHA-256 filename. Images remain behind archive login.
- `/api/notes`: independent field revisions. Case saves deliberately exclude note fields to prevent stale form content from overwriting shared notes.
- `/api/hearts`: independent researcher selections, reused by Research Perspectives.

`src/data.json` and `src/curated.json` are fallback seed data. Shared case records override seeds. When maintaining an already edited case, update its shared record through the authenticated edit form/API; changing seed JSON alone does not override a shared record. New seed IDs still appear normally.

Browser-local additional cases are migrated when missing from the shared store. Archived IDs are excluded from migration and from public views. Case imports now write through the same shared API. Browser storage is a local cache, not the source of truth for shared edits.

`lib/blob-json.js` requests uncompressed fresh content and verifies its ETag against storage metadata before a conditional write. Weak HTTP delivery ETags must not be passed directly to Blob put. The comparison prevents pairing old content with a newer metadata version.

Research Perspectives displays selected cases, category counts and shared selections. These are descriptive selection records. The future longitudinal/notes analysis area does not currently infer researcher traits or generate AI interpretations.

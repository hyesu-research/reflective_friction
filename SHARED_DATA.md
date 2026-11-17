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

## 2026-11-17: Neon Free 전환

Vercel 사이트와 로그인은 유지하고 공동 사례·하트·노트·신규 업로드 이미지는 Neon Free의 `archive_documents` 테이블에 저장한다. `DATABASE_URL`은 Vercel 통합이 설정한 서버 전용 값이다. JSON의 데이터와 버전을 한 쿼리로 읽고, UPDATE의 버전 조건으로 동시 수정 손실을 막는다. 이미지도 비공개 API를 거쳐 제공한다.

이전 Blob 저장소(`reflective-friction-notes`)는 무료 조회 한도 초과로 일시 중지되어 있다. 원본 파일을 삭제하거나 빈 데이터로 덮어쓰지 않았다. 대시보드 안내상 2026-12-16 재개 예정이며, 이전 기록 및 업로드 파일은 아직 이전되지 않았다. 새 DB가 빈 상태라고 원본 데이터가 삭제됐다고 판단하면 안 된다.

재개 후 서버용 Blob·Neon 환경변수가 설정된 비공개 작업 디렉터리에서 `node scripts/migrate-legacy-storage.mjs`를 실행한다. 이 스크립트는 모든 원본을 `.private/legacy-backup/`에 보관하고 새 DB에 없는 문서만 삽입한다. 같은 경로에 새 기록이 있으면 덮어쓰지 않고 충돌 건수를 보고한다. 충돌 하트·노트·사례는 새 수정 내역과 원본을 비교해 수동으로 병합한다. 백업은 GitHub에 올리지 않는다. 복구 검증이 끝나면 `Archive.jsx`의 임시 이전 안내를 제거한다.

자동 저장은 즉시(노트는 입력 후 800ms) 유지한다. 타인의 변경 확인은 하트·사례 2분, 열린 노트 1분 간격이며 창에 다시 돌아오면 갱신한다. 숨긴 탭과 5분 이상 상호작용이 없는 탭은 자동 조회를 멈춘다. 이전 3~5초 주기와 달리 방치된 탭이 계속 DB를 깨우지 않는다.

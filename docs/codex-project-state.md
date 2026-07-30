# Codex Project State

This document is the handoff snapshot for new Codex threads. Read it before starting work in this project, then update it when backend/frontend integration state changes.

## Project Paths

- Frontend root: `E:\code\trae_workspcae\shuxia\qianduan\shuxia-end`
- Backend root: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot`
- Docker compose file: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\docker\command\docker-compose.yml`
- Main backend service/container: `jeecg-system-start`
- MySQL container used in local debugging: `mysql`
- Local frontend dev URL normally used during testing: `http://127.0.0.1:5173`
- Canonical backend source is the E盘 `boot-box` tree above. The old `D:\weixin_download\boot-box1\server\jeecg-boot` tree is not the current merge target.

## Working Agreements

- Product positioning is a hard boundary for future work:
  - `书籍` means user-owned正版电子书 files deployed on a private local NAS. Its primary source is local directory scanning, batch import, file parsing, and library management; do not invent web-scraping acquisition flows for this domain.
  - `小说` means online serial fiction collected from free novel sites. Its primary source is rule-based web scraping, ingestion, task monitoring, and subscription updates; do not treat it as a local-file-first domain unless the user explicitly changes the product direction.
  - When a requirement could cross or blur these two source models, stop and confirm the intended domain with the user before changing behavior.
- Frontend must reflect backend responses truthfully. Do not add frontend mojibake/data-repair fallbacks that hide backend data quality problems.
- Prefer existing frontend components and shared styles. Avoid duplicating repeated styles page by page.
- After backend code changes, create or update a backend handoff document under backend `docs/` so backend colleagues know exactly what changed.
- For database scripts with Chinese text, do not pipe SQL through PowerShell into Docker. Copy the SQL into the container with `docker cp`, then run `mysql ... -e "source /tmp/file.sql"`.
- User usually wants implementation, not just a plan. Continue through code changes, verification, and concise handoff unless blocked.
- User will usually run final backend packaging/restart commands locally; Codex should provide PowerShell-safe commands when needed.

## Current Backend Notes

- Backend account/password login without image captcha is available through `POST /sys/mLogin`.
  - Local verification: `POST /sys/login` without captcha returns captcha invalid.
  - Local verification: `POST /sys/mLogin` with `username/password` returns `result.token` and `result.userInfo`.
- Backend already has category APIs based on `sx_book_category`:
  - `/sx/book/category/list`
  - `/sx/book/category/tree`
  - `/sx/book/category/options`
  - add/edit/reorder/status/delete endpoints
- Frontend resource-library pages now avoid mock business-data fallback:
  - Storage management reads `/sx/book/storage/summary` and `/sx/book/storage/source/config/page`.
  - Category management reads `/sx/book/category/summary` and `/sx/book/category/tree`; the four tabs are derived from root categories returned by the tree endpoint.
  - Tag management reads `/sx/book/tag/summary` and `/sx/book/tag/list`.
  - Static page labels/actions may live in `src/config/*`, but rows, counts, and metrics should come from backend APIs; on failure, show an error/empty state instead of mock rows.
- Frontend no longer keeps `src/mock/*` data files. Business rows, counts and metrics should come from APIs; UI-only labels/actions live under `src/config/*`.
- Content management pages now use real list APIs:
  - Comic management reads `/sx/comic/list`.
  - Audio management reads `/sx/audio/list`.
- Automation, permission, settings and log pages now read backend APIs instead of `mock/adminModules`:
  - `/sx/book/scrape-rule/list`, `/sx/book/scrape-channel/list`
  - `/sx/book/task/summary`, `/sx/book/task/list`
  - `/sx/book/dashboard/subscribe/list` for read-only subscription snapshots; `POST /sx/book/dashboard/subscribe/update` remains the explicit refresh action.
  - `/sx/book/user/manage/list`, `/sys/role/queryall`, `/sx/book/rbac/role-permission/view`
  - `/sx/book/site-setting/detail`, `/sx/book/front/reader/setting`, `/sx/book/notify-setting/channel/list`, `/sx/book/security-setting/detail`, `/sx/book/license-info/detail`
  - `/sx/book/operate-log/list`, `/sx/book/task-log/list`, `/sx/book/task-stats/summary`, `/sx/book/task-stats/trend`
- Automation frontend copy now uses "scan rule/channel" wording, while backend endpoints still use the mature `/scrape-*` route names.
  - Scan rules use `/sx/book/scrape-rule/detail/{id}`, `/add`, `/edit`, `/changeStatus`, `/delete`, and `/debug`.
  - Scan channels use `/sx/book/scrape-channel/detail/{id}`, `/add`, `/edit`, `/changeStatus`, `/delete`, and `/test`.
  - Task center uses `/sx/book/task/detail/{id}`, `/sx/book/task/timeline/{id}`, `/sx/book/task/{id}/{action}` for pause, terminate, and retry actions, and `POST /sx/book/task/batch-delete` for finished-task batch deletion.
- Site settings now drive global branding:
  - Admin edit reads `GET /sx/book/site-setting/detail` and saves with `POST /sx/book/site-setting/save`.
  - Public branding reads `GET /sx/book/site-setting/public` for login page, sidebar logo/name, browser title, and default footer.
  - The public branding endpoint is explicitly whitelisted as `anon` in backend `ShiroConfig`.
  - The site-setting SQL upsert can repair the local default `sx_site_setting` record if it contains mojibake values.
  - Local verification after the SQL repair: `site_name=书匣`, `copyright_text=© 2024 书匣 · 私有数字内容库系统`, `default_search_placeholder=搜索书名/作者/分类`, `del_flag=0`; unauthenticated public endpoint returned HTTP 200 with the same values.
  - Historical backend handoff doc was recorded under old D盘 backend; use E盘 backend as the current source before relying on that path.
- Backend already has tag APIs based on `sx_content_tag` and `sx_content_tag_rel`:
  - `/sx/book/tag/list`
  - `/sx/book/tag/options`
  - `/sx/book/tag/content/page`
  - add/edit/status/delete endpoints
- Tag management page now drives tabs, business-type/status filters, and pagination from real `/sx/book/tag/list` query parameters instead of static UI-only controls.
- Book and novel management are now separated by backend query scope:
  - Books page uses `bizType=ebook` and represents official/book-file content only.
  - Novel page uses `bizType=novel` plus `bookType=novel` and represents network novels only.
  - `/sx/book/list` supports `bizType` and `contentModel`; `/sx/book/filter/options` supports `bizType`; `/sx/book/category/options` supports `rootCode`; `/sx/book/dashboard/books-page-summary` supports `bizType`.
  - Books page type selectors are restricted to `txt/pdf/epub/mobi/azw3/graphic`; `novel`, `comic`, and `audio` are not valid books-page types.
  - Local verification: `ebook` scoped records `22`, `novel` scoped records `10`, `ebook_dirty_count=0`.
  - Historical handoff doc was recorded under old D盘 backend; use E盘 backend as the current source before relying on that path.
- The historical Douban/book web-scrape direction is retired and must not be restored:
  - Books are created only from user upload or local/NAS directory import.
  - The current E盘 backend does not expose `/sx/book/auto-scrape/*` endpoints.
  - `/automation/smart-scrape` is kept only as a compatibility redirect to the novel Collection Workbench.
  - Network collection rules, source templates, quick sync, batch discovery and subscriptions are novel-only.
- Backend tag names are now separated from category names:
  - `SxContentTagService` rejects tag names that match active `sx_book_category.category_name` or content-type aliases such as `书籍`, `NOVEL`, `book`, `ebook`, `comic`, and `audio`.
  - `sx-book-taxonomy-baseline.sql` removes category-name tags/relations, removes content-type alias tags, and seeds descriptive tag names instead.
  - Historical handoff doc was recorded under old D盘 backend; use E盘 backend as the current source before relying on that path.
- Latest taxonomy baseline added:
  - SQL: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\jeecg-boot-module\sx-book\src\main\resources\sql\sx-book-taxonomy-baseline.sql`
  - Doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\taxonomy-baseline-readme.md`
  - Migration list updated: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\service-migration\01-database-files.md`
- Local taxonomy verification after running the SQL:
  - Active categories: `69`
  - Active tags after latest local cleanup: `ebook=31`, `novel=22`, `comic=11`, `audio=10`
  - Dirty categories: `0`
  - Dirty tags: `0`
  - Active category-name tags: `0`
  - Active category-name tag relations: `0`
  - Active content-type alias tags: `0`
  - Active root-domain mismatches: `0`

## Recently Completed Work

- Unified the reading client's desktop application shell across home, library, novel, search, content detail, placeholder and settings pages:
  - Every sidebar page now uses the same `home-layout--wide` contract, so route changes no longer switch between 200px/guttered and 220px/full-width sidebar geometry.
  - At desktop widths, the application is fixed to `100dvh`, document scrolling is disabled, the 220px sidebar remains viewport-height and non-scrolling, and only the right-side `.home-shell` owns vertical scrolling. Tablet/mobile bottom navigation and document scrolling remain unchanged.
  - Live verification at 1280x720 confirmed identical 220x720 sidebars on home and novel routes, document `scrollHeight=clientHeight=720`, and independent right-panel scrolling on both routes. Reader production build passed on 2026-07-28; the existing large-chunk warning remains unchanged.

- Fixed the EPUB reading-progress race that could leave a valid CFI anchor with `readPosition=0` and `readPercent=0`:
  - Progress bootstrap now exposes a completion barrier. Route exits wait for location generation, saved-position restoration and bootstrap repair instead of skipping the final save while initialization is active.
  - Bootstrap repair writes are explicitly allowed, all progress writes are serialized, and CFI progress is persisted only after the EPUB location table is available. This prevents transient zero values and slower stale requests from overwriting the latest page.
  - The affected Red Star Over China CFI was independently resolved against the real 80-spine/210-location EPUB to `position=3828`, `percent=4`; the local `admin` progress and bookshelf records were repaired through the normal API and both now return 4%.
  - Verification: reader production build passed, the 5174 development server was restarted and confirmed to serve the bootstrap barrier, reliable-payload guard, serialized queue and bootstrap-repair code. The existing Vite large-chunk warning remains unchanged.

- Fixed the reader application's blank EPUB screen for authenticated preview URLs without a file extension:
  - `BookEpubReader.vue` now passes `openAs: "epub"` to Epub.js, so `/sx/book/preview?fileId=...` is opened as an archived EPUB instead of being misdetected as an extracted directory.
  - Initial rendition failures are no longer swallowed. The reader now shows explicit loading and failure states with a retry action instead of leaving an unexplained empty canvas.
  - Verification: the affected URL was reproduced as Epub.js auto-detection type `directory`, and the reader production build passed on 2026-07-27. The existing Vite large-chunk warning remains unchanged.

- Fixed the administration Books table cover and column-layout regression:
  - Book covers now load through an authenticated image component, so protected `/sx/book/preview` responses receive `X-Access-Token` without exposing that token to third-party image hosts.
  - Object URLs are revoked when rows change or unmount, and failed images retain a stable title-based placeholder instead of rendering a broken image.
  - The Books table now has explicit semantic column widths and an internal horizontal-scroll boundary. It displays the first three real backend tags on one line and collapses the remainder into a hoverable `+N`, so tags never overlap the adjacent storage location or change row height.
  - Verification passed with the production build and live browser checks at 1920x1080 and 1366x768. All 10 visible covers rendered, tag cells had no overflow, and the page had no document-level horizontal overflow.

- Completed the controlled novel lifecycle integration pass across the admin app, backend, MinIO and reader app:
  - A unique fixture novel was collected with 2 chapters, published, discovered through reader list/search/detail, read chapter-by-chapter, and exercised through bookshelf/history/progress writes.
  - Follow sync advanced the remote fixture to 3 chapters and produced `added=1, skipped=2, failed=0, localChapters=3`; existing chapters were not duplicated, and admin/reader chapter statistics updated immediately.
  - Reader category visibility and offline enforcement were verified on list, search, bookshelf, history, detail and direct chapter routes, then permissions were restored.
  - Novel list and publish validation now use actual chapter rows, and follow execution refreshes stored chapter statistics after every run.
  - Task Center deletion now removes entity-backed task logs in the same transaction, preventing deleted tasks from reappearing as log-backed virtual rows. A database-backed regression confirmed both task and log `del_flag=1` after one UI deletion.
  - The fixture novel, subscription, tasks/logs, generated scrape rule and source channel were fully removed; active records for the fixture run are zero, while the existing `玉奴娇` data remained unchanged.
  - Backend compile/full package and Docker rebuild passed. Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-lifecycle-integration-20260727.md`.

- Completed the first real book lifecycle acceptance pass across administration, backend, MinIO and the separate reader application:
  - A unique PDF was uploaded through the administration UI, assigned a generated cover, parsed into 11 chapters, published, discovered on the reader home/library/search/detail surfaces, and rendered as a real 14-page PDF with authenticated progress/shelf/history writes.
  - Offline content is now consistently excluded from recent reading, bookshelf and reading-history queries in addition to the existing discovery/detail filters.
  - The `/sx/book/preview` and `/sx/book/download` file boundary now prevents anonymous/reader accounts from using a known file ID to read draft or offline media. Backend management roles retain draft/offline preview access, and unbound temporary content is backend-only.
  - Backend role recognition is centralized in `SxCurrentUserSupport`; normal online cover requests do not perform the management-role lookup, avoiding an extra query on high-frequency cover lists.
  - Live publish/offline regression passed for anonymous, `ceshi`, and `admin` access. The controlled PDF fixture and all associated database/MinIO/user-read rows were removed afterward; active file count returned from 81 to 79.
  - Verification passed: 5 targeted backend tests, full 11-module package, Docker rebuild/recreate, both frontend production builds, OpenAPI health check, and final reader browser refresh with zero console errors. Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\reader-front-real-data-integration-20260727.md`.

- Completed the reading-client responsive UI density pass in `E:\code\trae_workspcae\shuxia\qianduan\shuxia` without changing routes, APIs, data flow, or feature behavior:
  - Added shared layout, spacing, control, touch-target, card-radius, and content-width tokens. At widths up to 1199px, phone and tablet navigation is now a fixed bottom bar with all six existing destinations, safe-area clearance, 56px touch targets, and matching content inset; desktop navigation remains the compact left sidebar.
  - Fixed the home media-card flex cascade that stretched nominal 97px covers to about 163px. Desktop home/library/novel covers use an 82px standard preset with stable aspect ratios; handheld home carousels now preserve 92px reading/audio cards and 96px recommendation cards instead of shrinking every item to fit one row.
  - Long card titles use a stable two-line clamp on phone/tablet, author/speaker text uses a single-line ellipsis, and both expose the complete value through the native title attribute. Reading/audio/recommendation panel heights are scoped to their complete content so progress bars, category labels, ratings, and author names are not clipped; unrelated panels keep their existing height.
  - Library layouts use two columns from 768px through 1199px instead of stacking all six panels. Novel hero/content grids, login, placeholder pages, and both EPUB/PDF readers received matching desktop/tablet/mobile rules.
  - Browser regression covered 1440x900 desktop plus 375x812 phone, 400x844 phone, 600x900 small tablet, 812x375 phone landscape, 834x1112 tablet, and 1024x768 tablet. Home, library, novel, audio, comic, and settings views had no document-level horizontal overflow; media cards had no vertical clipping, and the fixed bottom navigation does not overlap page content. Light/dark navigation and media-card surfaces were both checked.
  - Verification: reading-client `npm run build` passed on 2026-07-26. The dev server remains available at `http://127.0.0.1:5174` (PID 48712). The only build note is the existing Vite large-chunk warning.

- Completed the P2 recoverable batch-scrape checkpoint slice:
  - New `RULE_BATCH_SYNC` submissions persist the parent execution context and every ordered candidate before the asynchronous worker starts. The context includes the rule snapshot, target Storage Management ID, runtime options, attempt number, cursor and aggregate counters.
  - Candidate checkpoints record `PENDING/RUNNING/SUCCESS/FAILED/SKIPPED`, attempt counts, result IDs and errors. Resume keeps prior success/failure results and continues pending work; retry keeps successful items and resets unresolved items on the same parent task.
  - Pause now uses a `PAUSING -> PAUSED` acknowledgement. Task Center enables resume and deletion only after the old worker has stopped, preventing concurrent processing or writes into deleted context. Startup reconciliation also recovers orphaned `RUNNING` and `PAUSING` checkpoints.
  - Recovery revalidates the enabled novel rule and the configured writable novel storage location. Historical batch tasks without persisted context remain `RESUBMIT`; no historical candidates or destination are guessed.
  - The batch API now forwards `storageLocationId`. The Scrape Rules batch dialog consumes only writable novel locations returned by Storage Management, defaults to an eligible registered location, and uses a viewport-bounded dialog width on mobile.
  - Verification passed: 10 targeted backend tests, full 11-module backend package, Docker rebuild and normal startup, frontend production build, live `PAUSING -> PAUSED -> RUNNING -> FAIL` regression, desktop/mobile browser checks with zero console errors, and complete cleanup of test task/context/item/task-log/system-log rows.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\p2-batch-checkpoint-recovery-20260724.md`.

- Completed the P2 task failure-diagnosis and recovery slice:
  - Task responses now expose structured failure category, recovery mode, labels, and an actionable Chinese suggestion instead of forcing the frontend to infer recovery from error text.
  - Paused scrape tasks expose resume only; ordinary failed/terminated tasks expose retry; scheduled failures keep the next Quartz run and also allow immediate retry.
  - Chapter-sync retry/resume is submitted asynchronously, so the task action HTTP request no longer blocks for the full novel scrape.
  - Historical `RULE_BATCH_SYNC` parents without persisted context remain explicitly non-retryable and use `RESUBMIT`. New checkpoint-backed parents are covered by the later batch-checkpoint slice above.
  - Task Center renders diagnosis/recovery fields and the correct resume/retry action. Follow Management exposes recovery actions from the latest task capabilities while successful plans continue to use the existing sync action.
  - Verification passed: 10 targeted backend tests, full 11-module backend package, Docker rebuild/recreate and HTTP 200 startup check, frontend production build, live read-only failed-task contract, and desktop/mobile browser checks with zero console errors and no mobile page overflow.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\p2-task-failure-recovery-20260724.md`.

- Completed the first P2 book-format, novel-source and task-observability reliability pass:
  - MOBI/AZW3 now pass both the Jeecg global upload whitelist and strict PalmDB/Kindle magic validation. They are archive-only formats: upload creates and stores the ebook, but no parser task or `parse` action is exposed.
  - A live MOBI regression verified first upload, duplicate upload and delete cleanup. Counts moved from 10/79 books/files to 11/80, stayed unchanged on duplicate, then returned to 10/79 after cleanup.
  - Read-only URL analysis still parsed the Qimao sample at 911 chapters and the BQG sample at 688 chapters without changing task or storage-file counts.
  - Task statistics now include `MIGRATE`, exclude archive-only files from PARSE work, and deduplicate recent completion logs by task. Task Log filters, pagination and detail now use real backend contracts.
  - Task Statistics charts and tables are data-driven; desktop 1280x720 and mobile 390x844 browser checks had no page-level horizontal overflow and no console errors.
  - Subscription schedule reconstruction now waits until the delayed Quartz startup is complete, avoiding the former `QRTZ_LOCKS` startup race. Login activity recording no longer invokes JWT decoding when the login request has no access-token header.
  - Verification passed: frontend build, five targeted backend tests, full backend package, Docker rebuild/startup, live APIs and browser workflows.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\p2-format-task-reliability-20260724.md`.

- Implemented the first private-NAS storage-location and migration workflow:
  - Storage configuration now defines content scope (`ebook` / `novel` / `both`), a path prefix, write permission, and optional default destination for each domain.
  - The Books upload flow can target a configured local/NAS or MinIO location. It remains a user-owned local/NAS ebook workflow and does not introduce ebook crawling.
  - Novel subscriptions can target a configured storage location. The daily preset is `00:00`; the existing Quartz scheduler remains responsible for execution. New followed chapters are written to the selected location.
  - Books and novels expose a batch `迁移存储` action. The backend copies, verifies, switches the database reference, then cleans the source best-effort. Novel migrations include chapter bodies and update future subscription destinations.
  - Task Center now recognizes `MIGRATE` as `存储迁移`, including progress, detail labels, terminate/retry, and completed-task deletion.
  - Docker deployments must mount each local/NAS host directory and configure the matching container-visible path; host drive letters are not directly available to `jeecg-system-start`.
  - The migration SQL and backend handoff are `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\jeecg-boot-module\sx-book\src\main\resources\sql\sx-book-storage-location-and-migration-20260723.sql` and `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\storage-location-follow-migration-20260723.md`.
  - Verification: frontend `npm run build` and backend `mvn -pl :jeecg-system-start -am -DskipTests package` passed on 2026-07-23. The running Docker service still requires the user-side restart command before API/browser smoke testing.

- Restored real covers in Task Center without changing content acquisition behavior:
  - Unified task list/detail responses now expose `coverUrl` from the task's associated `sx_book.cover_file_id` through the existing `/sx/book/preview` proxy.
  - Task Center list rows and the detail panel render the real cover first, with the existing title-initial placeholder only for unbound tasks, missing covers, or failed image loads.
  - This preserves the product boundary: books continue to come from user-owned local/NAS files, while novels continue to come from web scraping and subscription updates.
  - No SQL migration is required. Frontend production build and backend `:sx-book` compile passed.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\task-center-cover-display-readme.md`.
- Fixed stale progress and invalid controls for Collection Workbench batch tasks:
  - Task Center silently refreshes pending/running rows every 3 seconds and updates the selected task detail without repeated loading overlays.
  - SCRAPE progress now uses processed counts against total candidates and displays `processed/total`; the previous fixed 50% running value was removed.
  - `RULE_BATCH_SYNC` parent tasks expose only cooperative termination while running. Pause, resume, and direct retry are disabled because the batch candidate context is not persisted for recovery.
  - The batch worker checks the parent task before and after candidates and during inter-candidate delays, and no longer overwrites a user-requested `TERMINATED` result during finalization.
  - The reported 七猫 task was not stuck: it failed about 1.6 seconds after submission because the current rule could not parse chapter titles/links. The stale page state caused the misleading `处理中 50%` display.
  - Verification passed: frontend build, `:sx-book` compile, full backend package, Docker rebuild, API action flags, browser auto-refresh from `0/5` to `5/5`, and terminate result `TERMINATED`.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\rule-batch-task-polling-control-readme.md`.
- Completed the task-center mojibake repair across frontend, backend, and historical data:
  - Task Center static labels, filters, table headings, detail actions, and API fallback errors now use clean Chinese; the task-type filter includes `SCRAPE / 刮削任务`.
  - `SxScrapeExecuteService` and the PDF content reader no longer emit the identified mojibake strings into task errors or logs.
  - Historical task, task-log, subscription, and known fixture chapter-title data was repaired by `sx-book-task-mojibake-repair-20260713.sql`; targeted remaining counts were verified as zero.
  - `GET /sx/book/site-setting/public` was restored and explicitly whitelisted as anonymous in `ShiroConfig`.
  - The backend container was rebuilt from the new packaged JAR. The public site-setting endpoint and authenticated task list return clean Chinese.
  - Verification passed: frontend production build, `:sx-book` compile, full `:jeecg-system-start` package, database checks, and browser Task Center checks with no document-level horizontal overflow.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\task-center-mojibake-repair-readme.md`.
- Added a read-only novel URL analysis phase for the Collection Workbench:
  - New backend endpoint: `POST /sx/book/scrape/analyze`.
  - Analysis parses metadata, existing matches, and chapter overview without creating or updating books, sources, rules, subscriptions, or tasks.
  - The workbench now calls `analyze` for preview and only calls `quickSync` after explicit collection confirmation.
  - BQG API-backed hash routes use the existing book/catalog API helpers for read-only chapter counts.
  - No SQL migration is required; existing quick sync, batch sync, subscription, and task APIs remain compatible.
  - Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-url-readonly-analyze-readme.md`.
  - Verification: frontend build, `:sx-book` compile, and full `:jeecg-system-start` package all passed.
- Consolidated the novel collection workflow into a user-oriented automation information architecture:
  - `/automation/collection` is the new Collection Workbench with `单本采集` and `批量采集` views.
  - Single collection accepts novel detail/catalog pages; list-like URLs can switch to batch collection with the URL preserved.
  - Batch collection reuses enabled novel scrape rules as `站点适配`, supports single-page or paginated discovery, candidate selection, and existing batch-sync task submission.
  - `/automation/following` is now the dedicated Follow Management page. The duplicate quick-URL form was removed; bulk enable/disable, selected delete, and delete-all remain available.
  - Primary automation navigation is reduced to `采集工作台`, `追更管理`, and `任务中心`. Rule/channel maintenance remains available as the advanced `采集设置` entry.
  - Legacy `/automation/smart-scrape` and `/automation/subscriptions` routes redirect to the new entry points.
  - It reuses the novel analyze, quick-sync, discovery, batch-sync, subscription, and task APIs only.
  - Verification: `npm run build` passed; browser checks passed on the default desktop viewport and a 390x844 mobile viewport with no document-level horizontal overflow.
- Switched frontend login to `POST /sys/mLogin` and removed the login-page image captcha requirement.
- Logout in the sidebar is now an explicit `退出登录` button and routes back to `/login` after clearing auth state.
- Removed frontend category mojibake fallback so frontend no longer masks backend dirty data.
- Removed resource-library mock data fallback for storage/category/tag pages and verified the category tabs switch with real backend category tree data.
- Removed remaining frontend mock data usage for dashboard, content management, automation, user permission, system settings and log pages.
- Completed the automation module frontend integration pass:
  - Scan rules support backend pagination, filtering, detail drawer, add/edit, enable/disable, delete, and rule debug.
  - Scan channels support backend pagination, filtering, detail drawer, add/edit, enable/disable, delete, and connection test.
  - Task center supports backend summary/list, detail, timeline, and pause/terminate/retry actions.
  - Subscription page loads backend data, refreshes through the explicit backend refresh API, and filters locally by keyword/status.
- Fixed login button hover text visibility.
- Fixed dashboard layout breakage after real data:
  - system status cards have enough width
  - quick operation cards wrap intentionally
  - horizontal overflow and panel content overflow were addressed
- Improved book cover handling:
  - Backend preview/download proxy supports cover and content files.
  - Frontend normalizes backend relative cover URLs using the API base URL.
  - Book list cover now displays when backend returns `coverUrl`.
  - Book detail drawer cover display was adjusted to use normalized cover data.
- Added single-file upload auto-import backend flow:
  - Uploaded EPUB should auto-create a book record.
  - Backend attempts metadata, cover, introduction and chapter extraction.
  - A backend handoff doc exists: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\single-upload-auto-import-readme.md`
- Added local-directory batch import for Books management:
  - Frontend Books page now has a "批量导入" action that opens a browser directory picker instead of asking for a backend-readable absolute path.
  - The selected client-side directory is read through browser file APIs; TXT/PDF/EPUB/MOBI/AZW3 candidates are recognized from `webkitRelativePath`.
  - Frontend auto-matches category per item with a weighted classifier over parent path, relative path, file name, and title; built-in topic keywords/synonyms map titles like `国史大纲`, `中国通史`, `资治通鉴`, and `唐代政治史` to existing categories such as `历史` without requiring a default category selector.
  - Frontend deduplicates same-directory same-book files before upload using normalized titles that remove extensions, leading numbers, source tails, and bracket notes; it keeps the best format with priority `EPUB > PDF > MOBI > AZW3 > TXT`.
  - Batch import now has two-layer duplicate protection:
    - after directory selection, frontend calls `POST /sx/book/import/duplicate-check` with normalized book title plus detected author; rows already present in the library are marked `已存在`, disabled in selection, and excluded from commit by default.
    - backend rechecks at `/sx/book/upload/single` before object storage upload, then parses uploaded EPUB/PDF/TXT metadata before auto-create and rechecks with the final book name/author. `createBook` also rechecks before saving, so direct upload, metadata title changes, or race conditions still skip/block existing books.
  - Batch import now hides raw backend/runtime errors from the UI:
    - if an older running backend does not yet expose `/sx/book/import/duplicate-check`, selection-time duplicate checking silently degrades instead of showing Spring's `No static resource ... duplicate-check` message.
    - if upload hits a transient Snowflake clock rollback (`Clock moved backwards` / `Refusing to generate id`), the frontend waits briefly, retries once, and only shows a short Chinese failure message if the retry still fails.
  - Batch commit uploads each retained file through `/sx/book/upload/single` with `fileType=content`, detected `bookType`, and detected `categoryId`.
  - Backend `SxBookUploadDTO` accepts `categoryId`; content upload auto-create passes it into `createBook` so `sx_book.category_id/category_name` are populated after validation.
  - Backend server-path local import endpoints still exist for service-side import scenarios, and `SxBookLocalImportDTO.Item` still accepts per-item `categoryId`.
  - Handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\local-batch-book-import-readme.md`
- Completed site settings page brand sync:
  - The page is now editable and saves through `/sx/book/site-setting/save`.
  - Saving refreshes the frontend global site settings store so sidebar Logo/name, title, and footer update without page reload.
  - A public backend endpoint `/sx/book/site-setting/public` was added for unauthenticated/global branding reads.
- Automation has one product-facing entry: `/automation/collection` for novel URL analysis and collection. `/automation/rules` and `/automation/channels` remain advanced novel-site configuration pages.
- Novel Sync now treats full-book website sync as a background SCRAPE task:
  - One-click URL sync and row-level sync submit a task instead of waiting for the whole book in the browser request.
  - The page shows a running-task panel, row progress bars, elapsed time, processed/total chapter counts, and a stop action.
  - Backend progress fields are exposed through subscription list/detail VOs.
  - bqglll-style full catalog parsing is restricted to same-book chapter URLs so recommendation links are not imported as chapters.
  - Scope remains Novel Sync only; ordinary Books upload/local-scan import is unaffected.
- Scan Rules "Discover novels" now supports whole-site novel discovery and batch sync:
  - `/sx/book/scrape-rule/discover` accepts single or multiple entry URLs, optional `nextPageSelector`, optional `paginationUrlTemplate`, optional `startPage`, optional `maxPages`, optional `maxItems`, `sameHostOnly`, and request delay.
  - There is no default page or item cap. Empty or `0` max pages/items means unlimited; discovery stops from site/data signals such as no next page, repeated page URL, templated page with no new candidates, request failure, or explicit user limits.
  - The Scan Rules discovery dialog has single-page and whole-site modes, previews discovered candidates, shows scanned page count, and then submits selected candidates through the existing novel sync pipeline.
  - Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-rule-batch-sync-readme.md`
- Auto analysis on Add Scan Source depends on the updated backend package exposing `POST /sx/book/scrape-rule/analyze`.
  - If the UI shows `No static resource sx/book/scrape-rule/analyze`, the running backend jar/container is stale even if the local source contains the controller method.
  - Frontend now normalizes that backend business error to `接口暂不可用，请确认后端服务已更新`.

- BQG hash-route list pages such as `https://*.bqg*.cc/#/` are API-backed.
  - Auto analysis now detects those URLs, calls `/api/sort` or `/api/search`, renders an internal temporary HTML structure, and fills generated selectors plus JSON `remark` with `apiMode=bqg-list-api`.
  - Add/Edit Scan Source keeps that generated `remark` and sends it during debug, so `auto analyze -> debug -> save -> discover novels` stays on the API-backed path instead of re-fetching the empty app shell.
- Task Center batch delete is available:
  - The backend exposes `POST /sx/book/task/batch-delete`.
  - Only completed or failed `SCRAPE`, `TRANSCODE`, `SLICE`, and `LOCAL_SCAN` rows are deletable.
  - `PARSE` rows are not deleted from Task Center because they are derived from book parse state.
  - Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\task-center-batch-delete-readme.md`

## Known Local Commands

Use PowerShell path changes like this, not `cd /d`:

```powershell
Set-Location "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot"
```

Backend package/restart pattern:

```powershell
$BackendRoot = "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot"
$ComposeFile = "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\docker\command\docker-compose.yml"
$env:MAVEN_HOME = "D:\tools\apache-maven-3.9.16"
$env:Path = "$env:MAVEN_HOME\bin;$env:Path"

mvn -f "$BackendRoot\pom.xml" -pl ":jeecg-system-start" -am -DskipTests package
docker compose -f "$ComposeFile" restart jeecg-system-start
docker logs -f --tail 120 jeecg-system-start
```

Run taxonomy SQL safely:

```powershell
$Sql = "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\jeecg-boot-module\sx-book\src\main\resources\sql\sx-book-taxonomy-baseline.sql"
docker cp $Sql mysql:/tmp/sx-book-taxonomy-baseline.sql
docker exec mysql mysql -uroot -p123456 -D jeecg-boot --default-character-set=utf8mb4 -e "source /tmp/sx-book-taxonomy-baseline.sql"
```

Frontend build check:

```powershell
npm run build
```

## 2026-06-20 Shelf Status Note

- Fixed Books page offline/delete status mismatch.
- Backend canonical shelf statuses are `1` online and `2` offline.
- Frontend Books page now sends `2` for single and batch offline.
- Backend `/sx/book/shelf` and `/sx/book/batch/shelf` also normalize legacy request value `0` to `2`.
- Deletion still rejects books with `publish_status=1`; offline first, then delete.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\book-shelf-status-compat-readme.md`

## 2026-06-20 Delete Storage Cleanup Note

- Books are stored in MinIO when uploaded through the normal `/sx/book/upload/single` flow.
- Fixed Books delete behavior so `/sx/book/delete` and `/sx/book/batch/delete` clean the deleted book's bound cover/content `sx_book_file` rows and their MinIO objects when the object is not referenced by another file row.
- Historical orphan objects are not retroactively deleted by this change; use storage orphan cleanup for old leftovers.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\book-delete-storage-cleanup-readme.md`

## 2026-06-20 Storage Orphan Cleanup UI Note

- Storage Management now exposes a `清理孤儿文件` action next to `添加存储`.
- The action confirms before calling `POST /sx/book/storage/orphan/cleanup`, then refreshes storage summary and source list.
- The cleanup result shows the backend `cleanedCount` so users can see how many orphan files were removed in the run.
- The backend cleanup also scans MinIO book prefixes `sx-book/content/` and `sx-book/cover/` for physical objects that no active `sx_book_file` row references. This fixes the case where the frontend orphan count is 0 but MinIO still has historical leftover objects.
- The MinIO cleanup now always includes the book-managed `sx-book` bucket and falls back to Docker-internal MinIO endpoints such as `http://minio:9000` when public/localhost-style config is not reachable from the backend container.
- Cleanup treats temporary `sx_book_file` rows as cleanable when they are not referenced by active books or active file history. History rows for deleted books no longer keep stale temporary files alive.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\storage-orphan-minio-object-cleanup-readme.md`

## 2026-06-20 Storage Source Scan Import Note

- Storage Management local-directory rows expose a scan action in the operation column.
- The action is enabled only for active `local` storage source configs with `localBasePath`.
- Scan flow:
  - confirms the action
  - calls `POST /sx/book/import/local/scan` using the storage source `localBasePath`
  - filters scan results to books and novels
  - calls `POST /sx/book/import/local/commit`
  - refreshes storage summary/source list after commit
- TXT files detected as novel scan items are submitted with `bookType=novel`; backend NAS import now uses the uploaded-content parse eligibility helper so novel + TXT local source can still auto-parse into chapters.
- Existing auto-classify service applies category and tags after NAS/local import.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\storage-source-scan-import-readme.md`

## 2026-06-20 Novel Batch Import Note

- Novel page exposes a `批量导入` action next to `添加小说`.
- The dialog selects a local browser directory, filters TXT files, de-duplicates repeated title/path candidates, runs the existing duplicate pre-check API, and uploads selected files through `/sx/book/upload/single` with `bookType=novel`.
- The frontend attempts a lightweight category match from directory/path/file name and passes `categoryId` when available.
- Backend upload auto-classification remains responsible for final category/tag application, and novel TXT uploads can auto-parse chapters through the shared uploaded-content parse eligibility helper.

## 2026-06-20 Novel Batch Delete Note

- Novel page now enables row selection through the shared `ContentManagementPage` batch toolbar.
- The batch toolbar exposes `批量删除`, confirms destructive action, calls the existing `/sx/book/batch/delete` API, clears selection, closes the chapter drawer when the selected novel was deleted, and refreshes the current page.
- This keeps novel deletion behavior aligned with Books page batch delete while leaving batch shelf actions out until explicitly needed.

## 2026-06-20 Novel Shelf Actions Note

- Novel page row actions now include `上下架` between `章节` and `编辑`.
- Single-row shelf toggles call `/sx/book/shelf` with canonical statuses `1` online and `2` offline, then refresh the current page and the open chapter drawer context when needed.
- Novel batch toolbar now includes `批量上架`, `批量下架`, and `批量删除`, using the same shared `/sx/book/batch/shelf` and `/sx/book/batch/delete` APIs as Books page.

## 2026-06-20 Batch Delete Timeout Note

- Frontend `batchDeleteBooks` now splits large selections into small `/sx/book/batch/delete` chunks and keeps the per-request timeout at 60 seconds.
- Request timeout errors are shown as `请求处理时间较长，请稍后刷新确认结果` instead of the raw Axios `timeout of 15000ms exceeded` text.
- Books and Novel batch action toasts append up to three failed item details from backend `items`, so protected online content shows the actual reason instead of only `失败 N 条`.
- Backend batch delete still runs per-book cleanup synchronously so it can return per-item success/failure details while cleaning chapter content, file rows, and storage objects.

## 2026-06-20 Novel Web Sync Roadmap Note

- Future web-novel crawling/scheduled sync work should follow `E:\code\trae_workspcae\shuxia\qianduan\shuxia-end\docs\novel-web-sync-roadmap.md`.
- Phase 1 target: bind an existing local novel to a user-configured source detail/catalog URL, then manually or periodically sync missing chapters through the existing scrape subscription/task center pipeline.
- Phase 1 practice source: `https://m.bqglll.cc/`, example detail URL `https://m.bqglll.cc/look/104952/`; treat it as a development/practice source only, not an official bundled recommendation.
- Phase 2 target: discover new novels from category/ranking/search/list pages, preview candidates, auto-create missing novel records, apply classification/tags, and create update subscriptions.
- Key backend gaps before Phase 1 implementation: selector `::attr(...)` extraction, charset handling, catalog URL support, content scrubbing to remove ads/boilerplate before storage, max-chapter limits, request throttle, and clearer per-chapter failure logs.
- Key frontend gap before Phase 1 implementation: productize the current update subscription snapshot page into a usable novel sync management page with add/edit/debug/run/log actions.

## 2026-06-20 Novel Web Sync Phase 1 Backend Note

- Phase 1 backend execution foundation has been implemented in the current E盘 backend tree.
- Scrape selector extraction now supports `::attr(name)`, including metadata selectors like `meta[property=og\:novel\:book_name]::attr(content)`.
- Rule debug and subscription execution share the new selector helper for text, cover/media URLs, chapter titles, and chapter URLs.
- Subscription execution now decodes fetched pages by HTTP charset, meta charset, then UTF-8 fallback.
- Runtime options can be configured through rule/subscription `remark` JSON:
  - `catalogUrlSelector`, `catalogUrlTemplate`, `deriveCatalogListHtml`
  - `maxChapters`, `requestDelayMs`
  - `contentRemoveSelectors`, `adRemoveSelectors`
  - `contentLineFilters`, `contentLineRegexFilters`
- Manual `POST /sx/book/scrape/runNow` accepts `maxChapters` and `requestDelayMs` overrides.
- Chapter sync now supports catalog-page parsing, max-chapter limits, per-chapter request delay, content cleanup, suspiciously-short content failure, non-2xx HTTP failure, and per-chapter failure logs with URL.
- Compatibility note: backend default max chapter limit is now unlimited; `maxChapters` only limits runs when explicitly set by advanced/debug flows.
- No SQL migration was added in this slice. Practice source/channel/rule fixtures and real end-to-end sync verification remain next steps.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-web-sync-phase1-backend-readme.md`
- Verification:
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":sx-book" -am -DskipTests compile` passed.
  - Frontend: `npm run build` passed with existing dependency/chunk-size warnings.

## 2026-06-21 Novel One-Click Sync Note

- Product boundary clarified:
  - Normal Books remain user-prepared upload/local-scan imports.
  - Web crawling/scheduled updates belong to Novel Sync and future serial content such as comics.
  - Do not surface web-crawler entry points on the normal Books page.
- Added backend one-click novel URL endpoint:
  - `POST /sx/book/scrape/quickSync`
  - Inputs: `detailUrl`, optional `bookId`, `syncChapters`, `requestDelayMs`, `cronExpr`.
  - Behavior: parse the pasted URL, create/reuse only novel-scoped records, prepare source channel/rule/subscription, then reuse `runNow` for full missing-chapter sync.
- Novel Sync page now has a first-screen URL input panel:
  - paste novel detail/catalog URL
  - set request delay
  - choose sync vs preview
  - open run result and task center after completion
- Existing advanced subscription table/forms remain available under the one-click path for troubleshooting and manual management.
- Verification:
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":sx-book" -am -DskipTests compile` passed.
  - Frontend: `npm run build` passed with existing dependency/chunk-size warnings.

## 2026-06-21 Novel bqglll Full-Catalog Fix Note

- Root cause for the `https://m.bqglll.cc/look/104952/` 17-chapter result:
  - The mobile detail page exposes only a short recent-chapter fragment.
  - The full chapter catalog is available on the `www` detail page for the same path.
- Backend one-click novel sync now derives mobile `m.` catalog parsing to the `www.` host while preserving the path.
- The practice source example was verified externally:
  - derived catalog URL: `https://www.bqglll.cc/look/104952/`
  - real chapter links after filtering expand/control anchors: `688`
  - first link: `https://www.bqglll.cc/look/104952/1.html`
  - last link: `https://www.bqglll.cc/look/104952/688.html`
- Auto-created one-click rules now use `dd:not(.more) a` and filter non-content URLs such as `javascript:` so the expand link does not shift chapter title/link pairing.
- For the practice source,正文 fetching can use the site's chapter JSON API when a source book id is parsed from the detail page. The API returned正文 and `cs=688` for the example.
- No max chapter cap is applied by default; full-book missing-chapter sync is the normal one-click path. `maxChapters` remains only for explicit advanced/debug overrides.
- User-provided website credentials must not be stored in code, docs, rule remarks, or fixtures. Current verification did not require website login.
- Backend handoff doc updated: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-web-sync-phase1-backend-readme.md`
- Verification:
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":jeecg-system-start" -am -DskipTests package` passed.

## 2026-06-21 Novel bqg Hash-Route Repair Note

- Root cause for `Could not parse query 'a::attr(href)'`:
  - Auto-generated chapter URL selector used comma-separated `a::attr(href)` branches.
  - The selector helper only supported one terminal `::attr(...)`, so Jsoup saw an invalid CSS selector.
- Backend fix:
  - New auto rules use plain CSS chapter link selectors.
  - Legacy comma-separated per-branch `::attr(...)` selectors are now normalized by `SxScrapeSelectorSupport`.
- Root cause for `https://a830aa480783925d254.bqg907.cc/#/book/113680/` not producing a full catalog:
  - The URL is a JS hash route; server-side HTML fetch returns the app shell, not the book catalog.
  - The site exposes real data through `/api/book`, `/api/booklist`, and `/api/chapter`.
- Backend fix:
  - Quick sync extracts book id `113680` from the hash route.
  - bqg API mode now loads `/api/booklist` for the full catalog and `/api/chapter` for content.
  - External check for this URL returned 688 catalog entries.
- Local DB repair:
  - Auto rule selectors were updated to plain CSS.
  - Existing bqg907 rule remark was compacted to fit `sx_scrape_rule.remark varchar(500)` and now has `chapterContentMode=bqg-api`, `chapterApiBookId=113680`, `chapterApiDirId=113680`.
- Backend handoff doc updated: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-web-sync-phase1-backend-readme.md`
- Verification:
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":jeecg-system-start" -am -DskipTests package` passed.

## 2026-06-21 Novel bqg Runtime Verification Note

- The hash-route URL `https://a830aa480783925d254.bqg907.cc/#/book/113680/` was verified against the rebuilt local backend.
- `POST /sx/book/scrape/quickSync` with `syncChapters=false` returned clean data:
  - book: `机武风暴`
  - author: `骷髅精灵`
  - chapter count: `688`
  - latest chapter: `第689章 第三纪元天启时代 （终章）`
- Backend now archives same-URL duplicate failed subscriptions before logic delete, avoiding the `uk_sx_scrape_subscription_user_book_source` collision that previously kept old failed rows visible.
- The active subscription row now has:
  - `last_sync_status=success`
  - `last_sync_message=title=机武风暴; author=骷髅精灵; chapters=688; latest=第689章 第三纪元天启时代 （终章）`
- The ordinary Books page remains out of scope; these changes are in the Novel Sync scrape path only.
- Verification:
  - Backend package: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":jeecg-system-start" -am -DskipTests package` passed.
  - Docker rebuild/restart: `docker compose -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\docker\command\docker-compose.yml" up -d --build jeecg-system-start` completed.

## 2026-06-22 Novel Quick Sync Cover Note

- Root cause for quick-synced novels showing generated template covers:
  - One-click novel sync parsed a remote `coverUrl`, but book creation only persisted `cover_file_id`.
  - Because no remote cover file was downloaded/inserted before `createNovelBook`, normal book creation generated a local template cover.
  - For bqg hash-route domains, fallback cover URL derivation also needed to normalize random app-shell subdomains to the root `www.bqg*.cc` image host.
- Backend fix:
  - `SxNovelQuickSyncService` now downloads the parsed remote cover, validates image bytes/types, uploads it through the existing OSS/MinIO cover path, inserts an `sx_book_file` cover row, and passes that file id into novel creation.
  - Existing quick-sync novels with generated `*-template-cover.svg` can replace that template with the real remote cover on the next quick sync; manually maintained non-template covers are not overwritten.
  - Backend handoff doc updated: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-web-sync-phase1-backend-readme.md`
- Verification:
  - External probe confirmed `https://www.bqg907.cc/bookimg/113/113680.jpg` returns HTTP 200 `image/jpeg`.
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":sx-book" -am -DskipTests compile` passed.

## 2026-06-22 Scan Rule Novel Batch Sync Note

- Scan Rules can now drive Novel Sync discovery/import:
  - `POST /sx/book/scrape-rule/analyze` fetches a supplied page URL server-side and returns candidate request config plus selectors for list/title/author/intro/cover/chapter/content fields.
  - `POST /sx/book/scrape-rule/discover` previews novel candidates from an enabled `bizType=novel` rule.
  - `POST /sx/book/scrape-rule/batchSync` submits a server-side serial batch sync task.
- Add/Edit Scan Source now has auto-analysis actions in the request config section and side action area; it uses debug URL, then list URL, then base URL, and fills only currently empty fields so manual selectors are preserved.
- Auto-analysis is a candidate generator rather than a final guarantee; the expected flow is paste URL, auto-analyze, then run scan-source debug before saving.
- Discovery convention:
  - `listSelector` selects repeated novel items on the list page.
  - `titleSelector`, `authorSelector`, `introSelector`, and `coverSelector` are extracted inside each item.
  - detail URL priority is explicit `detailUrlSelector`, then rule `chapterUrlSelector`, then the item/first link.
- Batch sync creates a parent `SCRAPE` task with `executeMode=RULE_BATCH_SYNC` and reuses one-click Novel Sync per candidate, so channel/rule/book/subscription creation and chapter storage stay on the existing Novel Sync pipeline.
  - Batch parent tasks now fill legacy non-null `sx_scrape_task.subscription_id` with a synthetic `batch-{taskId}` value, fixing submit-sync failures such as `Field 'subscription_id' doesn't have a default value` when testing sources like 七猫.
  - Rule-batch background execution now preserves the application class loader on the worker thread, fixing candidate failures where Quartz reported it could not find `org.jeecg.modules.quartz.job.SxScrapeSubscriptionJob`.
  - Rule-batch candidate preparation no longer creates an extra preview scrape task for each discovered candidate, so future batches should not show paired success/failure rows for the same book in Task Center.
  - Rule-batch quick sync now forwards discovered title/author/intro/cover metadata, reducing numeric-ID book names when a site's detail page is JS-heavy but the list page already exposed readable metadata.
  - Rule-batch now stops early on `Current rule did not parse syncable chapter titles and links` and records a clear rule-level error. 七猫 can be discovered as a list source, but chapter sync still needs working chapter selectors or a dedicated site adapter/API path.
  - Existing historical failed tasks remain visible until the user clears completed tasks; the reduced-noise behavior applies to new batches after backend restart.
- `SxCurrentUserSupport` now has a scoped `runAs/callAs` user override so background batch work can preserve the submitting user's ownership/audit context.
- Scan Rules page row/detail actions now include `发现小说`; the dialog uses the saved rule configuration directly, auto-discovers candidates on open, and keeps selector/list URL editing in the existing Add/Edit Rule page.
- Add/Edit Rule now exposes only the `基础信息` top tab; request config and field selectors remain as sections on that page instead of duplicated top-level tabs.
- The frontend now treats rules + template binding as a soft-merged `扫描源管理` experience: `/automation/rules` is the main scan-source list, `/automation/channels` is labeled `连接模板配置`, and route titles use the scan-source/template wording while backend rule/channel tables remain separate.
- `连接模板配置` has a top action `返回扫描源` that routes back to `/automation/rules`, so the template page is clearly a child of scan-source management; its create action is labeled `新增连接模板` to distinguish it from `添加扫描源`.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-rule-batch-sync-readme.md`
- Verification:
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":sx-book" -am -DskipTests compile` passed.
  - Frontend: `npm run build` passed with existing Rolldown pure-annotation and chunk-size warnings.

## 2026-07-13 Novel Subscription Batch Status Note

- Novel Sync now exposes an `一键启停` menu in the filter bar for enabling or disabling all subscriptions matching the current keyword/status filter.
- The subscriptions table now supports row selection with `批量启用` and `批量停用` actions.
- The subscriptions table also supports `批量删除` for selected rows, and the filter bar exposes `全部删除` for every subscription matching the current filter.
- `全部删除` requires typing `删除全部` before the request is submitted.
- All bulk operations require confirmation and show loading/result feedback.
- Backend endpoint: `POST /sx/book/subscription/batch-change-status`.
- Backend deletion endpoint: `POST /sx/book/subscription/batch-delete`.
- The endpoint supports explicit subscription IDs or all current filter matches, remains scoped to the current user, and synchronizes every processed subscription's Quartz schedule.
- Batch deletion removes subscription records and Quartz schedules only; books, chapters, and historical task records are retained.
- No SQL migration is required.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-subscription-batch-status-readme.md`.
- Verification: frontend `npm run build`, backend `:sx-book` compile, and desktop/narrow browser layout checks passed.

## 2026-07-14 Qimao Adapter And Task Control Verification

- Added a dedicated Qimao API adapter for book metadata, full chapter catalogs, signed chapter-content requests, and content decryption.
- Qimao Quick Sync no longer depends on WAF-protected page HTML and no longer falls through to the unrelated BQG adapter.
- Real URL verification for `https://www.qimao.com/shuku/1672986/` resolved the correct title/author, found 911 chapters, and stored readable UTF-8 chapter text.
- A limited run completed with 3 added chapters and 0 failed chapters.
- Task Center refreshes the latest task state before pause/terminate/retry and shows paused/terminated tasks with their semantic status and actual processed percentage.
- Browser verification confirmed live progress, a successful pause action, and correct final task details/timeline.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\qimao-api-adapter-readme.md`.
- No SQL migration is required.

## 2026-07-14 Task Center Batch Delete Contract Fix

- Root cause: `SxTaskBatchDeleteDTO` reused `SxTaskActionDTO`, so validation incorrectly required `tasks[*].action` for delete requests.
- Batch delete now uses a dedicated task reference DTO with only `taskType` and `taskId`.
- The backend package and Docker image were rebuilt.
- A real SCRAPE batch-delete call returned `result=1`; the selected verification task became logically deleted and disappeared from normal task queries.
- No SQL migration is required.
- Task Center now also provides `全部删除` for all deletable tasks matching the current keyword/type/status filters, not only the selected page.
- The destructive action requires entering `删除全部`; pending, processing, and non-deletable parse rows are retained automatically.
- Backend all-matched deletion was verified against a unique SCRAPE filter and removed both the task record and its remaining legacy logs without deleting unrelated tasks.

## 2026-07-23 Configurable Storage Path And Capacity Note

- Storage Management now uses one shared add/edit dialog for local directories and MinIO instead of separate add and generic edit forms.
- Local storage paths can be typed or selected from directories visible to the backend process. The page can explicitly test readability/writability and shows the containing volume's total, used, and available bytes.
- The backend exposes root/mount discovery, child-directory browsing, and path probing under `/sx/book/storage/path/*`.
- Saving an enabled local source now validates the path server-side. Writable sources must pass an actual temporary-file create/write/delete test; read-only sources must exist and be readable.
- Storage config rows now carry live path status and physical volume statistics. The summary deduplicates multiple paths on the same volume.
- Unknown capacity is no longer normalized to `0 B`. MinIO physical capacity remains unknown unless a separate infrastructure monitoring integration is added; the ordinary S3/MinIO bucket API does not expose host disk capacity.
- Docker boundary remains explicit: the page can select only paths already mounted into the running backend container. A new host/NAS path still requires a Compose volume mapping and container recreation before it becomes selectable.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\storage-path-configuration-capacity-20260723.md`.
- No SQL migration is required.
- Verification completed: frontend production build, backend `:sx-book` compile and full `:jeecg-system-start` package, desktop 1280x720 and narrow 390x844 browser checks. The rebuilt container and live storage APIs were verified on 2026-07-23; see the P0 runtime results below.

## 2026-07-23 Admin Scope And Storage Contract Note

- The management frontend scope is documented in `docs/admin-system-development-plan.md`; the user-facing reader is a separate existing project and is integration-only here.
- Books are local/user-upload only. The old book/Douban web acquisition UI and frontend API helpers are removed; the compatibility route redirects to the novel Collection Workbench.
- Managed scrape rules and connection templates now accept only `bizType=novel` for create/edit. Historical rows remain queryable for cleanup.
- Storage Management is the single source of storage choices for Books upload/directory import, Novel local import, single/batch novel collection, subscriptions and migrations.
- Local/NAS scan commit now sends and validates `storageLocationId`; uploaded content uses ebook/novel scope according to the detected type.
- Parsed book covers and downloaded novel covers follow the selected content storage. Novel chapters continue to use the subscription's selected storage.
- Referenced storage cannot be deleted or have its physical connection/path changed before migration. Administrators may still disable it or make it read-only to stop new writes.
- Migration identifies local/NAS sources by `storage_source_id` and retains legacy `local-path` compatibility.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\admin-scope-storage-contract-20260723.md`.
- P0 runtime verification completed on 2026-07-23:
  - Executed `sx-book-storage-location-and-migration-20260723.sql`, rebuilt the Docker image, and recreated `jeecg-system-start`.
  - Registered `minio:sx-book` as the ebook default and `minio:novel` as the novel default. Invalid Windows paths that are not mounted into the container are excluded from eligible destination APIs.
  - Verified synthetic MinIO->local and local->MinIO migrations, including database reference switching, byte-size checks, source cleanup, and test-data cleanup.
  - Verified a real book upload wrote content to `sx-book`; verified one-click novel sync bound its subscription to `minio:novel`, wrote one chapter plus cover to the `novel` bucket, and produced a successful scrape task.
  - Quick Sync now validates five-part Cron input before creating books, channels, rules, covers, subscriptions, or tasks. A rejected six-part Cron left zero database rows and zero MinIO objects.
  - Deleting a book now logically deletes its chapter rows after removing chapter content, preventing active orphan chapter records.
  - Added `sx-book-storage-reference-backfill-20260723.sql` for the explicitly confirmed local mapping: active files physically in `sx-book` bind to `minio:sx-book`, and active subscriptions without a destination bind to `minio:novel`. The script does not move content or touch deleted rows.
  - All synthetic upload, scrape, migration, rule, source, subscription, task, log, file, and object data used for verification was removed.

## 2026-07-23 P1 Permission And Settings Closure

- Frontend authorization is now driven by the permission codes returned for the logged-in user:
  - navigation entries declare required permissions and are filtered centrally;
  - route metadata uses the same permissions and unauthorized direct navigation renders the 403 page;
  - page and row actions are hidden or disabled using the same permission codes;
  - the backend remains the final authorization boundary through Shiro annotations.
- Dedicated role baselines are available:
  - `admin` manages the whole administration system;
  - `sx_content_manager` manages content, novel collection, subscriptions and task actions, while storage infrastructure and system settings remain outside its scope;
  - `sx_readonly_auditor` can inspect content, storage summaries, tasks, logs and settings without write operations.
- Storage, subscription, scrape execution and migration endpoints now use specific operation permissions rather than one broad write permission.
- Role Permission uses the real backend permission tree and save endpoint. User Management no longer exposes decorative row actions that have no backend contract.
- Reader defaults now use `/sx/book/reader-setting/detail` and `/save`; security and notification settings also use real save flows. The reader frontend remains a separate existing project and is integration-only.
- Dashboard welcome text uses the current user. Quick actions are shown only when their destination/action is implemented and the user owns its permission.
- Local runtime verification covered all three roles, direct-route 403 handling, storage operations, subscription actions and read-only settings controls.
- SQL migration order and backend handoff are documented in `docs/p1-permission-settings-handoff-20260723.md` under the canonical E-drive backend repository.

## 2026-07-24 P2 Controlled Fixture And Idempotency Closure

- P2 book/novel reliability is complete. Books remain local/user-upload only; the controlled web fixture exercises only the Novel Sync path.
- Added reusable backend fixtures:
  - `scripts/p2-novel-fixture-server.mjs` serves deterministic success and recoverable-failure novels, chapters and covers.
  - `scripts/p2-novel-batch-acceptance.ps1` validates success, partial failure, same-parent recovery, checkpoint replay prevention, repeated submission and cleanup through real APIs.
- The final run `p21784866238` passed with 3 novels, 5 chapters, zero duplicate books/subscriptions/chapters and zero successful-checkpoint replays.
- The acceptance cross-checked Task Center, novels, subscriptions, chapters, storage summary and the selected `novel` storage row. A two-book success batch increased storage counts by 6 (2 covers + 4 chapter files).
- Cleanup left zero active fixture books, subscriptions, tasks, batch items, chapters and files. The MinIO `novel` bucket returned to `0 B / 0 objects`.
- Fixed a real idempotency defect found by the fixture: quick sync and manual channel creation now restore a logically deleted same-code channel instead of colliding with `uk_sx_scrape_channel_code`.
- Storage deletion/change protection and storage file counts now include managed chapter paths in `sx_book_chapter.content_path`.
- Legacy chapter paths without `storage://{locationId}/...` remain visible in global content counts but cannot be attributed to a configured source without an explicit migration/backfill; runtime code must not guess their location.
- Verification completed:
  - forced backend tests: 10 passed, 0 failed/errors/skipped;
  - full 11-module backend package: passed;
  - Docker image rebuild/container recreation and backend login: passed;
  - frontend `npm run build`: passed with existing dependency annotation and chunk-size warnings.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\p2-controlled-fixture-idempotency-20260724.md`.

## 2026-07-25 Admin Management Closure And Test Baseline

- User Management now supports real keyword/status/author filtering, pagination, detail inspection and freeze/unfreeze operations. The page labels `lastReadTime` as recent reading and no longer presents membership as a role or reading activity as login activity.
- Operation Log now supports real filtering, pagination, detail inspection, CSV export and retention-limited cleanup. Fields not present in the backend contract, including fabricated success state and IP address, were removed.
- Notification Settings now manages channels, rules and templates and supports template test sending. This closes configuration administration only; business-event dispatch is not considered active until each business module explicitly consumes the rules.
- Dashboard quick actions now preserve backend permission/API metadata. Subscription update and runtime snapshot execute real endpoints; storage cleanup navigates to Storage Management for its existing destructive confirmation; collection routes to the real workbench.
- The old “system backup” label is now “runtime snapshot”. It remains a homepage overview JSON and is not a database/content backup or restore mechanism. The old endpoint path and return field names are retained for compatibility.
- Browser regression exposed a dashboard failure when a long task error exceeded `sx_dashboard_notice.description`. Notification candidates are now normalized to the database column limits before comparison and persistence, using Unicode-safe truncation so the dashboard aggregation is not taken down by one long message.
- Dashboard system status is consolidated into four compact groups: core services, storage links, content/tasks and host resources. The three middle modules remain equal-height on desktop; hover or focus exposes every original backend value in a full detail popover, including touch-width layouts, without page-level horizontal overflow.
- Frontend automated testing now uses Vitest. `npm test` passed 1 file / 4 tests; `npm run build` passed with only the existing dependency annotation and chunk-size warnings.
- Backend `:sx-book` package completed with all 9 reactor modules successful. Handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\admin-management-closure-runtime-snapshot-20260725.md`.
- Browser checks passed for desktop user/log/notification views and their real data. A shared table-width constraint now keeps the page viewport stable on narrow screens while wide tables scroll only inside their own container.
- This closure phase originally stopped before container deployment. The later P4 notification deployment rebuilt the same startup image, so the dashboard long-notice fix is now also present in the running local container.
- The root `.gitignore` `logs` rule previously hid the source directory `src/pages/logs/`. A scoped exception now keeps runtime logs ignored while allowing the operation-log page to be versioned.

## 2026-07-25 P4 Task Notification Event Dispatch

- The first explicit notification producers are now limited to `task.completed` and `task.failed`. Pause, terminate, resume and retry administration actions do not emit false failure events.
- Task log commit creates idempotent rule/channel/receiver dispatch rows. Actual delivery runs after commit on a bounded executor, and a 30-second pending scan provides restart/failure compensation without rolling notification errors into the original task.
- Rule saving now rejects unsupported event codes, disabled templates, missing/disabled channels and missing/frozen custom receiver users. The frontend event selector consumes the backend event catalog instead of accepting guessed codes.
- Notification Settings now includes dispatch status filtering, payload/error detail and guarded manual retry. Successful or currently processing records cannot be retried.
- Migration `sx-book-notify-event-dispatch-20260725.sql` creates the dispatch table, two enabled task templates and dispatch permissions. It intentionally creates no notification rules, so deployment cannot start sending messages until an administrator explicitly configures a rule.
- Backend targeted tests passed 4/4 and frontend tests passed 5/5. Frontend production build and the logged-in desktop notification-page check passed without page-level horizontal overflow.
- The local Docker environment is now migrated and rebuilt. `/notify-setting/dispatch/list` is live, the rebuilt OpenAPI endpoint returns 200, and MySQL, Redis and MinIO remain healthy.
- Live acceptance covered the complete success/failure/retry sequence: an empty local-directory scan produced a successful system notification; a disabled temporary channel produced a persisted failure; re-enabling it and retrying from the page succeeded with the attempt count increasing from 1 to 2.
- A real scheduled scrape for `玉奴娇` completed while the temporary rule was active and entered the same task event path. Its task and 911 chapters were preserved. All temporary rules, channels, storage, scan logs, dispatch rows and test messages were removed afterward, leaving zero active task notification rules and no automatic message behavior.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\p4-notification-event-dispatch-20260725.md`.

## 2026-07-26 P5 Release Regression Baseline

- P0-P4 were regressed as one administration system without adding new content domains. Books remain local/upload-only, novels remain network collection/subscription content, and Storage Management remains the only destination registry.
- Storage references are consistent: one valid default exists for each ebook/novel scope; active subscriptions and managed files have zero dangling configured-storage references.
- Controlled novel acceptance run `p21785033551` passed with 3 novels, 5 chapters, zero duplicate books/subscriptions/chapters and zero successful-checkpoint replay. Its generated task/context/log rows were cleaned by exact IDs without touching real tasks.
- Added backend `scripts/p5-role-contract-acceptance.ps1`. It verified 108 content-manager and 60 readonly-auditor permissions, four real read endpoints per role and three protected write denials; temporary users and role links were fully removed.
- Task summary/list, task-log, notification dispatch and event catalog APIs were cross-checked. The only notification events remain `task.completed` and `task.failed`; active rules and dispatch rows remain zero.
- A restart snapshot covered storage, subscription Cron/destination, Quartz triggers, notification counts, reader/site/security settings and content counts. `jeecg-system-start` returned to HTTP 200 with an identical snapshot and exactly one subscription trigger.
- Logged-in browser checks covered Storage Management, Task Center, Follow Management, Books and Notification Settings. Book batch import offered only `sx-book (MinIO)` and subscription edit showed `novel (MinIO)`. Task covers rendered from real content.
- Task Center detail logs now wrap long English text and URLs; the detail panel has no horizontal overflow. The batch selection summary and delete actions remain separated into distinct toolbar groups.
- Verification passed: frontend Vitest 5/5, frontend production build, full 11-module backend package, Docker restart persistence and browser data/layout checks.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\p5-release-regression-baseline-20260726.md`.

## 2026-07-26 Reader Category Visibility ACL

- User Management now distinguishes configurable reader accounts from administrators and management-only accounts. Only administrators can open the content-visibility editor.
- An administrator can blacklist ebook and novel category nodes for one reader account. Parent selections apply to every descendant, while accounts without rules retain the existing all-visible behavior.
- The reader-facing backend now enforces the same rule across discovery, category navigation, detail/catalog/chapter access, search/ranking, related content, bookshelf, history, progress, download records, previews, downloads, comments and payment entry points.
- Direct access to restricted content returns the generic unavailable response. Reader clients must not implement an independent interpretation of category rules; the backend remains the final visibility boundary.
- Historical purchase orders remain available as financial records, but cannot be used to reopen restricted content. Management comment auditing remains an administrator-wide function.
- Migration: `sx-book-user-category-visibility-20260726.sql`. Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\reader-category-visibility-20260726.md`.
- Core backend visibility tests passed 4/4 and frontend Vitest passed 5/5. Frontend production build and the full 11-module backend package passed.
- The local database migration, image rebuild and container recreation are complete. OpenAPI returned HTTP 200; the two management permissions exist only on `admin`, and no default reader deny rules were created.
- Reversible reader API acceptance proved that denying the novel `玄幻` category simultaneously filters list/detail/catalog/chapter/bookshelf access and that restoring the empty rule set restores access. Temporary publication and bookshelf changes were restored.
- Browser acceptance passed on `1280x720` and `390x844`: only reader accounts receive the action, the real category trees load, checkbox counts and “全部可见” work, the dialog footer remains visible, and the console is clean.

## 2026-07-26 Global Admin UI Responsive Audit

- The administration frontend completed a full layout audit across 21 primary routes at 1440px, 842px and 390px viewports. Wide data tables remain internally scrollable, while every audited page now keeps page-level horizontal overflow at zero.
- Shared page actions wrap on narrow screens instead of hiding commands behind a horizontal scrollbar. Shared metric grids use two compact columns on normal phone widths and fall back to one column only on very narrow screens.
- The Task Log grid no longer lets its 1120px table widen the filter bar or document. Shared mobile filters, pagination, content batch toolbars, configurable footers and fixed-width Element Plus dialogs/drawers now stay within the visible viewport.
- Dashboard recent tasks/connections/notifications and Scrape Rules truncated fields expose their complete backend text through hover titles; existing content-table titles and internal table scrolling remain unchanged.
- Verification passed: frontend Vitest 5/5, frontend production build, a real 620px Novel dialog constrained to 366px at a 390px viewport, and 42 responsive route combinations with no page-level overflow.

## 2026-07-27 Reader Real Data Integration

- The separate reader application at `E:\code\trae_workspcae\shuxia\qianduan\shuxia` now consumes real backend data for login, home, book/novel lists, search, detail, catalog, bookshelf, settings, EPUB/PDF/text reading, history and progress.
- The administration frontend remains management-only. Books remain local/NAS upload or folder-import content; novels remain administrator-collected network content. Audio and comic remain placeholders and are not part of this implementation.
- Reader discovery honors online status and the server-enforced category visibility ACL. Configured homepage rows can no longer expose missing or unpublished records.
- Reader covers and protected ebook/PDF files now use backend proxy endpoints rather than internal MinIO URLs. Authenticated readers send `X-Access-Token` for protected preview and download requests.
- A real progress-save failure was found during browser acceptance: a logically deleted bookshelf row collided with the unique user/book key. Manual shelf addition and progress auto-shelving now restore that row instead of inserting a duplicate.
- Verification passed: 3 targeted backend tests, the full 11-module backend package, Docker image rebuild/container recreation, reader production build, and real desktop/mobile/tablet browser flows. The tablet viewport had no page-level horizontal overflow and no console errors.
- Temporary publication, history and progress data used for acceptance were fully restored. The database currently has no published ebook or novel among those fixtures, so reader empty states are expected until an administrator publishes real content.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\reader-front-real-data-integration-20260727.md`.

## 2026-07-27 Reader EPUB Sandbox Compatibility

- The reader keeps epub.js scripted content disabled. User-uploaded EPUB documents continue to render in sandboxed iframes without `allow-scripts`; do not enable it merely to suppress browser console messages.
- The real Red Star EPUB fixture was scanned across all 80 HTML/XHTML/JS entries and contains no script elements, unload handlers or `javascript:` URLs. The repeated `about:srcdoc` script blocks seen with the `Dual Screen Linker` browser extension are third-party extension injection attempts being correctly rejected by the sandbox, not book or application scripts.
- `epubjs@0.3.93` still registers deprecated anonymous `unload` listeners in both view managers. A reproducible `patch-package` patch removes those listeners; Vue's existing unmount path remains responsible for destroying the rendition and book. `npm install` reapplies the patch through `postinstall`.
- Reader production build passed after the compatibility patch. The existing bundle-size warning remains unchanged.

## 2026-07-27 Reader Exit And Scroll Lifecycle

- EPUB navigation no longer performs a progress flush both in the button handler and again in the route guard. EPUB, PDF and text readers now share one bounded exit flush: progress saving still starts before route completion, but a stalled index generation or request can delay navigation by at most 800 ms.
- EPUB and PDF readers now snapshot the existing `html` and `body` horizontal/vertical overflow styles before applying reader mode and restore all four values on unmount. Reader teardown must never assign a new global `hidden` value because that disables scrolling on Home and Library after navigation.
- A direct lifecycle check covered a never-settling save, concurrent flush coalescing and exact host-style restoration. Reader production build passed with only the existing bundle-size warning.

## 2026-07-27 Reader PC Home Alignment

- The reader home now follows the confirmed desktop information hierarchy: compact top controls, side-by-side continue-reading/listening panels, a single-row recent-update strip, four content-domain entry cards and a single-row recommendation strip.
- Book, novel, audio and comic remain stable visual domains. Audio and comic currently expose zero-count entry cards and formal `暂无相关书籍` states; no audio/comic API, storage rule or processing behavior was inferred or implemented.
- Recent Updates and Popular Recommendations share one reusable domain-tab control. The book and novel tabs filter real `bizType` data, while unintegrated domains stay empty instead of reusing unrelated records.
- Desktop-only layout rules start at 1200px. Existing tablet and phone bottom navigation, horizontal card scrolling and touch sizing remain unchanged.
- Long recent-update titles, chapters and category labels truncate safely and expose the complete value through the native hover title. The reader production build passed, and the existing development server returned HTTP 200 on port 5174.

## 2026-07-27 Reader Bookhouse PC Dashboard Alignment

- The reader Bookhouse route now uses a dedicated dashboard instead of the generic content-list composition. Its desktop hierarchy follows the approved reference: bookshelf and seven-day reading summary, category discovery and configured recommendations, then latest arrivals and reading insight.
- Every displayed value comes from the existing reader APIs: published ebook totals, ebook bookshelf records, seven-day read duration/days/books, category counts, configured recommendation sections, latest portal records, history count and download count. Unsupported preference scores, ratings and category-reading percentages were not fabricated.
- Category selection updates the latest-book view through the real portal request. The complete category/sort/pagination browser remains available as an expandable section, so visual alignment does not remove the existing discovery workflow.
- The Home and Bookhouse routes now share one `home-layout--wide` desktop shell for sidebar, topbar and content spacing. Tablet and phone layouts continue to use the shared bottom navigation and responsive single/two-column fallbacks.
- The reader production build passed with only the existing bundle-size warning, and the running development service returned HTTP 200 for `/library` on port 5174.

## 2026-07-28 Reader Novel PC Dashboard Alignment

- The reader Novel route now uses a dedicated dashboard aligned with the approved desktop reference: a novel channel hero and reader bookshelf, a full-width recommendation strip, then latest updates, configured recommendations, categories and reader statistics.
- All rendered values continue to come from the existing reader APIs. The page does not fabricate ratings, completion counts or novel-specific statistics that the backend does not provide; the four statistics are labelled according to their actual account-level contracts.
- The novel product boundary is unchanged: the reader only displays administrator-collected, synchronized and published novels. Collection, subscription and source configuration remain management-side responsibilities.
- Recommendation tabs use the real `recommend` and `latest` sort contracts. Category shortcuts and every "view all" action retain access to the complete category/sort/pagination catalog instead of replacing the existing discovery workflow.
- Desktop uses the shared fixed sidebar and independently scrolling content shell. At narrower desktop widths the four lower panels become a stable two-column grid; tablet and phone keep the shared bottom navigation and collapse the dashboard without page-level horizontal overflow.
- Empty bookshelf, recommendation and update areas remain explicit because the current database has no published novel visible to this account. No placeholder novel records were introduced.
- Reader production build passed with only the existing bundle-size warning. Browser acceptance at `1280x720` covered layout dimensions, independent scrolling, recommendation sorting, the expandable full catalog and a clean console.

## 2026-07-28 BQG One-Time Batch Acceptance

- The management collection workbench submitted a one-time BQG metadata batch for 20 candidates. Task `f422be22b4c642fe855ab021005140d7` completed 20/20.
- Reader validation exposed two backend/source defects before release: shared-rule BQG book IDs could cross-contaminate batch members, and the currently configured `apibi.cc` / `apiqu.cc` / `apige.cc` API mirrors returned injected chapter bodies. This finding applies to those mirrors, not to the target BQG website as a whole.
- The backend now derives the API book ID from each subscription detail URL, rejects the observed high-specificity pollution markers before storage, and fails a chapter task when every attempted fetch fails with no readable local chapter.
- All affected chapters were removed from the active dataset. The original 20 subscriptions remain: 1 verified novel is enabled/online with 1,575 readable chapters; 19 are disabled/offline with 0 active chapters. Temporary replacement/test candidates were deleted.
- The reader novel page, detail, catalog, chapter 1, next chapter and return navigation passed for the verified novel with no application console errors. The requested 20-readable-novel result remains blocked by the configured API-mirror content; the next source step is a real-site page adapter or a verified clean API contract, followed by re-collection of the 19 metadata-only records.
- The Novel dashboard now keeps shelf rows full-width, left-aligns sparse recommendation results, separates trend charts from statistic text, and reserves enough height for complete recommendation cards. Browser acceptance at `1280x720`, `768x1024` and `400x800` found no horizontal page overflow, card clipping or application console errors.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\bqg-batch-content-acceptance-20260728.md`.

## 2026-07-28 Scrape API Endpoint Management

- Compatible novel API mirrors are no longer Java constants. Each scrape rule now owns an ordered, persisted `apiEndpoints` list maintained from the management-side Station Adapter form.
- Administrators can add, remove, enable, disable and reorder endpoints, and test each endpoint before saving. The inline test reports candidate count and latency without creating content or tasks.
- Discovery, one-time collection, quick sync and scheduled subscription execution all read the same saved rule configuration. An API-compatible rule with no enabled endpoint now fails with a configuration message instead of silently using a hidden fallback.
- Multiple BQG-like sources remain separate scrape rules. Adding a third or later source is a management operation: create a rule, configure its own site URLs/selectors/endpoints, then reference it from collection and subscription flows.
- Migration `sx-book-scrape-rule-api-endpoints-20260728.sql` has been applied locally. The two existing BQG rules each have three ordered endpoints; all three passed the management-page test with 150 candidates.
- The backend container was rebuilt and recreated, six focused backend tests passed, and the frontend production build passed. Browser acceptance covered save/reload persistence, medium-width no-overlap layout and a clean management console.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\scrape-rule-api-endpoints-20260728.md`.

## 2026-07-29 Scrape Task Order, Pause Stability And BQG Fallback

- `玉奴娇` now has a validated 1-through-911 chapter order. The repair preserved all chapter IDs and 911 content files, and backup/rollback SQL remains available in the backend repository.
- Remote chapter-number coherence now takes precedence over a local anchor, so scheduled synchronization cannot perpetuate the old corrupted order.
- BQG chapter execution falls back to the source chapter page when configured API-mirror text is rejected by the pollution guard. Five consecutive content failures now stop a task with an actionable error.
- Runtime `maxChapters` now honors explicit run, subscription and rule configuration in that precedence order. A live unpublished `九星霸体诀` canary logged `maxChapters=1`, added exactly one clean MinIO chapter and completed with 52 local chapters; its temporary option was restored afterward.
- Task Center polling now reuses unchanged row objects and only refreshes selected-task detail while that task is active. Paused rows no longer flash merely because another task on the page is running.
- Verification passed: 14 focused backend tests, full 11-module backend package, Docker rebuild/recreation with OpenAPI HTTP 200, and the administration frontend production build.
- The remaining BQG metadata-only novels stay unpublished until bounded per-source synchronization and representative body checks pass. Do not interpret metadata discovery success as publication readiness.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\scrape-task-order-pause-and-bqg-fallback-20260729.md`.

## 2026-07-29 Task Center Execution Presentation

- Task Center now distinguishes scheduled follow-up, manual follow-up, first full collection and rule-batch collection instead of presenting every scrape row as the same generic source task.
- Successful no-change subscription runs show `up to date`. Bounded canaries show their real local/remote chapter ratio and explicitly remain incomplete even when the bounded task itself succeeded.
- The summary card now uses the backend `completeImportedBookCount` contract. It counts distinct novels with a successful, failure-free scrape result whose local chapter count is at least the reported remote count; it no longer uses historical scrape-task volume as an imported-book count.
- Live verification currently reports one fully imported novel. `玉奴娇` is current at 911 chapters, while the `九星霸体诀` canary remains incomplete at 52/7261 chapters.
- Frontend targeted tests passed 4/4, frontend production build passed, the full 11-module backend package passed, Docker was rebuilt/recreated, OpenAPI returned HTTP 200 and real Task Center browser acceptance passed without page-level horizontal overflow.
- This phase does not complete the BQG data rollout. The remaining metadata-only or partially synchronized novels still require bounded reruns, per-book count/body validation and an explicit publication decision.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\task-center-execution-presentation-20260729.md`.

## 2026-07-29 Qimao And BQG Source Continuity

- BQG chapter execution now keeps per-book remote IDs at subscription scope, validates response book/chapter identity, rejects known injected-content fingerprints and switches through the administrator-configured mirrors before using the same-site chapter repair endpoint.
- A run with any failed new chapter now fails explicitly; existing local chapters can no longer turn a failed incremental sync into a false success.
- Management endpoint tests now cover list, metadata, catalog and chapter body instead of treating list reachability as proof that正文 is usable.
- Live BQG acceptance ran two consecutive bounded tasks for `九星霸体诀`: task `e31f5dd34a8940068814ecf155cd51b2` increased valid local chapters 53 -> 55, and task `1c50404164244ccdbbd8d1e6d2a89789` increased them 55 -> 57. Two additional single-mirror canaries increased the book to 59 valid chapters. Every task had 0 chapter failures, and chapters 54-59 passed body inspection without the known pollution fingerprint or domains.
- Live Qimao acceptance task `79180ddd1f2249fc9dcfd69cd9a882df` completed `玉奴娇` idempotent follow-up with 0 added, 911 skipped, 0 failed and 911 local chapters.
- This does not complete the BQG rollout. The remaining 19 metadata-only novels have not been fully synchronized, a 20/50-book soak has not been run, Qimao had no upstream new chapter available for a new-body acceptance, and the application-level BQG repair endpoint still needs a forced all-mirrors-polluted acceptance even though the upstream endpoint itself returned a valid chapter in direct testing.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-source-continuity-qimao-bqg-20260729.md`.

## 2026-07-29 Novel Shelf Readiness And List Metadata

- The management Novel list now exposes the backend shelf decision before an administrator acts. Rows distinguish `可上架`, `暂不可上架`, and `已上架`, with a hover explanation using the same validation contract as the shelf API.
- Novel list aggregation now reads real chapter records for total chapters, readable chapters, latest chapter title, and word count. Zero-content metadata records display `暂无正文`, `0 章`, and `0 字` instead of ambiguous dashes.
- Row shelf actions are disabled when the backend marks a novel ineligible. Batch shelf skips known-ineligible rows, reports the skipped count before submission, and still leaves the backend as the final validation authority.
- Live browser verification covered a ready offline novel (`玉奴娇`: 911 readable chapters, latest `第911章 人物志`, 1,889,391 words), an online novel (`万相之王`: 1,694 readable chapters, 5,554,062 words), and metadata-only records with explicit blocking reasons.
- This phase does not create missing正文. The remaining metadata-only BQG records stay ineligible until their collection tasks store at least one readable chapter.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-shelf-readiness-list-metadata-20260729.md`.

## 2026-07-29 Novel Full-Library Statistics And Readiness Filter

- The Novel management summary and tab counts now use a dedicated full-library backend summary. Pagination, tabs and list filters no longer recalculate the cards from the current page.
- The summary contract reports 75 total novels, 1 online, 74 non-online, 3,782 active chapters and 11,096,421 words in the current local dataset.
- The Novel list now supports server-side `published` and `shelfReady` filters. `published=false` includes every non-online state, while `shelfReady=true` finds all currently offline novels that satisfy the same shelf validation contract used by the shelf action.
- Live browser acceptance confirmed 1 row in the online tab, 74 rows in the offline tab and 7 rows with the full-library ready-to-shelf filter. The five summary cards remained unchanged across tab switches, and the management console reported no application errors.
- Frontend production build, backend module compile, full backend package and Docker image rebuild/recreation all passed. No database migration is required.
- This phase does not complete source ingestion. The remaining metadata-only BQG novels still need real chapter collection, and the planned 20/50-book Qimao/BQG soak acceptance is still outstanding.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-shelf-readiness-list-metadata-20260729.md`.

## 2026-07-29 Reader Private-Library Recommendation Semantics

- The reader is a private local/NAS library, not a public content platform. Public-style ratings, stars, visit heat, popularity labels and popularity sorting must not be presented as meaningful reader metadata.
- Reader recommendation cards now show only locally verifiable metadata: category and stored chapter count. The former star value incorrectly mapped local collect/visit counters into a rating-like treatment and has been removed.
- Home, Book Library and Novel recommendation copy now uses `书库推荐` or `管理推荐`. User-facing `热门` sort entries were removed; catalog access still supports latest, administrator recommendation and title sorting.
- The Novel recommendation card area reserves two title lines and a stable 300px desktop panel height. Browser acceptance at `1440x900`, `768x1024` and `375x812` confirmed eight real recommendation cards fit vertically without clipping or page-level horizontal overflow; light/dark modes had no application console errors.
- The Novel reading-statistics tiles now prioritize the complete metric label and value. The decorative mini sparkline was removed from the seven-day-duration tile so all four labels remain readable and aligned at `1440x900`, `768x1024` and `375x812`, without page-level horizontal overflow.
- This change does not alter administrator collection ranking, source priority or backend visit counters. Those values may remain operational inputs, but they are not reader-facing ratings or heat.

## 2026-07-29 Reader Novel Theme And Dual-Column Mode

- The real-text novel reader now uses the shared reader preference state for background theme, font size and reading mode, matching the EPUB reader controls instead of relying on a read-only backend theme value.
- Desktop widths from `960px` support a two-column paginated layout. Each viewport shows a two-page spread, the mouse wheel maps to horizontal page movement, footer controls expose previous/next page and the current page count, and chapter navigation remains available at spread boundaries.
- Tablet and phone widths automatically use the single-column scrolling layout. The dual-column control is disabled with an explanatory label at those widths, while the stored desktop preference is restored when the viewport becomes wide enough again.
- Mode changes preserve the current chapter fraction after layout settles. Width animation was intentionally excluded because it caused a second reflow and shifted the restored reading position.
- The single-column novel reader keeps its dedicated scroll container but hides the native scrollbar track across Chromium, Firefox and legacy Microsoft engines. The reader shell now uses the flex remainder below the real rendered toolbar height instead of subtracting a fixed `58px`, preventing the extra document-level scrollbar while preserving wheel, touch, keyboard and progress-save scrolling.
- Live acceptance used the real 659-chapter novel `封总，太太想跟你离婚很久了`: desktop `1280x720` rendered a six-spread first chapter and advanced from `1 / 6` to `2 / 6`; `768x1024` and `375x812` both auto-fell back to one column without page or toolbar overflow; returning to desktop restored dual-column mode. Light and dark reading backgrounds both rendered correctly. Reader production build passed; the existing large-chunk warning remains.
- Scrollbar acceptance also covered desktop `1280x720`, phone `375x812` and landscape `812x375`: document height matched the viewport, no horizontal overflow was present, the native track consumed `0px`, and the internal reading surface still moved programmatically before returning to its original position.

## 2026-07-30 fnOS Full-Data Migration Package

- A complete amd64 fnOS migration package was generated at `E:\code\trae_workspcae\shuxia\qianduan\shuxia-end\output\fnos-migration-20260730-001958`.
- The package contains six offline Docker images, a consistent MySQL dump, the complete MinIO data tree, local chapter-content files, upload files, a Compose project, generated private credentials and deployment instructions. A verified `shuxia-project.zip` is included so the project can be uploaded and extracted as one file in fnOS. Redis cache is intentionally rebuilt instead of migrated.
- Storage Management cleanup was performed before export. Eight test or historical test records were hard-deleted after confirming they had no file, task, subscription or notification references. The restored database contains only the formal `sx-book` and `novel` MinIO sources.
- Package SHA-256 verification passed. The manifest writer/reader now uses UTF-8 so Chinese chapter filenames remain verifiable on Windows PowerShell 5.1.
- A clean MySQL 8.0.46 restore rehearsal passed: 189 tables initialized; 92 active books/novels, 15,638 active chapter rows, 15,622 stored content paths, two active formal storage sources and zero legacy `127.0.0.1`/`localhost` MinIO URLs.
- Active-parent content verification resolved all 6,329 referenced chapter bodies: 2,735 local chapter files plus 3,594 MinIO-backed objects, with zero missing paths.
- The original Windows environment remains available and was restarted after the consistent export. Backend OpenAPI returned HTTP 200 at `http://127.0.0.1:18080/jeecg-boot/v3/api-docs` after export.
- Remaining work is real-device acceptance only: upload and extract `shuxia-project.zip` on the 21.83 TB storage, import the six image archives into fnOS, create/start the Compose project, then verify login, covers, book preview, novel chapters, reading progress and collection configuration on `192.168.8.13`. Chrome automation is currently paused at the fnOS upload page because the ChatGPT Chrome extension does not yet have permission to access local file URLs.
- Backend handoff: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\fnos-full-data-migration-20260730.md`.

## Integration Priority

Current user priority:

1. P0-P5 and the first reader real-data integration pass are complete; storage contracts, permissions, category visibility, authenticated file access, reader progress and restart persistence remain release regression requirements.
2. Keep the historical no-context `RESUBMIT` boundary as a compatibility requirement while all new rule batches use persisted candidate context and item checkpoints.
3. Treat Storage Management as the only destination registry in all later work; downstream forms must consume eligible IDs and backend execution must revalidate them.
4. Keep the first notification event boundary limited to explicit task completion/failure producers. Additional event codes must have a confirmed meaning and a real backend producer before they appear in configuration.
5. Do not start P3 comic or audio implementation until their legal source, accepted formats, directory structures, processing requirements and storage contracts are explicitly confirmed by the user. Stable visual slots and empty states on the reader home do not broaden this boundary.
6. Treat the current dashboard JSON as a runtime snapshot only. Do not implement or claim full backup/restore until product scope, encryption, retention and restore compatibility are confirmed.
7. Keep tag taxonomy distinct from category taxonomy and keep the existing reader application integration-only in this repository.
8. Before implementing another domain, confirm the NAS release/installation approach and then close Compose mount templates, first-start diagnostics, upgrade instructions and real-device path acceptance. Do not fold comic, audio, reader UI or undefined backup/restore work into that phase.

## New Thread Startup Checklist

When starting a fresh Codex thread for this project:

1. Read `AGENTS.md`.
2. Read this file.
3. Skim `docs/backend-integration-plan.md` for the broader interface plan.
4. Check `git status --short` before editing.
5. Preserve unrelated user changes.
6. Update this file if the project state materially changes.

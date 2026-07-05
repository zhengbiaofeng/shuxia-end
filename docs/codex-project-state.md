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
  - Task center uses `/sx/book/task/detail/{id}`, `/sx/book/task/timeline/{id}`, and `/sx/book/task/{id}/{action}` for pause, terminate, and retry actions.
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
- Smart scrape一期 is now implemented for Douban Book detail URLs:
  - Frontend page: `/automation/smart-scrape`.
  - Backend APIs:
    - `POST /sx/book/auto-scrape/analyze`
    - `POST /sx/book/auto-scrape/import`
    - `POST /sx/book/auto-scrape/content/analyze`
    - `POST /sx/book/auto-scrape/content/start`
  - Backend adapter layer starts with `DoubanBookAdapter` and supports `https://book.douban.com/subject/{id}/`.
  - Douban is treated as metadata completion only, not chapter/content scraping.
  - Douban cover URLs are now downloaded server-side and bound through the existing cover file/proxy path; existing manually maintained covers are not overwritten.
  - Smart-scrape preview covers use `GET /sx/book/auto-scrape/cover-preview?url=...` instead of browser hotlinking Douban images directly; the endpoint is whitelisted for image tags and restricted to Douban image hosts.
  - The smart-scrape frontend no longer exposes a local txt/pdf/epub upload panel; local file upload, auto-create, and parsing remain centralized in the Books page upload flow.
  - The smart-scrape frontend also has a web content scrape panel after metadata import. Users can paste a public chapter-list or chapter-detail URL, preview matched rule/chapter samples, and confirm ingestion into `sx_book_chapter`.
  - Web content scrape uses enabled advanced scan rules for `chapterSelector`/`chapterTitleSelector`/`chapterUrlSelector`/`contentSelector`; Douban remains metadata-only.
  - Web content ingestion stores chapter text through the existing chapter content storage service, marks chapters `sliceStatus=SUCCESS`, refreshes `chapterCount/lastReadableChapterId`, and records `WEB_SCRAPE` task logs.
  - `WEB_SCRAPE` is now supported in task log validation, task center list/detail/summary, and task statistics.
  - For books with `sourceSite`, content parsing preserves the user-confirmed metadata/source fields after chapter parsing, so EPUB/PDF embedded metadata does not overwrite the Douban preview data.
  - Import conflict matching uses ISBN first, then `bookName + authorName + publisher`.
  - New `sx_book` metadata/source fields are added by SQL: `sx-book-auto-scrape.sql`.
  - Historical handoff doc was recorded under old D盘 backend; use E盘 backend as the current source before relying on that path.
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
- Added the two-layer automation entrance:
  - Common user flow: `/automation/smart-scrape` for URL -> parse -> preview -> import.
  - Advanced flow remains `/automation/rules` and `/automation/channels` for scan-rule debugging and fallback configuration.
  - The sidebar automation group now lists Smart Scrape before Scan Rules.
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
- `SxCurrentUserSupport` now has a scoped `runAs/callAs` user override so background batch work can preserve the submitting user's ownership/audit context.
- Scan Rules page row/detail actions now include `发现小说`; the dialog uses the saved rule configuration directly, auto-discovers candidates on open, and keeps selector/list URL editing in the existing Add/Edit Rule page.
- Add/Edit Rule now exposes only the `基础信息` top tab; request config and field selectors remain as sections on that page instead of duplicated top-level tabs.
- The frontend now treats rules + template binding as a soft-merged `扫描源管理` experience: `/automation/rules` is the main scan-source list, `/automation/channels` is labeled `连接模板配置`, and route titles use the scan-source/template wording while backend rule/channel tables remain separate.
- `连接模板配置` has a top action `返回扫描源` that routes back to `/automation/rules`, so the template page is clearly a child of scan-source management; its create action is labeled `新增连接模板` to distinguish it from `添加扫描源`.
- Backend handoff doc: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\docs\novel-rule-batch-sync-readme.md`
- Verification:
  - Backend: `mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":sx-book" -am -DskipTests compile` passed.
  - Frontend: `npm run build` passed with existing Rolldown pure-annotation and chunk-size warnings.

## Integration Priority

Current user priority:

1. Build a reliable book and novel management chain first.
2. Continue the web-novel sync roadmap: create/configure a practice source rule, run Phase 1 end-to-end against one existing local novel, then defer Phase 2 source discovery and auto-create until Phase 1 is stable.
3. Defer comic and audio work unless explicitly requested.
4. Keep backend taxonomy, upload/import, cover preview, list/detail display, and batch book actions coherent.
5. Keep UI resilient to real backend data: long names, missing fields, empty states, and unexpected counts must not break layout.
6. Keep tag taxonomy distinct from category taxonomy; do not reintroduce category names as default tags.

## New Thread Startup Checklist

When starting a fresh Codex thread for this project:

1. Read `AGENTS.md`.
2. Read this file.
3. Skim `docs/backend-integration-plan.md` for the broader interface plan.
4. Check `git status --short` before editing.
5. Preserve unrelated user changes.
6. Update this file if the project state materially changes.

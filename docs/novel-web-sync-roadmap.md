# Novel Web Sync Roadmap

Updated: 2026-06-20

This document is the working plan for adding scheduled web novel synchronization to Shuxia. Future implementation steps should follow this checklist unless the user explicitly changes the direction.

## Goal

Build a reliable flow that lets an admin configure a novel website source, bind it to local novels, and let the backend periodically fetch new chapters into the existing novel library.

The first practice source is:

- Site: `https://m.bqglll.cc/`
- Example detail URL: `https://m.bqglll.cc/look/104952/`
- Example chapter URL: `https://m.bqglll.cc/look/104952/688.html`

This source is for development and rule verification only. Do not present it as an official bundled source or recommended content provider. The product should keep the model as user-configured web sources and show copyright/compliance reminders where appropriate.

## Existing Capabilities To Reuse

- `sx_scrape_channel`: stores website/channel configuration.
- `sx_scrape_rule`: stores selector rules for title, author, intro, cover, chapter list, chapter URL, and content.
- `sx_scrape_subscription`: stores per-book update subscriptions with `detailUrl` and `cronExpr`.
- `SxScrapeSubscriptionJob`: scheduled subscription execution.
- `SxScrapeExecuteService`: current backend execution path for subscription fetch, parsing, differential chapter sync, task termination checks, task logging, and automatic classification.
- Task Center pages and APIs: should show web sync task records instead of adding a separate task system.
- Auto-classification rules: `sourceType=SCRAPE` can apply category and tags after web sync.

## Product Principles

- Phase 1 updates existing novels from a configured detail/catalog URL. It does not discover a whole site.
- Phase 2 can discover new novels from category/ranking/search pages and auto-create records.
- Manual metadata edits win by default. Scheduled sync should add chapters, not overwrite a user-maintained title, cover, intro, category, or tags unless an explicit overwrite option is enabled.
- Crawled chapter content must pass a content scrubbing step before storage. The system should remove ads, source-site notices, script/style leftovers, navigation text, duplicated titles, update prompts, and other unrelated boilerplate instead of saving raw page text.
- The backend creates tasks and runs long work asynchronously. Frontend write APIs should not block until hundreds of chapters are downloaded.
- Fetch politely: single-site concurrency starts at 1, chapter request intervals are configurable, and each run has a max chapter limit.
- Never add anti-captcha, login bypass, paywall bypass, or hidden authorization workarounds.

## Phase 1: Existing Novel Scheduled Chapter Sync

Objective: bind one existing local novel to one source detail URL, then manually or periodically fetch only missing chapters.

### 1. Backend Rule Engine

- [x] Add selector value extraction syntax for attributes.
  - Example: `meta[property=og\:novel\:book_name]::attr(content)`
  - Example: `meta[property=og\:image]::attr(content)`
  - Keep existing plain CSS selector behavior as text extraction.
  - Apply consistently to title, author, intro, cover, chapter title, chapter URL, and content where it makes sense.
- [x] Add or confirm support for absolute and relative URL resolution from extracted URLs.
- [x] Add or confirm selector debug output includes raw matched count, extracted samples, and final normalized values.
- [x] Add fetch charset handling.
  - Prefer server-declared charset.
  - Detect page charset from meta tags when possible.
  - Fall back to UTF-8.
  - Record charset in debug/task logs when useful.
- [x] Add a catalog-page resolution strategy.
  - Preferred: explicit `catalogUrlSelector` or `catalogUrlTemplate` on the rule.
  - Acceptable MVP fallback for bqglll: derive `detailUrl + "list.html"` when the source rule enables it.
- [x] Ensure chapter list parsing can use the catalog page rather than only the detail page.
- [x] Add per-run max chapter count.
  - Suggested default for development: 5.
  - Suggested production default: configurable, conservative.
- [x] Add per-request delay or site-level throttle.
  - Suggested default: 1000-3000 ms between chapter fetches.
- [x] Add a content scrubbing pipeline before chapter content is stored.
  - Strip `script`, `style`, `iframe`, hidden elements, navigation blocks, recommendation blocks, footer blocks, and obvious ad containers before text extraction when possible.
  - Support rule-level remove selectors, for example `adRemoveSelectors` or `contentRemoveSelectors`.
  - Support rule-level line filters or regex filters for common junk text, site notices, update prompts, and repeated source statements.
  - Normalize whitespace, blank lines, HTML entities, full-width spaces, and duplicated chapter titles.
  - Keep paragraph boundaries readable for the frontend reader.
  - [ ] Record how many nodes/lines were removed in debug output and task logs.
  - Fail or warn when the cleaned content becomes too short compared with the raw extraction result.
- [x] Add clear failure messages for:
  - detail page empty
  - catalog page empty
  - no chapters parsed
  - content selector matched nothing
  - content scrubbed to empty or suspiciously short text
  - HTTP status not OK
  - unsupported charset or decoding failure

### 2. bqglll Practice Rule And Channel

- [ ] Create a backend SQL seed or admin-created test fixture for a `bqglll` channel.
- [ ] Use conservative request headers.
  - User-Agent should be browser-like but transparent enough for compatibility.
  - Do not add stealth or bypass behavior.
- [ ] Configure detail metadata selectors.
  - Title: `meta[property=og\:novel\:book_name]::attr(content)`
  - Author: `meta[property=og\:novel\:author]::attr(content)`
  - Cover: `meta[property=og\:image]::attr(content)`
  - Intro: `meta[property=og\:description]::attr(content)` or the visible intro block if cleaner.
  - Latest chapter: `meta[property=og\:novel\:latest_chapter_name]::attr(content)`
- [ ] Configure chapter list selectors for detail page samples.
  - Chapter title: suitable `dd a` selector under the chapter area.
  - Chapter URL: same links through `href`.
- [ ] Configure full catalog strategy.
  - Catalog URL: `/look/{bookId}/list.html` derived from detail URL or a selector/template.
  - Full catalog chapter selector: suitable `dd a` selector on the list page.
- [ ] Configure content selector for chapter pages.
  - Verify with one chapter page only.
  - Configure remove selectors and line filters to strip navigation, ads, source-site notices, update prompts, and unrelated footer text.
  - Verify the cleaned text only contains chapter title/body content.
- [ ] Add a handoff note under backend `docs/` if backend SQL or Java changes are made.

### 3. Subscription Backend

- [x] Confirm `sx_scrape_subscription` supports binding to an existing `sx_book.id`.
- [ ] Confirm subscription creation validates:
  - book exists
  - book belongs to novel scope or target type is novel
  - channel exists and is enabled
  - detail URL belongs to the selected channel base URL
  - cron expression is valid
- [x] Add run options if missing:
  - `syncChapters`
  - `maxChapters`
  - `overwriteMetadata`
  - `requestDelayMs`
- [x] Ensure scheduled runs use the same logic as manual runs.
- [x] Ensure duplicate chapter detection uses:
  - remote chapter key
  - remote chapter URL
  - normalized chapter title
- [x] Ensure repeated runs skip existing chapters and do not inflate chapter count.
- [x] Add task log rows for per-chapter failures, with chapter title and URL.
- [x] Add pause/terminate checks during long chapter loops.
- [x] Add a retry path for failed/paused tasks if existing task center actions do not cover it.

### 4. Frontend Phase 1

- [x] Rename or reshape the current "Update Subscriptions" page into a usable "Novel Sync" page.
- [x] Add table columns:
  - novel name
  - source site
  - detail URL
  - cron
  - latest remote chapter
  - latest sync time
  - last sync status/message
  - status
  - actions
- [x] Add actions:
  - add subscription
  - edit subscription
  - enable/disable
  - run now
  - preview/debug parse
  - view task logs
  - delete subscription
- [x] Add subscription form fields:
  - existing novel selector
  - source channel selector
  - detail URL
  - sync frequency presets
  - advanced Cron expression
  - max chapters per run
  - request delay
  - sync chapters switch
  - overwrite metadata switch, default off
  - remark
- [x] Add parse preview panel:
  - title
  - author
  - cover
  - intro
  - latest chapter
  - chapter samples
  - raw content sample
  - cleaned content sample
  - scrub summary
  - warnings
- [x] Add result messaging after run:
  - task ID
  - added chapter count
  - skipped chapter count
  - failed chapter count
  - link/open task center detail
- [x] Keep UI resilient to long URLs, long book names, empty values, and failed parse messages.

### 5. Verification Phase 1

- [ ] Create or select a local novel record for the bqglll example.
- [ ] Create channel and rule.
- [ ] Debug parse detail URL.
- [ ] Debug parse full catalog URL.
- [ ] Run immediate sync with max 1-5 chapters.
- [ ] Confirm chapters are inserted into the selected novel.
- [ ] Confirm inserted chapter content has been scrubbed and does not contain ads, source-site notices, navigation text, recommendation text, or footer boilerplate.
- [ ] Run immediate sync again and confirm duplicate chapters are skipped.
- [ ] Enable a short test cron and confirm scheduled execution appears in Task Center.
- [ ] Pause/terminate a long-running task and confirm it stops cleanly.
- [ ] Confirm failure logs show understandable Chinese messages.
- [x] Run frontend build after meaningful frontend changes.
- [x] Compile backend module after backend Java changes.

## Phase 2: Discover New Novels From Website Pages

Objective: configure category/ranking/search/list pages so the system can discover novel detail URLs, create missing local novel records, classify/tag them, then create subscriptions for later updates.

### 1. Discovery Rule Model

- [ ] Add discovery-specific rule fields, or a new discovery rule type, for:
  - list page URL
  - pagination selector/template
  - item selector
  - detail URL selector
  - item title selector
  - item author selector
  - category selector
  - update time/latest chapter selector
- [ ] Support depth and page limits.
  - max pages per run
  - max novels per run
  - max new subscriptions per run
- [ ] Support URL allowlist by host/base URL.
- [ ] Support dry-run preview before writing local records.
- [ ] Support source-level throttle shared with Phase 1 chapter sync.

### 2. Discovery Execution

- [ ] Add a discovery task type or execute mode.
- [ ] Fetch configured list/category/ranking page.
- [ ] Parse candidate detail URLs.
- [ ] Normalize and de-duplicate candidate URLs.
- [ ] Fetch candidate detail pages up to the configured limit.
- [ ] Parse metadata and chapter samples using the normal source rule.
- [ ] Match existing local novels by:
  - source detail URL
  - title + author
  - optional external/source key
- [ ] Auto-create missing `sx_book` rows with:
  - `bizType=novel`
  - `bookType=novel`
  - source site/name fields
  - parsed title/author/intro/cover when available
  - publish status default offline/unpublished
- [ ] Apply auto-classification and tags with `sourceType=SCRAPE`.
- [ ] Create disabled or enabled subscriptions according to user setting.
- [ ] Record per-candidate results:
  - created
  - existed
  - skipped
  - failed

### 3. Frontend Phase 2

- [ ] Add a "Source Discovery" view under Automation or Novel Sync.
- [ ] Add discovery source form:
  - channel
  - list/category URL
  - page limit
  - novel limit
  - create subscription switch
  - subscription status default
  - max chapters to sync after creation, default 0
- [ ] Add preview results table:
  - title
  - author
  - category
  - detail URL
  - latest chapter
  - match status
  - planned action
- [ ] Add confirm import action after dry-run preview.
- [ ] Add discovery task detail page or reuse task center detail.
- [ ] Add filters for created/existing/failed/skipped results.

### 4. Verification Phase 2

- [ ] Run discovery preview against a small category/ranking page.
- [ ] Confirm only the configured host is fetched.
- [ ] Confirm preview makes no database writes.
- [ ] Confirm import creates only missing novels.
- [ ] Confirm repeated import does not duplicate novels.
- [ ] Confirm created novels appear in Novel page.
- [ ] Confirm created subscriptions appear in Novel Sync page.
- [ ] Confirm auto-classification and tags are applied.
- [ ] Confirm scheduled Phase 1 updates work for newly discovered novels.

## Suggested Implementation Order

1. Extend selector extraction syntax and charset handling.
2. Add catalog URL support and max-chapter throttle in backend execution.
3. Add or seed bqglll practice channel/rule.
4. Productize the subscription page as "Novel Sync".
5. Run Phase 1 with one existing novel.
6. Add task/log polish and retry handling.
7. Start Phase 2 discovery dry-run.
8. Add discovery import.
9. Polish source management and compliance prompts.

## Open Decisions

- Whether to store `catalogUrlSelector/catalogUrlTemplate` on `sx_scrape_rule` or encode it inside existing rule JSON/remark-style fields.
- Whether `maxChapters` and `requestDelayMs` belong to the subscription, channel, run request, or all three with override precedence.
- Whether the first bqglll practice source should be added through SQL seed, admin UI, or a hidden local debug endpoint.
- Whether Phase 2 auto-created novels should default to unpublished. Current recommendation: unpublished.
- Whether cover images from web sync should be stored through the existing file/proxy pipeline or kept as external URLs. Current recommendation: store/proxy later; Phase 1 can preview external cover only if current behavior permits it.

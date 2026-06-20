# Shuxia Codex Instructions

These instructions apply to this frontend repository and the related local backend used for integration.

## Required Startup Context

At the start of every new Codex thread for this project:

1. Read `docs/codex-project-state.md`.
2. If working on interface integration, also read `docs/backend-integration-plan.md`.
3. Run or inspect `git status --short` before editing.
4. Preserve unrelated user changes. Do not revert files you did not change unless the user explicitly asks.

## Project Paths

- Frontend root: `E:\code\trae_workspcae\shuxia\qianduan\shuxia-end`
- Backend root: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot`
- Docker compose file: `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\docker\command\docker-compose.yml`
- Main backend service/container: `jeecg-system-start`

## Frontend Rules

- Follow the existing design system, page structure, shared styles, and reusable components.
- Do not copy repeated CSS across pages when a shared class/component is appropriate.
- UI must tolerate real backend data: long names, missing optional fields, empty lists, large counts, and unexpected text must not break layout.
- Frontend must not silently repair backend dirty data. In particular, do not add mojibake/data-fixing fallbacks in frontend normalizers unless the user explicitly requests it.
- After significant UI changes, verify with a browser when practical, especially for layout and overflow problems.

## Backend Collaboration Rules

- Backend code changes live under `E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot`.
- The old `D:\weixin_download\boot-box1\server\jeecg-boot` tree is not the current backend source for this project; do not use it as the merge target.
- Every backend code or SQL change must have a matching handoff document under backend `docs/`.
- Handoff docs should state:
  - changed files
  - behavior change
  - execution or packaging commands
  - verification performed
  - compatibility or migration notes
- User usually runs backend packaging/restart locally. Provide PowerShell-safe commands instead of assuming Bash syntax.

## Database And Docker Notes

- Do not pipe SQL containing Chinese text through PowerShell into Docker MySQL. Use `docker cp` and `mysql ... -e "source /tmp/file.sql"`.
- Use PowerShell `Set-Location "path"` instead of `cd /d`.
- Prefer explicit compose file path:

```powershell
docker compose -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\docker\command\docker-compose.yml" restart jeecg-system-start
```

## Verification Expectations

- For frontend changes, run `npm run build` when the change is meaningful and time allows.
- For backend Java changes, compile the affected module when practical:

```powershell
mvn -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\jeecg-boot\pom.xml" -pl ":jeecg-system-start" -am -DskipTests package
```

- For SQL/data changes, run targeted SQL verification queries and record important results in the final response and relevant handoff doc.

## State Maintenance

Update `docs/codex-project-state.md` whenever any of these materially change:

- completed integration milestones
- backend or database behavior
- important commands or local paths
- known pitfalls
- next integration priority

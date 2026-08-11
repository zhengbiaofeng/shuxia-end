# 书匣本地开发与 fnOS 持续交付

首次全量迁移和后续升级是两件不同的事情：

- 首次迁移使用 `build-migration-package.ps1`，包含数据库、MinIO 和全部正文数据，只执行一次。
- 后续升级使用 `build-upgrade-package.ps1`，只包含管理端、阅读端、后端三个应用镜像及运行配置，不包含任何用户数据和密码。

## 一、开发与发布边界

本地环境用于持续开发、联调和回归；NAS 环境用于阶段性验收和稳定使用。不要把 NAS 当成开发数据库，也不要直接在 NAS 上改源码。

一项功能进入 NAS 前，应依次经过：

1. 本地完成开发和模块测试。
2. 管理端、阅读端、后端完成联调。
3. 三个代码目录的里程碑改动均已提交，工作区干净。
4. 明确本次是否涉及数据库结构或数据迁移。
5. 构建带唯一版本号的升级包并完成校验。
6. NAS 备份、升级、冒烟验收；失败时回滚上一版本。

正式版本使用语义化版本号，例如 `0.3.0`；临时验收包可使用 `年.月.日.序号`。同一个版本号不得重复构建或覆盖，三个仓库必须使用同一个 Git 标签（例如 `v0.3.0`）。

## 二、本地构建升级包

在 PowerShell 执行：

```powershell
Set-Location "E:\code\trae_workspcae\shuxia\qianduan\shuxia-end"

powershell -ExecutionPolicy Bypass -File ".\deploy\fnos\scripts\build-upgrade-package.ps1" `
  -Version "0.3.0"
```

脚本会完成：

- 检查管理端、阅读端、后端源码状态。
- 构建两个前端和后端 JAR。
- 构建 `linux/amd64` 的三个应用镜像。
- 生成固定镜像版本的 `docker-compose.yml`。
- 导出三个镜像 tar、`release.json`、发布说明和 SHA-256 清单。
- 默认输出到 `output/fnos-release-版本号`。

工作区存在未提交或未跟踪源码时，正式出包会被阻止。只有临时 NAS 测试包可以显式增加 `-AllowDirty`，该包会在 `release.json` 中标记 `productionReady=false`，不能当作正式版本归档。

## 三、数据库变更

当前 NAS 后端没有自动启用 Flyway，因此数据库变更不能隐藏在应用镜像中，也不能假设重启后自动执行。

本次需要 SQL 时，按执行顺序传给构建脚本：

```powershell
powershell -ExecutionPolicy Bypass -File ".\deploy\fnos\scripts\build-upgrade-package.ps1" `
  -Version "2026.08.01.1" `
  -MigrationFiles @(
    "E:\path\001-add-column.sql",
    "E:\path\002-backfill-data.sql"
  )
```

SQL 会进入升级包的 `migrations` 目录并生成顺序文件，但不会自动执行。正式发布必须同时具备：

- 数据库备份。
- 可重复执行或有明确前置条件的升级 SQL。
- 对应回滚 SQL；无法回滚时必须说明只能恢复数据库备份。
- 升级后的针对性查询和业务验收项。

## 四、校验升级包

```powershell
powershell -ExecutionPolicy Bypass -File ".\deploy\fnos\scripts\verify-upgrade-package.ps1" `
  -PackageRoot ".\output\fnos-release-0.3.0"
```

校验会检查文件哈希、三个镜像归档、Compose 版本、Compose 语法，以及升级包内是否误带 `.env`、数据库初始化目录或用户书库。

## 五、fnOS 升级操作

1. 暂停新采集任务，等待正在执行的任务安全结束。
2. 备份 NAS 当前项目的 `docker-compose.yml`、`.env`、`config` 和 MySQL 数据库。
3. 在 fnOS Docker 的“本地镜像”中导入升级包 `images` 下三个 tar。
4. 如果存在 `migrations`，在数据库备份后按 `MIGRATION-ORDER.txt` 执行并核验。
5. 只把升级包的 `project/docker-compose.yml` 和 `project/config` 合并到现有项目。
6. 绝对不要删除或覆盖 NAS 上的 `.env`、`library`、MySQL 卷、Redis 卷和 MinIO 数据。
7. 在 fnOS Compose 中更新/重建 `shuxia` 项目。
8. 验收管理端、阅读端、登录、书籍阅读、小说阅读、封面、阅读进度和采集任务。

## 六、回滚

应用升级失败时：

1. 恢复升级前备份的 Compose 和配置。
2. 确认 Compose 中三个 `shuxia/*` 镜像标签均为上一版本。
3. 在 fnOS 中重新创建/更新项目。
4. 若执行过 SQL，运行已审核的回滚 SQL；没有可逆 SQL 时恢复升级前数据库备份。

回滚不得删除 `library` 或数据卷。公网映射属于网络发布，和应用镜像升级分开管理，日常升级不需要重新配置公网端口。

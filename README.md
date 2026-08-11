# 书匣管理端

书匣管理端是面向私人本地 NAS 部署的内容管理后台，仅供管理员使用。管理员在这里维护存储位置、导入正版电子书、配置网络小说采集与追更、管理阅读账号和内容可见权限，并监控任务与系统状态。

## 产品边界

- **书籍**：只允许用户主动上传，或读取本地/NAS 文件夹批量导入；管理端不提供书籍网站抓取功能。
- **小说**：由管理员配置免费小说站点、采集规则、一次性或定时任务，并将正文同步到已登记的存储位置。
- **阅读用户**：普通用户不登录本管理端，只通过阅读端访问已上架且有权查看的内容。
- **有声和漫画**：只允许管理员上传，或扫描存储管理中已登记的本地/NAS 目录；分别使用独立的 MinIO 桶或用户指定路径，不提供网络采集和 AI 生成能力。
- **存储**：存储管理是全系统唯一的目标位置注册表；导入、采集、追更和迁移只能使用其中已启用且校验通过的位置。

## 三端仓库

| 仓库 | 职责 | 本地联调地址 |
| --- | --- | --- |
| [shuxia-end](https://github.com/zhengbiaofeng/shuxia-end) | 管理端，本仓库 | `http://127.0.0.1:5173` |
| [shuxia-reader](https://github.com/zhengbiaofeng/shuxia-reader) | 普通用户阅读端 | `http://127.0.0.1:5174` |
| [shuxia-server](https://github.com/zhengbiaofeng/shuxia-server) | 后端、数据库脚本和本地 Docker 环境 | `http://127.0.0.1:18080/jeecg-boot` |

三个仓库独立维护 Git 历史。一次正式交付应记录三个仓库各自的提交版本，不能只更新其中一端。

## 主要功能

- 书籍上传、本地/NAS 目录扫描、解析、分类、标签、上架和存储迁移
- 小说站点适配、采集规则、批量采集、追更订阅和上架检查
- 有声上传/目录扫描、音频元数据提取、Range 流式播放、专辑与分轨管理
- 漫画图片/PDF/ZIP/CBZ/CBR 导入、目录扫描、封面提取、分页阅读和增量页面合并
- 书籍、有声和漫画的多格式选择、默认格式、人工合并及单格式删除
- 存储位置登记、连通性与容量校验、文件统计和迁移管理
- 任务中心、任务日志、失败重试、暂停/恢复和通知配置
- 阅读账号、角色权限和按书籍/小说分类配置内容可见性
- 站点、阅读、安全、通知和授权信息配置

## 技术栈与环境

- Vue 3、Vite、Vue Router、Pinia、Element Plus、Axios
- Node.js `^20.19.0` 或 `>=22.12.0`
- npm（建议使用仓库锁文件执行 `npm ci`）
- 已启动的书匣后端；默认地址为 `http://127.0.0.1:18080/jeecg-boot`

## 本地启动

```powershell
Set-Location "E:\code\trae_workspcae\shuxia\qianduan\shuxia-end"
npm ci
.\scripts\run-admin.ps1 -Command dev
```

浏览器访问 `http://127.0.0.1:5173`。开发配置位于 `.env.development`：

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:18080/jeecg-boot
```

修改环境变量后需要重新启动 Vite。不要把账号、密码、Token 或 NAS 密钥写入仓库。

`run-admin.ps1` 默认把书匣管理端的临时文件和 npm、pnpm、Playwright 缓存写入
`E:\shuxia-runtime`，并拒绝使用 C 盘运行目录。需要后台运行时使用：

```powershell
.\scripts\run-admin.ps1 -Command dev -Background
```

后台模式不持久化 stdout/stderr，避免开发警告生成无上限日志。构建和测试也应通过该脚本执行：

```powershell
.\scripts\run-admin.ps1 -Command build
.\scripts\run-admin.ps1 -Command test
```

## 三端联调

建议分别打开三个 PowerShell 窗口：

```powershell
# 1. 启动后端依赖和服务
docker compose -f "E:\code\trae_workspcae\shuxia\qianduan\boot-box\server\docker\command\docker-compose.yml" up -d

# 2. 启动管理端（5173）
Set-Location "E:\code\trae_workspcae\shuxia\qianduan\shuxia-end"
npm run dev

# 3. 启动阅读端（显式指定 5174，避免与管理端冲突）
Set-Location "E:\code\trae_workspcae\shuxia\qianduan\shuxia"
npm run dev -- --port 5174
```

后端健康检查：`http://127.0.0.1:18080/jeecg-boot/v3/api-docs`。

## 测试与构建

```powershell
npm test
npm run build
npm run preview
```

重要界面改动至少应验证桌面、平板和手机宽度，尤其检查长标题、空数据、超大计数、表格横向滚动以及弹窗/抽屉边界。

## fnOS / NAS 交付

- 首次带数据迁移：阅读 [deploy/fnos/README.md](deploy/fnos/README.md)。
- 后续应用升级：阅读 [deploy/fnos/UPGRADE.md](deploy/fnos/UPGRADE.md)。
- 日常发布使用 `deploy/fnos/scripts/build-upgrade-package.ps1`，不会打包或覆盖数据库、MinIO 对象、小说正文和用户书库。
- `build-migration-package.ps1` 只用于首次全量迁移，不能作为日常升级方式。

正式出包前，三端源码必须已提交且工作区干净；涉及 SQL 时必须先备份数据库，并准备经过审核的执行顺序和回滚方案。

## 目录说明

```text
src/api/          后端接口封装
src/components/   共享组件
src/composables/  复用业务状态与交互逻辑
src/config/       页面静态配置
src/pages/        管理页面
src/router/       路由定义
src/stores/       Pinia 状态
src/styles/       全局设计系统与共享样式
docs/             项目状态、接口协作和开发记录
deploy/fnos/      fnOS 首次迁移与持续交付工具
```

## 协作入口

- 当前项目状态：[docs/codex-project-state.md](docs/codex-project-state.md)
- 前后端联调计划：[docs/backend-integration-plan.md](docs/backend-integration-plan.md)
- 接口依赖：[docs/api-dependency-log.md](docs/api-dependency-log.md)
- 后端变更协作：[docs/backend-collaboration-log.md](docs/backend-collaboration-log.md)

开发前先阅读项目状态文档并检查 `git status --short`。不要覆盖无关的本地改动，也不要使用旧的 `D:\weixin_download\boot-box1` 后端目录作为合并目标。

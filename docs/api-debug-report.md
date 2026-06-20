# 接口调试与功能校验记录

更新时间：2026-06-12

## 后端连通性

- `GET http://127.0.0.1:18080/jeecg-boot/doc.html#/home`：200
- `GET http://127.0.0.1:18080/jeecg-boot/v3/api-docs`：200，OpenAPI 路径数 401
- `GET /sys/randomImage/{key}`：200，返回 `data:image/jpg;base64,...`

## 认证接口

- OpenAPI 当前存在 `POST /sys/login`；源码与实测确认也可使用 `POST /sys/mLogin`。
- OpenAPI 当前存在 `GET /sx/book/user/ext/me`，不存在旧前端使用的 `/sys/user/getUserInfo`。
- `POST /sys/login` 不带验证码返回 `验证码无效`；带空验证码返回 `验证码错误`。
- `POST /sys/mLogin` 仅提交 `username/password` 可完成登录，返回 `result.token` 和 `result.userInfo`。
- 前端已改为调用 `/sys/mLogin`，不再展示或提交图形验证码。
- 前端请求拦截器已验证会在存在 token 时携带 `X-Access-Token`。

## 业务接口探测

未登录请求以下接口均返回 401 `token为空!`，符合鉴权预期：

- `GET /sx/book/dashboard/home-page`
- `GET /sx/book/storage/summary`
- `GET /sx/book/storage/source/config/page`
- `GET /sx/book/category/summary`
- `GET /sx/book/category/tree`
- `GET /sx/book/tag/summary`
- `GET /sx/book/tag/list`
- `GET /sx/book/list`

有效 token 请求以下接口均返回 200：

- `GET /sx/book/user/ext/me`：返回用户扩展信息。
- `GET /sx/book/dashboard/home-page`：返回首页聚合数据。
- `GET /sx/book/storage/source/config/page?pageNo=1&pageSize=5`：返回 4 条存储源。
- `GET /sx/book/category/tree`：返回 4 组分类树。
- `GET /sx/book/tag/list?pageNo=1&pageSize=5`：返回 5 条记录，总数 33。
- `GET /sx/book/list?pageNo=1&pageSize=5`：返回 5 条记录，总数 19。

## 前端功能校验

- 登录页已移除验证码输入和验证码图片。
- 未登录访问 `/storage` 会被路由守卫重定向到 `/login`。
- 模拟 token 访问 `/storage` 时，前端会请求：
  - `/sx/book/storage/summary`
  - `/sx/book/storage/source/config/page?pageNo=1&pageSize=20`
- 模拟 token 非真实有效 token，后端返回 401；页面使用静态数据兜底，不白屏。
- 真实 token 浏览器校验：`/storage` 渲染 4 条存储源，`/categories` 渲染 4 个分类卡片，`/tags` 渲染 20 条标签，`/books` 渲染 10 条书籍；相关接口均为 200。
- `npm run build` 通过。

## 已完成前端适配

- 认证接口路径修正：`/sys/mLogin`、`/sx/book/user/ext/me`。
- 登录页移除验证码输入与刷新。
- 首页统计改用 `/sx/book/dashboard/home-page` 聚合接口。
- 存储管理、分类管理、标签管理接入真实接口，并集中在 `src/api/resourceManagement.js` 做字段归一化。
- 新增 `docs/api-integration-guideline.md`，沉淀接口联调标准流程、写操作约定和错误处理约定。
- 资源库写操作 API 已接入：
  - 存储源：`add/edit/delete/detail` 对应前端新增、编辑、删除入口。
  - 分类：`add/edit/changeStatus` 对应前端新增、编辑、启停用入口。
  - 标签：`add/edit/delete/changeStatus` 对应前端新增、编辑、删除、启停用入口。
- 标签写操作闭环已实测：创建 `codex-test-*` 测试标签、编辑、禁用、启用、删除，全部返回成功，并已清理测试数据。
- 浏览器校验资源库新增入口：`/storage`、`/categories`、`/tags` 顶部新增按钮均能打开对应表单弹窗。

## 后续建议

- 为资源管理页补分页、筛选和搜索参数联动。
- 把首页更多模块逐步切换为 `/sx/book/dashboard/home-page` 的聚合数据，而不是仅替换顶部统计。
- 存储源和分类写操作涉及真实系统配置，建议后续使用后端提供的测试数据或专门测试租户继续做创建/删除闭环。

## 2026-06-10 书籍单文件上传自动入库前端适配

- 后端已调整 `POST /sx/book/upload/single`：上传正文文件后自动创建书籍、绑定正文文件、解析章节，并尽量提取 EPUB/PDF 的封面、作者、简介。
- 前端同步调整 `/books` 导入弹窗：
  - `src/api/books.js` 的上传结果 normalizer 保留 `bookId`、`bookName`、`storageStatus`、`parseStatus`、`coverFileId`、`contentFileId`。
  - `BooksPage.vue` 上传正文文件成功且响应包含 `bookId` 时，显示“已自动入库”状态卡，不再出现“填入新增表单”。
  - 自动入库成功后刷新书籍列表、顶部统计和筛选项。
  - 单独上传封面图片时仍保留“填入新增表单”，用于新增表单绑定 `coverFileId`。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-10 上传成功但列表未新增问题修复

- 现象：前端提示上传成功，但书籍列表未显示新增书籍。
- 原因：
  - 后端已创建书籍，但上传接口返回的 `SxBookFileVO` 未包含 `bookId/storageStatus/bookName/parseStatus`。
  - 前端无法判断该上传是否已经自动入库，因此只按普通文件上传成功处理。
  - 当前筛选或搜索条件也可能让新书在刷新后不可见。
- 后端修复：
  - `SxBookFileVO` 增加 `bookId`、`bookName`、`storageStatus`、`parseStatus`。
  - `SxBookServiceImpl.toFileVO` 在文件已绑定书籍时回填书名和解析状态。
- 前端修复：
  - 上传结果为正文文件时，即使旧接口未返回 `bookId`，也会刷新列表、统计和筛选项。
  - 上传正文成功后清空当前搜索/筛选并回到第一页，确保新导入书籍可见。

## 2026-06-08 首页概览聚合接口补充联调

- 本轮按计划推进阶段 2：`GET /sx/book/dashboard/home-page`。
- OpenAPI 已确认该接口返回 `header`、`topStats`、`serviceStatuses`、`systemMetrics`、`statusDetails`、`storageOverview`、`storageSources`、`storageConnections`、`quickActions`、`recentTasks`、`taskTabs`、`notices`、`footer` 等模块。
- 前端新增 `fetchDashboardHomePage()`，统一在 `src/api/dashboard.js` 做首页聚合数据 normalizer。
- `DashboardPage.vue` 已从单独拉取统计、任务、通知，改为一次消费首页聚合接口。
- 已接入模块：顶部 NAS 状态、顶部指标、系统服务状态、系统指标、系统详情、存储空间概览、存储源使用情况、快捷操作、任务标签、最近任务、存储连接状态、系统通知、页脚版本信息。
- 数组为空或接口失败时仍回退到原静态数据，避免首页白屏。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-08 存储新增弹窗设计还原修复

- 用户反馈接入真实接口后，“添加存储”弹窗退化为通用 Element 表单，与设计图差异过大。
- 已恢复使用原 `AddStorageModal.vue` 的大弹窗、存储类型卡片、分区表单、底部操作栏等视觉结构。
- `AddStorageModal.vue` 已从静态展示控件改为真实表单控件，新增本地目录和 MinIO 可提交到 `POST /sx/book/storage/source/config/add`。
- 后端当前实际枚举仅支持 `local/minio`，因此 SMB/WebDAV 暂在设计弹窗中保留但标记为“后端待支持”，避免前端制造假可用入口。
- 编辑存储源仍保留现有轻量配置表单，便于直接维护后端当前字段。

## 2026-06-08 书籍管理列表接口联调推进

- 本轮按计划推进阶段 4.1：书籍管理列表页。
- OpenAPI 已确认并接入：
  - `GET /sx/book/filter/options`：书籍筛选项，包含标签、书籍类型、存储源。
  - `GET /sx/book/action/metas`：书籍操作元数据。
  - `GET /sx/book/list`：书籍分页列表。
  - `GET /sx/book/dashboard/books-page-summary`：书籍页顶部统计。
  - `GET /sx/book/detail/{id}`：书籍详情，已在 API 层预留。
- `src/api/books.js` 已按后端 `SxBookQueryDTO` 收敛查询参数，不再使用旧的 `fileType` 字段，改为 `fileFormat`。
- `BooksPage.vue` 已移除对乱码 mock 配置和假列表数据的依赖，页面标题、筛选项、顶部指标、列表行均由真实接口或空态驱动。
- 真实接口失败时书籍页不再展示假书籍数据，避免联调时误判；页面会保留空态并输出控制台告警。
- `ContentManagementPage.vue` 已补通用溢出保护：页面级禁止横向撑破，筛选栏和表格只在组件内部滚动，长标题、路径、标签、状态文本统一省略并保留 `title`。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-08 书籍管理详情与行操作补充

- 本轮继续推进阶段 4.1：书籍详情、上下架、删除操作。
- 新增 API 封装：
  - `POST /sx/book/add`
  - `POST /sx/book/edit`
  - `DELETE /sx/book/delete`
  - `DELETE /sx/book/batch/delete`
  - `POST /sx/book/shelf`
  - `POST /sx/book/batch/shelf`
  - `GET /sx/book/file/history`
  - `GET /sx/book/operateLog/list`
- `BooksPage.vue` 已接入详情抽屉，点击查看时调用 `GET /sx/book/detail/{id}` 并展示标题、作者、分类、标签、文件、存储、解析、转码等字段。
- 书籍上下架已接真实接口 `POST /sx/book/shelf`，保留二次确认、loading、成功提示，并刷新列表和顶部统计。
- 书籍删除已接真实接口 `DELETE /sx/book/delete`，保留危险操作二次确认，成功后关闭当前详情并刷新数据。
- `ContentManagementPage.vue` 行操作会尊重后端 `availableActions`，仅展示当前记录允许执行的动作；危险操作增加红色状态。
- 新增/编辑/上传入口暂不做半成品表单，仅保留提示，下一步需要结合设计图和 `SxBookCreateDTO`/`SxBookEditDTO` 做完整表单。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-08 书籍新增编辑与上传补充

- 本轮继续推进阶段 4.1：新增、编辑、上传闭环。
- `src/api/books.js` 新增 `uploadBookFile()`，接入 `POST /sx/book/upload/single`，使用 `multipart/form-data` 提交 `file`、`fileType`、`bookType`。
- `BooksPage.vue` 新增书籍表单，按 `SxBookCreateDTO` / `SxBookEditDTO` 的核心必填项提交：
  - `bookName`
  - `authorName`
  - `bookType`
  - `categoryId/categoryName`
  - `subtitle`
  - `introduction`
  - `accessType`
  - `priceAmount`
  - `coverFileId`
  - `contentFileId`
  - `sortNo`
  - `remark`
  - `tagNames`
- 点击“添加书籍”打开新增表单；行内“编辑”会先拉 `GET /sx/book/detail/{id}` 回填，再提交 `POST /sx/book/edit`。
- 点击“导入书籍”打开上传弹窗；上传成功后显示文件名、大小、文件 ID，并可一键填入新增表单的正文或封面文件 ID。
- 保存成功后刷新书籍列表和顶部统计；保存失败时弹窗不关闭，保留用户输入。
- 表单和上传结果增加响应式与省略保护，避免长文件名、长 ID 或窄屏撑破弹窗。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-08 书籍后台管理追溯信息补充

- 按用户反馈，后台不再实现预览/阅读能力；查看和阅读交给前台现有界面处理。
- 本轮继续推进阶段 4.1 的后台管理信息：
  - `GET /sx/book/file/history`
  - `GET /sx/book/operateLog/list`
- `BooksPage.vue` 的书籍详情抽屉增加“文件历史”和“操作日志”两个标签页。
- 文件历史展示版本、文件类型、动作、源文件、目标文件、操作人、时间。
- 操作日志展示操作类型、描述、操作人、时间。
- 两个管理列表各取最近 5 条，接口失败时保持空态并输出控制台告警，不影响详情主体展示。
- 抽屉宽度调整为 720px，并给管理表格增加溢出保护，避免长文件名或长日志描述破坏布局。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-09 小说章节管理接口联调推进

- 本轮按计划推进阶段 4.2：小说章节。
- `src/api/books.js` 新增小说与章节 API 封装：
  - `POST /sx/book/createNovel`
  - `GET /sx/book/chapter/novel/list`
  - `POST /sx/book/chapter/novel/add`
  - `POST /sx/book/chapter/novel/edit`
  - `POST /sx/book/chapter/novel/reorder`
  - `DELETE /sx/book/chapter/novel/delete`
  - `GET /sx/book/chapter/detail/{id}`
- `NovelPage.vue` 已从静态 mock 列表切换为真实 `GET /sx/book/list?bookType=novel`，支持搜索、分类、标签、存储源、上下架状态筛选与分页。
- 新增“添加小说”表单，按后端 `SxNovelCreateDTO` 提交 `bookName`、`authorName`、`subtitle`、`categoryId`、`introduction`、`coverFileId`、`sortNo`、`remark`。
- 行内“章节”操作已接入章节抽屉，使用 `GET /sx/book/chapter/novel/list` 展示章节列表，并支持新增章节和删除章节。
- 按用户要求，后台不接入章节阅读/预览界面，`GET /sx/book/chapter/read/{id}` 留给前台阅读页使用。
- 当前小说元数据编辑、章节编辑和章节排序 API 已在 API 层预留，页面入口下一轮结合设计图补完整交互。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-09 书籍与小说主链路补齐

- 按用户要求，暂缓漫画和有声联调，优先打通书籍与小说链路。
- 书籍管理当前已具备列表、筛选、分页、详情、文件历史、操作日志、新增、编辑、上传、上下架、删除等后台管理闭环，本轮未扩大书籍页范围。
- 小说管理补齐元数据编辑：行内“编辑”会先读取 `GET /sx/book/detail/{id}` 回填，再通过 `POST /sx/book/edit` 保存，并固定 `bookType=novel`。
- 章节管理补齐编辑：行内“编辑”会通过 `GET /sx/book/chapter/read/{id}` 读取正文用于后台编辑回填，再通过 `POST /sx/book/chapter/novel/edit` 保存。
- 后台仍不实现章节阅读/预览界面；读取章节正文仅用于编辑表单回填。
- 章节管理补齐排序入口：支持上移/下移，提交前会拉取当前小说完整章节 ID 列表，再调用 `POST /sx/book/chapter/novel/reorder`，满足后端“完整顺序列表”校验。
- 新增 `fetchChapterRead()` API 封装，并在章节 normalizer 中保留 `content` 字段，避免正文处理散落在页面模板。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-09 书籍批量操作接口联调推进

- 本轮按计划优先补齐书籍管理批量操作。
- `ContentManagementPage.vue` 新增可选批量选择能力：
  - `config.selectable` 开启选择列。
  - `selectedRowKeys` 由页面受控传入。
  - `config.batchActions` 渲染批量工具条。
  - 对外触发 `selection-change` 和 `batch-action`，未开启批量的页面不受影响。
- `BooksPage.vue` 已接入批量选择、清空选择、批量上架、批量下架、批量删除。
- 已调用真实接口：
  - `POST /sx/book/batch/shelf`
  - `DELETE /sx/book/batch/delete`
- 批量操作保留二次确认；成功后清空选择，刷新书籍列表和顶部统计。
- 批量接口返回的 `summary/successCount/failedCount` 会用于结果提示，前端不自行伪造成功结果。
- 分页或筛选后会移除当前页不可见的已选项，避免对不可见旧选择误操作。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

## 2026-06-10 书籍上传目录拖拽错误修复

- 用户反馈拖拽文件夹上传书籍时，请求 `POST /sx/book/upload/single` 出现 `net::ERR_ACCESS_DENIED`。
- 原因：当前后端接口是单文件上传，浏览器拖入文件夹时可能把目录作为不可读取的 File 对象交给上传组件，直接提交会被浏览器拦截。
- `BooksPage.vue` 已在拖拽阶段处理目录：
  - 如果能读取目录内容，自动遍历目录并选择第一个支持的书籍/封面文件。
  - 如果拿到的是目录伪文件，清空选择并提示用户选择具体文件。
  - 上传提交前再次阻止目录型 File 进入接口请求。
- `src/api/books.js` 在 `uploadBookFile()` 增加单文件上传兜底校验，避免不可读目录对象进入 `/sx/book/upload/single`。
- `npm run build` 通过；构建中的 `@vueuse/core` pure annotation 与 chunk size 警告仍为既有警告。

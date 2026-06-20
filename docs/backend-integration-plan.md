# 书匣前端后端联调开发计划

更新时间：2026-06-07

## 目标

将当前前端页面从静态 mock 数据逐步切换到后端真实接口，优先覆盖已经完成高保真页面的后台管理功能，并保证后续新增页面可以复用同一套请求、字段适配、错误处理和调试流程。

## 环境信息

- 后端服务：`http://127.0.0.1:18080/jeecg-boot`
- 接口文档：`http://127.0.0.1:18080/jeecg-boot/doc.html#/home`
- OpenAPI JSON：`http://127.0.0.1:18080/jeecg-boot/v3/api-docs`
- 前端默认接口地址：`src/config/app.js` 中的 `API_BASE_URL`
- 鉴权 Header：`X-Access-Token`

## 联调原则

- 以 Knife4j/OpenAPI 文档为准，不靠接口路径猜测。
- 每接一个页面，先接查询接口，再接新增/编辑/删除等写操作。
- 页面组件继续保持可复用，接口适配放在 API/service 层，不把后端字段转换散落到 Vue 模板里。
- 后端返回统一按 Jeecg `Result` 结构处理：优先使用 `result`，同时处理 `success`、`code`、`message`。
- 写操作必须有 loading、失败提示、成功后刷新列表或局部回填。
- 删除、清理、批量状态变更等危险操作必须保留二次确认。

## 阶段 0：联调基础设施

- [ ] 确认 Docker 后端、MySQL、Redis、MinIO 都处于健康状态。
- [ ] 确认前端 CORS 已放行 `127.0.0.1:5173` / `localhost:5173`。
- [ ] 确认 `src/utils/request.js` 能统一注入 `X-Access-Token`。
- [ ] 确认登录流程可获取并持久化 token。
- [ ] 建立 API 模块目录规范，例如：
  - `src/api/auth.js`
  - `src/api/dashboard.js`
  - `src/api/storage.js`
  - `src/api/category.js`
  - `src/api/tag.js`
  - `src/api/book.js`
  - `src/api/task.js`
  - `src/api/settings.js`
- [ ] 建立统一字段适配策略：后端字段到前端视图模型统一在 API/service 层完成。

## 阶段 1：认证与基础请求

优先级最高。没有 token 后续接口都无法稳定联调。

### 接口

- `GET /sys/randomImage/{key}`：获取验证码
- `POST /sys/login`：登录

### 验收点

- [ ] 登录成功后保存 token。
- [ ] 刷新页面后仍能恢复登录态。
- [ ] 请求失败时能显示后端 `message`。
- [ ] 退出登录后清理 token 和用户信息。

## 阶段 2：首页概览页面

目标：让概览页成为第一个完整真实数据页面，用于验证全局请求、字段适配、loading 和错误状态。

### 接口

- `GET /sx/book/dashboard/home-page`：首页专用聚合，优先接入
- `GET /sx/book/dashboard/overview`：后台首页概览
- `GET /sx/book/dashboard/books-page-summary`：书籍页顶部统计
- `GET /sx/book/dashboard/notice/page`：系统通知分页
- `POST /sx/book/dashboard/notice/read`：标记已读
- `POST /sx/book/dashboard/notice/read-all`：全部标记已读
- `POST /sx/book/dashboard/subscribe/update`：更新订阅
- `POST /sx/book/dashboard/backup/run`：系统备份

### 页面联调范围

- [ ] 顶部统计卡片
- [ ] 系统状态
- [ ] 存储空间概览
- [ ] 快捷操作
- [ ] 最近任务
- [ ] 存储连接状态
- [ ] 系统通知

### 验收点

- [ ] 数据为空时页面不塌陷，有空状态。
- [ ] 聚合接口失败时页面给出错误提示，不影响侧栏和路由。
- [ ] 数字、单位、百分比格式和当前设计统一。
- [ ] 快捷操作点击后能触发对应接口或跳转到对应页面。

## 阶段 3：资源库三页

这是当前后台资源库下最适合优先完成的一组页面：存储管理、分类管理、标签管理。

### 3.1 存储管理

接口：

- `GET /sx/book/storage/summary`
- `GET /sx/book/storage/source/list`
- `GET /sx/book/storage/source/config/page`
- `GET /sx/book/storage/source/config/detail`
- `POST /sx/book/storage/source/config/add`
- `POST /sx/book/storage/source/config/edit`
- `DELETE /sx/book/storage/source/config/delete`
- `GET /sx/book/storage/file/page`
- `GET /sx/book/storage/orphan/page`
- `POST /sx/book/storage/orphan/cleanup`

验收：

- [ ] 统计卡片使用真实数据。
- [ ] 存储源列表分页、筛选、状态展示正常。
- [ ] 添加存储弹窗支持本地目录、SMB、WebDAV、网盘四类提交。
- [ ] 编辑时能回填详情。
- [ ] 删除后刷新列表。
- [ ] 接口异常时保留弹窗输入，不直接关闭。

### 3.2 分类管理

接口：

- `GET /sx/book/category/summary`
- `GET /sx/book/category/list`
- `GET /sx/book/category/tree`
- `GET /sx/book/category/options`
- `GET /sx/book/category/detail/{id}`
- `POST /sx/book/category/add`
- `POST /sx/book/category/edit`
- `POST /sx/book/category/reorder`
- `POST /sx/book/category/changeStatus`
- `DELETE /sx/book/category/delete`

验收：

- [ ] 分类卡片和树形结构使用真实数据。
- [ ] 新增、编辑、启停用、删除流程可用。
- [ ] 排序后页面顺序和后端一致。
- [ ] 书籍、小说、漫画、有声分类 tab 参数能正确传递。

### 3.3 标签管理

接口：

- `GET /sx/book/tag/summary`
- `GET /sx/book/tag/list`
- `GET /sx/book/tag/options`
- `GET /sx/book/tag/detail/{id}`
- `GET /sx/book/tag/content/page`
- `POST /sx/book/tag/add`
- `POST /sx/book/tag/edit`
- `POST /sx/book/tag/changeStatus`
- `DELETE /sx/book/tag/delete`

验收：

- [ ] 标签统计卡片使用真实数据。
- [ ] 标签表格分页、筛选、颜色展示正常。
- [ ] 新增、编辑、启停用、删除流程可用。
- [ ] 关联内容分页可从标签详情或操作入口查看。

## 阶段 4：内容管理主流程

目标：接入书籍、小说、漫画、有声的列表、详情、上传、章节或分集管理。

### 4.1 书籍管理

接口：

- `GET /sx/book/filter/options`
- `GET /sx/book/action/metas`
- `GET /sx/book/list`
- `GET /sx/book/detail/{id}`
- `POST /sx/book/add`
- `POST /sx/book/edit`
- `DELETE /sx/book/delete`
- `DELETE /sx/book/batch/delete`
- `POST /sx/book/shelf`
- `POST /sx/book/batch/shelf`
- `POST /sx/book/upload/single`
- `GET /sx/book/preview`
- `GET /sx/book/download`
- `GET /sx/book/file/history`
- `GET /sx/book/operateLog/list`

验收：

- [ ] 书籍列表搜索、筛选、分页可用。
- [ ] 顶部统计和筛选选项来自真实接口。
- [ ] 新增/编辑表单提交后列表刷新。
- [ ] 上传后能预览或下载。
- [ ] 上下架和批量上下架可用。

### 4.2 小说章节

接口：

- `POST /sx/book/createNovel`
- `GET /sx/book/chapter/novel/list`
- `POST /sx/book/chapter/novel/add`
- `POST /sx/book/chapter/novel/edit`
- `POST /sx/book/chapter/novel/reorder`
- `DELETE /sx/book/chapter/novel/delete`
- `GET /sx/book/chapter/list`
- `GET /sx/book/chapter/detail/{id}`
- `GET /sx/book/chapter/read/{id}`

验收：

- [ ] 网络小说创建、章节新增、编辑、排序、删除可用。
- [ ] 阅读内容接口能正确渲染正文。

### 4.3 漫画内容

接口：

- `GET /sx/comic/list`
- `GET /sx/comic/detail/{id}`
- `POST /sx/comic/add`
- `POST /sx/comic/edit`
- `POST /sx/comic/changeStatus`
- `DELETE /sx/comic/delete`
- `GET /sx/comic/episode/list`
- `GET /sx/comic/episode/detail/{id}`
- `POST /sx/comic/episode/add`
- `POST /sx/comic/episode/edit`
- `POST /sx/comic/episode/reorder`
- `DELETE /sx/comic/episode/delete`
- `GET /sx/comic/tag/options`
- `GET /sx/comic/export`
- `POST /sx/comic/import`

验收：

- [ ] 漫画列表、详情、章节列表可用。
- [ ] 导入导出 CSV 可用。
- [ ] 批量标签和批量状态变更可用。

### 4.4 有声内容

接口：

- `GET /sx/audio/list`
- `GET /sx/audio/detail/{id}`
- `POST /sx/audio/add`
- `POST /sx/audio/edit`
- `POST /sx/audio/changeStatus`
- `DELETE /sx/audio/delete`
- `GET /sx/audio/track/list`
- `GET /sx/audio/track/detail/{id}`
- `POST /sx/audio/track/add`
- `POST /sx/audio/track/edit`
- `POST /sx/audio/track/reorder`
- `DELETE /sx/audio/track/delete`
- `GET /sx/audio/tag/options`
- `GET /sx/audio/export`
- `POST /sx/audio/import`

验收：

- [ ] 有声专辑列表、详情、分集列表可用。
- [ ] 分集排序和状态展示正常。
- [ ] 导入导出 CSV 可用。

## 阶段 5：任务、自动化、日志

目标：接入自动化、任务中心、日志中心相关页面。

### 任务中心

- `GET /sx/book/task/summary`
- `GET /sx/book/task/list`
- `GET /sx/book/task/detail`
- `GET /sx/book/task/timeline`
- `POST /sx/book/task/action`

### 任务统计

- `GET /sx/book/task-stats/summary`
- `GET /sx/book/task-stats/trend`

### 任务日志

- `GET /sx/book/task-log/list`
- `GET /sx/book/task-log/detail/{id}`
- `GET /sx/book/task-log/fail/detail/{id}`

### 操作日志

- `GET /sx/book/operate-log/list`
- `GET /sx/book/operate-log/detail/{id}`
- `GET /sx/book/operate-log/export`
- `POST /sx/book/operate-log/cleanup`

验收：

- [ ] 任务状态和日志状态映射统一。
- [ ] 时间线、进度条、失败原因展示完整。
- [ ] 导出与清理操作有确认和结果提示。

## 阶段 6：系统设置、权限、用户

目标：补齐后台长期运营页面。

### 站点设置

- `GET /sx/book/site-setting/detail`
- `POST /sx/book/site-setting/save`

### 通知设置

- `GET /sx/book/notify-setting/channel/list`
- `GET /sx/book/notify-setting/channel/detail`
- `POST /sx/book/notify-setting/channel/save`
- `GET /sx/book/notify-setting/rule/list`
- `GET /sx/book/notify-setting/rule/detail`
- `POST /sx/book/notify-setting/rule/save`
- `GET /sx/book/notify-setting/template/list`
- `GET /sx/book/notify-setting/template/detail`
- `POST /sx/book/notify-setting/template/save`
- `POST /sx/book/notify-setting/template/test-send`

### 安全设置

- `GET /sx/book/security-setting/detail`
- `POST /sx/book/security-setting/save`
- `GET /sx/book/security-setting/audit-log/list`
- `GET /sx/book/security-setting/activity/list`

### 授权信息

- `GET /sx/book/license-info/detail`
- `GET /sx/book/license-info/purchase/list`

### 用户管理

- `GET /sx/book/user/manage/list`
- `GET /sx/book/user/manage/detail/{userId}`
- `POST /sx/book/user/manage/status`

### 角色权限

- `GET /sx/book/rbac/role-permission/view`
- `POST /sx/book/rbac/role-permission/save`

验收：

- [ ] 所有设置页保存后可重新读取并回填。
- [ ] 用户状态变更后列表即时更新。
- [ ] 权限树勾选、半选、保存回显一致。

## 阶段 7：前台与用户中心

如后续继续做前台或移动端，再接这些接口。

### 前台聚合

- `GET /sx/book/front/home`
- `GET /sx/book/front/{bizType}/home`
- `GET /sx/book/front/content/list`
- `GET /sx/book/front/content/detail/{id}`
- `GET /sx/book/front/content/catalog`
- `GET /sx/book/front/chapter/read/{id}`
- `GET /sx/book/front/reading/recent`
- `GET /sx/book/front/reading/progress`
- `POST /sx/book/front/reading/progress`

### 首页模块

- `GET /bookhouse/home/portal`
- `GET /bookhouse/home/summary`
- `GET /novel/home/portal`
- `GET /novel/home/summary`
- `GET /novel/rank/list`
- `GET /comic/home/summary`
- `GET /audio/home/portal`
- `GET /audio/home/summary`

### 用户中心

- `GET /sx/book/user/mine/overview`
- `GET /sx/book/user/mine/read-stats`
- `GET /sx/book/user/shelf/list`
- `POST /sx/book/user/shelf/add`
- `POST /sx/book/user/shelf/remove`
- `GET /sx/book/user/history/list`
- `POST /sx/book/user/history/delete`
- `POST /sx/book/user/history/clear`
- `GET /sx/book/user/message/page`
- `GET /sx/book/user/message/unread-count`
- `POST /sx/book/user/message/read`
- `POST /sx/book/user/message/read-all`
- `GET /sx/book/user/setting/detail`
- `GET /sx/book/user/setting/reader`
- `POST /sx/book/user/setting/reader`
- `GET /sx/book/user/setting/privacy`
- `POST /sx/book/user/setting/privacy`

## 每个页面的通用验收清单

- [ ] 初始加载有 loading。
- [ ] 空数据有空状态。
- [ ] 网络失败有错误提示。
- [ ] 搜索、筛选、分页参数和后端一致。
- [ ] 表格刷新后保留当前筛选条件。
- [ ] 新增、编辑、删除后数据同步刷新。
- [ ] 弹窗关闭前不会丢失失败提交时的输入。
- [ ] 所有时间、数字、容量、百分比格式统一。
- [ ] 所有接口路径在 `docs/api-dependency-log.md` 或本计划中有记录。

## 当前优先队列

1. 阶段 1：认证与 token。
2. 阶段 3.1：存储管理。
3. 阶段 3.2：分类管理。
4. 阶段 3.3：标签管理。
5. 阶段 2：首页概览聚合替换。
6. 阶段 4.1：书籍管理列表和详情。

## 变更记录

### 2026-06-07

- 初始化联调开发计划。
- 后端 Docker 已启动，接口文档可通过 Knife4j 访问。
- 当前计划中的接口来自 `GET /v3/api-docs` 筛选出的书匣业务接口。

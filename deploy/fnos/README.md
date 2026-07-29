# 书匣 fnOS 迁移包

这个目录用于把当前本地环境完整迁移到飞牛 NAS，不会重新创建业务数据。

## 迁移内容

- MySQL：账号、权限、书籍、小说、章节索引、阅读进度、书架、采集规则、订阅和任务记录。
- MinIO：`sx-book`、`novel` 及现有其他 bucket 的对象与元数据。
- 本地章节正文：`data/sx-book/chapter-content` 下的小说/书籍章节文件。
- 管理端、阅读端和当前后端的 amd64 Docker 镜像。
- Redis 不迁移旧缓存，NAS 首次启动会创建干净缓存。

## fnOS 页面操作

1. 用“文件管理”把整个 `project` 目录上传到 21.83 TB 的存储空间，例如建立 `书匣/shuxia` 目录。
2. 在 Docker 的“本地镜像”页面依次导入 `images` 目录下 6 个 `.tar` 文件。
3. 进入 Docker -> Compose -> 新增项目。
4. 项目名称填写 `shuxia`。
5. 路径选择刚上传的 `project` 目录。
6. 来源选择“上传 docker-compose.yml”，选择 `project/docker-compose.yml`。
7. 首次不要勾选“创建项目后立即启动”；确认 `.env`、`config`、`initdb` 和 `library` 均已在项目目录后再启动。

## 访问地址

- 管理端：`http://192.168.8.13:18081`
- 阅读端：`http://192.168.8.13:18082`
- 后端诊断：`http://192.168.8.13:18080/jeecg-boot/v3/api-docs`
- MinIO API：`http://192.168.8.13:19000`
- MinIO 控制台：`http://192.168.8.13:19001`

## 首次启动说明

- MySQL 仅在 `shuxia-mysql-data` 为空时执行 `initdb`。不要在第一次导入过程中反复删除项目或中断 MySQL。
- 如果第一次数据库导入确实失败，需要先删除 `shuxia-mysql-data` 卷，再重新创建项目；不要删除 `library` 目录。
- `.env` 保存数据库与 MinIO 的随机密码，不要公开或删除。
- Compose 只暴露管理端、阅读端、后端诊断和 MinIO；MySQL、Redis 不对 NAS 外部开放端口。

## 验收清单

1. 6 个容器全部运行，MySQL、Redis、MinIO、后端显示健康。
2. 管理端可以用原账号登录。
3. 存储管理只显示正式的 `sx-book` 和 `novel` 存储源。
4. 书籍列表封面、预览和下载正常。
5. 小说列表、目录和正文正常，章节数与本地迁移前一致。
6. 阅读端书架与阅读进度保留。
7. 采集规则、站点适配、订阅与任务记录保留。

## 回滚边界

迁移不会删除 Windows 本地数据。NAS 验收完成前保留原环境；若 NAS 启动失败，停止 NAS 的 `shuxia` Compose 项目即可继续使用本机环境。

# 前端接口依赖清单

## 说明
- 本文档记录 `前端已经接入或明确依赖的后端接口与字段`。
- 如果后续前端新增页面、模块或筛选项，导致依赖了新的接口、参数或字段，需要同步更新这里。
- 如果某个接口还不存在，但前端已经明确提出需求，也记录在“待补后端能力”里。

## 当前前端已接入的后端接口

### 鉴权
- `POST /sys/mLogin`
  - 用途：登录
  - 当前前端页面：`/login`
- `GET /sys/getUserInfo`
  - 用途：获取当前登录用户信息
  - 当前前端页面：全局登录态恢复、首页展示用户名
- `POST /sys/logout`
  - 用途：退出登录
  - 当前前端页面：侧边栏退出按钮

### 首页概览
- `GET /sx/book/list`
  - 用途：获取顶部 `书籍`、`小说` 统计
  - 当前前端实现：
    - 全部书籍：直接读取分页 `total`
    - 小说：传 `bookType=novel` 后读取分页 `total`
  - 说明：`漫画`、`有声` 统计目前未接真实接口
- `GET /sx/book/transcode/list`
  - 用途：首页 `最近任务`
- `GET /sx/book/operateLog/list`
  - 用途：首页 `系统通知`

### 书籍管理
- `GET /sx/book/list`
  - 用途：书籍表格分页、搜索、筛选
  - 当前已用参数：
    - `pageNo`
    - `pageSize`
    - `bookName`
    - `categoryId`
    - `bookType`
    - `publishStatus`
- `GET /sx/book/category/options`
  - 用途：书籍管理页分类筛选下拉
- `POST /sx/book/upload/single`
  - 用途：书籍单文件上传；正文文件由后端自动入库、自动解析章节，并尽量识别封面、作者、简介等元数据
  - 当前前端页面：`/books` 导入书籍弹窗
  - 当前前端行为：
    - 正文文件上传成功且响应包含 `bookId` 时，视为已自动入库，关闭二次填表流程并刷新列表/统计
    - 封面图片上传成功时，仍允许填入新增书籍表单的 `coverFileId`

## 当前前端已依赖的后端字段

### 用户信息
- 主要字段：
  - `username`
  - `realname`
  - `post`
  - `departNames`

### 书籍列表
- 主要字段：
  - `id`
  - `bookName`
  - `subtitle`
  - `authorName`
  - `bookType`
  - `categoryName`
  - `publishStatus`
  - `parseStatus`
  - `transcodeStatus`
  - `fileSize`
  - `coverUrl`
  - `createTime`

### 转码任务
- 主要字段：
  - `bookName`
  - `targetFormat`
  - `transcodeStatus`
  - `createTime`
  - `finishedTime`
  - `errorMessage`

### 操作日志
- 主要字段：
  - `operateType`
  - `operateDesc`
  - `bookName`
  - `operateByName`
  - `operateTime`

### 分类选项
- 主要字段：
  - `id`
  - `categoryName`
  - `children`

### 单文件上传结果
- 主要字段：
  - `id`
  - `bookId`
  - `bookName`
  - `fileType`
  - `bookType`
  - `fileName`
  - `fileSize`
  - `storageStatus`
  - `parseStatus`
  - `coverFileId`
  - `contentFileId`

## 待补后端能力
- 首页顶部 `漫画` 统计接口
- 首页顶部 `有声` 统计接口
- 书籍管理页顶部以下卡片的真实数据接口：
  - `本地文件`
  - `最近新增`
  - `阅读中`
- 首页以下模块的真实数据接口：
  - `系统状态`
  - `存储空间概览`
  - `存储连接状态`

## 变更记录

### 2026-05-28
- 状态：初始化文档
- 当前已接入模块：
  - 登录
  - 退出登录
  - 首页概览部分真实数据
  - 书籍管理页面
- 说明：当前依赖全部来自现有后端接口，未要求后端代码改动。

### 2026-06-10
- 状态：补充书籍单文件上传自动入库依赖
- 前端改动：
  - 上传结果保留 `bookId/storageStatus/parseStatus/bookName` 等字段。
  - `/books` 上传弹窗在正文文件自动入库后不再提示“填入新增表单”。
  - 上传成功后刷新书籍列表、顶部统计和筛选项。
- 后端依赖：
  - `/sx/book/upload/single` 正文文件上传成功后返回已绑定文件，并带回 `bookId`。
  - 上传返回体必须保留 `storageStatus` 和 `parseStatus`，用于前端展示绑定与解析状态。

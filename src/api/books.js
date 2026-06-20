import { API_BASE_URL } from '../config/app';
import request from '../utils/request';

export async function fetchBookCategories(params = {}) {
  const response = await request.get('/sx/book/category/options', {
    params: normalizePageQuery(params),
  });

  if (!response?.success || !Array.isArray(response?.result)) {
    throw new Error(response?.message || '获取分类列表失败');
  }

  return flattenCategories(response.result);
}

export async function fetchBookFilterOptions(options = {}) {
  const params = typeof options === 'string' ? { bookType: options } : options;
  const response = await request.get('/sx/book/filter/options', {
    params: normalizePageQuery(params),
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取书籍筛选项失败');
  }

  return normalizeFilterOptions(response.result);
}

export async function fetchBookActionMetas() {
  const response = await request.get('/sx/book/action/metas');

  if (!response?.success || !Array.isArray(response?.result)) {
    throw new Error(response?.message || '获取书籍操作元数据失败');
  }

  return response.result
    .map((item) => ({
      code: item.code || '',
      label: item.label || item.code || '未命名操作',
      group: item.group || '',
      order: Number(item.order || 0),
      tone: item.tone || '',
      danger: Boolean(item.danger),
      confirmText: item.confirmText || '',
      permission: item.permission || '',
      api: item.api || null,
      batchApi: item.batchApi || null,
      batchSupported: Boolean(item.batchSupported),
      raw: item,
    }))
    .sort((a, b) => a.order - b.order);
}

export async function fetchBookList(params = {}) {
  const response = await request.get('/sx/book/list', {
    params: normalizeBookQuery(params),
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取书籍列表失败');
  }

  return {
    total: Number(response.result.total || 0),
    records: Array.isArray(response.result.records) ? response.result.records.map(normalizeBookRecord) : [],
    current: Number(response.result.current || params?.pageNo || 1),
    pageSize: Number(response.result.size || params?.pageSize || 10),
    pages: Number(response.result.pages || 0),
  };
}

export async function fetchBookPageSummary(params = {}) {
  const response = await request.get('/sx/book/dashboard/books-page-summary', {
    params: normalizePageQuery(params),
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取书籍页统计失败');
  }

  return normalizeBookPageSummary(response.result);
}

export async function fetchBookDetail(id) {
  if (!id) {
    throw new Error('缺少书籍ID');
  }

  const response = await request.get(`/sx/book/detail/${encodeURIComponent(id)}`);

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取书籍详情失败');
  }

  return normalizeBookRecord(response.result);
}

export async function uploadBookFile({ file, fileType, bookType, categoryId } = {}) {
  if (!file) {
    throw new Error('请选择要上传的文件');
  }

  if (isUnreadableUploadFile(file)) {
    throw new Error('当前接口只支持上传单个文件，不能直接上传文件夹或空文件');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (fileType) formData.append('fileType', fileType);
  if (bookType) formData.append('bookType', bookType);
  if (categoryId) formData.append('categoryId', categoryId);

  const response = await request.post('/sx/book/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '上传书籍文件失败');
  }

  return normalizeBookFile(response.result);
}

export async function checkBookImportDuplicates(items = []) {
  const payloadItems = Array.isArray(items) ? items : [];
  let response;

  try {
    response = await request.post('/sx/book/import/duplicate-check', {
      items: payloadItems,
    });
  } catch (error) {
    if (isDuplicateCheckEndpointUnavailable(error)) {
      return normalizeBookDuplicateCheckResult({
        requestedCount: payloadItems.length,
        duplicateCount: 0,
        items: [],
        unavailable: true,
      });
    }
    throw error;
  }

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '检查重复书籍失败');
  }

  return normalizeBookDuplicateCheckResult(response.result);
}

function isDuplicateCheckEndpointUnavailable(error) {
  const message = `${error?.message || ''} ${error?.rawMessage || ''}`;
  return /duplicate-check|No static resource|接口暂不可用|接口不存在|404/i.test(message);
}

export async function fetchLocalBookImportRoots() {
  const response = await request.get('/sx/book/import/local/roots');

  if (!response?.success || !Array.isArray(response?.result)) {
    throw new Error(response?.message || '获取可扫描目录失败');
  }

  return response.result.map(normalizeLocalImportRoot);
}

export async function scanLocalBookImport(payload = {}) {
  const response = await request.post('/sx/book/import/local/scan', {
    rootPath: payload.rootPath,
    recursive: payload.recursive,
    maxDepth: payload.maxDepth,
    maxFiles: payload.maxFiles,
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '扫描本地目录失败');
  }

  return normalizeLocalScanResult(response.result);
}

export async function commitLocalBookImport(payload = {}) {
  const response = await request.post('/sx/book/import/local/commit', {
    authorName: payload.authorName,
    categoryId: payload.categoryId,
    autoParse: payload.autoParse,
    items: Array.isArray(payload.items) ? payload.items : [],
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '批量导入书籍失败');
  }

  return normalizeLocalImportResult(response.result);
}

function isUnreadableUploadFile(file) {
  return file instanceof File && Number(file.size || 0) === 0 && !file.type && !file.name?.includes('.');
}

export async function createBook(payload) {
  const response = await request.post('/sx/book/add', payload);

  if (!response?.success) {
    throw new Error(response?.message || '新增书籍失败');
  }

  return response.result;
}

export async function createNovel(payload) {
  const response = await request.post('/sx/book/createNovel', payload);

  if (!response?.success) {
    throw new Error(response?.message || '创建小说失败');
  }

  return response.result;
}

export async function updateBook(payload) {
  const response = await request.post('/sx/book/edit', payload);

  if (!response?.success) {
    throw new Error(response?.message || '编辑书籍失败');
  }

  return response.result;
}

export async function deleteBook(id) {
  if (!id) {
    throw new Error('缺少书籍ID');
  }

  const response = await request.delete('/sx/book/delete', {
    params: { id },
  });

  if (!response?.success) {
    throw new Error(response?.message || '删除书籍失败');
  }

  return response.result;
}

export async function batchDeleteBooks(ids = []) {
  const response = await request.delete('/sx/book/batch/delete', {
    data: { ids },
    timeout: 60000,
  });

  if (!response?.success) {
    throw new Error(response?.message || '批量删除书籍失败');
  }

  return response.result;
}

export async function changeBookShelfStatus(id, publishStatus) {
  if (!id) {
    throw new Error('缺少书籍ID');
  }

  const response = await request.post('/sx/book/shelf', {
    id,
    publishStatus,
  });

  if (!response?.success) {
    throw new Error(response?.message || '切换书籍上下架状态失败');
  }

  return response.result;
}

export async function batchChangeBookShelfStatus(ids = [], publishStatus) {
  const response = await request.post('/sx/book/batch/shelf', {
    ids,
    publishStatus,
  });

  if (!response?.success) {
    throw new Error(response?.message || '批量切换书籍上下架状态失败');
  }

  return response.result;
}

export async function fetchBookFileHistory(params = {}) {
  const response = await request.get('/sx/book/file/history', {
    params: normalizePageQuery(params),
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取书籍文件历史失败');
  }

  return normalizePageResult(response.result, normalizeBookFileHistoryRecord);
}

export async function fetchBookOperateLogs(params = {}) {
  const response = await request.get('/sx/book/operateLog/list', {
    params: normalizePageQuery(params),
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取书籍操作日志失败');
  }

  return normalizePageResult(response.result, normalizeBookOperateLogRecord);
}

export async function fetchNovelChapterList(params = {}) {
  const response = await request.get('/sx/book/chapter/novel/list', {
    params: normalizePageQuery(params),
  });

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取小说章节列表失败');
  }

  return normalizePageResult(response.result, normalizeChapterRecord);
}

export async function fetchChapterDetail(id) {
  if (!id) {
    throw new Error('缺少章节ID');
  }

  const response = await request.get(`/sx/book/chapter/detail/${encodeURIComponent(id)}`);

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取章节详情失败');
  }

  return normalizeChapterRecord(response.result);
}

export async function fetchChapterRead(id) {
  if (!id) {
    throw new Error('缺少章节ID');
  }

  const response = await request.get(`/sx/book/chapter/read/${encodeURIComponent(id)}`);

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取章节正文失败');
  }

  return normalizeChapterRecord(response.result);
}

export async function createNovelChapter(payload) {
  const response = await request.post('/sx/book/chapter/novel/add', payload);

  if (!response?.success) {
    throw new Error(response?.message || '新增小说章节失败');
  }

  return response.result;
}

export async function updateNovelChapter(payload) {
  const response = await request.post('/sx/book/chapter/novel/edit', payload);

  if (!response?.success) {
    throw new Error(response?.message || '编辑小说章节失败');
  }

  return response.result;
}

export async function reorderNovelChapters(bookId, orderedChapterIds = []) {
  const response = await request.post('/sx/book/chapter/novel/reorder', {
    bookId,
    orderedChapterIds,
  });

  if (!response?.success) {
    throw new Error(response?.message || '小说章节排序失败');
  }

  return response.result;
}

export async function deleteNovelChapter(id) {
  if (!id) {
    throw new Error('缺少章节ID');
  }

  const response = await request.delete('/sx/book/chapter/novel/delete', {
    params: { id },
  });

  if (!response?.success) {
    throw new Error(response?.message || '删除小说章节失败');
  }

  return response.result;
}

function normalizeBookQuery(params = {}) {
  const query = {
    pageNo: params.pageNo,
    pageSize: params.pageSize,
    bookName: params.bookName,
    authorName: params.authorName,
    bookType: params.bookType,
    bizType: params.bizType,
    contentModel: params.contentModel,
    fileFormat: params.fileFormat || params.fileType || params.format,
    categoryId: params.categoryId,
    tagName: params.tagName || params.tag,
    storageSource: params.storageSource || params.store,
    storagePath: params.storagePath,
    publishStatus: params.publishStatus,
  };

  Object.keys(query).forEach((key) => {
    if (query[key] === '' || query[key] === undefined || query[key] === null) {
      delete query[key];
    }
  });

  return query;
}

function normalizeFilterOptions(result = {}) {
  return {
    tagOptions: Array.isArray(result.tagOptions)
      ? result.tagOptions.filter(Boolean).map((tag) => ({ label: String(tag), value: String(tag) }))
      : [],
    bookTypeOptions: normalizeOptionList(result.bookTypeOptions),
    storageOptions: normalizeOptionList(result.storageOptions),
  };
}

function normalizePageQuery(params = {}) {
  const query = { ...params };

  Object.keys(query).forEach((key) => {
    if (query[key] === '' || query[key] === undefined || query[key] === null) {
      delete query[key];
    }
  });

  return query;
}

function normalizePageResult(result = {}, normalizer = (item) => item) {
  return {
    total: Number(result.total || 0),
    records: Array.isArray(result.records) ? result.records.map(normalizer) : [],
    current: Number(result.current || 1),
    pageSize: Number(result.size || 10),
    pages: Number(result.pages || 0),
  };
}

function normalizeOptionList(options = []) {
  if (!Array.isArray(options)) return [];

  return options
    .filter((item) => item && (item.value !== undefined || item.label !== undefined))
    .map((item) => ({
      label: item.label || item.value || '--',
      value: item.value ?? item.label ?? '',
      raw: item,
    }));
}

function normalizeBookPageSummary(result = {}) {
  const localFileSize = Number(result.localFileSize || 0);

  return {
    totalBooks: Number(result.totalBooks || 0),
    onlineBooks: Number(result.onlineBooks || 0),
    offlineBooks: Number(result.offlineBooks || 0),
    localFileCount: Number(result.localFileCount || 0),
    localFileSize,
    localFileSizeText: formatFileSize(localFileSize),
    recentAddedBooks: Number(result.recentAddedBooks || 0),
    readingBooks: Number(result.readingBooks || 0),
    raw: result,
  };
}

function flattenCategories(categories, list = []) {
  categories.forEach((item) => {
    list.push({
      id: item.id,
      code: item.categoryCode,
      name: normalizeCategoryName(item),
    });

    if (Array.isArray(item.children) && item.children.length > 0) {
      flattenCategories(item.children, list);
    }
  });

  return list;
}

function normalizeBookRecord(item = {}) {
  const bookType = String(item.bookType || '').toLowerCase();
  const coverUrl = normalizeResourceUrl(resolveBookCoverUrl(item));
  const title = item.bookName || item.title || '未命名书籍';
  const category = normalizeCategoryName({
    categoryName: item.categoryName,
    categoryCode: item.categoryCode || bookType,
  });

  return {
    id: item.id,
    raw: item,
    title,
    isbn: item.isbn || item.isbnNo || item.id || '--',
    author: item.authorName || item.author || '--',
    category,
    tags: buildTags(item, bookType),
    store: item.storageSourceName || item.storageName || item.bucketName || '书匣书库',
    path: item.storagePath || item.contentUrl || item.fileUrl || item.outputUrl || coverUrl || '--',
    format: normalizeFormat(item, bookType),
    size: formatFileSize(item.fileSize),
    scrapeStatus: normalizeParseStatus(item.parseStatus),
    publishStatus: normalizePublishStatus(item.publishStatus),
    transcodeStatus: normalizeTranscodeStatus(item.transcodeStatus),
    addedAt: formatDateTime(item.createTime),
    updatedAt: formatDateTime(item.updateTime || item.lastUpdateTime || item.createTime),
    latest: item.latestChapterTitle || item.latestEpisodeTitle || item.latestTitle || '--',
    chapterCount: formatCount(item.chapterCount || item.episodeCount, '章'),
    words: formatCount(item.wordCount || item.totalWords, '字'),
    source: item.sourceName || item.storageSourceName || item.storageName || item.bucketName || '书匣书库',
    status: normalizePublishStatus(item.publishStatus),
    statusSub: item.parseStatus !== undefined ? normalizeParseStatus(item.parseStatus) : '',
    cover: coverUrl ? `url("${coverUrl}") center/cover` : coverGradient(title),
    coverUrl,
    availableActions: Array.isArray(item.availableActions) ? item.availableActions : [],
  };
}

function resolveBookCoverUrl(item = {}) {
  return item.coverUrl
    || item.coverFile?.previewUrl
    || item.coverFile?.accessUrl
    || '';
}

function normalizeResourceUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${value}`;
  }
  return value;
}

function normalizeBookFile(item = {}) {
  return {
    id: item.id,
    bookId: item.bookId || '',
    bookName: item.bookName || '',
    fileType: item.fileType || '',
    bookType: item.bookType || '',
    fileName: item.fileName || '--',
    fileSuffix: item.fileSuffix || '',
    fileSize: formatFileSize(item.fileSize),
    storageStatus: item.storageStatus,
    storageStatusText: normalizeFileStorageStatus(item.storageStatus),
    parseStatus: item.parseStatus,
    parseStatusText: item.parseStatus !== undefined ? normalizeParseStatus(item.parseStatus) : '',
    coverFileId: item.coverFileId || '',
    contentFileId: item.contentFileId || '',
    bucketName: item.bucketName || '',
    objectName: item.objectName || '',
    storagePath: item.storagePath || '',
    accessUrl: item.accessUrl || '',
    previewUrl: item.previewUrl || '',
    duplicate: Boolean(item.duplicate),
    duplicateBookId: item.duplicateBookId || '',
    duplicateBookName: item.duplicateBookName || '',
    duplicateReason: item.duplicateReason || '',
    raw: item,
  };
}

function normalizeBookDuplicateCheckResult(result = {}) {
  return {
    requestedCount: Number(result.requestedCount || 0),
    duplicateCount: Number(result.duplicateCount || 0),
    unavailable: Boolean(result.unavailable),
    items: Array.isArray(result.items) ? result.items.map(normalizeBookDuplicateCheckItem) : [],
    raw: result,
  };
}

function normalizeBookDuplicateCheckItem(item = {}) {
  return {
    key: item.key || '',
    duplicate: Boolean(item.duplicate),
    reason: item.reason || '',
    matchType: item.matchType || '',
    existingBookId: item.existingBookId || '',
    existingBookName: item.existingBookName || '',
    existingAuthorName: item.existingAuthorName || '',
    existingBookType: item.existingBookType || '',
    existingCategoryName: item.existingCategoryName || '',
    raw: item,
  };
}

function normalizeLocalImportRoot(item = {}) {
  return {
    label: item.label || item.path || '--',
    path: item.path || '',
    exists: Boolean(item.exists),
    readable: Boolean(item.readable),
    raw: item,
  };
}

function normalizeLocalScanResult(result = {}) {
  return {
    rootPath: result.rootPath || '',
    recursive: Boolean(result.recursive),
    maxDepth: Number(result.maxDepth || 0),
    maxFiles: Number(result.maxFiles || 0),
    scannedFileCount: Number(result.scannedFileCount || 0),
    supportedFileCount: Number(result.supportedFileCount || 0),
    ignoredFileCount: Number(result.ignoredFileCount || 0),
    truncated: Boolean(result.truncated),
    totalFileSize: Number(result.totalFileSize || 0),
    totalFileSizeText: formatFileSize(result.totalFileSize),
    bookCount: Number(result.bookCount || 0),
    novelCount: Number(result.novelCount || 0),
    graphicCount: Number(result.graphicCount || 0),
    items: Array.isArray(result.items) ? result.items.map(normalizeLocalScanItem) : [],
    raw: result,
  };
}

function normalizeLocalScanItem(item = {}) {
  const title = item.title || item.fileName || '--';
  return {
    key: item.absolutePath || `${title}-${item.lastModifiedTime || ''}`,
    sourceKind: item.sourceKind || '',
    contentType: item.contentType || '',
    contentTypeLabel: item.contentTypeLabel || item.contentType || '--',
    title,
    fileName: item.fileName || title,
    extension: item.extension || '',
    absolutePath: item.absolutePath || '',
    relativePath: item.relativePath || item.absolutePath || '',
    parentPath: item.parentPath || '',
    suggestedBookType: item.suggestedBookType || item.extension || '',
    fileSize: Number(item.fileSize || 0),
    fileSizeText: formatFileSize(item.fileSize),
    childFileCount: Number(item.childFileCount || 0),
    lastModifiedTime: formatDateTime(item.lastModifiedTime),
    raw: item,
  };
}

function normalizeLocalImportResult(result = {}) {
  return {
    requestedCount: Number(result.requestedCount || 0),
    createdCount: Number(result.createdCount || 0),
    skippedCount: Number(result.skippedCount || 0),
    failedCount: Number(result.failedCount || 0),
    parsedCount: Number(result.parsedCount || 0),
    summary: result.summary || '',
    items: Array.isArray(result.items) ? result.items.map(normalizeLocalImportResultItem) : [],
    raw: result,
  };
}

function normalizeLocalImportResultItem(item = {}) {
  return {
    absolutePath: item.absolutePath || '',
    bookName: item.bookName || '--',
    bookType: item.bookType || '--',
    status: item.status || '',
    message: item.message || '',
    bookId: item.bookId || '',
    contentFileId: item.contentFileId || '',
    parsed: Boolean(item.parsed),
    raw: item,
  };
}

function normalizeFileStorageStatus(value) {
  const map = {
    0: '临时文件',
    1: '已绑定',
  };
  return map[value] || '';
}

function normalizeBookFileHistoryRecord(item = {}) {
  return {
    id: item.id,
    bookId: item.bookId,
    bookName: item.bookName || '--',
    fileType: item.fileType || '--',
    versionNo: item.versionNo ?? '--',
    actionType: item.actionType || '--',
    sourceFileName: item.sourceFileName || '--',
    targetFileName: item.targetFileName || '--',
    operateByName: item.operateByName || '--',
    operateTime: formatDateTime(item.operateTime),
    remark: item.remark || '',
    raw: item,
  };
}

function normalizeBookOperateLogRecord(item = {}) {
  return {
    id: item.id,
    bookId: item.bookId,
    bookName: item.bookName || '--',
    bizType: item.bizType || '--',
    operateType: item.operateType || '--',
    operateDesc: item.operateDesc || '--',
    operateByName: item.operateByName || '--',
    operateTime: formatDateTime(item.operateTime || item.createTime),
    raw: item,
  };
}

function normalizeChapterRecord(item = {}) {
  const title = item.chapterTitle || item.title || '未命名章节';

  return {
    id: item.id,
    bookId: item.bookId,
    raw: item,
    chapterNo: item.chapterNo ?? '--',
    chapterTitle: title,
    title,
    wordCount: Number(item.wordCount || 0),
    wordCountText: formatCount(item.wordCount, '字'),
    volumeName: item.volumeName || '--',
    content: item.content || '',
    contentPath: item.contentPath || '--',
    sliceStatus: normalizeSliceStatus(item.sliceStatus),
    parseVersion: item.parseVersion ?? '--',
    updateTime: formatDateTime(item.updateTime || item.createTime),
    createTime: formatDateTime(item.createTime),
  };
}

function buildTags(item, bookType) {
  const tags = [];
  const typeLabel = normalizeCategoryName({ categoryCode: bookType });
  if (typeLabel && typeLabel !== '全部分类') tags.push(typeLabel);
  if (Array.isArray(item.tagNames)) tags.push(...item.tagNames.filter(Boolean));
  if (item.publishStatus !== undefined) tags.push(normalizePublishStatus(item.publishStatus));
  if (item.transcodeStatus !== undefined) tags.push(normalizeTranscodeStatus(item.transcodeStatus));
  return [...new Set(tags)].slice(0, 3);
}

function normalizeCategoryName(item = {}) {
  const code = String(item.categoryCode || '').toLowerCase();
  const codeMap = {
    ebook: '电子书',
    book: '电子书',
    txt: '电子书',
    pdf: '电子书',
    epub: '电子书',
    novel: '网络小说',
    comic: '漫画',
    audio: '有声',
  };

  if (item.categoryName) return item.categoryName;
  if (codeMap[code]) return codeMap[code];
  return '未分类';
}

function normalizeFormat(item, bookType) {
  const value = item.fileFormat || item.fileType || item.bookType || item.targetFormat || bookType || '--';
  return String(value).toUpperCase();
}

function normalizeParseStatus(value) {
  const map = {
    0: '未解析',
    1: '解析中',
    2: '已解析',
    3: '解析失败',
  };
  return map[value] || '未解析';
}

function normalizePublishStatus(value) {
  const map = {
    0: '未上架',
    1: '已上架',
    2: '已下架',
  };
  return map[value] || '未上架';
}

function normalizeTranscodeStatus(value) {
  const map = {
    0: '待转码',
    1: '转码中',
    2: '已转码',
    3: '转码失败',
  };
  return map[value] || '待转码';
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!size) return '--';
  if (size >= 1024 ** 4) return `${(size / 1024 ** 4).toFixed(2)} TB`;
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GB`;
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${size} B`;
}

function formatCount(value, unit) {
  const number = Number(value || 0);
  if (!number) return '--';
  return `${number.toLocaleString('zh-CN')} ${unit}`;
}

function formatDateTime(value) {
  if (!value) return '--';
  return String(value).replace('T', ' ').slice(0, 16);
}

function normalizeSliceStatus(value) {
  const map = {
    0: '未切片',
    1: '切片中',
    2: '已切片',
    3: '切片失败',
  };
  return map[value] || '未切片';
}

function coverGradient(seed) {
  const palettes = [
    ['#14213d', '#fb8500'],
    ['#f7efe2', '#d4b894'],
    ['#111827', '#6b1d1d'],
    ['#0f2f2c', '#6ee7b7'],
    ['#e5e7eb', '#334155'],
    ['#1f2937', '#f97316'],
  ];
  const index = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  const [from, to] = palettes[index];
  return `linear-gradient(160deg, ${from}, ${to})`;
}

import {
  Check,
  Clock,
  Collection,
  Files,
  Folder,
  FolderOpened,
  PriceTag,
} from '@element-plus/icons-vue'
import request from '../utils/request'

export async function fetchStoragePageData(params = {}) {
  const [summaryResponse, sourceResponse] = await Promise.all([
    request.get('/sx/book/storage/summary'),
    request.get('/sx/book/storage/source/config/page', {
      params: {
        pageNo: 1,
        pageSize: 20,
        ...params,
      },
    }),
  ])

  assertSuccess(summaryResponse, '获取存储摘要失败')
  assertSuccess(sourceResponse, '获取存储源列表失败')

  const summary = summaryResponse.result || {}
  const page = sourceResponse.result || {}
  const rows = Array.isArray(page.records) ? page.records.map(normalizeStorageRow) : []
  const enabledCount = rows.filter((row) => row.raw?.status === 1).length

  return {
    metrics: [
      { label: '总存储源', value: formatNumber(summary.sourceCount ?? rows.length), unit: '个', sub: `已启用 ${enabledCount} 个`, color: 'blue', icon: FolderOpened },
      { label: '正常运行', value: formatNumber(enabledCount), unit: '个', sub: rows.length ? `${Math.round((enabledCount / rows.length) * 100)}%` : '0%', color: 'green', icon: Check },
      { label: '总容量', value: formatBytesValue(summary.totalStorageBytes).value, unit: formatBytesValue(summary.totalStorageBytes).unit, sub: `已用 ${formatBytes(summary.usedStorageBytes)}`, color: 'blue', icon: Collection },
      { label: '可用容量', value: formatBytesValue(summary.availableStorageBytes).value, unit: formatBytesValue(summary.availableStorageBytes).unit, sub: usageText(summary.usedStorageBytes, summary.totalStorageBytes), color: 'purple', icon: Clock },
      { label: '总文件数', value: formatNumber(summary.totalFileCount), unit: '个', sub: `已绑定 ${formatNumber(summary.boundFileCount)}`, color: 'orange', icon: Folder },
      { label: '可清理文件', value: formatNumber(summary.orphanFileCount), unit: '个', sub: `临时文件 ${formatNumber(summary.tempFileCount)}`, color: 'cyan', icon: Clock },
    ],
    rows,
    total: Number(page.total || rows.length),
  }
}

export async function createStorageSource(payload) {
  const response = await request.post('/sx/book/storage/source/config/add', payload)
  return readMutationResult(response, '新增存储源失败')
}

export async function updateStorageSource(payload) {
  const response = await request.post('/sx/book/storage/source/config/edit', payload)
  return readMutationResult(response, '编辑存储源失败')
}

export async function deleteStorageSource(id) {
  const response = await request.delete('/sx/book/storage/source/config/delete', {
    params: { id },
  })
  return readMutationResult(response, '删除存储源失败')
}

export async function cleanupOrphanStorageFiles(payload = {}) {
  const response = await request.post('/sx/book/storage/orphan/cleanup', payload)
  return readMutationResult(response, '清理孤儿/临时文件失败')
}

export async function fetchCategoryPageData() {
  const [summaryResponse, treeResponse] = await Promise.all([
    request.get('/sx/book/category/summary'),
    request.get('/sx/book/category/tree'),
  ])

  assertSuccess(summaryResponse, '获取分类摘要失败')
  assertSuccess(treeResponse, '获取分类树失败')

  const summary = summaryResponse.result || {}
  const roots = Array.isArray(treeResponse.result) ? treeResponse.result.map(normalizeCategoryGroup) : []

  return {
    summary,
    roots,
  }
}

export async function createCategory(payload) {
  const response = await request.post('/sx/book/category/add', payload)
  return readMutationResult(response, '新增分类失败')
}

export async function updateCategory(payload) {
  const response = await request.post('/sx/book/category/edit', payload)
  return readMutationResult(response, '编辑分类失败')
}

export async function deleteCategory(id) {
  const response = await request.delete('/sx/book/category/delete', {
    params: { id },
  })
  return readMutationResult(response, '删除分类失败')
}

export async function changeCategoryStatus(id, status) {
  const response = await request.post('/sx/book/category/changeStatus', {
    id,
    status,
  })
  return readMutationResult(response, '切换分类状态失败')
}

export async function fetchTagPageData(params = {}) {
  const [summaryResponse, tagResponse] = await Promise.all([
    request.get('/sx/book/tag/summary'),
    request.get('/sx/book/tag/list', {
      params: {
        pageNo: 1,
        pageSize: 20,
        ...params,
      },
    }),
  ])

  assertSuccess(summaryResponse, '获取标签摘要失败')
  assertSuccess(tagResponse, '获取标签列表失败')

  const summary = summaryResponse.result || {}
  const page = tagResponse.result || {}
  const rows = Array.isArray(page.records) ? page.records.map(normalizeTagRow) : []

  return {
    summary,
    metrics: [
      { label: '全部标签', value: formatNumber(summary.totalTagCount), unit: '个', sub: '总计', color: 'blue', icon: PriceTag },
      { label: '书籍标签', value: formatNumber(summary.ebookTagCount), unit: '个', sub: `已使用 ${formatNumber(summary.usedTagCount)} 个`, color: 'green', icon: PriceTag },
      { label: '小说标签', value: formatNumber(summary.novelTagCount), unit: '个', sub: `关联 ${formatNumber(summary.totalRelationCount)} 次`, color: 'purple', icon: PriceTag },
      { label: '漫画标签', value: formatNumber(summary.comicTagCount), unit: '个', sub: `未使用 ${formatNumber(summary.unusedTagCount)} 个`, color: 'orange', icon: PriceTag },
      { label: '有声标签', value: formatNumber(summary.audioTagCount), unit: '个', sub: '音频内容', color: 'cyan', icon: PriceTag },
    ],
    rows,
    total: Number(page.total || rows.length),
    pageNo: Number(page.current || params.pageNo || 1),
    pageSize: Number(page.size || params.pageSize || 20),
  }
}

export async function createTag(payload) {
  const response = await request.post('/sx/book/tag/add', payload)
  return readMutationResult(response, '新增标签失败')
}

export async function updateTag(payload) {
  const response = await request.post('/sx/book/tag/edit', payload)
  return readMutationResult(response, '编辑标签失败')
}

export async function deleteTag(id) {
  const response = await request.delete('/sx/book/tag/delete', {
    params: { id },
  })
  return readMutationResult(response, '删除标签失败')
}

export async function changeTagStatus(id, status) {
  const response = await request.post('/sx/book/tag/changeStatus', {
    id,
    status,
  })
  return readMutationResult(response, '切换标签状态失败')
}

function assertSuccess(response, fallbackMessage) {
  if (!response?.success) {
    throw new Error(response?.message || fallbackMessage)
  }
}

function readMutationResult(response, fallbackMessage) {
  assertSuccess(response, fallbackMessage)
  return response.result
}

function normalizeStorageRow(item = {}) {
  const total = Number(item.totalBytes || item.totalStorageBytes || 0)
  const used = Number(item.usedBytes || item.usedStorageBytes || 0)
  const percent = total ? Math.round((used / total) * 100) : Number(item.usagePercent || 0)
  const sourceType = String(item.sourceType || '').toLowerCase()

  return {
    raw: item,
    id: item.id,
    name: item.sourceName || item.sourceKey || '--',
    desc: item.remark || item.bucketName || item.sourceKey || '--',
    type: normalizeSourceType(item.sourceType),
    path: item.localBasePath || item.endpoint || item.bucketName || '--',
    total: formatBytes(total),
    used: formatBytes(used),
    percent: Math.min(Math.max(percent, 0), 100),
    free: formatBytes(item.availableBytes || Math.max(total - used, 0)),
    status: item.status === 0 ? '禁用' : '正常',
    scan: formatDateTime(item.updateTime || item.createTime),
    files: formatNumber(item.fileCount),
    color: sourceType === 'minio' ? 'purple' : 'blue',
    scannable: sourceType === 'local' && item.status !== 0 && Boolean(item.localBasePath),
    scanPath: item.localBasePath || '',
  }
}

function normalizeCategoryGroup(item = {}, index = 0) {
  const children = Array.isArray(item.children)
    ? item.children.map((child, childIndex) => normalizeCategoryGroup(child, childIndex))
    : []
  const categoryName = item.categoryName || item.categoryCode || '--'
  const directUsageCount = Number(item.usageCount || 0)
  const usageCount = children.length
    ? children.reduce((total, child) => total + Number(child.usageCount || 0), 0)
    : directUsageCount

  return {
    raw: item,
    id: item.id,
    title: categoryName,
    label: `${categoryName} (${formatNumber(usageCount)} 本)`,
    count: `${formatNumber(usageCount)} 本`,
    usageCount,
    directUsageCount,
    status: Number(item.status ?? 1),
    color: ['blue', 'green', 'purple', 'orange'][index % 4],
    children,
  }
}

function normalizeTagRow(item = {}) {
  const bizType = normalizeBizType(item.bizType)
  const usageCount = Number(item.usageCount || 0)

  return {
    raw: item,
    id: item.id,
    name: item.tagName || '--',
    color: pickTagColor(item.bizType),
    type: bizType,
    count: formatNumber(usageCount),
    related: `${bizType}内容 ${formatNumber(usageCount)} 条`,
    createdAt: formatDateTime(item.createTime),
    status: Number(item.status ?? 1),
    statusText: Number(item.status ?? 1) === 0 ? '禁用' : '启用',
  }
}

function normalizeSourceType(value) {
  const map = {
    local: '本地目录',
    minio: 'MinIO',
    smb: 'SMB',
    webdav: 'WebDAV',
  }

  return map[String(value || '').toLowerCase()] || value || '--'
}

function normalizeBizType(value) {
  const map = {
    ebook: '书籍',
    book: '书籍',
    novel: '小说',
    comic: '漫画',
    audio: '有声',
  }

  return map[String(value || '').toLowerCase()] || value || '全部内容'
}

function pickTagColor(value) {
  const colors = {
    ebook: '#1476ff',
    book: '#1476ff',
    novel: '#7c3aed',
    comic: '#ff951c',
    audio: '#32a8cf',
  }

  return colors[String(value || '').toLowerCase()] || '#1476ff'
}

function usageText(used, total) {
  const percent = total ? Math.round((Number(used || 0) / Number(total || 1)) * 100) : 0
  return `${percent}% 已使用`
}

function formatBytesValue(value) {
  const text = formatBytes(value)
  const [number, unit = 'B'] = text.split(' ')

  return {
    value: number,
    unit,
  }
}

function formatBytes(value) {
  const size = Number(value || 0)
  if (!size) return '0 B'
  if (size >= 1024 ** 4) return `${(size / 1024 ** 4).toFixed(2)} TB`
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GB`
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(2)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${size} B`
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatDateTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 16)
}

import {
  CircleCheck,
  CircleClose,
  Clock,
  DataAnalysis,
  Finished,
  Key,
  Refresh,
  Timer,
  TrendCharts,
  VideoPlay,
  Warning,
} from '@element-plus/icons-vue'
import request from '../utils/request'
import { API_BASE_URL } from '../config/app'

export const BIZ_TYPE_OPTIONS = [
  { label: '书籍', value: 'ebook' },
  { label: '小说', value: 'novel' },
  { label: '漫画', value: 'comic' },
  { label: '有声', value: 'audio' },
]

export const STATUS_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

export const REQUEST_METHOD_OPTIONS = ['GET', 'POST']

export async function fetchScrapeRulesPage(params = {}) {
  const response = await request.get('/sx/book/scrape-rule/list', {
    params: { pageNo: 1, pageSize: 10, ...cleanParams(params) },
  })
  const page = readPageResponse(response, '获取扫描规则失败')
  const rows = page.records.map(normalizeScrapeRule)
  const enabled = rows.filter((row) => row.enabled).length

  return {
    rows,
    total: page.total,
    current: page.current,
    pageSize: page.pageSize,
    metrics: [
      metric('规则总数', page.total, '条', '接口返回总数', 'blue', DataAnalysis),
      metric('当前页启用', enabled, '条', `${rows.length ? Math.round((enabled / rows.length) * 100) : 0}%`, 'green', CircleCheck),
      metric('当前页规则', rows.length, '条', '当前筛选结果', 'purple', Finished),
      metric('关联渠道', uniqueCount(rows.map((row) => row.channelCode)), '个', '当前页去重', 'orange', Key),
      metric('覆盖内容类型', uniqueCount(rows.map((row) => row.raw.bizType)), '种', '当前页去重', 'cyan', TrendCharts),
    ],
  }
}

export async function fetchScrapeRuleDetail(id) {
  if (!id) throw new Error('缺少规则ID')
  const response = await request.get(`/sx/book/scrape-rule/detail/${encodeURIComponent(id)}`)
  return normalizeScrapeRuleDetail(readResultResponse(response, '获取扫描规则详情失败') || {})
}

export async function createScrapeRule(payload) {
  const response = await request.post('/sx/book/scrape-rule/add', normalizeScrapeRulePayload(payload))
  if (!response?.success) throw new Error(response?.message || '新增扫描规则失败')
  return response.result
}

export async function updateScrapeRule(payload) {
  const response = await request.post('/sx/book/scrape-rule/edit', normalizeScrapeRulePayload(payload))
  if (!response?.success) throw new Error(response?.message || '编辑扫描规则失败')
  return response.result
}

export async function changeScrapeRuleStatus({ id, status }) {
  const response = await request.post('/sx/book/scrape-rule/changeStatus', { id, status })
  if (!response?.success) throw new Error(response?.message || '切换扫描规则状态失败')
  return response.result
}

export async function deleteScrapeRule(id) {
  if (!id) throw new Error('缺少规则ID')
  const response = await request.delete('/sx/book/scrape-rule/delete', { params: { id } })
  if (!response?.success) throw new Error(response?.message || '删除扫描规则失败')
  return response.result
}

export async function debugScrapeRule(payload = {}) {
  const response = await request.post('/sx/book/scrape-rule/debug', cleanParams(payload))
  return readResultResponse(response, '调试扫描规则失败')
}

export async function analyzeScrapeRule(payload = {}) {
  const response = await request.post('/sx/book/scrape-rule/analyze', cleanParams({
    url: trimText(payload.url),
    bizType: trimText(payload.bizType),
    requestMethod: payload.requestMethod || 'GET',
    requestHeadersJson: trimText(payload.requestHeadersJson),
  }))
  return normalizeScrapeRuleAnalyze(readResultResponse(response, '自动分析扫描源失败') || {})
}

export async function discoverScrapeRuleNovels(payload = {}) {
  const response = await request.post('/sx/book/scrape-rule/discover', cleanParams({
    ruleId: payload.ruleId,
    listUrl: trimText(payload.listUrl),
    entryUrls: Array.isArray(payload.entryUrls) ? payload.entryUrls.map(trimText).filter(Boolean) : undefined,
    detailUrlSelector: trimText(payload.detailUrlSelector),
    paginationUrlTemplate: trimText(payload.paginationUrlTemplate),
    nextPageSelector: trimText(payload.nextPageSelector),
    startPage: payload.startPage,
    maxItems: payload.maxItems,
    maxPages: payload.maxPages,
    sameHostOnly: payload.sameHostOnly,
    requestDelayMs: payload.requestDelayMs,
  }))
  return normalizeScrapeRuleDiscover(readResultResponse(response, '按规则发现小说失败') || {})
}

export async function batchSyncScrapeRuleNovels(payload = {}) {
  const response = await request.post('/sx/book/scrape-rule/batchSync', cleanParams({
    ruleId: payload.ruleId,
    listUrl: trimText(payload.listUrl),
    entryUrls: Array.isArray(payload.entryUrls) ? payload.entryUrls.map(trimText).filter(Boolean) : undefined,
    detailUrlSelector: trimText(payload.detailUrlSelector),
    paginationUrlTemplate: trimText(payload.paginationUrlTemplate),
    nextPageSelector: trimText(payload.nextPageSelector),
    startPage: payload.startPage,
    maxPages: payload.maxPages,
    detailUrls: Array.isArray(payload.detailUrls) ? payload.detailUrls.map(trimText).filter(Boolean) : undefined,
    maxItems: payload.maxItems,
    sameHostOnly: payload.sameHostOnly,
    syncChapters: payload.syncChapters !== false,
    requestDelayMs: payload.requestDelayMs,
    cronExpr: trimText(payload.cronExpr),
  }))
  return normalizeScrapeRuleBatchSync(readResultResponse(response, '按规则批量同步小说失败') || {})
}

export async function fetchScrapeChannelsPage(params = {}) {
  const response = await request.get('/sx/book/scrape-channel/list', {
    params: { pageNo: 1, pageSize: 10, ...cleanParams(params) },
  })
  const page = readPageResponse(response, '获取连接模板失败')
  const rows = page.records.map(normalizeScrapeChannel)

  return {
    rows,
    total: page.total,
    current: page.current,
    pageSize: page.pageSize,
    metrics: [
      metric('渠道总数', page.total, '个', '接口返回总数', 'blue', Key),
      metric('当前页启用', rows.filter((row) => row.enabled).length, '个', '可作为连接模板复用', 'green', CircleCheck),
      metric('关联规则', sum(rows.map((row) => row.raw.linkedRuleCount)), '条', '当前页累计', 'purple', TrendCharts),
      metric('测试成功率', formatAveragePercent(rows.map((row) => row.raw.successRate)), '', '当前页平均', 'cyan', Finished),
    ],
  }
}

export async function fetchScrapeChannelDetail(id) {
  if (!id) throw new Error('缺少连接模板ID')
  const response = await request.get(`/sx/book/scrape-channel/detail/${encodeURIComponent(id)}`)
  return normalizeScrapeChannelDetail(readResultResponse(response, '获取连接模板详情失败') || {})
}

export async function createScrapeChannel(payload) {
  const response = await request.post('/sx/book/scrape-channel/add', normalizeScrapeChannelPayload(payload))
  if (!response?.success) throw new Error(response?.message || '新增连接模板失败')
  return response.result
}

export async function updateScrapeChannel(payload) {
  const response = await request.post('/sx/book/scrape-channel/edit', normalizeScrapeChannelPayload(payload))
  if (!response?.success) throw new Error(response?.message || '编辑连接模板失败')
  return response.result
}

export async function changeScrapeChannelStatus({ id, status }) {
  const response = await request.post('/sx/book/scrape-channel/changeStatus', { id, status })
  if (!response?.success) throw new Error(response?.message || '切换连接模板状态失败')
  return response.result
}

export async function deleteScrapeChannel(id) {
  if (!id) throw new Error('缺少连接模板ID')
  const response = await request.delete('/sx/book/scrape-channel/delete', { params: { id } })
  if (!response?.success) throw new Error(response?.message || '删除连接模板失败')
  return response.result
}

export async function testScrapeChannel(id) {
  if (!id) throw new Error('缺少连接模板ID')
  const response = await request.post('/sx/book/scrape-channel/test', { id })
  return readResultResponse(response, '测试连接模板失败')
}

export async function fetchTaskCenterPage(params = {}) {
  const [summaryResponse, listResponse] = await Promise.all([
    request.get('/sx/book/task/summary'),
    request.get('/sx/book/task/list', {
      params: { pageNo: 1, pageSize: 10, ...cleanParams(params) },
    }),
  ])
  const summary = readResultResponse(summaryResponse, '获取任务摘要失败') || {}
  const page = readPageResponse(listResponse, '获取任务列表失败')
  const rows = page.records.map(normalizeTaskRow)

  return {
    metrics: buildTaskMetrics(summary),
    tabs: buildTaskTabs(summary),
    rows,
    total: page.total,
    current: page.current,
    pageSize: page.pageSize,
    detail: buildTaskDetail(rows[0]),
  }
}

export async function fetchTaskDetail({ taskType, taskId }) {
  if (!taskType || !taskId) throw new Error('缺少任务类型或任务ID')
  const response = await request.get('/sx/book/task/detail', {
    params: { taskType, taskId },
  })
  return normalizeTaskRow(readResultResponse(response, '获取任务详情失败') || {})
}

export async function fetchTaskTimeline(params = {}) {
  const response = await request.get('/sx/book/task/timeline', {
    params: { pageNo: 1, pageSize: 10, ...cleanParams(params) },
  })
  const page = readPageResponse(response, '获取任务时间线失败')
  return {
    rows: page.records.map(normalizeTaskLog),
    total: page.total,
    current: page.current,
    pageSize: page.pageSize,
  }
}

export async function runTaskAction(payload) {
  const response = await request.post('/sx/book/task/action', cleanParams(payload))
  if (!response?.success) throw new Error(response?.message || '任务操作失败')
  return response.result
}

export async function batchDeleteTasks(tasks = []) {
  const items = tasks
    .filter((item) => item?.taskType && item?.taskId)
    .map((item) => ({ taskType: item.taskType, taskId: item.taskId }))
  if (!items.length) throw new Error('璇峰厛閫夋嫨瑕佸垹闄ょ殑浠诲姟')
  const response = await request.post('/sx/book/task/batch-delete', { tasks: items })
  if (!response?.success) throw new Error(response?.message || '鎵归噺鍒犻櫎浠诲姟澶辫触')
  return Number(response.result || 0)
}

export async function fetchSubscribePage() {
  const response = await request.get('/sx/book/dashboard/subscribe/list')
  return normalizeSubscribePage(readResultResponse(response, '获取订阅列表失败') || {})
}

export async function refreshSubscribePage() {
  const response = await request.post('/sx/book/dashboard/subscribe/update')
  return normalizeSubscribePage(readResultResponse(response, '刷新订阅快照失败') || {})
}

export async function fetchNovelSyncPage(params = {}) {
  const response = await request.get('/sx/book/subscription/list', {
    params: { pageNo: 1, pageSize: 10, ...cleanParams(params) },
  })
  const page = readPageResponse(response, '获取小说同步订阅失败')
  const rows = page.records.map(normalizeNovelSyncRow)

  return {
    rows,
    total: page.total,
    current: page.current,
    pageSize: page.pageSize,
    pages: page.pages,
    metrics: buildNovelSyncMetrics(rows, page.total),
  }
}

export async function fetchNovelSyncDetail(id) {
  if (!id) throw new Error('缺少订阅ID')
  const response = await request.get(`/sx/book/subscription/detail/${encodeURIComponent(id)}`)
  return normalizeNovelSyncDetail(readResultResponse(response, '获取小说同步详情失败') || {})
}

export async function createNovelSyncSubscription(payload = {}) {
  const response = await request.post('/sx/book/subscription/add', normalizeNovelSyncPayload(payload))
  if (!response?.success) throw new Error(response?.message || '新增小说同步订阅失败')
  return response.result
}

export async function updateNovelSyncSubscription(payload = {}) {
  const response = await request.post('/sx/book/subscription/edit', normalizeNovelSyncPayload(payload))
  if (!response?.success) throw new Error(response?.message || '保存小说同步订阅失败')
  return response.result
}

export async function changeNovelSyncStatus({ id, status }) {
  const response = await request.post('/sx/book/subscription/changeStatus', { id, status })
  if (!response?.success) throw new Error(response?.message || '切换小说同步状态失败')
  return response.result
}

export async function batchChangeNovelSyncStatus(payload = {}) {
  const response = await request.post('/sx/book/subscription/batch-change-status', cleanParams({
    status: payload.status,
    ids: Array.isArray(payload.ids) ? payload.ids.filter(Boolean) : [],
    allMatched: Boolean(payload.allMatched),
    keyword: trimText(payload.keyword),
    sourceId: payload.sourceId,
    targetType: payload.targetType,
    currentStatus: payload.currentStatus,
  }))
  if (!response?.success) throw new Error(response?.message || '批量切换小说同步状态失败')
  return Number(response.result || 0)
}

export async function batchDeleteNovelSyncSubscriptions(payload = {}) {
  const response = await request.post('/sx/book/subscription/batch-delete', cleanParams({
    ids: Array.isArray(payload.ids) ? payload.ids.filter(Boolean) : [],
    allMatched: Boolean(payload.allMatched),
    keyword: trimText(payload.keyword),
    sourceId: payload.sourceId,
    targetType: payload.targetType,
    currentStatus: payload.currentStatus,
  }))
  if (!response?.success) throw new Error(response?.message || '批量删除小说同步订阅失败')
  return Number(response.result || 0)
}

export async function deleteNovelSyncSubscription(id) {
  if (!id) throw new Error('缺少订阅ID')
  const response = await request.delete('/sx/book/subscription/delete', { params: { id } })
  if (!response?.success) throw new Error(response?.message || '删除小说同步订阅失败')
  return response.result
}

export async function runNovelSyncNow(payload = {}) {
  const response = await request.post('/sx/book/scrape/runNow', cleanParams({
    subscriptionId: payload.subscriptionId,
    syncChapters: Boolean(payload.syncChapters),
    maxChapters: payload.maxChapters,
    requestDelayMs: payload.requestDelayMs,
  }))
  return normalizeNovelSyncRunResult(readResultResponse(response, '执行小说同步失败') || {})
}

export async function quickSyncNovelByUrl(payload = {}) {
  const response = await request.post('/sx/book/scrape/quickSync', cleanParams({
    detailUrl: trimText(payload.detailUrl),
    bookId: payload.bookId,
    syncChapters: payload.syncChapters !== false,
    requestDelayMs: payload.requestDelayMs,
    cronExpr: trimText(payload.cronExpr),
  }))
  return normalizeNovelQuickSyncResult(readResultResponse(response, '小说链接同步失败') || {})
}

export async function analyzeNovelByUrl(payload = {}) {
  const response = await request.post('/sx/book/scrape/analyze', cleanParams({
    detailUrl: trimText(payload.detailUrl),
    bookId: payload.bookId,
    title: trimText(payload.title),
    author: trimText(payload.author),
    intro: trimText(payload.intro),
    coverUrl: trimText(payload.coverUrl),
  }))
  return normalizeNovelUrlAnalyze(readResultResponse(response, '小说网址分析失败') || {})
}

export async function analyzeSmartScrapeUrl(url) {
  const response = await request.post('/sx/book/auto-scrape/analyze', { url: trimText(url) })
  return normalizeSmartScrapeAnalyze(readResultResponse(response, '解析 URL 失败') || {})
}

export async function importSmartScrapeBook({ preview, conflictStrategy } = {}) {
  const response = await request.post('/sx/book/auto-scrape/import', {
    preview,
    conflictStrategy,
  })
  const result = readResultResponse(response, '导入书籍库失败') || {}
  return {
    bookId: result.bookId || '',
    action: result.action || '',
    message: result.message || '导入成功',
    raw: result,
  }
}

export async function analyzeSmartScrapeWebContent({ url, bookId, ruleId } = {}) {
  const response = await request.post('/sx/book/auto-scrape/content/analyze', cleanParams({
    url: trimText(url),
    bookId,
    ruleId,
  }))
  return normalizeSmartScrapeWebContentAnalyze(readResultResponse(response, '解析网页正文失败') || {})
}

export async function startSmartScrapeWebContent({
  url,
  bookId,
  ruleId,
  overwriteExisting = false,
  maxChapters = 100,
} = {}) {
  const response = await request.post('/sx/book/auto-scrape/content/start', cleanParams({
    url: trimText(url),
    bookId,
    ruleId,
    overwriteExisting,
    maxChapters,
  }))
  return normalizeSmartScrapeWebContentTask(readResultResponse(response, '抓取网页正文失败') || {})
}

export function normalizeBizType(value) {
  const map = {
    ebook: '书籍',
    book: '书籍',
    novel: '小说',
    comic: '漫画',
    audio: '有声',
  }

  return map[String(value || '').toLowerCase()] || value || '--'
}

export function bizTypeValue(label) {
  const option = BIZ_TYPE_OPTIONS.find((item) => item.label === label || item.value === label)
  return option?.value || ''
}

export function statusValue(label) {
  if (label === '启用') return 1
  if (label === '禁用') return 0
  return undefined
}

function readPageResponse(response, fallbackMessage) {
  const result = readResultResponse(response, fallbackMessage) || {}
  return {
    records: Array.isArray(result.records) ? result.records : [],
    total: Number(result.total || 0),
    current: Number(result.current || 1),
    pageSize: Number(result.size || result.pageSize || 10),
    pages: Number(result.pages || 0),
  }
}

function readResultResponse(response, fallbackMessage) {
  if (!response?.success) {
    throw new Error(normalizeBusinessErrorMessage(response?.message, fallbackMessage))
  }

  return response.result
}

function normalizeBusinessErrorMessage(message, fallbackMessage) {
  const value = String(message || '').trim()
  if (!value) return fallbackMessage
  if (/No static resource/i.test(value)) return '接口暂不可用，请确认后端服务已更新'
  return value
}

function normalizeScrapeRule(item = {}) {
  const priority = Number(item.priority || 0)
  const status = Number(item.status ?? 1)
  const entryUrl = item.listUrl || item.debugUrl || item.baseUrl || '--'

  return {
    raw: item,
    id: item.id,
    name: item.ruleName || '--',
    desc: item.remark || item.debugUrl || item.listUrl || item.baseUrl || '--',
    type: normalizeBizType(item.bizType),
    content: [normalizeBizType(item.bizType)].filter(Boolean),
    source: item.siteName || item.baseUrl || '--',
    channelCode: item.channelCode || '--',
    entryUrl,
    entryLabel: item.listUrl ? '列表地址' : item.debugUrl ? '调试地址' : item.baseUrl ? '站点根地址' : '未配置入口',
    enabled: status === 1,
    statusLabel: status === 1 ? '启用' : '禁用',
    statusTone: status === 1 ? 'green' : 'slate',
    priority,
    priorityLabel: priorityLabel(priority),
    lastRun: formatDateTime(item.updateTime || item.createTime),
    rate: item.channelCode ? '已绑定' : '--',
  }
}

function normalizeScrapeRuleDetail(item = {}) {
  return {
    id: item.id || '',
    ruleName: item.ruleName || '',
    bizType: item.bizType || 'ebook',
    siteName: item.siteName || '',
    channelCode: item.channelCode || '',
    baseUrl: item.baseUrl || '',
    listUrl: item.listUrl || '',
    debugUrl: item.debugUrl || '',
    requestMethod: item.requestMethod || 'GET',
    requestHeadersJson: item.requestHeadersJson || '',
    listSelector: item.listSelector || '',
    titleSelector: item.titleSelector || '',
    authorSelector: item.authorSelector || '',
    introSelector: item.introSelector || '',
    coverSelector: item.coverSelector || '',
    chapterSelector: item.chapterSelector || '',
    chapterTitleSelector: item.chapterTitleSelector || '',
    chapterUrlSelector: item.chapterUrlSelector || '',
    contentSelector: item.contentSelector || '',
    priority: Number(item.priority ?? 50),
    status: Number(item.status ?? 1),
    remark: item.remark || '',
    raw: item,
  }
}

function normalizeScrapeRulePayload(payload = {}) {
  return {
    id: payload.id || undefined,
    ruleName: trimText(payload.ruleName),
    bizType: payload.bizType,
    siteName: trimText(payload.siteName),
    channelCode: trimText(payload.channelCode),
    baseUrl: trimText(payload.baseUrl),
    listUrl: trimText(payload.listUrl),
    debugUrl: trimText(payload.debugUrl),
    requestMethod: payload.requestMethod || 'GET',
    requestHeadersJson: trimText(payload.requestHeadersJson),
    listSelector: trimText(payload.listSelector),
    titleSelector: trimText(payload.titleSelector),
    authorSelector: trimText(payload.authorSelector),
    introSelector: trimText(payload.introSelector),
    coverSelector: trimText(payload.coverSelector),
    chapterSelector: trimText(payload.chapterSelector),
    chapterTitleSelector: trimText(payload.chapterTitleSelector),
    chapterUrlSelector: trimText(payload.chapterUrlSelector),
    contentSelector: trimText(payload.contentSelector),
    priority: Number(payload.priority ?? 50),
    status: Number(payload.status ?? 1),
    remark: trimText(payload.remark),
  }
}

function normalizeScrapeRuleAnalyze(item = {}) {
  return {
    raw: item,
    requestUrl: item.requestUrl || '',
    baseUrl: item.baseUrl || '',
    listUrl: item.listUrl || '',
    debugUrl: item.debugUrl || '',
    requestMethod: item.requestMethod || 'GET',
    requestHeadersJson: item.requestHeadersJson || '',
    listSelector: item.listSelector || '',
    titleSelector: item.titleSelector || '',
    authorSelector: item.authorSelector || '',
    introSelector: item.introSelector || '',
    coverSelector: item.coverSelector || '',
    chapterSelector: item.chapterSelector || '',
    chapterTitleSelector: item.chapterTitleSelector || '',
    chapterUrlSelector: item.chapterUrlSelector || '',
    contentSelector: item.contentSelector || '',
    apiMode: item.apiMode || '',
    remark: item.remark || '',
    httpStatus: item.httpStatus,
    documentTitle: item.documentTitle || '',
    responseLength: Number(item.responseLength || 0),
    listMatchCount: Number(item.listMatchCount || 0),
    chapterMatchCount: Number(item.chapterMatchCount || 0),
    passed: Boolean(item.passed),
    errorMessage: item.errorMessage || '',
    notes: Array.isArray(item.notes) ? item.notes : [],
  }
}

function normalizeScrapeRuleDiscover(item = {}) {
  const candidates = Array.isArray(item.candidates) ? item.candidates.map(normalizeScrapeRuleCandidate) : []
  return {
    raw: item,
    ruleId: item.ruleId || '',
    ruleName: item.ruleName || '--',
    siteName: item.siteName || '--',
    requestUrl: item.requestUrl || '',
    httpStatus: item.httpStatus,
    responseLength: Number(item.responseLength || 0),
    listMatchCount: Number(item.listMatchCount || 0),
    scannedPageCount: Number(item.scannedPageCount || 0),
    candidateCount: Number(item.candidateCount ?? candidates.length),
    passed: Boolean(item.passed),
    errorMessage: item.errorMessage || '',
    candidates,
  }
}

function normalizeScrapeRuleCandidate(item = {}) {
  return {
    id: item.detailUrl || `${item.title || 'candidate'}-${item.author || ''}`,
    title: item.title || '--',
    author: item.author || '--',
    intro: item.intro || '',
    coverUrl: item.coverUrl || '',
    detailUrl: item.detailUrl || '',
    latestChapterTitle: item.latestChapterTitle || '',
    raw: item,
  }
}

function normalizeScrapeRuleBatchSync(item = {}) {
  return {
    raw: item,
    taskId: item.taskId || '',
    ruleId: item.ruleId || '',
    ruleName: item.ruleName || '--',
    requestUrl: item.requestUrl || '',
    candidateCount: Number(item.candidateCount || 0),
    submitted: Boolean(item.submitted),
    message: item.message || '批量同步任务已提交',
  }
}

function normalizeScrapeChannel(item = {}) {
  const status = Number(item.status ?? 1)
  const totalTestCount = Number(item.totalTestCount || 0)

  return {
    raw: item,
    id: item.id,
    code: item.channelCode || '--',
    name: item.channelName || item.channelCode || '--',
    type: normalizeBizType(item.bizType),
    site: item.siteName || '--',
    endpoint: item.baseUrl || item.testUrl || '--',
    status: status === 1 ? '启用' : '禁用',
    tone: status === 1 ? 'green' : 'slate',
    enabled: status === 1,
    quota: `${totalTestCount} 次测试`,
    latency: item.lastTestStatusCode ? `HTTP ${item.lastTestStatusCode}` : '--',
    lastTest: item.lastTestPassed === true ? '通过' : item.lastTestPassed === false ? '失败' : '未测试',
    lastTestTone: item.lastTestPassed === true ? 'green' : item.lastTestPassed === false ? 'red' : 'slate',
    successRate: formatPercent(item.successRate),
    rules: Number(item.linkedRuleCount || 0),
  }
}

function normalizeScrapeChannelDetail(item = {}) {
  return {
    id: item.id || '',
    channelCode: item.channelCode || '',
    channelName: item.channelName || '',
    bizType: item.bizType || 'ebook',
    siteName: item.siteName || '',
    baseUrl: item.baseUrl || '',
    testUrl: item.testUrl || '',
    requestMethod: item.requestMethod || 'GET',
    requestHeadersJson: item.requestHeadersJson || '',
    priority: Number(item.priority ?? 50),
    status: Number(item.status ?? 1),
    remark: item.remark || '',
    raw: item,
  }
}

function normalizeScrapeChannelPayload(payload = {}) {
  return {
    id: payload.id || undefined,
    channelCode: trimText(payload.channelCode),
    channelName: trimText(payload.channelName),
    bizType: payload.bizType,
    siteName: trimText(payload.siteName),
    baseUrl: trimText(payload.baseUrl),
    testUrl: trimText(payload.testUrl),
    requestMethod: payload.requestMethod || 'GET',
    requestHeadersJson: trimText(payload.requestHeadersJson),
    priority: Number(payload.priority ?? 50),
    status: Number(payload.status ?? 1),
    remark: trimText(payload.remark),
  }
}

function normalizeTaskRow(item = {}) {
  const statusInfo = taskStatusInfo(item.taskStatus)
  const progress = taskProgress(item.taskStatus)
  const title = item.bookName || item.taskId || '--'

  return {
    raw: item,
    id: `${item.taskType || 'TASK'}:${item.taskId || item.id || title}`,
    taskId: item.taskId,
    taskType: item.taskType,
    name: title,
    desc: item.errorMessage || item.authorName || item.targetFormat || item.bookId || '--',
    kind: item.taskTypeName || normalizeTaskType(item.taskType),
    source: item.taskType || '--',
    status: item.taskStatusName || statusInfo.label,
    statusValue: Number(item.taskStatus),
    tone: statusInfo.tone,
    progress,
    start: formatDateTime(item.createTime),
    duration: item.finishedTime ? formatDateTime(item.finishedTime) : '--',
    cover: String(title).slice(0, 1),
    canPause: Boolean(item.canPause),
    canTerminate: Boolean(item.canTerminate),
    canRetry: Boolean(item.canRetry),
    canDelete: Boolean(item.canDelete),
  }
}

function normalizeTaskLog(item = {}) {
  const statusInfo = taskStatusInfo(item.taskStatus)

  return {
    raw: item,
    id: item.id || `${item.taskType || ''}:${item.taskId || ''}:${item.eventTime || item.createTime || ''}`,
    time: formatDateTime(item.eventTime || item.createTime),
    action: item.actionName || item.actionType || '--',
    message: item.errorMessage || item.detailMessage || '--',
    status: item.taskStatusName || statusInfo.label,
    tone: statusInfo.tone,
    operator: item.operateByName || '--',
  }
}

function normalizeSubscribePage(result = {}) {
  const rows = Array.isArray(result.items) ? result.items.map(normalizeSubscribeRow) : []

  return {
    rows,
    total: rows.length,
    summary: result,
  }
}

function normalizeSubscribeRow(item = {}) {
  return {
    raw: item,
    id: item.bookId,
    name: item.bookName || item.bookId || '--',
    type: normalizeBizType(item.bookType),
    source: item.latestChapterTitle || '--',
    status: Number(item.publishStatus || 0) === 1 ? '已发布' : '未发布',
    tone: Number(item.publishStatus || 0) === 1 ? 'green' : 'slate',
    cadence: `${Number(item.chapterCount || 0)} 章`,
    lastRun: item.latestChapterTime || item.bookUpdateTime || '--',
  }
}

function normalizeNovelSyncRow(item = {}) {
  const status = Number(item.status ?? 1)
  const lastStatus = String(item.lastSyncStatus || '').toLowerCase()
  const taskStatus = String(item.latestTaskResultStatus || '').toUpperCase()
  const displayStatus = status === 1 ? '启用' : '停用'
  const resultStatus = taskStatus || lastStatus.toUpperCase()
  const remarkOptions = parseNovelSyncRemark(item.remark)
  const addedCount = Number(item.latestTaskAddedChapterCount || 0)
  const skippedCount = Number(item.latestTaskSkippedChapterCount || 0)
  const failedCount = Number(item.latestTaskFailedChapterCount || 0)
  const processedCount = addedCount + skippedCount + failedCount
  const chapterCount = Number(item.latestTaskChapterCount || 0)
  const isRunning = resultStatus === 'RUNNING' || Number(item.latestTaskStatus) === 1
  const progress = chapterCount > 0 ? Math.min(100, Math.round((processedCount / chapterCount) * 100)) : (isRunning ? 1 : 0)
  const startedTime = formatDateTime(item.latestTaskStartedTime)
  const finishedTime = formatDateTime(item.latestTaskFinishedTime)
  const taskElapsedMs = resolveTaskElapsedMs(item.latestTaskStartedTime, item.latestTaskFinishedTime, item.latestTaskDurationMs)
  const runningSummary = buildNovelSyncRunningSummary({
    isRunning,
    processedCount,
    chapterCount,
    addedCount,
    skippedCount,
    failedCount,
    requestDelayMs: remarkOptions.requestDelayMs,
    elapsedMs: taskElapsedMs,
  })
  return {
    raw: item,
    id: item.id,
    bookId: item.bookId || '',
    name: item.bookName || item.bookId || '--',
    author: item.authorName || '--',
    source: item.sourceName || item.sourceId || '--',
    sourceId: item.sourceId || '',
    detailUrl: item.detailUrl || '--',
    cron: item.cronExpr || '--',
    latestRemoteChapter: item.latestRemoteChapter || '--',
    latestSyncTime: formatDateTime(item.latestSyncTime),
    lastSyncStatus: normalizeSyncStatusLabel(resultStatus, lastStatus),
    lastSyncTone: syncStatusTone(resultStatus, lastStatus),
    lastSyncMessage: item.latestTaskErrorMessage || item.lastSyncMessage || item.latestTaskResultStatusLabel || '--',
    status: displayStatus,
    statusValue: status,
    statusTone: status === 1 ? 'green' : 'slate',
    taskId: item.latestTaskId || '',
    latestTaskSummary: buildLatestTaskSummary(item),
    latestTaskStatus: Number(item.latestTaskStatus ?? -1),
    latestTaskResultStatus: resultStatus,
    latestTaskLatestRemoteChapter: item.latestTaskLatestRemoteChapter || item.latestRemoteChapter || '--',
    latestTaskChapterCount: chapterCount,
    latestTaskProcessedCount: processedCount,
    latestTaskAddedChapterCount: addedCount,
    latestTaskSkippedChapterCount: skippedCount,
    latestTaskFailedChapterCount: failedCount,
    latestTaskLocalChapterCountAfterSync: item.latestTaskLocalChapterCountAfterSync,
    latestTaskStartedTime: startedTime,
    latestTaskFinishedTime: finishedTime,
    latestTaskUpdateTime: formatDateTime(item.latestTaskUpdateTime),
    latestTaskDurationMs: taskElapsedMs,
    latestTaskDurationText: formatDuration(taskElapsedMs),
    latestTaskErrorMessage: item.latestTaskErrorMessage || '',
    isRunning,
    progress,
    progressText: chapterCount > 0 ? `${processedCount}/${chapterCount}` : processedCount ? `${processedCount} 章` : '--',
    runningSummary,
    canPause: Boolean(item.latestTaskCanPause),
    canTerminate: Boolean(item.latestTaskCanTerminate),
    canRetry: Boolean(item.latestTaskCanRetry),
    canResume: Boolean(item.latestTaskCanResume),
    maxChapters: remarkOptions.maxChapters,
    requestDelayMs: remarkOptions.requestDelayMs,
  }
}

function normalizeNovelSyncDetail(item = {}) {
  const remarkOptions = parseNovelSyncRemark(item.remark)
  return {
    ...normalizeNovelSyncRow(item),
    targetType: item.targetType || 'cloud',
    targetTypeLabel: item.targetTypeLabel || item.targetType || '--',
    remark: remarkOptions.remark,
    maxChapters: remarkOptions.maxChapters,
    requestDelayMs: remarkOptions.requestDelayMs,
    overwriteMetadata: Boolean(remarkOptions.overwriteMetadata),
    syncChapters: remarkOptions.syncChapters !== false,
    catalogUrlSelector: remarkOptions.catalogUrlSelector || '',
    catalogUrlTemplate: remarkOptions.catalogUrlTemplate || '',
    deriveCatalogListHtml: Boolean(remarkOptions.deriveCatalogListHtml),
    contentRemoveSelectors: Array.isArray(remarkOptions.contentRemoveSelectors) ? remarkOptions.contentRemoveSelectors : [],
    contentLineFilters: Array.isArray(remarkOptions.contentLineFilters) ? remarkOptions.contentLineFilters : [],
    scheduleNextFireTime: formatDateTime(item.scheduleNextFireTime),
    scheduleTriggerStateLabel: item.scheduleTriggerStateLabel || '--',
    createTime: formatDateTime(item.createTime),
    updateTime: formatDateTime(item.updateTime),
    raw: item,
  }
}

function normalizeNovelSyncPayload(payload = {}) {
  const remarkOptions = {
    remark: trimText(payload.remark),
    maxChapters: Number(payload.maxChapters || 0) || undefined,
    requestDelayMs: Number(payload.requestDelayMs ?? 0),
    syncChapters: payload.syncChapters !== false,
    overwriteMetadata: Boolean(payload.overwriteMetadata),
    catalogUrlSelector: trimText(payload.catalogUrlSelector),
    catalogUrlTemplate: trimText(payload.catalogUrlTemplate),
    deriveCatalogListHtml: Boolean(payload.deriveCatalogListHtml),
    contentRemoveSelectors: normalizeLines(payload.contentRemoveSelectors),
    contentLineFilters: normalizeLines(payload.contentLineFilters),
  }

  return cleanParams({
    id: payload.id,
    bookId: payload.bookId,
    sourceId: payload.sourceId,
    detailUrl: trimText(payload.detailUrl),
    targetType: payload.targetType || 'cloud',
    cronExpr: payload.cronExpr,
    status: Number(payload.status ?? 1),
    remark: JSON.stringify(cleanParams(remarkOptions)),
  })
}

function normalizeNovelSyncRunResult(item = {}) {
  return {
    raw: item,
    taskId: item.taskId || '',
    subscriptionId: item.subscriptionId || '',
    bookId: item.bookId || '',
    bookName: item.bookName || '--',
    sourceName: item.sourceName || '--',
    ruleName: item.ruleName || '--',
    detailUrl: item.detailUrl || '',
    title: item.title || '--',
    author: item.author || '--',
    coverUrl: item.coverUrl || '',
    intro: item.intro || '',
    latestChapterTitle: item.latestChapterTitle || '--',
    chapterCount: Number(item.chapterCount || 0),
    chapterTitleSamples: Array.isArray(item.chapterTitleSamples) ? item.chapterTitleSamples : [],
    chapterUrlSamples: Array.isArray(item.chapterUrlSamples) ? item.chapterUrlSamples : [],
    contentSample: item.contentSample || '',
    syncChapters: Boolean(item.syncChapters),
    addedChapterCount: Number(item.addedChapterCount || 0),
    skippedChapterCount: Number(item.skippedChapterCount || 0),
    failedChapterCount: Number(item.failedChapterCount || 0),
    localChapterCountAfterSync: item.localChapterCountAfterSync,
    chapterOrderMode: item.chapterOrderMode || '--',
    chapterDedupMode: item.chapterDedupMode || '--',
    httpStatus: item.httpStatus,
    message: item.message || '执行完成',
    executedAt: formatDateTime(item.executedAt),
  }
}

function normalizeNovelQuickSyncResult(item = {}) {
  return {
    raw: item,
    detailUrl: item.detailUrl || '',
    bookId: item.bookId || '',
    bookName: item.bookName || '--',
    authorName: item.authorName || '--',
    sourceId: item.sourceId || '',
    sourceName: item.sourceName || '--',
    ruleId: item.ruleId || '',
    ruleName: item.ruleName || '--',
    subscriptionId: item.subscriptionId || '',
    createdBook: Boolean(item.createdBook),
    createdChannel: Boolean(item.createdChannel),
    createdRule: Boolean(item.createdRule),
    createdSubscription: Boolean(item.createdSubscription),
    matchedBy: item.matchedBy || '',
    submittedAsync: Boolean(item.submittedAsync),
    message: item.message || '同步任务已提交',
    runResult: normalizeNovelSyncRunResult(item.runResult || {}),
  }
}

function normalizeNovelUrlAnalyze(item = {}) {
  const warningTextMap = {
    'No existing source configuration matched; confirmation will create one automatically': '未匹配到现有来源配置，确认采集时会自动创建',
    'No existing scrape rule matched; confirmation will create an automatic rule': '未匹配到现有站点适配，确认采集时会自动创建',
    'No chapters were detected during analysis; confirm only after checking the URL type and site adapter': '分析阶段没有识别到章节，请确认网址类型和站点适配后再采集',
  }
  return {
    raw: item,
    detailUrl: item.detailUrl || '',
    bookName: item.bookName || '--',
    authorName: item.authorName || '--',
    intro: item.intro || '',
    coverUrl: item.coverUrl || '',
    sourceId: item.sourceId || '',
    sourceName: item.sourceName || '--',
    ruleId: item.ruleId || '',
    ruleName: item.ruleName || '',
    existingBookId: item.existingBookId || '',
    existingSubscriptionId: item.existingSubscriptionId || '',
    matchedBy: item.matchedBy || '',
    existingBook: Boolean(item.existingBook),
    existingSubscription: Boolean(item.existingSubscription),
    chapterCount: Number(item.chapterCount || 0),
    latestChapterTitle: item.latestChapterTitle || '--',
    chapterTitleSamples: Array.isArray(item.chapterTitleSamples) ? item.chapterTitleSamples : [],
    warnings: Array.isArray(item.warnings) ? item.warnings.map((text) => warningTextMap[text] || text) : [],
    message: '网址分析完成，尚未创建或更新书籍、来源、规则、追更计划和任务',
  }
}

function buildNovelSyncMetrics(rows = [], total = rows.length) {
  return [
    metric('追更计划', total, '条', '当前筛选结果', 'blue', DataAnalysis),
    metric('启用中', rows.filter((row) => row.statusValue === 1).length, '条', '可被定时触发', 'green', CircleCheck),
    metric('最近成功', rows.filter((row) => row.lastSyncTone === 'green').length, '条', '当前页统计', 'purple', Finished),
    metric('需要关注', rows.filter((row) => ['red', 'orange'].includes(row.lastSyncTone)).length, '条', '失败或暂停', 'orange', Warning),
  ]
}

function buildLatestTaskSummary(item = {}) {
  const parts = [
    item.latestTaskResultStatusLabel || item.latestTaskStatusLabel,
    item.latestTaskAddedChapterCount !== undefined ? `新增 ${item.latestTaskAddedChapterCount}` : '',
    item.latestTaskSkippedChapterCount !== undefined ? `跳过 ${item.latestTaskSkippedChapterCount}` : '',
    item.latestTaskFailedChapterCount !== undefined ? `失败 ${item.latestTaskFailedChapterCount}` : '',
  ].filter(Boolean)
  return parts.join(' / ') || '--'
}

function buildNovelSyncRunningSummary({
  isRunning,
  processedCount,
  chapterCount,
  addedCount,
  skippedCount,
  failedCount,
  requestDelayMs,
  elapsedMs,
} = {}) {
  if (!isRunning) return ''
  const base = chapterCount > 0 ? `已处理 ${processedCount}/${chapterCount} 章` : `已处理 ${processedCount} 章`
  const counts = `新增 ${addedCount}，跳过 ${skippedCount}，失败 ${failedCount}`
  const delay = Number(requestDelayMs || 0) >= 5000 ? `，间隔 ${requestDelayMs}ms` : ''
  const elapsed = elapsedMs > 0 ? `，已运行 ${formatDuration(elapsedMs)}` : ''
  return `${base}；${counts}${delay}${elapsed}`
}

function normalizeSyncStatusLabel(resultStatus, lastStatus) {
  const value = String(resultStatus || lastStatus || '').toUpperCase()
  if (value === 'SUCCESS' || value === 'SUCCESSFUL' || value === 'success'.toUpperCase()) return '成功'
  if (value === 'FAIL' || value === 'FAILED' || value === 'fail'.toUpperCase()) return '失败'
  if (value === 'RUNNING') return '运行中'
  if (value === 'PAUSED' || value === 'paused'.toUpperCase()) return '已暂停'
  if (value === 'TERMINATED') return '已终止'
  if (value === 'PENDING' || value === 'pending'.toUpperCase()) return '待执行'
  return value || '--'
}

function syncStatusTone(resultStatus, lastStatus) {
  const value = String(resultStatus || lastStatus || '').toUpperCase()
  if (value === 'SUCCESS' || value === 'SUCCESSFUL') return 'green'
  if (value === 'FAIL' || value === 'FAILED') return 'red'
  if (value === 'RUNNING' || value === 'PENDING') return 'blue'
  if (value === 'PAUSED' || value === 'TERMINATED') return 'orange'
  if (String(lastStatus || '').toLowerCase() === 'success') return 'green'
  if (String(lastStatus || '').toLowerCase() === 'fail') return 'red'
  if (String(lastStatus || '').toLowerCase() === 'paused') return 'orange'
  return 'slate'
}

function parseNovelSyncRemark(remark) {
  const fallback = {
    remark: typeof remark === 'string' ? remark : '',
    maxChapters: undefined,
    requestDelayMs: 1000,
    syncChapters: true,
    overwriteMetadata: false,
    deriveCatalogListHtml: false,
  }
  if (!remark || typeof remark !== 'string' || !remark.trim().startsWith('{')) {
    return fallback
  }
  try {
    const parsed = JSON.parse(remark)
    return {
      ...fallback,
      ...parsed,
      remark: parsed.remark || '',
      maxChapters: parsed.maxChapters === undefined ? fallback.maxChapters : Number(parsed.maxChapters),
      requestDelayMs: Number(parsed.requestDelayMs ?? fallback.requestDelayMs),
    }
  } catch {
    return fallback
  }
}

function normalizeLines(value) {
  if (Array.isArray(value)) return value.map(trimText).filter(Boolean)
  if (typeof value !== 'string') return []
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

function normalizeSmartScrapeAnalyze(result = {}) {
  const preview = normalizeSmartScrapePreview(result.preview || {})
  const warnings = Array.isArray(result.warnings) ? result.warnings : preview.warnings
  return {
    siteType: result.siteType || '--',
    pageType: result.pageType || '--',
    confidence: Number(result.confidence || 0),
    confidenceText: `${Math.round(Number(result.confidence || 0) * 100)}%`,
    warnings,
    preview: {
      ...preview,
      warnings,
    },
    raw: result,
  }
}

function normalizeSmartScrapePreview(item = {}) {
  const coverUrl = item.coverUrl || ''
  return {
    bookName: item.bookName || '',
    authorName: item.authorName || '',
    coverUrl,
    coverPreviewUrl: buildSmartScrapeCoverPreviewUrl(coverUrl),
    publisher: item.publisher || '',
    publishYear: item.publishYear || '',
    isbn: item.isbn || '',
    pageCount: item.pageCount || '',
    price: item.price || '',
    rating: item.rating ?? '',
    ratingCount: item.ratingCount ?? '',
    introduction: item.introduction || '',
    authorIntro: item.authorIntro || '',
    catalog: item.catalog || '',
    sourceSite: item.sourceSite || '',
    sourceUrl: item.sourceUrl || '',
    externalId: item.externalId || '',
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
    warnings: Array.isArray(item.warnings) ? item.warnings : [],
    conflict: item.conflict ? normalizeSmartScrapeConflict(item.conflict) : null,
    raw: item,
  }
}

function buildSmartScrapeCoverPreviewUrl(coverUrl) {
  const value = trimText(coverUrl)
  if (!value) return ''
  const baseUrl = API_BASE_URL.replace(/\/$/, '')
  return `${baseUrl}/sx/book/auto-scrape/cover-preview?url=${encodeURIComponent(value)}`
}

function normalizeSmartScrapeConflict(item = {}) {
  return {
    bookId: item.bookId || '',
    bookName: item.bookName || '',
    authorName: item.authorName || '',
    matchType: item.matchType || '',
    message: item.message || '',
    raw: item,
  }
}

function normalizeSmartScrapeWebContentAnalyze(item = {}) {
  const confidence = Number(item.confidence || 0)
  return {
    siteType: item.siteType || '--',
    pageType: item.pageType || '--',
    confidence,
    confidenceText: `${Math.round(confidence * 100)}%`,
    ruleId: item.ruleId || '',
    ruleName: item.ruleName || '',
    siteName: item.siteName || '',
    sourceUrl: item.sourceUrl || '',
    bookId: item.bookId || '',
    bookName: item.bookName || '',
    authorName: item.authorName || '',
    chapterCount: Number(item.chapterCount || 0),
    sampleChapters: Array.isArray(item.sampleChapters) ? item.sampleChapters.map(normalizeWebContentChapter) : [],
    warnings: Array.isArray(item.warnings) ? item.warnings : [],
    raw: item,
  }
}

function normalizeWebContentChapter(item = {}) {
  return {
    chapterNo: Number(item.chapterNo || 0),
    chapterTitle: item.chapterTitle || '',
    chapterUrl: item.chapterUrl || '',
    contentSample: item.contentSample || '',
    wordCount: Number(item.wordCount || 0),
    raw: item,
  }
}

function normalizeSmartScrapeWebContentTask(item = {}) {
  return {
    taskId: item.taskId || '',
    taskType: item.taskType || '',
    bookId: item.bookId || '',
    totalChapterCount: Number(item.totalChapterCount || 0),
    successCount: Number(item.successCount || 0),
    skippedCount: Number(item.skippedCount || 0),
    failedCount: Number(item.failedCount || 0),
    taskStatus: Number(item.taskStatus ?? -1),
    message: item.message || '',
    raw: item,
  }
}

function buildTaskMetrics(summary = {}) {
  return [
    metric('任务总数', summary.totalCount, '个', '所有任务', 'blue', DataAnalysis),
    metric('处理中', summary.processingCount, '个', '正在处理', 'green', VideoPlay),
    metric('等待中', summary.pendingCount, '个', '队列等待', 'orange', Timer),
    metric('已完成', summary.successCount, '个', '成功任务', 'purple', CircleCheck),
    metric('失败', summary.failCount, '个', '失败任务', 'orange', Warning),
    metric('本地扫描', summary.localScanTaskCount, '个', '扫描任务', 'cyan', Refresh),
    metric('网页抓取', summary.webScrapeTaskCount, '个', '正文入库', 'green', VideoPlay),
  ]
}

function buildTaskTabs(summary = {}) {
  return [
    `全部 (${formatNumber(summary.totalCount)})`,
    `处理中 (${formatNumber(summary.processingCount)})`,
    `待处理 (${formatNumber(summary.pendingCount)})`,
    `成功 (${formatNumber(summary.successCount)})`,
    `失败 (${formatNumber(summary.failCount)})`,
  ]
}

export function buildTaskDetail(row, logs = []) {
  if (!row) {
    return {
      title: '暂无任务',
      subtitle: '当前筛选条件下没有任务记录',
      status: '暂无',
      priority: '任务类型：--',
      cover: '--',
      fields: [['任务ID', '--'], ['任务类型', '--'], ['开始时间', '--'], ['完成时间', '--'], ['目标格式', '--'], ['章节数量', '--']],
      logs: [],
      progress: 0,
    }
  }

  const source = row.raw || row
  return {
    title: row.name,
    subtitle: row.desc,
    status: row.status,
    priority: `任务类型：${row.kind}`,
    cover: row.cover || row.name?.slice(0, 1) || '--',
    fields: [
      ['任务ID', row.taskId || source.taskId || '--'],
      ['任务类型', row.kind || '--'],
      ['开始时间', row.start || formatDateTime(source.createTime)],
      ['完成时间', formatDateTime(source.finishedTime)],
      ['目标格式', source.targetFormat || '--'],
      ['章节数量', source.chapterCount ?? '--'],
    ],
    logs: logs.length ? logs.map((item) => `${item.time} ${item.action}：${item.message}`) : [row.desc].filter((item) => item && item !== '--'),
    progress: row.progress,
  }
}

function metric(label, value, unit, sub, color, icon) {
  return {
    label,
    value: typeof value === 'string' ? value : formatNumber(value),
    unit,
    sub,
    color,
    icon,
  }
}

function taskStatusInfo(value) {
  const map = {
    0: { label: '待处理', tone: 'orange' },
    1: { label: '处理中', tone: 'blue' },
    2: { label: '成功', tone: 'green' },
    3: { label: '失败', tone: 'red' },
  }

  return map[Number(value)] || { label: '--', tone: 'slate' }
}

function taskProgress(value) {
  const map = {
    0: 0,
    1: 50,
    2: 100,
    3: 100,
  }

  return map[Number(value)] ?? 0
}

function normalizeTaskType(value) {
  const map = {
    PARSE: '解析',
    TRANSCODE: '转码',
    SLICE: '切片',
    LOCAL_SCAN: '本地扫描',
    WEB_SCRAPE: '网页抓取',
  }

  return map[String(value || '').toUpperCase()] || value || '--'
}

function priorityLabel(value) {
  const priority = Number(value || 0)
  if (priority >= 90) return '高'
  if (priority >= 50) return '中'
  return '低'
}

function formatNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toLocaleString() : '0'
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '--'
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return '--'
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`
}

function formatAveragePercent(values = []) {
  const valid = values.map(Number).filter((value) => Number.isFinite(value))
  if (!valid.length) return '--'
  return formatPercent(valid.reduce((total, value) => total + value, 0) / valid.length)
}

function formatDateTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 19)
}

function resolveTaskElapsedMs(startedAt, finishedAt, durationMs) {
  const explicit = Number(durationMs)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  const start = parseDateTime(startedAt)
  if (!start) return 0
  const end = parseDateTime(finishedAt) || new Date()
  return Math.max(0, end.getTime() - start.getTime())
}

function parseDateTime(value) {
  if (!value) return null
  const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDuration(ms) {
  const seconds = Math.floor(Number(ms || 0) / 1000)
  if (seconds <= 0) return '0秒'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const restSeconds = seconds % 60
  if (hours > 0) return `${hours}小时${minutes}分`
  if (minutes > 0) return `${minutes}分${restSeconds}秒`
  return `${restSeconds}秒`
}

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : value
}

function uniqueCount(values) {
  return new Set(values.filter((value) => value !== '' && value !== null && value !== undefined && value !== '--')).size
}

function sum(values = []) {
  return values.reduce((total, value) => total + Number(value || 0), 0)
}

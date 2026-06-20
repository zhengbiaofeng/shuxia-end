import request from '../utils/request'

const DASHBOARD_LIMITS = {
  topStats: 6,
  serviceStatuses: 8,
  systemMetrics: 4,
  statusDetails: 4,
  storageSources: 5,
  storageConnections: 6,
  quickActions: 6,
  taskTabs: 5,
  recentTasks: 6,
  notices: 5,
}

export async function fetchDashboardHomePage() {
  const response = await request.get('/sx/book/dashboard/home-page')

  if (!response?.success || !response?.result) {
    throw new Error(response?.message || '获取首页聚合数据失败')
  }

  return normalizeDashboardHomePage(response.result)
}

export async function fetchDashboardTopStats() {
  const dashboard = await fetchDashboardHomePage()

  return {
    bookTotal: readStatValue(dashboard.topStats[0]),
    novelTotal: readStatValue(dashboard.topStats[1]),
  }
}

function normalizeDashboardHomePage(result = {}) {
  const storageOverview = result.storageOverview || {}

  return {
    header: {
      nasName: result.header?.nasName || '--',
      runStatusText: result.header?.runStatusText || result.header?.statusText || '--',
      runStatusTone: normalizeTone(result.header?.runStatusTone || result.header?.statusTone, 'green'),
      time: result.header?.serverTime || result.header?.time || '',
    },
    topStats: normalizeArray(result.topStats, normalizeMetricCard, DASHBOARD_LIMITS.topStats),
    serviceStatuses: normalizeArray(result.serviceStatuses, normalizeServiceStatus, DASHBOARD_LIMITS.serviceStatuses),
    systemMetrics: normalizeArray(result.systemMetrics, normalizeSystemMetric, DASHBOARD_LIMITS.systemMetrics),
    statusDetails: normalizeArray(result.statusDetails, normalizeStatusDetail, DASHBOARD_LIMITS.statusDetails),
    storageOverview: {
      totalText: storageOverview.totalText || formatBytes(storageOverview.totalBytes),
      usedText: storageOverview.usedText || formatBytes(storageOverview.usedBytes),
      usagePercent: clampPercent(storageOverview.usagePercent),
      usageText: storageOverview.usageText || buildUsageText(storageOverview),
    },
    storageSources: normalizeArray(result.storageSources, normalizeStorageSource, DASHBOARD_LIMITS.storageSources),
    storageConnections: normalizeArray(result.storageConnections, normalizeStorageConnection, DASHBOARD_LIMITS.storageConnections),
    quickActions: normalizeArray(result.quickActions, normalizeQuickAction, DASHBOARD_LIMITS.quickActions),
    taskTabs: normalizeArray(result.taskTabs, normalizeTaskTab, DASHBOARD_LIMITS.taskTabs),
    recentTasks: normalizeArray(result.recentTasks, normalizeTaskItem, DASHBOARD_LIMITS.recentTasks),
    notices: normalizeArray(result.notices, normalizeNoticeItem, DASHBOARD_LIMITS.notices),
    footer: {
      copyrightText: result.footer?.copyrightText || '© 2024 书匣 · 私有数字内容库系统',
      version: result.footer?.version || 'v2.0.0',
    },
  }
}

function normalizeMetricCard(item = {}) {
  return {
    title: item.title || '--',
    value: item.value || '0',
    unit: item.unit || '',
    extraLabel: item.extraLabel || '',
    extraValue: item.extraValue || '',
    deltaLabel: item.deltaLabel || '',
    deltaValue: item.deltaValue || '',
    color: normalizeTone(item.color || item.tone, 'blue'),
    iconKey: item.iconKey || '',
  }
}

function normalizeServiceStatus(item = {}) {
  return {
    label: item.label || '--',
    status: item.status || '--',
    tone: normalizeTone(item.tone, 'green'),
    iconKey: item.iconKey || '',
  }
}

function normalizeSystemMetric(item = {}) {
  return {
    title: item.title || '--',
    value: item.value || '--',
    path: item.path || 'M6 30 C18 22, 24 18, 34 20 S54 28, 64 24 S82 14, 98 18',
    color: item.color || toneColor(item.tone),
    tone: normalizeTone(item.tone, 'blue'),
  }
}

function normalizeStatusDetail(item = {}) {
  return {
    label: item.label || '--',
    value: item.value || '--',
  }
}

function normalizeStorageSource(item = {}, index = 0) {
  const percent = clampPercent(item.percent)

  return {
    name: item.name || '--',
    used: item.used || formatBytes(item.usedBytes),
    percent,
    tone: normalizeTone(item.tone || item.color, toneByIndex(index)),
  }
}

function normalizeStorageConnection(item = {}) {
  return {
    name: item.name || '--',
    path: item.path || '--',
    state: item.state || '--',
    stateTone: normalizeTone(item.stateTone || item.tone, 'green'),
    time: item.time || item.checkedAt || '--',
    iconKey: item.iconKey || '',
  }
}

function normalizeQuickAction(item = {}) {
  return {
    key: item.key || item.label || '',
    label: item.label || '--',
    tone: normalizeTone(item.tone, 'blue'),
    iconKey: item.iconKey || '',
    routePath: item.routePath || '',
    enabled: item.enabled !== false,
    dangerous: Boolean(item.dangerous),
    confirmText: item.confirmText || '',
  }
}

function normalizeTaskTab(item = {}, index = 0) {
  return {
    key: item.key || String(index),
    label: item.label || '全部',
    count: Number(item.count || 0),
  }
}

function normalizeTaskItem(item = {}) {
  return {
    category: item.category || item.taskType || '--',
    title: item.title || '--',
    progress: clampPercent(item.progress),
    progressText: item.progressText || '',
    status: item.status || '--',
    statusTone: normalizeTone(item.statusTone, 'blue'),
    time: item.time || '--:--',
  }
}

function normalizeNoticeItem(item = {}) {
  return {
    id: item.id || '',
    title: item.title || '--',
    desc: item.desc || '',
    time: item.time || '--',
    tone: normalizeTone(item.tone, 'blue'),
    readFlag: Number(item.readFlag || 0),
  }
}

function normalizeArray(value, normalizer, limit = Infinity) {
  return Array.isArray(value) ? value.slice(0, limit).map(normalizer) : []
}

function readStatValue(item = {}) {
  const raw = String(item.value ?? '0').replace(/,/g, '')
  const value = Number(raw)

  return Number.isFinite(value) ? value : 0
}

function clampPercent(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return 0
  return Math.min(Math.max(Math.round(number), 0), 100)
}

function normalizeTone(value, fallback) {
  const tone = String(value || '').toLowerCase()
  const allowed = ['blue', 'green', 'purple', 'orange', 'red', 'indigo', 'violet', 'slate', 'gray', 'cyan']
  return allowed.includes(tone) ? tone : fallback
}

function toneByIndex(index) {
  return ['blue', 'violet', 'indigo', 'slate', 'gray'][index % 5]
}

function toneColor(value) {
  const map = {
    blue: '#3b82f6',
    green: '#22c55e',
    orange: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6',
  }
  return map[normalizeTone(value, 'blue')] || '#3b82f6'
}

function buildUsageText(storageOverview = {}) {
  const usedText = storageOverview.usedText || formatBytes(storageOverview.usedBytes)
  return `${usedText} (${clampPercent(storageOverview.usagePercent)}%)`
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

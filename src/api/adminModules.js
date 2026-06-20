import {
  Bell,
  Check,
  CircleCheck,
  CircleClose,
  Clock,
  DataAnalysis,
  Finished,
  Key,
  Lock,
  Refresh,
  Timer,
  TrendCharts,
  User,
  UserFilled,
  VideoPlay,
  Warning,
} from '@element-plus/icons-vue'
import request from '../utils/request'

export async function fetchScrapeRulesPage(params = {}) {
  const response = await request.get('/sx/book/scrape-rule/list', {
    params: { pageNo: 1, pageSize: 20, ...params },
  })
  const page = readPageResponse(response, '获取扫描规则失败')
  const rows = page.records.map(normalizeScrapeRule)
  const enabled = rows.filter((row) => row.enabled).length

  return {
    rows,
    total: page.total,
    metrics: [
      metric('规则总数', page.total, '条', '接口返回总数', 'blue', DataAnalysis),
      metric('已启用', enabled, '条', `${rows.length ? Math.round((enabled / rows.length) * 100) : 0}%`, 'green', CircleCheck),
      metric('当前页规则', rows.length, '条', '当前筛选结果', 'purple', Finished),
      metric('关联渠道', uniqueCount(rows.map((row) => row.channelCode)), '个', '当前页去重', 'orange', Key),
      metric('覆盖内容类型', uniqueCount(rows.map((row) => row.raw.bizType)), '种', '当前页去重', 'cyan', TrendCharts),
    ],
  }
}

export async function fetchScrapeChannelsPage(params = {}) {
  const response = await request.get('/sx/book/scrape-channel/list', {
    params: { pageNo: 1, pageSize: 20, ...params },
  })
  const page = readPageResponse(response, '获取扫描渠道失败')

  return {
    rows: page.records.map(normalizeScrapeChannel),
    total: page.total,
  }
}

export async function fetchTaskCenterPage(params = {}) {
  const [summaryResponse, listResponse] = await Promise.all([
    request.get('/sx/book/task/summary'),
    request.get('/sx/book/task/list', {
      params: { pageNo: 1, pageSize: 20, ...params },
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
    detail: buildTaskDetail(rows[0]),
  }
}

export async function fetchSubscribePage() {
  const response = await request.get('/sx/book/dashboard/subscribe/list')
  const result = readResultResponse(response, '获取订阅列表失败') || {}
  const rows = Array.isArray(result.items) ? result.items.map(normalizeSubscribeRow) : []

  return {
    rows,
    total: rows.length,
    summary: result,
  }
}

export async function refreshSubscribePage() {
  const response = await request.post('/sx/book/dashboard/subscribe/update')
  const result = readResultResponse(response, '刷新订阅快照失败') || {}
  const rows = Array.isArray(result.items) ? result.items.map(normalizeSubscribeRow) : []

  return {
    rows,
    total: rows.length,
    summary: result,
  }
}

export async function fetchUsersPage(params = {}) {
  const response = await request.get('/sx/book/user/manage/list', {
    params: { pageNo: 1, pageSize: 20, ...params },
  })
  const page = readPageResponse(response, '获取用户列表失败')
  const rows = page.records.map(normalizeUserRow)
  const frozen = rows.filter((row) => row.raw.status === 2).length
  const active = rows.length - frozen

  return {
    rows,
    total: page.total,
    metrics: [
      metric('用户总数', page.total, '', '接口返回总数', 'blue', User),
      metric('正常用户', active, '', '当前页统计', 'green', UserFilled),
      metric('冻结用户', frozen, '', '当前页统计', 'orange', Lock),
      metric('作者用户', rows.filter((row) => Number(row.raw.authorStatus || 0) > 0).length, '', '当前页统计', 'purple', Key),
      metric('书架记录', sum(rows.map((row) => row.raw.bookshelfCount)), '条', '当前页统计', 'cyan', TrendCharts),
      metric('阅读历史', sum(rows.map((row) => row.raw.readHistoryCount)), '条', '当前页统计', 'blue', Clock),
    ],
  }
}

export async function fetchRolesPage() {
  const rolesResponse = await request.get('/sys/role/queryall')
  const roles = normalizeRoleList(readResultResponse(rolesResponse, '获取角色列表失败'))
  const selectedRole = roles[0] || null
  const permissionView = selectedRole ? await fetchRolePermissionView(selectedRole.id) : null

  return buildRolesPage(roles, permissionView)
}

export async function fetchRolePermissionView(roleId) {
  if (!roleId) return null
  const response = await request.get('/sx/book/rbac/role-permission/view', { params: { roleId } })
  return readResultResponse(response, '获取角色权限失败')
}

export function buildRolesPage(roles = [], permissionView = null) {
  const selectedRoleId = permissionView?.roleId || roles[0]?.id || ''
  const checked = new Set(permissionView?.checkedIds || [])
  const permissions = flattenTree(permissionView?.treeList || []).map((item) => ({
    id: item.key || item.id,
    module: item.title || item.label || item.name || '--',
    desc: item.key || item.id || '--',
    view: checked.has(item.key || item.id),
    create: false,
    edit: false,
    delete: false,
    export: false,
    all: checked.has(item.key || item.id),
  }))

  return {
    roles: roles.map((role, index) => ({
      ...role,
      active: role.id === selectedRoleId || (!selectedRoleId && index === 0),
    })),
    selectedRole: roles.find((role) => role.id === selectedRoleId) || roles[0] || null,
    permissions,
    metrics: [
      metric('角色总数', roles.length, '个', '系统角色', 'blue', UserFilled),
      metric('书匣权限节点', permissions.length, '个', '权限树节点', 'green', User),
      metric('已授权节点', checked.size, '个', '当前角色', 'orange', Key),
      metric('权限标识', permissionView?.checkedPerms?.length || 0, '个', '当前角色', 'purple', Lock),
      metric('根权限', permissionView?.rootPermissionId ? 1 : 0, '个', '书匣根菜单', 'cyan', Key),
    ],
  }
}

export async function fetchSiteSettingsPage() {
  const response = await request.get('/sx/book/site-setting/detail')
  const data = readResultResponse(response, '获取站点设置失败') || {}

  return {
    raw: data,
    sections: [
      {
        title: '站点信息',
        items: [
          inputItem('站点名称', data.siteName, '显示在浏览器标题和前台页面'),
          inputItem('站点 Logo', data.siteLogo || data.siteLogoFileId, '站点 Logo 地址或文件 ID'),
          inputItem('默认搜索文案', data.defaultSearchPlaceholder, '搜索框默认提示文案'),
          inputItem('版权主体', data.copyrightCompany, '页脚版权主体'),
        ],
      },
      {
        title: '默认策略',
        items: [
          selectItem('默认客户端', data.defaultClientType, ['pc', 'mobile', 'all'], '默认客户端类型'),
          selectItem('默认业务类型', data.defaultBizType, ['ebook', 'novel', 'comic', 'audio'], '默认展示的内容类型'),
          selectItem('默认排序', data.defaultBookSortType, ['latest', 'hot', 'recommend', 'name'], '默认列表排序规则'),
        ],
      },
      {
        title: '备案信息',
        items: [
          inputItem('ICP备案号', data.icpNo, '站点 ICP 备案信息'),
          inputItem('公安备案号', data.policeNo, '公安联网备案信息'),
          inputItem('版权文案', data.copyrightText, '页脚完整版权文案'),
        ],
      },
    ],
    links: [
      ['站点 Logo', data.siteLogo || '--'],
      ['默认客户端', data.defaultClientType || '--'],
      ['默认业务类型', data.defaultBizType || '--'],
      ['默认排序', data.defaultBookSortType || '--'],
    ],
    system: [
      ['站点编码', data.siteKey || '--'],
      ['版权主体', data.copyrightCompany || '--'],
      ['ICP备案号', data.icpNo || '--'],
      ['公安备案号', data.policeNo || '--'],
    ],
  }
}

export async function fetchReaderSettingsPage() {
  const response = await request.get('/sx/book/front/reader/setting')
  const data = readResultResponse(response, '获取阅读设置失败') || {}

  return {
    sections: [
      {
        title: '基础阅读偏好',
        items: [
          inputItem('默认字体', data.fontFamily, '阅读器正文默认字体'),
          inputItem('默认字号', `${data.fontSize ?? ''}`, '阅读器正文默认字号'),
          inputItem('行间距', `${data.lineHeight ?? ''}`, '长文本阅读的行高比例'),
          selectItem('默认主题', data.theme, ['light', 'dark', 'eye'], '新用户进入阅读器时使用的主题'),
          switchItem('记住阅读位置', flagToBool(data.rememberReadState), '跨设备同步最后阅读位置'),
        ],
      },
      {
        title: '翻页与显示',
        items: [
          selectItem('翻页方式', data.turnMode, ['scroll', 'page'], '电子书和小说阅读器的翻页行为'),
          selectItem('页面模式', data.pageSizeMode, ['scroll', 'page'], '阅读页面排版方式'),
          inputItem('段落间距', `${data.paragraphSpacing ?? ''}`, '正文段落间距比例'),
          switchItem('显示页码', flagToBool(data.showPageNumber), '阅读器是否显示页码'),
          switchItem('显示章节标题', flagToBool(data.showChapterTitle), '阅读器是否显示当前章节标题'),
          switchItem('显示进度条', flagToBool(data.showProgressBar), '阅读器是否显示阅读进度'),
          inputItem('自动保存间隔', `${data.autoSaveInterval ?? ''}`, '阅读进度自动保存间隔，单位秒'),
        ],
      },
    ],
  }
}

export async function fetchNotifySettingsPage(params = {}) {
  const response = await request.get('/sx/book/notify-setting/channel/list', {
    params: { pageNo: 1, pageSize: 20, ...params },
  })
  const page = readPageResponse(response, '获取通知渠道失败')

  return {
    channels: page.records.map(normalizeNotifyChannel),
  }
}

export async function fetchSecuritySettingsPage() {
  const response = await request.get('/sx/book/security-setting/detail')
  const data = readResultResponse(response, '获取安全设置失败') || {}

  return {
    sections: [
      {
        title: '登录安全',
        items: [
          inputItem('密码最小长度', `${data.passwordMinLength ?? ''}`, '用户密码的最小长度'),
          inputItem('密码最大长度', `${data.passwordMaxLength ?? ''}`, '用户密码的最大长度'),
          switchItem('要求大写字母', flagToBool(data.requireUppercase), '密码必须包含大写字母'),
          switchItem('要求小写字母', flagToBool(data.requireLowercase), '密码必须包含小写字母'),
          switchItem('要求数字', flagToBool(data.requireDigit), '密码必须包含数字'),
          switchItem('要求特殊字符', flagToBool(data.requireSpecial), '密码必须包含特殊字符'),
        ],
      },
      {
        title: '访问控制',
        items: [
          switchItem('登录失败锁定', flagToBool(data.loginLockEnabled), '连续失败后锁定账号'),
          inputItem('失败次数阈值', `${data.loginFailThreshold ?? ''}`, '触发锁定的连续失败次数'),
          inputItem('锁定时长', `${data.loginLockMinutes ?? ''}`, '账号锁定后自动恢复的分钟数'),
          switchItem('强制 HTTPS', flagToBool(data.forceHttps), '启用后强制使用 HTTPS 访问'),
        ],
      },
      {
        title: '审计策略',
        items: [
          inputItem('可信代理头', data.trustedProxyHeader, '用于解析真实请求协议的代理头'),
          inputItem('活动保留天数', `${data.activityRetentionDays ?? ''}`, '安全活动记录保留时间'),
          inputItem('当前协议', data.currentScheme, '后端检测到的当前请求协议'),
          inputItem('安全模式', data.currentSecurityMode, '当前安全模式'),
        ],
      },
    ],
  }
}

export async function fetchLicenseInfoPage() {
  const response = await request.get('/sx/book/license-info/detail')
  const data = readResultResponse(response, '获取授权信息失败') || {}

  return {
    cards: [
      ['授权状态', normalizeAuthStatus(data.authStatus), data.licenseDescription || `支持状态：${data.supportStatus || '--'}`],
      ['授权用户', data.authorizedTo || '--', data.licenseName || '--'],
      ['授权类型', data.licenseType || '--', data.openSourceLicense || '--'],
      ['当前版本', data.currentVersion || '--', data.versionCompareMessage || `最新版本：${data.latestVersion || '--'}`],
      ['授权厂商', data.vendorName || '--', data.officialWebsite || '--'],
      ['剩余天数', data.remainingDays ?? '--', data.expireDate ? `到期时间：${formatDateTime(data.expireDate)}` : '--'],
      ['购买次数', data.purchaseCount ?? 0, `累计金额：${data.purchaseAmountTotal ?? 0}`],
      ['联系人', data.contactName || '--', data.contactEmail || data.contactPhone || '--'],
    ],
  }
}

export async function fetchOperationLogPage(params = {}) {
  const response = await request.get('/sx/book/operate-log/list', {
    params: { pageNo: 1, pageSize: 20, ...params },
  })
  const page = readPageResponse(response, '获取操作日志失败')

  return {
    rows: page.records.map(normalizeOperateLog),
    total: page.total,
  }
}

export async function fetchTaskLogPage(params = {}) {
  const response = await request.get('/sx/book/task-log/list', {
    params: { pageNo: 1, pageSize: 20, ...params },
  })
  const page = readPageResponse(response, '获取任务日志失败')

  return {
    rows: page.records.map(normalizeTaskLog),
    total: page.total,
  }
}

export async function fetchTaskStatsPage(params = {}) {
  const [summaryResponse, trendResponse] = await Promise.all([
    request.get('/sx/book/task-stats/summary', { params: { days: 7, ...params } }),
    request.get('/sx/book/task-stats/trend', { params: { days: 7, ...params } }),
  ])
  const summary = readResultResponse(summaryResponse, '获取任务统计失败') || {}
  const trend = readResultResponse(trendResponse, '获取任务趋势失败') || {}

  return {
    metrics: [
      metric('当前任务总数', summary.currentTotalCount, '个', `${summary.days || 7} 天统计`, 'blue', Finished),
      metric('当前待处理', summary.pendingCount, '个', '队列等待', 'orange', Timer),
      metric('当前处理中', summary.processingCount, '个', '正在执行', 'green', Refresh),
      metric('当前成功', summary.successCount, '个', '累计成功', 'green', CircleCheck),
      metric('当前失败', summary.failCount, '个', '累计失败', 'orange', CircleClose),
      metric('近期成功率', formatPercent(summary.recentSuccessRate), '', '统计周期内', 'purple', TrendCharts),
    ],
    typeRows: Array.isArray(summary.taskTypeStats) ? summary.taskTypeStats.map(normalizeTaskTypeStats) : [],
    durationRows: Array.isArray(trend.points) ? trend.points.map(normalizeTrendPoint) : [],
    trend,
  }
}

function readPageResponse(response, fallbackMessage) {
  const result = readResultResponse(response, fallbackMessage) || {}
  return {
    records: Array.isArray(result.records) ? result.records : [],
    total: Number(result.total || 0),
  }
}

function readResultResponse(response, fallbackMessage) {
  if (!response?.success) {
    throw new Error(response?.message || fallbackMessage)
  }

  return response.result
}

function normalizeScrapeRule(item = {}) {
  const priority = Number(item.priority || 0)
  const status = Number(item.status ?? 1)

  return {
    raw: item,
    id: item.id,
    name: item.ruleName || '--',
    desc: item.remark || item.baseUrl || item.debugUrl || '--',
    type: normalizeBizType(item.bizType),
    content: [normalizeBizType(item.bizType)],
    source: item.siteName || item.baseUrl || '--',
    channelCode: item.channelCode || '--',
    enabled: status === 1,
    priority: priority >= 90 ? '高' : priority >= 50 ? '中' : '低',
    lastRun: formatDateTime(item.updateTime || item.createTime),
    rate: '--',
  }
}

function normalizeScrapeChannel(item = {}) {
  const status = Number(item.status ?? 1)

  return {
    raw: item,
    id: item.id,
    name: item.channelName || item.channelCode || '--',
    type: normalizeBizType(item.bizType),
    endpoint: item.baseUrl || item.testUrl || '--',
    status: status === 1 ? '正常' : '禁用',
    tone: status === 1 ? 'green' : 'slate',
    quota: `${Number(item.totalTestCount || 0)} 次测试`,
    latency: item.lastTestStatusCode ? `${item.lastTestStatusCode}` : '--',
  }
}

function normalizeTaskRow(item = {}) {
  const statusInfo = taskStatusInfo(item.taskStatus)
  const progress = taskProgress(item.taskStatus)
  const title = item.bookName || item.taskId || '--'

  return {
    raw: item,
    id: item.taskId,
    name: title,
    desc: item.errorMessage || item.authorName || item.targetFormat || '--',
    kind: item.taskTypeName || normalizeTaskType(item.taskType),
    source: item.taskType || '--',
    status: statusInfo.label,
    tone: statusInfo.tone,
    progress,
    start: formatDateTime(item.createTime),
    duration: item.finishedTime ? `${formatDateTime(item.finishedTime)}` : '--',
    cover: String(title).slice(0, 1),
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

function normalizeUserRow(item = {}) {
  const status = Number(item.status || 1)
  const nickname = item.nickName || item.realname || item.username || '--'

  return {
    raw: item,
    id: item.userId,
    username: item.username || '--',
    nickname,
    email: item.email || item.phone || '--',
    role: item.memberLevel || item.sourceType || '用户',
    roleTone: item.memberLevel ? 'blue' : 'slate',
    status: status === 2 ? '冻结' : '正常',
    tone: status === 2 ? 'red' : 'green',
    lastLogin: formatDateTime(item.lastReadTime),
    createdAt: formatDateTime(item.createTime),
    avatar: nickname.slice(0, 1).toUpperCase(),
  }
}

function normalizeRoleList(value) {
  const list = Array.isArray(value) ? value : []
  const colors = ['blue', 'green', 'purple', 'orange', 'cyan', 'red']

  return list.map((item, index) => ({
    raw: item,
    id: item.id || item.value,
    name: item.roleName || item.title || item.text || item.label || '--',
    code: item.roleCode || item.value || '',
    type: item.roleCode?.startsWith('admin') ? '内置' : '系统',
    desc: item.description || item.roleCode || '--',
    users: item.userCount ?? '--',
    color: colors[index % colors.length],
  }))
}

function normalizeNotifyChannel(item = {}) {
  const status = Number(item.status ?? 1)

  return {
    raw: item,
    id: item.id,
    name: item.channelName || item.channelCode || '--',
    desc: item.endpointUrl || item.providerName || item.remark || '--',
    enabled: status === 1,
    status: status === 1 ? '已启用' : '未启用',
    tone: status === 1 ? 'green' : 'slate',
  }
}

function normalizeOperateLog(item = {}) {
  return {
    raw: item,
    id: item.id,
    time: formatDateTime(item.operateTime || item.createTime),
    user: item.operateByName || '--',
    module: normalizeBizType(item.bizType),
    action: item.operateType || '--',
    target: item.bookName || item.bookId || '--',
    content: item.operateDesc || '--',
    status: '成功',
    tone: 'green',
    ip: '--',
  }
}

function normalizeTaskLog(item = {}) {
  const statusInfo = taskStatusInfo(item.taskStatus)

  return {
    raw: item,
    id: item.taskId || item.id,
    name: item.bookName || item.taskId || '--',
    module: item.taskTypeName || normalizeTaskType(item.taskType),
    type: normalizeTaskType(item.taskType),
    trigger: item.actionName || item.actionType || '--',
    start: formatDateTime(item.eventTime || item.createTime),
    duration: '--',
    status: item.taskStatusName || statusInfo.label,
    tone: statusInfo.tone,
    progress: taskProgress(item.taskStatus),
    remark: item.errorMessage || item.detailMessage || '--',
  }
}

function normalizeTaskTypeStats(item = {}) {
  const total = Number(item.currentTotalCount || 0)
  const success = Number(item.successCount || 0)
  const failed = Number(item.failCount || 0)

  return {
    type: item.taskTypeName || normalizeTaskType(item.taskType),
    total: formatNumber(total),
    success: formatNumber(success),
    failed: formatNumber(failed),
    rate: formatPercent(item.recentSuccessRate ?? (total ? (success / total) * 100 : 0)),
    avg: `${formatNumber(item.recentCompletedCount)} 次完成`,
  }
}

function normalizeTrendPoint(item = {}) {
  return {
    range: item.dateLabel || '--',
    count: formatNumber(item.completedCount),
    ratio: formatPercent(item.successRate),
  }
}

function flattenTree(list = []) {
  return list.flatMap((item) => [item, ...flattenTree(item.children || [])])
}

function buildTaskMetrics(summary = {}) {
  return [
    metric('任务总数', summary.totalCount, '个', '所有任务', 'blue', DataAnalysis),
    metric('处理中', summary.processingCount, '个', '正在处理', 'green', VideoPlay),
    metric('等待中', summary.pendingCount, '个', '排队等待', 'orange', Timer),
    metric('已完成', summary.successCount, '个', '成功任务', 'purple', CircleCheck),
    metric('失败', summary.failCount, '个', '失败任务', 'orange', Warning),
    metric('切片任务', summary.sliceTaskCount, '个', '媒体切片', 'cyan', Timer),
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

function buildTaskDetail(row) {
  if (!row) {
    return {
      title: '暂无任务',
      subtitle: '当前筛选条件下没有任务记录',
      status: '暂无',
      priority: '优先级：--',
      fields: [['任务ID', '--'], ['规则', '--'], ['开始时间', '--'], ['预计完成', '--'], ['耗时', '--'], ['处理项', '--']],
      logs: [],
      progress: 0,
    }
  }

  return {
    title: row.name,
    subtitle: row.desc,
    status: row.status,
    priority: `任务类型：${row.kind}`,
    fields: [
      ['任务ID', row.id || '--'],
      ['任务类型', row.kind || '--'],
      ['开始时间', row.start || '--'],
      ['完成时间', formatDateTime(row.raw.finishedTime)],
      ['目标格式', row.raw.targetFormat || '--'],
      ['章节数量', row.raw.chapterCount ?? '--'],
    ],
    logs: [row.desc].filter(Boolean),
    progress: row.progress,
  }
}

function inputItem(label, value, help) {
  return { label, value: value ?? '', help }
}

function selectItem(label, value, options, help) {
  return { label, type: 'select', value: value ?? '', options, help }
}

function switchItem(label, value, help) {
  return { label, type: 'switch', value: Boolean(value), help }
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

function normalizeBizType(value) {
  const map = {
    ebook: '书籍',
    book: '书籍',
    novel: '小说',
    comic: '漫画',
    audio: '有声',
  }

  return map[String(value || '').toLowerCase()] || value || '--'
}

function normalizeTaskType(value) {
  const map = {
    PARSE: '解析',
    TRANSCODE: '转码',
    SLICE: '切片',
    LOCAL_SCAN: '本地扫描',
  }

  return map[String(value || '').toUpperCase()] || value || '--'
}

function normalizeAuthStatus(value) {
  const map = {
    valid: '有效',
    expired: '已过期',
    invalid: '无效',
  }

  return map[String(value || '').toLowerCase()] || value || '--'
}

function flagToBool(value) {
  return Number(value || 0) === 1 || value === true
}

function formatNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toLocaleString() : '0'
}

function formatPercent(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return '0%'
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`
}

function formatDateTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 19)
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0)
}

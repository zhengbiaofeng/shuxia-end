import {
  Bell,
  Calendar,
  Check,
  CircleCheck,
  CircleClose,
  Clock,
  CloseBold,
  DataAnalysis,
  Delete,
  Download,
  EditPen,
  Finished,
  FolderChecked,
  Key,
  Lock,
  MoreFilled,
  Operation,
  Plus,
  Refresh,
  RefreshRight,
  Setting,
  Timer,
  TrendCharts,
  Upload,
  User,
  UserFilled,
  VideoPause,
  VideoPlay,
  View,
  Warning,
} from '@element-plus/icons-vue'

export const commonActions = {
  row: [
    { label: '编辑', icon: EditPen },
    { label: '权限', icon: Key },
    { label: '更多', icon: MoreFilled, boxed: true },
  ],
  run: [
    { label: '执行', icon: VideoPlay },
    { label: '编辑', icon: EditPen },
    { label: '更多', icon: MoreFilled, boxed: true },
  ],
  taskRunning: [
    { label: '暂停', icon: VideoPause },
    { label: '停止', icon: CloseBold, danger: true },
    { label: '更多', icon: MoreFilled, boxed: true },
  ],
  taskDone: [
    { label: '查看', icon: View, boxed: true },
    { label: '更多', icon: MoreFilled, boxed: true },
  ],
  retry: [
    { label: '重试', icon: RefreshRight, boxed: true },
    { label: '更多', icon: MoreFilled, boxed: true },
  ],
  more: [{ label: '更多', icon: MoreFilled, boxed: true }],
}

export const automationPages = {
  smartScrape: {
    title: '智能抓取',
    subtitle: '粘贴公开图书页面 URL，自动识别、解析、预览并确认入库',
    activeMenu: '智能抓取',
    actions: [{ label: '高级规则', icon: Setting }],
    notes: [
      '一期仅支持豆瓣读书详情页：https://book.douban.com/subject/{id}/',
      '豆瓣仅作为图书元数据来源，不抓取章节正文',
      '所有导入都会先预览确认，检测到冲突时需要选择处理策略',
    ],
  },
  rules: {
    title: '采集设置',
    subtitle: '维护站点适配、访问方式和字段解析规则；普通采集请从采集工作台开始',
    activeMenu: '采集工作台',
    actions: [
      { label: '连接模板', icon: Setting },
      { label: '添加站点适配', icon: Plus, type: 'primary' },
    ],
    filters: {
      search: { placeholder: '搜索扫描源名称、站点或渠道' },
      filters: [
        { label: '全部类型', value: '全部类型', options: ['全部类型', '书籍', '小说', '漫画', '有声'] },
        { label: '全部状态', value: '全部状态', options: ['全部状态', '启用', '禁用'] },
      ],
    },
    notes: [
      '扫描源列表直接来自 /sx/book/scrape-rule/list，前端将规则和模板绑定信息合并展示',
      '站点访问配置可在添加/编辑扫描源时维护；连接模板仅用于复用或测试独立访问配置',
    ],
  },
  channels: {
    title: '连接模板',
    subtitle: '维护可复用的站点访问模板，普通扫描源可直接在编辑页内配置请求信息',
    activeMenu: '采集工作台',
    actions: [
      { label: '返回采集设置', icon: RefreshRight },
      { label: '新增连接模板', icon: Plus, type: 'primary' },
    ],
    filters: {
      search: { placeholder: '搜索模板名称、站点或接口地址' },
      filters: [{ label: '全部类型', value: '全部类型', options: ['全部类型', '书籍', '小说', '漫画', '有声'] }],
    },
  },
  tasks: {
    title: '任务中心',
    subtitle: '管理和监控所有自动化任务，查看任务状态、进度和执行日志',
    activeMenu: '任务中心',
    actions: [
      { label: '清空已完成', icon: Delete },
      { label: '导出任务日志', icon: Download },
      { label: '新建任务', icon: Plus, type: 'primary' },
    ],
    tabs: ['全部', '处理中', '待处理', '成功', '失败'],
    filters: {
      search: { placeholder: '搜索任务名称、类型、来源...' },
      filters: [
        { label: '全部类型', value: '全部类型', options: ['全部类型', '解析', '转码', '切片', '本地扫描'] },
        { label: '全部状态', value: '全部状态', options: ['全部状态', '待处理', '处理中', '成功', '失败'] },
      ],
    },
  },
  subscriptions: {
    title: '更新订阅',
    subtitle: '查看书架订阅内容的更新快照',
    activeMenu: '更新订阅',
    actions: [{ label: '刷新订阅快照', icon: RefreshRight, type: 'primary' }],
    filters: {
      search: { placeholder: '搜索订阅书名或内容类型' },
    },
  },
}

export const permissionPages = {
  users: {
    title: '用户管理',
    subtitle: '管理系统用户账号，查看用户状态和内容使用情况',
    activeMenu: '用户管理',
    actions: [{ label: '添加用户', icon: Plus, type: 'primary' }],
    filters: {
      search: { placeholder: '搜索用户名、邮箱、昵称' },
      filters: [
        { label: '全部状态', value: '全部状态', options: ['全部状态', '正常', '冻结'] },
        { label: '全部来源', value: '全部来源', options: ['全部来源', '系统', '移动端', '后台'] },
      ],
    },
    notes: ['用户列表直接来自 /sx/book/user/manage/list'],
  },
  roles: {
    title: '角色权限',
    subtitle: '管理系统角色和书匣权限树，控制不同角色的功能访问范围',
    activeMenu: '角色权限',
    actions: [{ label: '添加角色', icon: Plus, type: 'primary' }],
    filters: {
      search: { placeholder: '搜索角色名称或编码' },
      filters: [{ label: '全部角色', value: '全部角色', options: ['全部角色'] }],
    },
  },
}

export const settingPages = {
  site: {
    title: '站点设置',
    subtitle: '配置和管理站点基本信息、默认客户端和默认内容展示策略',
    activeMenu: '站点设置',
    tabs: ['基本设置', '默认策略', '备案信息'],
    actions: [{ label: '保存设置', type: 'primary' }],
  },
  reader: {
    title: '阅读设置',
    subtitle: '配置电子书、小说、漫画和有声内容的默认阅读体验',
    activeMenu: '阅读设置',
    tabs: ['基础阅读', '翻页与缓存'],
    actions: [{ label: '保存设置', type: 'primary' }],
  },
  notify: {
    title: '通知设置',
    subtitle: '管理系统通知渠道、通知规则和发送策略',
    activeMenu: '通知设置',
    tabs: ['通知渠道'],
    actions: [{ label: '保存设置', type: 'primary' }],
  },
  security: {
    title: '安全设置',
    subtitle: '配置登录验证、访问控制和系统安全策略',
    activeMenu: '安全设置',
    tabs: ['登录安全', '访问控制', '审计策略'],
    actions: [{ label: '保存设置', type: 'primary' }],
  },
  license: {
    title: '授权信息',
    subtitle: '查看当前授权状态、授权范围和系统版本信息',
    activeMenu: '授权信息',
    tabs: ['授权状态', '版本信息'],
    actions: [{ label: '更新授权', icon: Upload, type: 'primary' }],
  },
}

export const logPages = {
  operation: {
    title: '操作日志',
    subtitle: '记录系统中所有用户的操作行为，便于审计和追踪',
    activeMenu: '操作日志',
    tabs: ['操作日志', '导出日志'],
    actions: [{ label: '导出日志', icon: Download }],
    filters: {
      dateRange: { value: [] },
      search: { placeholder: '搜索书名、操作内容或操作人' },
      filters: [
        { label: '全部业务', value: '全部业务', options: ['全部业务', '书籍', '小说', '漫画', '有声'] },
        { label: '全部操作', value: '全部操作', options: ['全部操作', '新增', '编辑', '删除', '导入', '导出'] },
      ],
    },
  },
  task: {
    title: '任务日志',
    subtitle: '记录系统中所有任务的执行情况和失败原因',
    activeMenu: '任务日志',
    tabs: ['任务日志', '任务统计'],
    actions: [{ label: '导出日志', icon: Download }],
    filters: {
      dateRange: { value: [] },
      search: { placeholder: '搜索任务名称、任务 ID 或日志内容' },
      filters: [
        { label: '全部任务类型', value: '全部任务类型', options: ['全部任务类型', '解析', '转码', '切片', '本地扫描'] },
        { label: '全部状态', value: '全部状态', options: ['全部状态', '待处理', '处理中', '成功', '失败'] },
      ],
    },
  },
  stats: {
    title: '任务日志',
    subtitle: '统计系统任务执行情况，便于分析和优化',
    activeMenu: '任务日志',
    tabs: ['任务日志', '任务统计'],
    actions: [{ label: '导出统计', icon: Download }],
  },
}

export const adminMetricIcons = {
  Bell,
  Calendar,
  Check,
  CircleCheck,
  CircleClose,
  Clock,
  DataAnalysis,
  Finished,
  FolderChecked,
  Lock,
  Operation,
  Refresh,
  Setting,
  Timer,
  TrendCharts,
  User,
  UserFilled,
  VideoPlay,
  Warning,
}

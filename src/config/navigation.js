import {
  Briefcase,
  Connection,
  DataAnalysis,
  Document,
  Files,
  FolderOpened,
  Headset,
  House,
  Monitor,
  MoreFilled,
  Notebook,
  Opportunity,
  PieChart,
  Reading,
  RefreshRight,
  Setting,
  SwitchButton,
  User,
  VideoPlay,
} from '@element-plus/icons-vue'

const baseSideMenus = [
  {
    title: '概览',
    items: [{ label: '概览', icon: House, path: '/dashboard', permission: 'sxbook:dashboard:view' }],
  },
  {
    title: '资源库',
    items: [
      { label: '存储管理', icon: FolderOpened, path: '/storage', permission: 'sxbook:storage:list' },
      { label: '分类管理', icon: Files, path: '/categories', permission: 'sxbook:category:list' },
      { label: '标签管理', icon: Notebook, path: '/tags', permission: 'sxbook:tag:list' },
    ],
  },
  {
    title: '内容管理',
    items: [
      { label: '书籍', icon: Reading, path: '/books', permission: 'sxbook:book:list' },
      { label: '小说', icon: Document, path: '/novels', permission: 'sxbook:book:list' },
      { label: '漫画', icon: Opportunity, path: '/comics', permission: 'sxbook:comic:list' },
      { label: '有声', icon: Headset, path: '/audio', permission: 'sxbook:audio:list' },
    ],
  },
  {
    title: '自动化',
    items: [
      { label: '采集工作台', icon: DataAnalysis, path: '/automation/collection', permission: 'sxbook:scrapeRule:debug' },
      { label: '追更管理', icon: SwitchButton, path: '/automation/following', permission: 'sxbook:subscription:list' },
      { label: '任务中心', icon: Briefcase, path: '/automation/tasks', permission: 'sxbook:task:list' },
    ],
  },
  {
    title: '用户权限',
    items: [
      { label: '用户管理', icon: User, permission: 'sxbook:userManage:list' },
      { label: '角色权限', icon: MoreFilled, permission: 'system:role:list' },
    ],
  },
  {
    title: '系统设置',
    items: [
      { label: '站点设置', icon: Setting, permission: 'sxbook:siteSetting:detail' },
      { label: '阅读设置', icon: Monitor, permission: 'sxbook:readerSetting:detail' },
      { label: '通知设置', icon: VideoPlay, permission: 'sxbook:notifySetting:channel:list' },
      { label: '安全设置', icon: Connection, permission: 'sxbook:securitySetting:detail' },
    ],
  },
  {
    title: '日志中心',
    items: [
      { label: '操作日志', icon: PieChart, permission: 'sxbook:operateLog:list' },
      { label: '任务日志', icon: RefreshRight, permission: 'sxbook:taskLog:list' },
    ],
  },
]

const menuPathGroups = [
  [],
  [],
  [],
  ['/automation/collection', '/automation/following', '/automation/tasks'],
  ['/permissions/users', '/permissions/roles'],
  ['/settings/site', '/settings/reader', '/settings/notifications', '/settings/security'],
  ['/logs/operations', '/logs/tasks'],
]

const menuExtraGroups = {
  5: [{ label: '授权信息', icon: Setting, path: '/settings/license', permission: 'sxbook:licenseInfo:detail' }],
}

export function createSideMenus(activeLabel = '概览', hasPermission = () => true) {
  const currentPath = typeof window === 'undefined' ? '' : window.location.pathname

  return baseSideMenus.map((group, groupIndex) => ({
    ...group,
    items: [...group.items, ...(menuExtraGroups[groupIndex] || [])].map((item, itemIndex) => {
      const path = item.path || menuPathGroups[groupIndex]?.[itemIndex]

      return {
        ...item,
        path,
        active: item.label === activeLabel || path === currentPath,
      }
    }).filter((item) => !item.permission || hasPermission(item.permission)),
  })).filter((group) => group.items.length)
}

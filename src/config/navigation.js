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
    items: [{ label: '概览', icon: House, path: '/dashboard' }],
  },
  {
    title: '资源库',
    items: [
      { label: '存储管理', icon: FolderOpened, path: '/storage' },
      { label: '分类管理', icon: Files, path: '/categories' },
      { label: '标签管理', icon: Notebook, path: '/tags' },
    ],
  },
  {
    title: '内容管理',
    items: [
      { label: '书籍', icon: Reading, path: '/books' },
      { label: '小说', icon: Document, path: '/novels' },
      { label: '漫画', icon: Opportunity, path: '/comics' },
      { label: '有声', icon: Headset, path: '/audio' },
    ],
  },
  {
    title: '自动化',
    items: [
      { label: '智能抓取', icon: DataAnalysis, path: '/automation/smart-scrape' },
      { label: '扫描规则', icon: RefreshRight },
      { label: '任务中心', icon: Briefcase },
      { label: '更新订阅', icon: SwitchButton },
    ],
  },
  {
    title: '用户权限',
    items: [
      { label: '用户管理', icon: User },
      { label: '角色权限', icon: MoreFilled },
    ],
  },
  {
    title: '系统设置',
    items: [
      { label: '站点设置', icon: Setting },
      { label: '阅读设置', icon: Monitor },
      { label: '通知设置', icon: VideoPlay },
      { label: '安全设置', icon: Connection },
    ],
  },
  {
    title: '日志中心',
    items: [
      { label: '操作日志', icon: PieChart },
      { label: '任务日志', icon: RefreshRight },
    ],
  },
]

const menuPathGroups = [
  [],
  [],
  [],
  ['/automation/smart-scrape', '/automation/rules', '/automation/tasks', '/automation/subscriptions'],
  ['/permissions/users', '/permissions/roles'],
  ['/settings/site', '/settings/reader', '/settings/notifications', '/settings/security'],
  ['/logs/operations', '/logs/tasks'],
]

const menuExtraGroups = {
  5: [{ label: '授权信息', icon: Setting, path: '/settings/license' }],
}

export function createSideMenus(activeLabel = '概览') {
  return baseSideMenus.map((group, groupIndex) => ({
    ...group,
    items: [...group.items, ...(menuExtraGroups[groupIndex] || [])].map((item, itemIndex) => ({
      ...item,
      path: item.path || menuPathGroups[groupIndex]?.[itemIndex],
      active: item.label === activeLabel,
    })),
  }))
}

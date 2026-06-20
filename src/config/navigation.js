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
    title: '姒傝',
    items: [{ label: '姒傝', icon: House, path: '/dashboard' }],
  },
  {
    title: '璧勬簮搴?,
    items: [
      { label: '瀛樺偍绠＄悊', icon: FolderOpened, path: '/storage' },
      { label: '鍒嗙被绠＄悊', icon: Files, path: '/categories' },
      { label: '鏍囩绠＄悊', icon: Notebook, path: '/tags' },
    ],
  },
  {
    title: '鍐呭绠＄悊',
    items: [
      { label: '涔︾睄', icon: Reading, path: '/books' },
      { label: '灏忚', icon: Document, path: '/novels' },
      { label: '婕敾', icon: Opportunity, path: '/comics' },
      { label: '鏈夊０', icon: Headset, path: '/audio' },
    ],
  },
  {
    title: '鑷姩鍖?,
    items: [
      { label: '鏅鸿兘鎶撳彇', icon: DataAnalysis, path: '/automation/smart-scrape' },
      { label: '鎵弿瑙勫垯', icon: RefreshRight },
      { label: '浠诲姟涓績', icon: Briefcase },
      { label: '小说同步', icon: SwitchButton },
    ],
  },
  {
    title: '鐢ㄦ埛鏉冮檺',
    items: [
      { label: '鐢ㄦ埛绠＄悊', icon: User },
      { label: '瑙掕壊鏉冮檺', icon: MoreFilled },
    ],
  },
  {
    title: '绯荤粺璁剧疆',
    items: [
      { label: '绔欑偣璁剧疆', icon: Setting },
      { label: '闃呰璁剧疆', icon: Monitor },
      { label: '閫氱煡璁剧疆', icon: VideoPlay },
      { label: '瀹夊叏璁剧疆', icon: Connection },
    ],
  },
  {
    title: '鏃ュ織涓績',
    items: [
      { label: '鎿嶄綔鏃ュ織', icon: PieChart },
      { label: '浠诲姟鏃ュ織', icon: RefreshRight },
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
  5: [{ label: '鎺堟潈淇℃伅', icon: Setting, path: '/settings/license' }],
}

export function createSideMenus(activeLabel = '姒傝') {
  return baseSideMenus.map((group, groupIndex) => ({
    ...group,
    items: [...group.items, ...(menuExtraGroups[groupIndex] || [])].map((item, itemIndex) => ({
      ...item,
      path: item.path || menuPathGroups[groupIndex]?.[itemIndex],
      active: item.label === activeLabel,
    })),
  }))
}

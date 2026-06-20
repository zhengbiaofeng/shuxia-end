import {
  Brush,
  Connection,
  Delete,
  Document,
  FolderOpened,
  Headset,
  HomeFilled,
  MagicStick,
  Monitor,
  Opportunity,
  PieChart,
  Reading,
  RefreshRight,
  SwitchButton,
} from '@element-plus/icons-vue'

export const dashboardIconFallbacks = [
  { title: '书籍', icon: Reading },
  { title: '小说', icon: Document },
  { title: '漫画', icon: Opportunity },
  { title: '有声', icon: Headset },
  { title: '存储占用', icon: PieChart },
  { title: '最近新增', icon: RefreshRight },
  { label: 'Docker 容器', icon: HomeFilled },
  { label: 'NAS 连接', icon: Connection },
  { label: '存储服务', icon: FolderOpened },
  { label: '网络状态', icon: Monitor },
  { label: '添加存储', icon: FolderOpened },
  { label: '立即扫描', icon: RefreshRight },
  { label: '一键刮削', icon: MagicStick },
  { label: '更新订阅', icon: SwitchButton },
  { label: '清理缓存', icon: Delete },
  { label: '系统备份', icon: Brush },
]

export const dashboardQuickActionFallbacks = [
  { label: '添加存储', tone: 'blue', icon: FolderOpened, routePath: '/storage' },
  { label: '立即扫描', tone: 'green', icon: RefreshRight, enabled: false },
  { label: '一键刮削', tone: 'purple', icon: MagicStick, enabled: false },
  { label: '更新订阅', tone: 'orange', icon: SwitchButton, routePath: '/automation/subscriptions' },
  { label: '清理缓存', tone: 'blue', icon: Delete, enabled: false },
  { label: '系统备份', tone: 'green', icon: Brush, enabled: false },
]

export const defaultTaskTabs = [
  { key: 'all', label: '全部' },
  { key: 'scan', label: '扫描任务' },
  { key: 'scrape', label: '刮削任务' },
  { key: 'update', label: '更新任务' },
  { key: 'other', label: '其他任务' },
]

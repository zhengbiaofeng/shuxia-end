import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores'

const LoginPage = () => import('../pages/LoginPage.vue')
const DashboardPage = () => import('../pages/DashboardPage.vue')
const BooksPage = () => import('../pages/BooksPage.vue')
const NovelPage = () => import('../pages/NovelPage.vue')
const ComicPage = () => import('../pages/ComicPage.vue')
const AudioPage = () => import('../pages/AudioPage.vue')
const StorageManagementPage = () => import('../pages/StorageManagementPage.vue')
const CategoryManagementPage = () => import('../pages/CategoryManagementPage.vue')
const TagManagementPage = () => import('../pages/TagManagementPage.vue')
const CollectionWorkbenchPage = () => import('../pages/automation/CollectionWorkbenchPage.vue')
const ScrapeRulesPage = () => import('../pages/automation/ScrapeRulesPage.vue')
const ScrapeChannelsPage = () => import('../pages/automation/ScrapeChannelsPage.vue')
const AddScrapeRulePage = () => import('../pages/automation/AddScrapeRulePage.vue')
const TaskCenterPage = () => import('../pages/automation/TaskCenterPage.vue')
const SubscriptionsPage = () => import('../pages/automation/SubscriptionsPage.vue')
const UserManagementPage = () => import('../pages/permissions/UserManagementPage.vue')
const RolePermissionPage = () => import('../pages/permissions/RolePermissionPage.vue')
const SiteSettingsPage = () => import('../pages/settings/SiteSettingsPage.vue')
const ReaderSettingsPage = () => import('../pages/settings/ReaderSettingsPage.vue')
const NotificationSettingsPage = () => import('../pages/settings/NotificationSettingsPage.vue')
const SecuritySettingsPage = () => import('../pages/settings/SecuritySettingsPage.vue')
const LicenseInfoPage = () => import('../pages/settings/LicenseInfoPage.vue')
const OperationLogPage = () => import('../pages/logs/OperationLogPage.vue')
const TaskLogPage = () => import('../pages/logs/TaskLogPage.vue')
const TaskStatsPage = () => import('../pages/logs/TaskStatsPage.vue')
const ForbiddenPage = () => import('../pages/ForbiddenPage.vue')

const adminModuleRoutes = [
  { path: '/automation/collection', name: 'automation-collection', component: CollectionWorkbenchPage, meta: { title: '采集工作台', requiresAuth: true, permission: 'sxbook:scrapeRule:list' } },
  { path: '/automation/smart-scrape', name: 'automation-smart-scrape', redirect: '/automation/collection' },
  { path: '/automation/rules', name: 'automation-rules', component: ScrapeRulesPage, meta: { title: '采集设置', requiresAuth: true, permission: 'sxbook:scrapeRule:list' } },
  { path: '/automation/channels', name: 'automation-channels', component: ScrapeChannelsPage, meta: { title: '连接模板', requiresAuth: true, permission: 'sxbook:scrapeChannel:list' } },
  { path: '/automation/rules/new', name: 'automation-rules-new', component: AddScrapeRulePage, meta: { title: '添加站点适配', requiresAuth: true, permission: 'sxbook:scrapeRule:add' } },
  { path: '/automation/tasks', name: 'automation-tasks', component: TaskCenterPage, meta: { title: '任务中心', requiresAuth: true, permission: 'sxbook:task:list' } },
  { path: '/automation/following', name: 'automation-following', component: SubscriptionsPage, meta: { title: '追更管理', requiresAuth: true, permission: 'sxbook:book:list' } },
  { path: '/automation/subscriptions', name: 'automation-subscriptions', redirect: '/automation/following' },
  { path: '/permissions/users', name: 'permissions-users', component: UserManagementPage, meta: { title: '用户管理', requiresAuth: true, permission: 'sxbook:userManage:list' } },
  { path: '/permissions/roles', name: 'permissions-roles', component: RolePermissionPage, meta: { title: '角色权限', requiresAuth: true, permission: 'system:role:list' } },
  { path: '/settings/site', name: 'settings-site', component: SiteSettingsPage, meta: { title: '站点设置', requiresAuth: true, permission: 'sxbook:siteSetting:detail' } },
  { path: '/settings/reader', name: 'settings-reader', component: ReaderSettingsPage, meta: { title: '阅读设置', requiresAuth: true, permission: 'sxbook:readerSetting:detail' } },
  { path: '/settings/notifications', name: 'settings-notifications', component: NotificationSettingsPage, meta: { title: '通知设置', requiresAuth: true, permission: 'sxbook:notifySetting:channel:list' } },
  { path: '/settings/security', name: 'settings-security', component: SecuritySettingsPage, meta: { title: '安全设置', requiresAuth: true, permission: 'sxbook:securitySetting:detail' } },
  { path: '/settings/license', name: 'settings-license', component: LicenseInfoPage, meta: { title: '授权信息', requiresAuth: true, permission: 'sxbook:licenseInfo:detail' } },
  { path: '/logs/operations', name: 'logs-operations', component: OperationLogPage, meta: { title: '操作日志', requiresAuth: true, permission: 'sxbook:operateLog:list' } },
  { path: '/logs/tasks', name: 'logs-tasks', component: TaskLogPage, meta: { title: '任务日志', requiresAuth: true, permission: 'sxbook:taskLog:list' } },
  { path: '/logs/tasks/stats', name: 'logs-task-stats', component: TaskStatsPage, meta: { title: '任务统计', requiresAuth: true, permission: 'sxbook:taskStats:summary' } },
]

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginPage, meta: { title: '登录' } },
  { path: '/403', name: 'forbidden', component: ForbiddenPage, meta: { title: '没有权限', requiresAuth: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { title: '首页概览', requiresAuth: true, permission: 'sxbook:dashboard:view' } },
  { path: '/books', name: 'books', component: BooksPage, meta: { title: '书籍管理', requiresAuth: true, permission: 'sxbook:book:list' } },
  { path: '/storage', name: 'storage', component: StorageManagementPage, meta: { title: '存储管理', requiresAuth: true, permission: 'sxbook:storage:list' } },
  { path: '/categories', name: 'categories', component: CategoryManagementPage, meta: { title: '分类管理', requiresAuth: true, permission: 'sxbook:category:list' } },
  { path: '/tags', name: 'tags', component: TagManagementPage, meta: { title: '标签管理', requiresAuth: true, permission: 'sxbook:tag:list' } },
  { path: '/novels', name: 'novels', component: NovelPage, meta: { title: '小说', requiresAuth: true, permission: 'sxbook:book:list' } },
  { path: '/comics', name: 'comics', component: ComicPage, meta: { title: '漫画管理', requiresAuth: true, permission: 'sxbook:comic:list' } },
  { path: '/audio', name: 'audio', component: AudioPage, meta: { title: '有声管理', requiresAuth: true, permission: 'sxbook:audio:list' } },
  ...adminModuleRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)
  const requiresAuth = Boolean(to.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (requiresAuth && authStore.isAuthenticated && (!authStore.userInfo || !authStore.permissionsLoaded)) {
    try {
      await authStore.ensureSession()
    } catch (error) {
      authStore.clearAuth()
      return { name: 'login' }
    }
  }

  if (requiresAuth && to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    return to.name === 'forbidden' ? true : { name: 'forbidden', query: { from: to.fullPath } }
  }

  return true
})

router.afterEach((to) => {
  document.title = `书匣 - ${to.meta.title || '内容平台'}`
})

export default router

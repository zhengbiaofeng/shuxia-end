<template>
  <AppShell>
    <template #sidebar>
      <SidebarNav :menus="menus" :profile="profile" @logout="handleLogout" />
    </template>

    <div class="dashboard-page">
      <header class="page-top">
        <div>
          <h1>概览</h1>
          <p>欢迎回来，管理员！随时掌握您的书匣运行状态</p>
        </div>
        <div class="top-status">
          <span>NAS名称：</span>
          <strong>{{ headerInfo.nasName }}</strong>
          <span class="status-pill" :class="`tone-text-${headerInfo.runStatusTone}`"><i />{{ headerInfo.runStatusText }}</span>
          <span>{{ headerInfo.time }}</span>
          <el-button class="icon-btn" :icon="RefreshRight" @click="loadDashboard" />
        </div>
      </header>

      <section class="stats-grid" aria-label="关键指标">
        <StatCard
          v-for="(item, index) in statItems"
          :key="item.title"
          :item="item"
          :clickable="Boolean(resolveStatRoute(item, index))"
          @click="onStatClick(item, index)"
        />
      </section>

      <section class="middle-grid" aria-label="运行状态">
        <article class="panel panel--system">
          <div class="panel__head">
            <h2>系统状态</h2>
          </div>

          <div class="service-grid">
            <div v-for="entry in dashboardServiceStatuses" :key="entry.label" class="service-card">
              <span class="service-card__icon" :class="`tone-${entry.tone}`">
                <el-icon><component :is="entry.icon" /></el-icon>
              </span>
              <div>
                <strong>{{ entry.label }}</strong>
                <span :class="`tone-text-${entry.tone}`"><i />{{ entry.status }}</span>
              </div>
            </div>
            <div v-if="!dashboardServiceStatuses.length" class="empty-panel">暂无系统状态</div>
          </div>

          <div class="metric-grid">
            <div v-for="entry in dashboardMetricCards" :key="entry.title" class="mini-metric">
              <span>{{ entry.title }}</span>
              <strong>{{ entry.value }}</strong>
              <svg viewBox="0 0 104 42" aria-hidden="true">
                <path :d="entry.path" :stroke="entry.color" fill="none" />
              </svg>
            </div>
            <div v-if="!dashboardMetricCards.length" class="empty-panel">暂无系统指标</div>
          </div>

          <div class="system-detail-grid">
            <div v-for="entry in dashboardStatusDetails" :key="entry.label">
              <span>{{ entry.label }}</span>
              <strong>{{ entry.value }}</strong>
            </div>
            <div v-if="!dashboardStatusDetails.length" class="empty-panel">暂无状态明细</div>
          </div>
        </article>

        <article class="panel panel--storage">
          <div class="panel__head">
            <h2>存储空间概览</h2>
            <a href="#">查看更多</a>
          </div>
          <div class="storage-body">
            <div class="storage-summary">
              <div class="storage-ring" :aria-label="`已使用 ${storageOverview.usagePercent}%`">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="44" class="storage-ring__track" />
                  <circle
                    cx="60"
                    cy="60"
                    r="44"
                    class="storage-ring__value"
                    :style="{ strokeDashoffset: storageDashOffset }"
                  />
                </svg>
                <div>
              <span>总容量</span>
              <strong>{{ storageOverview.totalText }}</strong>
            </div>
          </div>
              <p class="storage-used">已使用 {{ storageOverview.usageText }}</p>
            </div>
            <div class="storage-list">
            <div v-for="entry in dashboardStorageItems" :key="entry.name" class="storage-row">
                <div class="storage-row__title">
                  <span :class="`dot tone-dot-${entry.tone}`" />
                  <strong>{{ entry.name }}</strong>
                </div>
                <div class="storage-row__meta">
                  <span>{{ entry.used }}</span>
                  <span>{{ entry.percent }}%</span>
                </div>
                <div class="storage-row__bar">
                  <i :class="`tone-bg-${entry.tone}`" :style="{ width: `${entry.percent}%` }" />
                </div>
              </div>
            </div>
            <div v-if="!dashboardStorageItems.length" class="empty-panel">暂无存储数据</div>
          </div>
        </article>

        <article class="panel panel--actions">
          <div class="panel__head">
            <h2>快捷操作</h2>
          </div>
          <div class="quick-grid">
            <button
              v-for="entry in dashboardQuickActions"
              :key="entry.label"
              class="quick-card"
              :class="`tone-${entry.tone}`"
              :disabled="entry.enabled === false"
              @click="handleQuickAction(entry)"
            >
              <el-icon><component :is="entry.icon" /></el-icon>
              <span>{{ entry.label }}</span>
            </button>
          </div>
        </article>
      </section>

      <section class="bottom-grid" aria-label="任务与通知">
        <article class="panel panel--tasks">
          <div class="panel__head">
            <h2>最近任务</h2>
            <a href="#">查看全部</a>
          </div>
          <div class="task-tabs">
            <button
              v-for="(entry, index) in taskTabs"
              :key="entry.key || entry.label"
              :class="{ 'is-active': index === 0 }"
            >
              {{ entry.label }}
            </button>
          </div>
          <ul class="task-list">
            <li v-for="entry in tasks" :key="entry.title">
              <span class="task-icon" :class="`tone-${entry.statusTone}`">
                <el-icon><RefreshRight /></el-icon>
              </span>
              <div class="task-main">
                <strong>{{ entry.title }}</strong>
                <span>{{ entry.category }}</span>
              </div>
              <div class="task-progress">
                <i :class="`tone-bg-${entry.statusTone}`" :style="{ width: `${entry.progress}%` }" />
              </div>
              <span class="task-percent">{{ entry.progressText || `${entry.progress || 0}%` }}</span>
              <span class="task-state" :class="`tone-text-${entry.statusTone}`">{{ entry.status }}</span>
              <time>{{ entry.time }}</time>
            </li>
            <li v-if="!tasks.length" class="empty-row">暂无最近任务</li>
          </ul>
        </article>

        <article class="panel panel--connections">
          <div class="panel__head">
            <h2>存储连接状态</h2>
            <a href="#">查看全部</a>
          </div>
          <ul class="connection-list">
            <li v-for="entry in dashboardConnections" :key="entry.name">
              <span class="connection-icon" :class="`tone-${entry.stateTone}`">
                <el-icon><component :is="entry.icon" /></el-icon>
              </span>
              <div>
                <strong>{{ entry.name }}</strong>
                <span>{{ entry.path }}</span>
              </div>
              <div class="connection-state">
                <strong :class="`tone-text-${entry.stateTone}`"><i />{{ entry.state }}</strong>
                <span>最后扫描：{{ entry.time }}</span>
              </div>
            </li>
            <li v-if="!dashboardConnections.length" class="empty-row">暂无存储连接数据</li>
          </ul>
        </article>

        <article class="panel panel--notifications">
          <div class="panel__head">
            <h2>系统通知</h2>
            <a href="#">查看更多</a>
          </div>
          <ul class="notification-list">
            <li v-for="(entry, index) in notifications" :key="`${entry.title}-${entry.time}-${index}`">
              <span class="notice-icon" :class="`tone-${entry.tone}`">i</span>
              <div>
                <strong>{{ entry.title }}</strong>
                <span>{{ entry.desc }}</span>
              </div>
              <time>{{ entry.time }}</time>
            </li>
            <li v-if="!notifications.length" class="empty-row">暂无系统通知</li>
          </ul>
        </article>
      </section>

      <footer class="dashboard-footer">
        <span>{{ footerInfo.copyrightText }}</span>
        <span>{{ footerInfo.version }}</span>
      </footer>
    </div>
  </AppShell>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { RefreshRight } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useSiteSettingsStore } from '../stores/siteSettings'
import { fetchDashboardHomePage } from '../api/dashboard'
import { AppShell } from '../components/layout'
import SidebarNav from '../components/nav/SidebarNav.vue'
import StatCard from '../components/dashboard/StatCard.vue'
import { createSideMenus } from '../config/navigation'
import {
  dashboardIconFallbacks,
  dashboardQuickActionFallbacks,
  defaultTaskTabs,
} from '../config/dashboard'
import { computed, onMounted, shallowRef } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const siteSettingsStore = useSiteSettingsStore()
const menus = computed(() => createSideMenus('概览'))
const profile = computed(() => {
  const user = authStore.userInfo

  if (!user) return null

  const name = user.realname || user.username || '用户'

  return {
    name,
    role: user.username === 'admin' ? '超级管理员' : '管理员',
    initial: name.slice(0, 1),
    color: 'var(--color-accent)',
  }
})
const headerInfo = shallowRef({
  nasName: '--',
  runStatusText: '--',
  runStatusTone: 'blue',
  time: '',
})
const statItems = shallowRef([])
const dashboardServiceStatuses = shallowRef([])
const dashboardMetricCards = shallowRef([])
const dashboardStatusDetails = shallowRef([])
const storageOverview = shallowRef({
  totalText: '0 B',
  usageText: '0 B (0%)',
  usagePercent: 0,
})
const dashboardStorageItems = shallowRef([])
const dashboardQuickActions = shallowRef(dashboardQuickActionFallbacks)
const taskTabs = shallowRef(defaultTaskTabs)
const tasks = shallowRef([])
const dashboardConnections = shallowRef([])
const notifications = shallowRef([])
const footerInfo = shallowRef({
  copyrightText: siteSettingsStore.footerText,
  version: siteSettingsStore.version,
})
const storageDashOffset = computed(() => {
  const circumference = 276
  return Math.round(circumference * (1 - Number(storageOverview.value.usagePercent || 0) / 100))
})
const statRouteByTitle = {
  书籍: '/books',
  小说: '/novels',
  漫画: '/comics',
  有声: '/audio',
}
const statRouteByIndex = ['/books', '/novels', '/comics', '/audio']

async function loadDashboard() {
  try {
    const data = await fetchDashboardHomePage()
    headerInfo.value = data.header
    statItems.value = mergeIconModels(data.topStats)
    dashboardServiceStatuses.value = mergeIconModels(data.serviceStatuses)
    dashboardMetricCards.value = data.systemMetrics
    dashboardStatusDetails.value = data.statusDetails
    storageOverview.value = data.storageOverview
    dashboardStorageItems.value = data.storageSources
    dashboardQuickActions.value = mergeIconModels(data.quickActions.length ? data.quickActions : dashboardQuickActionFallbacks)
    taskTabs.value = data.taskTabs.length ? data.taskTabs : defaultTaskTabs
    tasks.value = data.recentTasks
    dashboardConnections.value = mergeIconModels(data.storageConnections)
    notifications.value = data.notices
    footerInfo.value = data.footer?.copyrightText ? data.footer : {
      copyrightText: siteSettingsStore.footerText,
      version: siteSettingsStore.version,
    }
  } catch (error) {
    console.warn('首页聚合接口加载失败。', error)
    headerInfo.value = {
      nasName: '--',
      runStatusText: '接口异常',
      runStatusTone: 'orange',
      time: '',
    }
    statItems.value = []
    dashboardServiceStatuses.value = []
    dashboardMetricCards.value = []
    dashboardStatusDetails.value = []
    storageOverview.value = {
      totalText: '0 B',
      usageText: '0 B (0%)',
      usagePercent: 0,
    }
    dashboardStorageItems.value = []
    dashboardQuickActions.value = dashboardQuickActionFallbacks
    taskTabs.value = defaultTaskTabs
    tasks.value = []
    dashboardConnections.value = []
    notifications.value = []
    footerInfo.value = {
      copyrightText: siteSettingsStore.footerText,
      version: siteSettingsStore.version,
    }
  }
}

function onStatClick(item, index) {
  const route = resolveStatRoute(item, index)
  if (!route || router.currentRoute.value.path === route) return
  router.push(route)
}

function resolveStatRoute(item, index) {
  return statRouteByTitle[item.title] || statRouteByIndex[index] || ''
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function handleQuickAction(entry) {
  if (!entry.enabled) return
  if (entry.routePath) {
    router.push(entry.routePath)
  }
}

function mergeIconModels(records) {
  if (!records?.length) return []
  return records.map((record, index) => ({
    ...record,
    icon: resolveIcon(record, dashboardIconFallbacks[index]),
  }))
}

function resolveIcon(record, fallback) {
  if (fallback?.icon) return fallback.icon
  const iconMap = Object.fromEntries(
    dashboardIconFallbacks
      .filter((item) => item.icon)
      .map((item) => [item.iconKey || item.label || item.title || item.name, item.icon]),
  )
  return iconMap[record.iconKey] || iconMap[record.label] || iconMap[record.title] || iconMap[record.name] || RefreshRight
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard-page {
  width: 100%;
  max-width: 100%;
  min-height: calc(100vh - 44px);
  overflow-x: hidden;
  padding: var(--admin-page-padding-y) var(--admin-page-padding-x) var(--admin-page-padding-bottom);
  color: #14234b;
}

.page-top,
.top-status,
.panel__head,
.task-list li,
.connection-list li,
.notification-list li {
  display: flex;
  align-items: center;
}

.page-top {
  justify-content: space-between;
  margin-bottom: 23px;
}

.page-top h1 {
  font-size: var(--admin-text-page-title);
  line-height: 1.15;
  color: #081a45;
}

.page-top p {
  margin-top: 8px;
  color: #536486;
  font-size: 14px;
}

.top-status {
  gap: 12px;
  color: #40547c;
  font-size: 13px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border: 1px solid #ccefdc;
  border-radius: 6px;
  background: #effcf5;
  color: #12a553;
  font-weight: 700;
}

.status-pill i,
.tone-text-green i,
.tone-text-orange i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.icon-btn {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
  min-width: 0;
}

.middle-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1.2fr) minmax(0, 0.76fr);
  gap: 14px;
  margin-bottom: 14px;
  align-items: stretch;
  min-width: 0;
}

.bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 14px;
  min-width: 0;
}

.panel {
  min-width: 0;
  max-width: 100%;
  padding: 17px 18px;
  border: 1px solid #e1e8f3;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 2px rgba(35, 55, 94, 0.03);
}

.middle-grid .panel {
  min-height: 260px;
}

.panel--system {
  max-height: 260px;
  overflow: hidden;
}

.panel--actions,
.panel--storage {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel__head {
  justify-content: space-between;
  margin-bottom: 15px;
}

.panel__head h2 {
  font-size: 16px;
  color: #0e2050;
  letter-spacing: 0;
}

.panel__head a {
  color: #176bff;
  font-size: 12px;
  font-weight: 600;
}

.service-grid,
.metric-grid,
.quick-grid,
.system-detail-grid {
  display: grid;
  gap: 10px;
}

.service-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 11px;
}

.service-card,
.mini-metric,
.quick-card {
  border: 1px solid #e1e8f3;
  border-radius: 7px;
  background: #fff;
}

.service-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  height: 44px;
  padding: 8px 12px;
  overflow: hidden;
}

.service-card__icon,
.task-icon,
.connection-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 7px;
}

.service-card__icon {
  width: 30px;
  height: 30px;
}

.service-card strong {
  display: block;
  overflow: hidden;
  color: #26385f;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-card span:not(.service-card__icon) {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  max-width: 100%;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-grid {
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 11px;
}

.mini-metric {
  height: 80px;
  padding: 8px 10px;
  overflow: hidden;
}

.mini-metric span {
  display: block;
  overflow: hidden;
  color: #3a4d75;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-metric strong {
  display: block;
  height: 22px;
  margin-top: 7px;
  overflow: hidden;
  color: #081a45;
  font-size: 17px;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-metric svg {
  width: 100%;
  height: 24px;
  margin-top: 4px;
}

.mini-metric path {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}

.system-detail-grid {
  grid-template-columns: repeat(4, 1fr);
  padding: 10px 8px;
  border-radius: 7px;
  background: #fafcff;
}

.system-detail-grid div {
  text-align: center;
}

.system-detail-grid span {
  display: block;
  overflow: hidden;
  color: #60708e;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.system-detail-grid strong {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  color: #25385f;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-panel,
.empty-row {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  border: 1px dashed #d8e2f2;
  border-radius: 8px;
  color: #5d6f9d;
  font-size: 13px;
  font-weight: 700;
}

.empty-panel {
  grid-column: 1 / -1;
}

.empty-row {
  width: 100%;
}

.storage-body {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
  flex: 1;
}

.storage-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.storage-ring {
  position: relative;
  width: 148px;
  height: 148px;
}

.storage-ring svg {
  transform: rotate(-90deg);
}

.storage-ring circle {
  fill: none;
  stroke-width: 18;
}

.storage-ring__track {
  stroke: #dce8ff;
}

.storage-ring__value {
  stroke: #176bff;
  stroke-dasharray: 276;
  stroke-dashoffset: 158;
}

.storage-ring div {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
}

.storage-ring span,
.storage-used,
.storage-row__meta {
  color: #60708e;
  font-size: 12px;
}

.storage-ring strong {
  margin-top: 5px;
  color: #081a45;
  font-size: 16px;
}

.storage-list {
  display: grid;
  align-content: center;
  gap: 10px;
  min-width: 0;
}

.storage-row__title,
.storage-row__meta {
  display: flex;
  justify-content: space-between;
}

.storage-row__title {
  align-items: center;
  gap: 8px;
  color: #26385f;
  font-size: 12px;
}

.storage-row__title strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.storage-row__bar,
.task-progress {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: #e9eef7;
}

.storage-row__bar i,
.task-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.storage-used {
  align-self: stretch;
  margin: 11px 0 0;
  text-align: center;
}

.quick-grid {
  flex: 1;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, minmax(0, 1fr));
  max-height: 206px;
  overflow: hidden;
}

.quick-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 0;
  height: 100%;
  padding: 0 12px;
  overflow: hidden;
  color: #1a2e5d;
  font-weight: 700;
  cursor: pointer;
}

.quick-card .el-icon {
  flex: 0 0 auto;
  font-size: 25px;
}

.quick-card span {
  display: block;
  width: 2.2em;
  overflow: hidden;
  text-align: center;
  line-height: 1.25;
  white-space: normal;
  word-break: break-all;
}

.task-tabs {
  display: flex;
  gap: 28px;
  margin: -2px 0 10px;
  border-bottom: 1px solid #e8eef7;
}

.task-tabs button {
  height: 32px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #556685;
  font-size: 12px;
  cursor: pointer;
}

.task-tabs .is-active {
  border-color: #176bff;
  color: #176bff;
}

.task-list,
.connection-list,
.notification-list {
  display: grid;
  gap: 0;
}

.task-list li {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 86px 44px 48px 42px;
  min-height: 50px;
  gap: 11px;
  border-bottom: 1px solid #edf2f8;
}

.task-list li:last-child,
.connection-list li:last-child {
  border-bottom: 0;
}

.task-icon,
.connection-icon {
  width: 30px;
  height: 30px;
}

.task-main,
.connection-list li > div:first-of-type,
.notification-list li > div {
  min-width: 0;
}

.task-main {
  max-width: none;
}

.task-main strong,
.connection-list strong,
.notification-list strong {
  display: block;
  overflow: hidden;
  color: #142654;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-main span,
.connection-list span,
.notification-list span,
.task-list time {
  color: #60708e;
  font-size: 12px;
}

.task-progress {
  width: 86px;
}

.task-percent {
  width: 44px;
  overflow: hidden;
  color: #60708e;
  font-size: 12px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-state {
  width: 48px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-list time {
  width: 42px;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-list li {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 92px;
  gap: 12px;
  min-height: 58px;
  border-bottom: 1px solid #edf2f8;
}

.connection-state {
  width: 92px;
  min-width: 0;
  text-align: left;
}

.connection-state strong {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  font-size: 12px;
}

.connection-state span {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-list {
  gap: 10px;
}

.notification-list li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 58px;
  min-height: 52px;
  gap: 12px;
  padding: 10px 13px;
  border: 1px solid #e6edf7;
  border-radius: 7px;
  background: #fff;
}

.notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.notification-list time {
  width: 58px;
  overflow: hidden;
  color: #60708e;
  font-size: 12px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-footer {
  display: flex;
  justify-content: center;
  gap: 46%;
  padding: 22px 16px 0;
  color: #60708e;
  font-size: 12px;
}

.tone-blue,
.tone-indigo {
  background: #eaf2ff;
  color: #176bff;
}

.tone-green {
  background: #eaf9f1;
  color: #15ad5f;
}

.tone-purple {
  background: #f3edff;
  color: #8248ef;
}

.tone-orange {
  background: #fff4e7;
  color: #ff8a15;
}

.tone-red {
  background: #fff0f0;
  color: #ef4444;
}

.tone-text-green {
  color: #12a553;
}

.tone-text-blue {
  color: #176bff;
}

.tone-text-orange {
  color: #ff8a15;
}

.tone-text-red {
  color: #ef4444;
}

.tone-bg-blue,
.tone-bg-indigo {
  background: #176bff;
}

.tone-bg-violet {
  background: #2f7cff;
}

.tone-bg-green {
  background: #15ad5f;
}

.tone-bg-orange {
  background: #ff8a15;
}

.tone-bg-red {
  background: #ef4444;
}

.tone-bg-slate,
.tone-bg-gray {
  background: #6b7c9a;
}

.tone-dot-blue { background: #15ad8a; }
.tone-dot-violet { background: #24b47e; }
.tone-dot-indigo { background: #ef4444; }
.tone-dot-slate { background: #ef4444; }
.tone-dot-gray { background: #6b7c9a; }

@media (max-width: 1320px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .middle-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-page {
    padding: var(--admin-page-padding-mobile-y) var(--admin-page-padding-mobile-x);
  }

  .page-top,
  .top-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid,
  .service-grid,
  .metric-grid,
  .quick-grid,
  .system-detail-grid,
  .storage-body {
    grid-template-columns: 1fr;
  }
}
</style>

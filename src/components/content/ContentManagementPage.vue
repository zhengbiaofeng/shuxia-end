<template>
  <AppShell>
    <template #sidebar>
      <SidebarNav :menus="menus" :profile="profile" @logout="handleLogout" />
    </template>

    <div class="content-page">
      <header class="page-top">
        <div class="page-title">
          <h1>{{ config.title }}</h1>
          <p>{{ config.subtitle }}</p>
        </div>
        <div v-if="status" class="top-status">
          <span>NAS名称:</span>
          <strong>{{ status.nasName }}</strong>
          <span class="status-pill"><i />{{ status.status }}</span>
          <span>{{ status.time }}</span>
          <el-button class="icon-btn" :icon="RefreshRight" @click="$emit('refresh')" />
        </div>
      </header>

      <div class="command-row" :class="{ 'has-tabs': hasTabs }">
        <nav v-if="hasTabs" class="content-tabs" aria-label="内容状态">
          <button
            v-for="tab in config.tabs"
            :key="tab.key || tab.label"
            type="button"
            :class="{ active: (activeTab || config.tabs[0]?.key) === tab.key }"
            @click="$emit('tab-change', tab.key)"
          >
            {{ tab.label }}
          </button>
        </nav>
        <div class="page-actions">
          <el-button
            v-for="action in config.actions"
            :key="action.label"
            :type="action.tone || 'default'"
            :icon="action.icon"
            @click="$emit('action', action)"
          >
            {{ action.label }}
          </el-button>
        </div>
      </div>

      <section
        v-if="visibleMetrics.length"
        class="content-metrics"
        :style="{ '--metric-count': visibleMetrics.length }"
        aria-label="内容指标"
      >
        <BookMetricCard v-for="item in visibleMetrics" :key="item.title" :item="item" />
      </section>

      <section class="content-card">
        <div class="filter-bar">
          <el-input
            :model-value="searchKeyword"
            :placeholder="config.searchPlaceholder"
            clearable
            :prefix-icon="Search"
            class="filter-search"
            @update:model-value="$emit('update:searchKeyword', $event)"
            @keyup.enter="$emit('search')"
          />

          <label v-for="filter in config.filters" :key="filter.key">
            <span v-if="filter.label">{{ filter.label }}</span>
            <el-select
              :model-value="filtersState[filter.key]"
              :placeholder="filter.placeholder"
              @update:model-value="$emit('filter-change', filter.key, $event)"
            >
              <el-option
                v-for="option in normalizeOptions(filter.options)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>

          <el-button class="reset-btn" :icon="RefreshRight" @click="$emit('reset')">重置</el-button>
          <el-button v-if="config.extraFilterAction" class="plain-filter-btn" @click="$emit('extra-filter')">
            {{ config.extraFilterAction }}
            <el-icon class="btn-suffix"><ArrowDown /></el-icon>
          </el-button>
        </div>

        <div v-loading="loading" class="table-wrap">
          <div v-if="config.selectable && config.batchActions?.length" class="batch-toolbar">
            <span>已选择 {{ selectedRowKeys.length }} 项</span>
            <el-button
              v-for="action in config.batchActions"
              :key="action.code || action.label"
              :disabled="selectedRowKeys.length === 0 || action.loading"
              :loading="action.loading"
              :type="action.tone || 'default'"
              plain
              size="small"
              @click="$emit('batch-action', action, selectedRows)"
            >
              {{ action.label }}
            </el-button>
            <el-button v-if="selectedRowKeys.length" link size="small" @click="$emit('selection-change', [])">
              清空
            </el-button>
          </div>
          <table class="content-table">
            <thead>
              <tr>
                <th v-if="config.selectable" class="selection-column">
                  <el-checkbox
                    :indeterminate="isSelectionIndeterminate"
                    :model-value="isAllCurrentPageSelected"
                    @change="toggleCurrentPageSelection"
                  />
                </th>
                <th v-for="column in config.columns" :key="column.key" :class="column.class">
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td v-if="config.selectable" class="selection-column">
                  <el-checkbox
                    :model-value="selectedRowKeySet.has(row.id)"
                    @change="(checked) => toggleRowSelection(row, checked)"
                  />
                </td>
                <td v-for="column in config.columns" :key="column.key" :class="column.class">
                  <template v-if="column.type === 'cover'">
                    <span class="item-cover" :style="coverStyle(row.cover)" />
                  </template>

                  <template v-else-if="column.type === 'title'">
                    <div class="title-cell">
                      <strong :title="row[column.key]">{{ row[column.key] }}</strong>
                      <span v-if="row[column.subKey]" :title="row[column.subKey]">{{ row[column.subKey] }}</span>
                    </div>
                  </template>

                  <template v-else-if="column.type === 'coverTitle'">
                    <div class="media-cell">
                      <span class="item-cover" :style="coverStyle(row.cover)" />
                      <div class="title-cell">
                        <strong :title="row.title">
                          {{ row.title }}
                          <span v-for="badge in row.badges || []" :key="badge.label" class="mini-badge" :class="badge.tone">
                            {{ badge.label }}
                          </span>
                        </strong>
                        <span :title="row.subtitle">{{ row.subtitle }}</span>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="column.type === 'chip'">
                    <span class="chip" :class="chipTone(row[column.key])">{{ row[column.key] }}</span>
                  </template>

                  <template v-else-if="column.type === 'tags'">
                    <span v-for="tag in row[column.key]" :key="tag" class="chip chip-tag">{{ tag }}</span>
                  </template>

                  <template v-else-if="column.type === 'status'">
                    <div class="status-cell">
                      <span class="status-chip" :class="statusTone(row[column.key])">{{ row[column.key] }}</span>
                      <span v-if="row[column.subKey]" :title="row[column.subKey]">{{ row[column.subKey] }}</span>
                    </div>
                  </template>

                  <template v-else-if="column.type === 'source'">
                    <div class="source-cell">
                      <strong :title="row[column.key]">{{ row[column.key] }}</strong>
                      <span v-if="row[column.subKey]" :title="row[column.subKey]">{{ row[column.subKey] }}</span>
                    </div>
                  </template>

                  <template v-else-if="column.type === 'dual'">
                    <div class="dual-cell">
                      <strong :title="row[column.key]">{{ row[column.key] }}</strong>
                      <span v-if="row[column.subKey]" :title="row[column.subKey]">{{ row[column.subKey] }}</span>
                    </div>
                  </template>

                  <template v-else-if="column.type === 'actions'">
                    <div class="row-actions">
                      <button
                        v-for="action in visibleRowActions(row)"
                        :key="action.label"
                        type="button"
                        :class="{ danger: action.danger }"
                        :title="action.label"
                        @click="$emit('row-action', action, row)"
                      >
                        <el-icon><component :is="action.icon" /></el-icon>
                      </button>
                    </div>
                  </template>

                  <template v-else>
                    <span class="text-cell" :title="row[column.key]">{{ row[column.key] }}</span>
                  </template>
                </td>
              </tr>
              <tr v-if="!loading && rows.length === 0">
                <td class="empty-cell" :colspan="config.columns.length + (config.selectable ? 1 : 0)">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="table-footer">
          <span>共 {{ total.toLocaleString() }} 条数据</span>
          <div class="pagination">
            <button :disabled="pageNo === 1" @click="$emit('page-change', 1)">«</button>
            <button :disabled="pageNo === 1" @click="$emit('page-change', pageNo - 1)">‹</button>
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="{ 'is-active': page === pageNo }"
              @click="$emit('page-change', page)"
            >
              {{ page }}
            </button>
            <button v-if="pageCount > 6" disabled>...</button>
            <button v-if="pageCount > 6" @click="$emit('page-change', pageCount)">{{ pageCount }}</button>
            <button :disabled="pageNo >= pageCount" @click="$emit('page-change', pageNo + 1)">›</button>
            <button :disabled="pageNo >= pageCount" @click="$emit('page-change', pageCount)">»</button>
          </div>
          <el-select :model-value="pageSize" class="page-size" @update:model-value="$emit('page-size-change', $event)">
            <el-option
              v-for="size in config.pageSizeOptions || [10, 20, 50]"
              :key="size"
              :label="`${size} 条/页`"
              :value="size"
            />
          </el-select>
        </footer>
      </section>

      <footer class="content-footer">
        <span>© 2024 书匣 · 私有数字内容库系统</span>
        <span>v2.0.0</span>
      </footer>
    </div>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, RefreshRight, Search } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { AppShell } from '../layout'
import SidebarNav from '../nav/SidebarNav.vue'
import BookMetricCard from '../books/BookMetricCard.vue'
import { createSideMenus } from '../../config/navigation'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  metrics: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
  pageNo: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  pageCount: {
    type: Number,
    default: 1,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  searchKeyword: {
    type: String,
    default: '',
  },
  filtersState: {
    type: Object,
    default: () => ({}),
  },
  activeTab: {
    type: String,
    default: '',
  },
  selectedRowKeys: {
    type: Array,
    default: () => [],
  },
  status: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'action',
  'batch-action',
  'extra-filter',
  'filter-change',
  'page-change',
  'page-size-change',
  'refresh',
  'reset',
  'row-action',
  'search',
  'selection-change',
  'tab-change',
  'update:searchKeyword',
])

const router = useRouter()
const authStore = useAuthStore()
const menus = computed(() => createSideMenus(props.config.activeMenu))
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
const hasTabs = computed(() => Boolean(props.config.tabs?.length))
const visibleMetrics = computed(() => props.metrics.length ? props.metrics : (props.config.metrics || []))
const selectedRowKeySet = computed(() => new Set(props.selectedRowKeys))
const selectedRows = computed(() => props.rows.filter((row) => selectedRowKeySet.value.has(row.id)))
const selectableRows = computed(() => props.rows.filter((row) => row?.id))
const isAllCurrentPageSelected = computed(() => (
  selectableRows.value.length > 0 && selectableRows.value.every((row) => selectedRowKeySet.value.has(row.id))
))
const isSelectionIndeterminate = computed(() => {
  const selectedCount = selectableRows.value.filter((row) => selectedRowKeySet.value.has(row.id)).length
  return selectedCount > 0 && selectedCount < selectableRows.value.length
})

const visiblePages = computed(() => {
  const max = Math.max(1, props.pageCount)
  const start = Math.max(1, Math.min(props.pageNo - 2, max - 4))
  const end = Math.min(max, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

function normalizeOptions(options = []) {
  return options.map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option }
    }
    return option
  })
}

function coverStyle(cover) {
  if (!cover) {
    return { background: 'linear-gradient(145deg, #dbeafe, #2563eb)' }
  }
  if (cover.startsWith?.('http') || cover.startsWith?.('/') || cover.startsWith?.('data:')) {
    return { backgroundImage: `url("${cover}")` }
  }
  return { background: cover }
}

function chipTone(value = '') {
  if (value.includes('历史') || value.includes('热血') || value.includes('搞笑') || value.includes('养生')) return 'orange'
  if (value.includes('仙侠') || value.includes('文学') || value.includes('校园')) return 'blue'
  if (value.includes('科幻') || value.includes('幻术') || value.includes('心理')) return 'purple'
  if (value.includes('悬疑') || value.includes('儿童')) return 'green'
  return 'cyan'
}

function statusTone(value = '') {
  if (value.includes('暂停') || value.includes('更新中') || value.includes('解析中') || value.includes('转码中')) return 'is-warning'
  if (value.includes('未') || value.includes('失败') || value.includes('待')) return 'is-pending'
  if (value.includes('完成') || value.includes('完结') || value.includes('已')) return 'is-done'
  return 'is-active'
}

function visibleRowActions(row = {}) {
  const actions = Array.isArray(props.config.rowActions) ? props.config.rowActions : []
  const availableActions = Array.isArray(row.availableActions) ? row.availableActions.map((item) => String(item).toLowerCase()) : []

  if (!availableActions.length) {
    return actions
  }

  return actions.filter((action) => {
    const code = String(action.code || '').toLowerCase()
    return !code || availableActions.includes(code)
  })
}

function toggleRowSelection(row, checked) {
  if (!row?.id) return
  const nextKeys = new Set(props.selectedRowKeys)
  if (checked) {
    nextKeys.add(row.id)
  } else {
    nextKeys.delete(row.id)
  }
  emit('selection-change', [...nextKeys])
}

function toggleCurrentPageSelection(checked) {
  const nextKeys = new Set(props.selectedRowKeys)
  selectableRows.value.forEach((row) => {
    if (checked) {
      nextKeys.add(row.id)
    } else {
      nextKeys.delete(row.id)
    }
  })
  emit('selection-change', [...nextKeys])
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.content-page {
  color: #172554;
  max-width: 100%;
  min-height: 100vh;
  min-width: 0;
  overflow-x: hidden;
  padding: var(--admin-page-padding-y) var(--admin-page-padding-x) var(--admin-page-padding-bottom);
}

.page-top {
  align-items: flex-start;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  min-width: 0;
}

.page-title {
  min-width: 0;
}

.page-top h1 {
  color: #071f56;
  font-size: var(--admin-text-page-title);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 10px;
}

.page-top p {
  color: #40558b;
  font-size: 14px;
  margin: 0;
  overflow-wrap: anywhere;
}

.top-status {
  align-items: center;
  color: #42578c;
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 10px;
  justify-content: flex-end;
  min-width: 0;
}

.top-status strong {
  font-weight: 700;
}

.status-pill {
  align-items: center;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #16a34a;
  display: inline-flex;
  font-weight: 700;
  gap: 7px;
  padding: 7px 12px;
  white-space: nowrap;
}

.status-pill i {
  background: #22c55e;
  border-radius: 50%;
  height: 6px;
  width: 6px;
}

.icon-btn {
  border-radius: 8px;
  height: 36px;
  padding: 0 10px;
  width: 36px;
}

.command-row {
  align-items: flex-end;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  margin-top: 28px;
  min-width: 0;
}

.command-row:not(.has-tabs) {
  justify-content: flex-end;
}

.content-tabs {
  align-items: flex-end;
  display: flex;
  gap: 34px;
  min-height: 42px;
  min-width: 0;
  overflow-x: auto;
}

.content-tabs button {
  background: transparent;
  border: 0;
  color: #334a80;
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 700;
  height: 42px;
  padding: 0;
  position: relative;
}

.content-tabs button.active {
  color: #0b7cff;
}

.content-tabs button.active::after {
  background: #1476ff;
  bottom: 0;
  content: '';
  height: 2px;
  left: 0;
  position: absolute;
  right: 0;
}

.page-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-end;
  min-width: 0;
}

.page-actions :deep(.el-button) {
  border-radius: 6px;
  font-weight: 700;
  height: 40px;
  margin-left: 0;
  padding: 0 18px;
}

.content-metrics {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(var(--metric-count), minmax(150px, 1fr));
  margin-top: 24px;
  min-width: 0;
}

.content-card {
  background: #ffffff;
  border: 1px solid #e7ecf7;
  border-radius: 8px;
  box-shadow: 0 18px 50px rgba(35, 56, 118, 0.06);
  margin-top: 22px;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.filter-bar {
  align-items: center;
  border-bottom: 1px solid #e8edf8;
  display: flex;
  flex-wrap: nowrap;
  gap: 14px;
  max-width: 100%;
  overflow-x: auto;
  padding: 18px 20px;
}

.filter-bar label {
  align-items: center;
  display: flex;
  flex: 0 0 168px;
  gap: 10px;
  min-width: 0;
}

.filter-bar label > span {
  color: #44588a;
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-search :deep(.el-input__wrapper),
.filter-bar :deep(.el-select__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dce4f3 inset;
  min-height: 38px;
}

.filter-search {
  flex: 0 0 250px;
}

.filter-bar :deep(.el-select) {
  width: 100%;
}

.reset-btn,
.plain-filter-btn {
  border-radius: 6px;
  flex: 0 0 auto;
  font-weight: 700;
  height: 38px;
}

.plain-filter-btn {
  color: #2f4781;
}

.btn-suffix {
  margin-left: 4px;
}

.table-wrap {
  max-width: 100%;
  min-height: 420px;
  overflow-x: auto;
}

.batch-toolbar {
  align-items: center;
  background: #f8fbff;
  border-bottom: 1px solid #e8edf8;
  color: #40558b;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 1120px;
  padding: 12px 16px;
}

.batch-toolbar span {
  font-size: 13px;
  font-weight: 700;
}

.content-table {
  border-collapse: collapse;
  min-width: 1120px;
  table-layout: fixed;
  width: 100%;
}

.content-table th {
  background: #fbfcff;
  color: #102557;
  font-size: 13px;
  font-weight: 800;
  padding: 14px 16px;
  text-align: left;
  white-space: nowrap;
}

.content-table td {
  border-top: 1px solid #e9eef8;
  color: #41558a;
  font-size: 13px;
  line-height: 1.45;
  min-width: 0;
  padding: 9px 16px;
  vertical-align: middle;
  white-space: nowrap;
}

.content-table th:first-child,
.content-table td:first-child {
  width: 72px;
}

.content-table th:last-child,
.content-table td:last-child {
  width: 120px;
}

.content-table .selection-column {
  text-align: center;
  width: 48px;
}

.item-cover {
  background-position: center;
  background-size: cover;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4), 0 6px 14px rgba(18, 34, 75, 0.13);
  display: inline-block;
  height: 54px;
  width: 40px;
}

.media-cell {
  align-items: center;
  display: flex;
  gap: 14px;
  min-width: 0;
}

.title-cell,
.source-cell,
.dual-cell,
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.title-cell strong,
.source-cell strong,
.dual-cell strong,
.text-cell {
  color: #102557;
  display: block;
  font-weight: 800;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-cell span,
.source-cell span,
.dual-cell span,
.status-cell span:not(.status-chip) {
  color: #546798;
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip,
.mini-badge {
  border: 1px solid currentColor;
  border-radius: 6px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  max-width: 100%;
  overflow: hidden;
  padding: 3px 7px;
  text-overflow: ellipsis;
  transform: scale(0.92);
  transform-origin: left center;
  vertical-align: middle;
  white-space: nowrap;
}

.title-cell .mini-badge {
  margin-left: 6px;
}

.chip-tag {
  background: #eff6ff;
  color: #2563eb;
  margin-right: 5px;
}

.chip.blue,
.mini-badge.blue {
  background: #eff6ff;
  color: #2563eb;
}

.chip.purple,
.mini-badge.purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.chip.green,
.mini-badge.green {
  background: #ecfdf5;
  color: #16a34a;
}

.chip.orange,
.mini-badge.orange {
  background: #fff7ed;
  color: #f97316;
}

.chip.cyan,
.mini-badge.cyan {
  background: #ecfeff;
  color: #0891b2;
}

.status-chip {
  border-radius: 6px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  max-width: 100%;
  overflow: hidden;
  padding: 4px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: fit-content;
}

.status-chip.is-active,
.status-chip.is-done {
  background: #eafaf1;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

.status-chip.is-pending {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1677ff;
}

.status-chip.is-warning {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #f97316;
}

.row-actions {
  align-items: center;
  display: flex;
  gap: 12px;
}

.row-actions button {
  align-items: center;
  background: transparent;
  border: 0;
  color: #40558f;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 16px;
  height: 24px;
  justify-content: center;
  padding: 0;
  width: 24px;
}

.row-actions button:hover {
  color: #1476ff;
}

.row-actions button.danger {
  color: #dc2626;
}

.row-actions button.danger:hover {
  color: #b91c1c;
}

.row-actions button:last-child {
  border: 1px solid #dfe7f5;
  border-radius: 6px;
  height: 30px;
  width: 30px;
}

.empty-cell {
  color: #6b7ea8;
  height: 160px;
  text-align: center;
}

.table-footer {
  align-items: center;
  border-top: 1px solid #e9eef8;
  color: #42578c;
  display: grid;
  font-size: 13px;
  gap: 20px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  min-width: 0;
  padding: 14px 20px;
}

.pagination {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.pagination button {
  background: #ffffff;
  border: 1px solid #dfe7f5;
  border-radius: 6px;
  color: #43598f;
  cursor: pointer;
  height: 32px;
  min-width: 32px;
}

.pagination button.is-active {
  background: #1476ff;
  border-color: #1476ff;
  color: #ffffff;
}

.pagination button:disabled {
  color: #b8c3d8;
  cursor: not-allowed;
}

.page-size {
  width: 118px;
}

.content-footer {
  align-items: center;
  color: #496099;
  display: flex;
  font-size: 13px;
  justify-content: center;
  margin-top: 18px;
  position: relative;
}

.content-footer span:last-child {
  position: absolute;
  right: 0;
}

@media (max-width: 1320px) {
  .content-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .content-page {
    padding: 20px 16px;
  }

  .page-top,
  .command-row,
  .table-footer {
    align-items: stretch;
    display: flex;
    flex-direction: column;
  }

  .content-tabs,
  .page-actions,
  .top-status {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .content-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-bar {
    flex-wrap: wrap;
    overflow-x: hidden;
  }

  .filter-search,
  .filter-bar label {
    flex: 1 1 220px;
  }
}
</style>

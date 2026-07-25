<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handleAction"
    @tab-change="handleTabChange"
  >
    <div class="admin-page-stack">
      <AdminFilterBar
        :date-range="page.filters.dateRange"
        :filters="page.filters.filters"
        :search="page.filters.search"
        show-search
        @date-change="handleDateChange"
        @filter-change="handleFilterChange"
        @reset="resetFilters"
        @search="queryLogs"
        @search-input="handleSearchInput"
      />

      <div v-loading="loading">
        <AdminTableCard
          :columns="columns"
          :current-page="pageNo"
          :page-size="pageSize"
          :rows="page.rows"
          min-width="1120px"
          row-clickable
          :total="page.total"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          @row-click="openDetail"
        >
          <template #status="{ row }">
            <AdminStatusBadge :label="row.status" :tone="row.tone" dot />
          </template>
          <template #progress="{ row }">
            <div class="progress-cell">
              <span>{{ row.progress }}%</span>
              <el-progress :percentage="row.progress" :show-text="false" :stroke-width="4" />
            </div>
          </template>
          <template #remark="{ row }">
            <span class="remark-cell" :title="row.remark">{{ row.remark }}</span>
          </template>
        </AdminTableCard>
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="任务日志详情" width="min(680px, 92vw)">
      <div v-loading="detailLoading" class="log-detail">
        <dl v-if="selectedLog">
          <template v-for="item in detailFields" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </template>
        </dl>
        <el-empty v-else description="暂无日志详情" :image-size="72" />
      </div>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { AdminFilterBar, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchTaskLogDetail, fetchTaskLogPage } from '../../api/adminModules'
import { logPages } from '../../config/adminModules'

const page = reactive({
  ...logPages.task,
  actions: [{ label: '刷新', icon: Refresh, permission: 'sxbook:taskLog:list' }],
  filters: {
    search: { ...logPages.task.filters.search, value: '' },
    dateRange: { ...logPages.task.filters.dateRange, value: [] },
    filters: logPages.task.filters.filters.map((filter) => ({ ...filter, options: [...filter.options] })),
  },
  rows: [],
  total: 0,
})
const router = useRouter()
const loading = ref(false)
const pageNo = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const detailLoading = ref(false)
const selectedLog = ref(null)
const taskTypeMap = {
  解析: 'PARSE',
  转码: 'TRANSCODE',
  切片: 'SLICE',
  小说采集: 'SCRAPE',
  本地扫描: 'LOCAL_SCAN',
  存储迁移: 'MIGRATE',
}
const taskStatusMap = {
  待处理: 0,
  处理中: 1,
  成功: 2,
  失败: 3,
}

const columns = [
  { key: 'taskId', label: '任务ID' },
  { key: 'name', label: '任务名称' },
  { key: 'module', label: '模块' },
  { key: 'type', label: '任务类型' },
  { key: 'trigger', label: '触发方式' },
  { key: 'start', label: '开始时间' },
  { key: 'duration', label: '执行时长' },
  { key: 'status', label: '状态' },
  { key: 'progress', label: '进度' },
  { key: 'remark', label: '备注' },
]

const detailFields = computed(() => {
  const row = selectedLog.value
  if (!row) return []
  const raw = row.raw || {}
  return [
    { label: '日志ID', value: row.id || '--' },
    { label: '任务ID', value: row.taskId || '--' },
    { label: '任务类型', value: row.module || row.type || '--' },
    { label: '关联书籍', value: row.name || '--' },
    { label: '执行动作', value: row.trigger || '--' },
    { label: '任务状态', value: row.status || '--' },
    { label: '操作人', value: raw.operateByName || '--' },
    { label: '发生时间', value: row.start || '--' },
    { label: '日志内容', value: raw.detailMessage || '--' },
    { label: '失败原因', value: raw.errorMessage || '--' },
  ]
})

async function loadTaskLogs() {
  loading.value = true
  try {
    const [startDate, endDate] = page.filters.dateRange.value || []
    const data = await fetchTaskLogPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: page.filters.search.value || undefined,
      taskType: taskTypeMap[page.filters.filters[0]?.value] || undefined,
      taskStatus: taskStatusMap[page.filters.filters[1]?.value],
      startTime: startDate ? `${startDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined,
    })
    page.rows = data.rows
    page.total = data.total
  } catch (error) {
    page.rows = []
    page.total = 0
    ElMessage.error(error.message || '获取任务日志失败')
  } finally {
    loading.value = false
  }
}

function handleSearchInput(value) {
  page.filters.search.value = value || ''
}

function handleDateChange(value) {
  page.filters.dateRange.value = Array.isArray(value) ? value : []
}

function handleFilterChange(filter) {
  const target = page.filters.filters.find((item) => item.label === filter.label)
  if (target) target.value = filter.value
}

function queryLogs() {
  pageNo.value = 1
  loadTaskLogs()
}

function resetFilters() {
  page.filters.search.value = ''
  page.filters.dateRange.value = []
  page.filters.filters.forEach((filter) => { filter.value = filter.options[0] })
  pageNo.value = 1
  loadTaskLogs()
}

function handlePageChange(value) {
  pageNo.value = value
  loadTaskLogs()
}

function handlePageSizeChange(value) {
  pageSize.value = value
  pageNo.value = 1
  loadTaskLogs()
}

async function openDetail(row) {
  if (!row?.id) return
  detailVisible.value = true
  detailLoading.value = true
  selectedLog.value = row
  try {
    selectedLog.value = await fetchTaskLogDetail(row.id)
  } catch (error) {
    ElMessage.error(error.message || '获取任务日志详情失败')
  } finally {
    detailLoading.value = false
  }
}

function handleAction() {
  loadTaskLogs()
}

function handleTabChange(index) {
  router.push(index === 0 ? '/logs/tasks' : '/logs/tasks/stats')
}

onMounted(loadTaskLogs)
</script>

<style scoped>
.admin-page-stack {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.progress-cell {
  width: 120px;
}

.progress-cell span {
  display: block;
  margin-bottom: 6px;
  color: #213a73;
  font-variant-numeric: tabular-nums;
}

.remark-cell {
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-detail {
  min-height: 120px;
}

.log-detail dl {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  margin: 0;
  border-top: 1px solid var(--admin-row-border);
}

.log-detail dt,
.log-detail dd {
  min-width: 0;
  margin: 0;
  padding: 11px 14px;
  border-bottom: 1px solid var(--admin-row-border);
  overflow-wrap: anywhere;
}

.log-detail dt {
  color: #50679b;
  font-weight: 700;
}

.log-detail dd {
  color: #1f376d;
}
</style>

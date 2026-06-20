<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :active-tab="activeTab"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @tab-change="handleTabChange"
  >
    <div class="task-center">
      <ResourceMetricGrid :items="page.metrics" />
      <AdminFilterBar
        :filters="filters"
        :search="searchConfig"
        show-search
        @filter-change="handleFilterChange"
        @reset="resetFilters"
        @search="loadTasks(1)"
        @search-input="handleSearchInput"
      />

      <section class="task-layout">
        <AdminTableCard
          v-loading="loading"
          :columns="columns"
          :current-page="query.pageNo"
          :page-size="query.pageSize"
          :rows="page.rows"
          min-width="1080px"
          row-clickable
          selectable
          :total="page.total"
          @page-change="loadTasks"
          @page-size-change="handlePageSizeChange"
          @row-click="selectTask"
        >
          <template #name="{ row }">
            <div class="task-name">
              <span>{{ row.cover }}</span>
              <div>
                <strong>{{ row.name }}</strong>
                <small>{{ row.desc }}</small>
              </div>
            </div>
          </template>
          <template #kind="{ row }">
            <AdminStatusBadge :label="row.kind" tone="blue" />
          </template>
          <template #source="{ row }">
            <span class="source-dot"><i />{{ row.source }}</span>
          </template>
          <template #status="{ row }">
            <AdminStatusBadge :label="row.status" :tone="row.tone" />
          </template>
          <template #progress="{ row }">
            <div class="progress-cell">
              <span>{{ row.progress ? `${row.progress}%` : '排队中' }}</span>
              <el-progress :percentage="row.progress" :status="row.tone === 'red' ? 'exception' : undefined" :show-text="false" :stroke-width="4" />
            </div>
          </template>
          <template #actions="{ row }">
            <AdminActionIcons :actions="actionsFor(row)" @action="(action) => handleTaskAction(row, action)" />
          </template>
        </AdminTableCard>

        <aside v-loading="detailLoading" class="task-detail">
          <header>
            <h2>任务详情</h2>
            <button type="button" @click="clearSelection"><el-icon><Close /></el-icon></button>
          </header>
          <div class="task-detail__hero">
            <span>{{ page.detail.cover }}</span>
            <div>
              <strong>{{ page.detail.title }}</strong>
              <small>{{ page.detail.subtitle }}</small>
              <p>
                <AdminStatusBadge :label="page.detail.status" tone="blue" />
                <AdminStatusBadge :label="page.detail.priority" tone="red" />
              </p>
            </div>
          </div>
          <dl>
            <div v-for="field in page.detail.fields" :key="field[0]">
              <dt>{{ field[0] }}</dt>
              <dd>{{ field[1] }}</dd>
            </div>
          </dl>
          <el-progress :percentage="page.detail.progress" :stroke-width="5" />
          <section class="task-timeline">
            <h3>执行日志</h3>
            <ol v-if="page.detail.logs.length">
              <li v-for="item in page.detail.logs" :key="item">{{ item }}</li>
            </ol>
            <el-empty v-else description="暂无执行日志" :image-size="58" />
          </section>
          <div class="task-detail__actions">
            <el-button
              :disabled="!selectedTask?.canPause"
              :icon="VideoPause"
              :loading="actionLoading === 'pause'"
              type="primary"
              @click="handleTaskAction(selectedTask, { label: '暂停', action: 'pause' })"
            >
              暂停任务
            </el-button>
            <el-button
              :disabled="!selectedTask?.canTerminate"
              :icon="CloseBold"
              :loading="actionLoading === 'terminate'"
              type="danger"
              @click="handleTaskAction(selectedTask, { label: '停止', action: 'terminate' })"
            >
              停止任务
            </el-button>
            <el-button
              :disabled="!selectedTask?.canRetry"
              :icon="RefreshRight"
              :loading="actionLoading === 'retry'"
              @click="handleTaskAction(selectedTask, { label: '重试', action: 'retry' })"
            >
              重新执行
            </el-button>
          </div>
        </aside>
      </section>
    </div>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, CloseBold, RefreshRight, VideoPause, View } from '@element-plus/icons-vue'
import { AdminActionIcons, AdminFilterBar, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { automationPages } from '../../config/adminModules'
import {
  buildTaskDetail,
  fetchTaskCenterPage,
  fetchTaskDetail,
  fetchTaskTimeline,
  runTaskAction,
} from '../../api/automation'

const emptyDetail = {
  title: '暂无任务',
  subtitle: '当前筛选条件下没有任务记录',
  status: '暂无',
  priority: '任务类型：--',
  cover: '--',
  fields: [['任务ID', '--'], ['任务类型', '--'], ['开始时间', '--'], ['完成时间', '--'], ['目标格式', '--'], ['章节数量', '--']],
  logs: [],
  progress: 0,
}
const page = reactive({
  ...automationPages.tasks,
  metrics: [],
  rows: [],
  total: 0,
  detail: emptyDetail,
})
const columns = [
  { key: 'name', label: '任务名称' },
  { key: 'kind', label: '类型' },
  { key: 'source', label: '来源 / 规则' },
  { key: 'status', label: '状态' },
  { key: 'progress', label: '进度' },
  { key: 'start', label: '开始时间' },
  { key: 'duration', label: '完成时间' },
  { key: 'actions', label: '操作' },
]
const taskTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '解析', value: 'PARSE' },
  { label: '转码', value: 'TRANSCODE' },
  { label: '切片', value: 'SLICE' },
  { label: '本地扫描', value: 'LOCAL_SCAN' },
]
const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '待处理', value: 0 },
  { label: '处理中', value: 1 },
  { label: '成功', value: 2 },
  { label: '失败', value: 3 },
]
const loading = ref(false)
const detailLoading = ref(false)
const actionLoading = ref('')
const activeTab = ref(0)
const selectedTask = ref(null)
const timelineRows = ref([])
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  taskType: '',
  taskStatus: undefined,
})
const searchConfig = computed(() => ({
  placeholder: '搜索任务名称、类型、来源...',
  value: query.keyword,
}))
const filters = computed(() => [
  {
    label: '全部类型',
    value: taskTypeOptions.find((item) => item.value === query.taskType)?.label || '全部类型',
    options: taskTypeOptions.map((item) => item.label),
  },
  {
    label: '全部状态',
    value: statusOptions.find((item) => item.value === query.taskStatus)?.label || '全部状态',
    options: statusOptions.map((item) => item.label),
  },
])

function actionsFor(row) {
  return [
    { label: '查看', icon: View, boxed: true },
    { label: '暂停', icon: VideoPause, disabled: !row.canPause, action: 'pause' },
    { label: '停止', icon: CloseBold, danger: true, disabled: !row.canTerminate, action: 'terminate' },
    { label: '重试', icon: RefreshRight, disabled: !row.canRetry, action: 'retry' },
  ]
}

function handleSearchInput(value) {
  query.keyword = value
}

function handleFilterChange(filter) {
  if (filter.label === '全部类型') {
    query.taskType = taskTypeOptions.find((item) => item.label === filter.value)?.value || ''
  }
  if (filter.label === '全部状态') {
    query.taskStatus = statusOptions.find((item) => item.label === filter.value)?.value
  }
  loadTasks(1)
}

function handleTabChange(index) {
  activeTab.value = index
  const statusByTab = [undefined, 1, 0, 2, 3]
  query.taskStatus = statusByTab[index]
  loadTasks(1)
}

function resetFilters() {
  query.keyword = ''
  query.taskType = ''
  query.taskStatus = undefined
  activeTab.value = 0
  loadTasks(1)
}

function handlePageSizeChange(size) {
  query.pageSize = size
  loadTasks(1)
}

async function loadTasks(pageNo = query.pageNo) {
  query.pageNo = pageNo
  loading.value = true
  try {
    const data = await fetchTaskCenterPage(query)
    page.metrics = data.metrics
    page.tabs = data.tabs
    page.rows = data.rows
    page.total = data.total
    query.pageNo = data.current || query.pageNo
    query.pageSize = data.pageSize || query.pageSize
    if (selectedTask.value) {
      const sameTask = data.rows.find((row) => row.taskId === selectedTask.value.taskId && row.taskType === selectedTask.value.taskType)
      if (sameTask) await selectTask(sameTask)
      else clearSelection()
    } else if (data.rows[0]) {
      await selectTask(data.rows[0])
    } else {
      clearSelection()
    }
  } catch (error) {
    page.metrics = []
    page.rows = []
    page.total = 0
    clearSelection()
    ElMessage.error(error.message || '获取任务中心失败')
  } finally {
    loading.value = false
  }
}

async function selectTask(row) {
  if (!row?.taskType || !row?.taskId) return
  selectedTask.value = row
  detailLoading.value = true
  try {
    const [detail, timeline] = await Promise.all([
      fetchTaskDetail({ taskType: row.taskType, taskId: row.taskId }).catch(() => row),
      fetchTaskTimeline({ taskType: row.taskType, taskId: row.taskId, pageNo: 1, pageSize: 8 }).catch(() => ({ rows: [] })),
    ])
    selectedTask.value = detail
    timelineRows.value = timeline.rows || []
    page.detail = buildTaskDetail(detail, timelineRows.value)
  } finally {
    detailLoading.value = false
  }
}

function clearSelection() {
  selectedTask.value = null
  timelineRows.value = []
  page.detail = emptyDetail
}

async function handleTaskAction(row, action) {
  if (!row) return
  if (action.label === '查看') {
    await selectTask(row)
    return
  }
  if (!action.action) return
  try {
    const label = action.label || '操作'
    await ElMessageBox.confirm(`确认${label}任务「${row.name}」吗？`, '任务操作确认', {
      type: action.action === 'terminate' ? 'warning' : 'info',
      confirmButtonText: label,
      cancelButtonText: '取消',
    })
    actionLoading.value = action.action
    await runTaskAction({
      taskType: row.taskType,
      taskId: row.taskId,
      action: action.action,
      remark: `前端${label}`,
    })
    ElMessage.success(`任务已${label}`)
    await loadTasks(query.pageNo)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '任务操作失败')
  } finally {
    actionLoading.value = ''
  }
}

onMounted(loadTasks)
</script>

<style scoped>
.task-center {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.task-center :deep(.resource-metrics) {
  margin-top: 0;
}

.task-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}

.task-name {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.task-name > span,
.task-detail__hero > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 52px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f8fafc, #dbeafe);
  color: #153673;
  font-weight: 800;
}

.task-name strong,
.task-name small {
  display: block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-name strong {
  color: #102557;
}

.task-name small {
  margin-top: 3px;
  color: #617098;
}

.source-dot {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.source-dot i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--admin-success);
}

.progress-cell {
  width: 120px;
}

.progress-cell span {
  display: block;
  margin-bottom: 6px;
}

.task-detail {
  overflow: hidden;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.task-detail header {
  display: flex;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--admin-row-border);
}

.task-detail h2,
.task-detail h3 {
  margin: 0;
  color: #102557;
  font-size: var(--admin-text-section);
}

.task-detail header button {
  border: 0;
  background: transparent;
  color: #334a80;
  cursor: pointer;
}

.task-detail__hero {
  display: flex;
  gap: 12px;
  padding: 18px;
}

.task-detail__hero strong,
.task-detail__hero small {
  display: block;
}

.task-detail__hero strong {
  color: #102557;
}

.task-detail__hero small {
  margin-top: 5px;
  color: #50679b;
}

.task-detail__hero p {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 9px 0 0;
}

.task-detail dl {
  display: grid;
  gap: 10px;
  padding: 0 18px 16px;
  margin: 0;
}

.task-detail dl div {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  font-size: 12px;
}

.task-detail dt {
  color: #6b7da8;
}

.task-detail dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #314a80;
}

.task-detail :deep(.el-progress) {
  margin: 0 18px 18px;
}

.task-timeline {
  padding: 16px 18px;
  border-top: 1px solid var(--admin-row-border);
}

.task-timeline ol {
  display: grid;
  gap: 11px;
  margin: 14px 0 0;
  padding-left: 18px;
  color: #40558f;
  font-size: 12px;
}

.task-detail__actions {
  display: grid;
  gap: 10px;
  padding: 0 18px 18px;
}

.task-detail__actions :deep(.el-button) {
  width: 100%;
  height: 36px;
  margin-left: 0;
}

@media (max-width: 1320px) {
  .task-layout {
    grid-template-columns: 1fr;
  }
}
</style>

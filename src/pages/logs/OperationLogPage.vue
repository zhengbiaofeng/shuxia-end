<template>
  <ResourceShell
    :actions="pageActions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handlePageAction"
  >
    <div class="admin-page-stack">
      <AdminFilterBar
        :date-range="dateRange"
        :filters="filters"
        :search="search"
        show-search
        @date-change="dateRange.value = $event || []"
        @filter-change="handleFilterChange"
        @reset="resetFilters"
        @search="applyFilters"
        @search-input="search.value = $event"
      />

      <div v-loading="loading">
        <AdminTableCard
          :columns="columns"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          :rows="page.rows"
          :total="page.total"
          min-width="1120px"
          row-clickable
          @page-change="changePage"
          @page-size-change="changePageSize"
          @row-click="openDetail"
        >
          <template #content="{ row }">
            <span class="cell-ellipsis" :title="row.content">{{ row.content }}</span>
          </template>
          <template #actions="{ row }">
            <el-button
              v-if="canViewDetail"
              link
              type="primary"
              @click.stop="openDetail(row)"
            >
              详情
            </el-button>
          </template>
        </AdminTableCard>
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="操作日志详情" width="min(720px, 92vw)">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="操作时间">{{ detailRow.time }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailRow.user }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ detailRow.module }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ detailRow.action }}</el-descriptions-item>
        <el-descriptions-item label="对象名称">{{ detailRow.raw.bookName || '--' }}</el-descriptions-item>
        <el-descriptions-item label="对象 ID">{{ detailRow.raw.bookId || '--' }}</el-descriptions-item>
        <el-descriptions-item label="操作内容" :span="2">
          <span class="detail-content">{{ detailRow.content }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="cleanupVisible" title="清理旧操作日志" width="min(460px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="保留最近天数">
          <el-input-number v-model="cleanupForm.retainDays" :min="1" :max="3650" controls-position="right" />
        </el-form-item>
        <el-form-item label="本次最多清理条数">
          <el-input-number v-model="cleanupForm.limit" :min="1" :max="10000" controls-position="right" />
        </el-form-item>
      </el-form>
      <p class="cleanup-hint">只清理超过保留期限的日志，单次不会超过设定上限。</p>
      <template #footer>
        <el-button @click="cleanupVisible = false">取消</el-button>
        <el-button type="danger" :loading="cleaning" @click="runCleanup">确认清理</el-button>
      </template>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download } from '@element-plus/icons-vue'
import { AdminFilterBar, AdminTableCard } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import {
  cleanupOperationLogs,
  exportOperationLogs,
  fetchOperationLogDetail,
  fetchOperationLogPage,
} from '../../api/adminModules'
import { logPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const page = reactive({ ...logPages.operation, rows: [], total: 0 })
const search = reactive({ placeholder: '搜索对象名称、操作内容、操作人', value: '' })
const dateRange = reactive({ value: [] })
const filters = reactive([
  { label: '业务类型', value: '全部类型', options: ['全部类型', '书籍', '小说'] },
])
const pagination = reactive({ pageNo: 1, pageSize: 10 })
const loading = ref(false)
const exporting = ref(false)
const cleaning = ref(false)
const detailVisible = ref(false)
const detailRow = ref(null)
const cleanupVisible = ref(false)
const cleanupForm = reactive({ retainDays: 30, limit: 500 })
const canViewDetail = computed(() => authStore.hasPermission('sxbook:operateLog:detail'))
const pageActions = computed(() => [
  {
    label: '导出日志',
    icon: Download,
    permission: 'sxbook:operateLog:export',
    loading: exporting.value,
  },
  {
    label: '清理旧日志',
    icon: Delete,
    permission: 'sxbook:operateLog:cleanup',
    disabled: cleaning.value,
  },
])

const columns = [
  { key: 'time', label: '时间' },
  { key: 'user', label: '操作人' },
  { key: 'module', label: '业务类型' },
  { key: 'action', label: '操作类型' },
  { key: 'target', label: '对象' },
  { key: 'content', label: '操作内容', style: { width: '320px' } },
  { key: 'actions', label: '操作' },
]

function buildQuery({ includePagination = true } = {}) {
  const bizType = filters[0].value === '书籍' ? 'ebook' : filters[0].value === '小说' ? 'novel' : undefined
  const [startDate, endDate] = dateRange.value || []
  return {
    keyword: search.value.trim() || undefined,
    bizType,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
    ...(includePagination ? pagination : {}),
  }
}

async function loadOperationLogs() {
  loading.value = true
  try {
    const data = await fetchOperationLogPage(buildQuery())
    page.rows = data.rows
    page.total = data.total
  } catch (error) {
    page.rows = []
    page.total = 0
    ElMessage.error(error.message || '获取操作日志失败')
  } finally {
    loading.value = false
  }
}

function handleFilterChange(filter) {
  const target = filters.find((item) => item.label === filter.label)
  if (target) target.value = filter.value
}

function applyFilters() {
  pagination.pageNo = 1
  loadOperationLogs()
}

function resetFilters() {
  search.value = ''
  dateRange.value = []
  filters[0].value = '全部类型'
  pagination.pageNo = 1
  loadOperationLogs()
}

function changePage(pageNo) {
  pagination.pageNo = pageNo
  loadOperationLogs()
}

function changePageSize(pageSize) {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  loadOperationLogs()
}

async function openDetail(row) {
  if (!canViewDetail.value || !row?.id) return
  try {
    detailRow.value = await fetchOperationLogDetail(row.id)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error.message || '获取操作日志详情失败')
  }
}

async function handlePageAction(action) {
  if (action?.label === '导出日志') await exportLogs()
  if (action?.label === '清理旧日志') cleanupVisible.value = true
}

async function exportLogs() {
  if (exporting.value) return
  exporting.value = true
  try {
    const data = await exportOperationLogs({ ...buildQuery({ includePagination: false }), exportLimit: 10000 })
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `operate-log-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('操作日志已导出')
  } catch (error) {
    ElMessage.error(error.message || '导出操作日志失败')
  } finally {
    exporting.value = false
  }
}

async function runCleanup() {
  try {
    await ElMessageBox.confirm(
      `确认清理 ${cleanupForm.retainDays} 天以前的日志吗？本次最多 ${cleanupForm.limit} 条。`,
      '确认清理',
      { confirmButtonText: '清理', cancelButtonText: '取消', type: 'warning' },
    )
    cleaning.value = true
    const result = await cleanupOperationLogs({ ...cleanupForm })
    cleanupVisible.value = false
    ElMessage.success(`已清理 ${Number(result.cleanedCount || 0)} 条日志`)
    pagination.pageNo = 1
    await loadOperationLogs()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message || '清理操作日志失败')
  } finally {
    cleaning.value = false
  }
}

onMounted(loadOperationLogs)
</script>

<style scoped>
.admin-page-stack { display: grid; min-width: 0; gap: 22px; margin-top: 22px; }
.admin-page-stack > * { min-width: 0; }
.cell-ellipsis { display: block; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail-content { white-space: pre-wrap; word-break: break-word; }
.cleanup-hint { margin: 0; color: var(--admin-text-muted); font-size: 13px; line-height: 1.6; }
</style>

<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
  >
    <div class="admin-page-stack">
      <ResourceMetricGrid :items="page.metrics" />

      <AdminFilterBar
        :filters="filters"
        :search="search"
        show-search
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
          min-width="1280px"
          row-clickable
          @page-change="changePage"
          @page-size-change="changePageSize"
          @row-click="openDetail"
        >
          <template #username="{ row }">
            <div class="user-cell">
              <span class="user-avatar">{{ row.avatar }}</span>
              <strong :title="row.username">{{ row.username }}</strong>
            </div>
          </template>
          <template #membership="{ row }">
            <AdminStatusBadge :label="row.membership" :tone="row.membershipTone" />
          </template>
          <template #status="{ row }">
            <AdminStatusBadge :label="row.status" :tone="row.tone" dot />
          </template>
          <template #actions="{ row }">
            <div class="row-actions" @click.stop>
              <el-button
                v-if="canViewDetail"
                link
                type="primary"
                @click="openDetail(row)"
              >
                详情
              </el-button>
              <el-button
                v-if="canConfigureVisibility && row.readerAccount"
                :icon="Hide"
                link
                type="primary"
                @click="openVisibility(row)"
              >
                内容权限
              </el-button>
              <el-button
                v-if="canChangeStatus"
                :disabled="isCurrentUser(row) || changingUserId === row.id"
                :loading="changingUserId === row.id"
                link
                :type="row.raw.status === 2 ? 'success' : 'danger'"
                @click="confirmStatusChange(row)"
              >
                {{ row.raw.status === 2 ? '解冻' : '冻结' }}
              </el-button>
            </div>
          </template>
        </AdminTableCard>
      </div>

      <AdminInfoBox title="权限说明" :icon="InfoFilled" :items="page.notes" />
    </div>

    <el-dialog v-model="detailVisible" title="用户详情" width="min(680px, 92vw)">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="用户名">{{ detailRow.username }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detailRow.nickname }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ detailRow.raw.realname || '--' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detailRow.raw.email || '--' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailRow.raw.phone || '--' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">{{ detailRow.membership }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detailRow.source }}</el-descriptions-item>
        <el-descriptions-item label="账户类型">{{ detailRow.readerAccount ? '阅读端账户' : '后台账户' }}</el-descriptions-item>
        <el-descriptions-item label="书架记录">{{ detailRow.raw.bookshelfCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="阅读历史">{{ detailRow.raw.readHistoryCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="最近阅读">{{ detailRow.recentRead }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detailRow.createdAt }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <UserContentVisibilityDialog
      v-model="visibilityVisible"
      :user="visibilityUser"
      :can-edit="canEditVisibility"
    />
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Hide, InfoFilled } from '@element-plus/icons-vue'
import { AdminFilterBar, AdminInfoBox, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import UserContentVisibilityDialog from '../../components/permissions/UserContentVisibilityDialog.vue'
import { changeUserStatus, fetchUserDetail, fetchUsersPage } from '../../api/adminModules'
import { permissionPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const page = reactive({ ...permissionPages.users, metrics: [], rows: [], total: 0 })
const search = reactive({ placeholder: '搜索用户名、邮箱、昵称', value: '' })
const filters = reactive([
  { label: '账号状态', value: '全部状态', options: ['全部状态', '正常', '冻结'] },
  { label: '作者状态', value: '全部作者', options: ['全部作者', '普通用户', '作者'] },
])
const pagination = reactive({ pageNo: 1, pageSize: 10 })
const loading = ref(false)
const changingUserId = ref('')
const detailVisible = ref(false)
const detailRow = ref(null)
const visibilityVisible = ref(false)
const visibilityUser = ref(null)
const canViewDetail = computed(() => authStore.hasPermission('sxbook:userManage:detail'))
const canChangeStatus = computed(() => authStore.hasPermission('sxbook:userManage:status'))
const canConfigureVisibility = computed(() => authStore.hasPermission('sxbook:userManage:visibility:view'))
const canEditVisibility = computed(() => authStore.hasPermission('sxbook:userManage:visibility:edit'))

const columns = [
  { key: 'username', label: '用户名' },
  { key: 'nickname', label: '昵称' },
  { key: 'contact', label: '联系方式' },
  { key: 'membership', label: '会员等级' },
  { key: 'source', label: '来源' },
  { key: 'status', label: '状态' },
  { key: 'recentRead', label: '最近阅读' },
  { key: 'createdAt', label: '注册时间' },
  { key: 'actions', label: '操作' },
]

function buildQuery() {
  const status = filters[0].value === '正常' ? 1 : filters[0].value === '冻结' ? 2 : undefined
  const authorStatus = filters[1].value === '作者' ? 1 : filters[1].value === '普通用户' ? 0 : undefined
  return { keyword: search.value.trim() || undefined, status, authorStatus, ...pagination }
}

async function loadUsers() {
  loading.value = true
  try {
    const data = await fetchUsersPage(buildQuery())
    page.metrics = data.metrics
    page.rows = data.rows
    page.total = data.total
  } catch (error) {
    page.metrics = []
    page.rows = []
    page.total = 0
    ElMessage.error(error.message || '获取用户列表失败')
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
  loadUsers()
}

function resetFilters() {
  search.value = ''
  filters[0].value = '全部状态'
  filters[1].value = '全部作者'
  pagination.pageNo = 1
  loadUsers()
}

function changePage(pageNo) {
  pagination.pageNo = pageNo
  loadUsers()
}

function changePageSize(pageSize) {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  loadUsers()
}

function isCurrentUser(row) {
  return String(row.id) === String(authStore.userInfo?.id || '')
}

async function openDetail(row) {
  if (!canViewDetail.value || !row?.id) return
  try {
    detailRow.value = await fetchUserDetail(row.id)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error.message || '获取用户详情失败')
  }
}

async function confirmStatusChange(row) {
  if (!canChangeStatus.value || isCurrentUser(row)) return
  const nextStatus = row.raw.status === 2 ? 1 : 2
  const action = nextStatus === 2 ? '冻结' : '解冻'
  try {
    await ElMessageBox.confirm(`确认${action}用户“${row.username}”吗？`, `${action}用户`, {
      confirmButtonText: action,
      cancelButtonText: '取消',
      type: nextStatus === 2 ? 'warning' : 'info',
    })
    changingUserId.value = row.id
    await changeUserStatus(row.id, nextStatus)
    ElMessage.success(`用户已${action}`)
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message || `${action}用户失败`)
  } finally {
    changingUserId.value = ''
  }
}

function openVisibility(row) {
  if (!canConfigureVisibility.value || !row?.readerAccount) return
  visibilityUser.value = row
  visibilityVisible.value = true
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-page-stack { display: grid; min-width: 0; gap: 22px; margin-top: 22px; }
.admin-page-stack > * { min-width: 0; }
.admin-page-stack :deep(.resource-metrics) { margin-top: 0; }
.user-cell { display: inline-flex; align-items: center; gap: 10px; max-width: 180px; }
.user-cell strong { overflow: hidden; color: #102557; font-weight: 700; text-overflow: ellipsis; }
.user-avatar { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex: 0 0 auto; border-radius: 50%; background: #1d67ff; color: #fff; font-size: 12px; font-weight: 800; }
.row-actions { display: inline-flex; align-items: center; gap: 2px; }
</style>

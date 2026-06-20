<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
  >
    <div class="admin-page-stack">
      <ResourceMetricGrid :items="page.metrics" />

      <AdminFilterBar :filters="page.filters.filters" :search="page.filters.search" />

      <AdminTableCard :columns="columns" :rows="page.rows" min-width="1120px" selectable :total="page.total">
        <template #username="{ row }">
          <div class="user-cell">
            <span class="user-avatar">{{ row.avatar }}</span>
            <strong>{{ row.username }}</strong>
          </div>
        </template>
        <template #role="{ row }">
          <AdminStatusBadge :label="row.role" :tone="row.roleTone" />
        </template>
        <template #status="{ row }">
          <AdminStatusBadge :label="row.status" :tone="row.tone" dot />
        </template>
        <template #actions>
          <AdminActionIcons :actions="commonActions.row" />
        </template>
      </AdminTableCard>

      <AdminInfoBox title="权限说明" :icon="InfoFilled" :items="page.notes" />
    </div>
  </ResourceShell>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { AdminActionIcons, AdminFilterBar, AdminInfoBox, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchUsersPage } from '../../api/adminModules'
import { commonActions, permissionPages } from '../../config/adminModules'

const page = reactive({
  ...permissionPages.users,
  metrics: [],
  rows: [],
  total: 0,
})
const columns = [
  { key: 'username', label: '用户名' },
  { key: 'nickname', label: '昵称' },
  { key: 'email', label: '邮箱' },
  { key: 'role', label: '角色' },
  { key: 'status', label: '状态' },
  { key: 'lastLogin', label: '最后登录' },
  { key: 'createdAt', label: '注册时间' },
  { key: 'actions', label: '操作' },
]

async function loadUsers() {
  try {
    const data = await fetchUsersPage()
    page.metrics = data.metrics
    page.rows = data.rows
    page.total = data.total
  } catch (error) {
    page.metrics = []
    page.rows = []
    page.total = 0
    ElMessage.error(error.message || '获取用户列表失败')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-page-stack {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.admin-page-stack :deep(.resource-metrics) {
  margin-top: 0;
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4e8eff, #1d67ff);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.user-cell strong {
  color: #102557;
  font-weight: 700;
}
</style>

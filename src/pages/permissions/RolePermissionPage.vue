<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
  >
    <div class="role-page">
      <ResourceMetricGrid :items="page.metrics" />
      <AdminFilterBar :filters="[{ label: '全部类型', value: '全部类型', options: ['全部类型', '内置', '自定义'] }]" :search="{ placeholder: '搜索角色名称或描述' }" />

      <section class="role-layout">
        <aside class="role-list">
          <header>角色列表</header>
          <button
            v-for="role in page.roles"
            :key="role.id || role.name"
            class="role-item"
            :class="{ active: role.active }"
            type="button"
            @click="selectRole(role)"
          >
            <span class="role-item__icon" :class="`tone-${role.color}`">
              <el-icon><UserFilled /></el-icon>
            </span>
            <span>
              <strong>{{ role.name }} <em>{{ role.type }}</em></strong>
              <small>{{ role.desc }}</small>
            </span>
            <b>用户数：{{ role.users }}</b>
          </button>
          <el-button class="role-list__add" :icon="Plus">添加角色</el-button>
        </aside>

        <section class="permission-panel">
          <header class="permission-panel__head">
            <div>
              <h2>当前角色：{{ page.selectedRole?.name || '暂无角色' }} <AdminStatusBadge :label="page.selectedRole?.type || '--'" tone="green" /></h2>
              <p>{{ page.selectedRole?.desc || '当前没有可展示的角色权限数据' }}</p>
            </div>
            <el-button>批量操作</el-button>
          </header>

          <nav class="permission-tabs">
            <button class="active" type="button">权限配置</button>
            <button type="button">角色用户（{{ page.selectedRole?.users || 0 }}）</button>
            <button type="button">权限继承</button>
            <button type="button">操作日志</button>
          </nav>

          <AdminTableCard :columns="columns" :rows="page.permissions" min-width="920px" :pagination="false">
            <template #view="{ row }"><el-checkbox :model-value="row.view" /></template>
            <template #create="{ row }"><el-checkbox :model-value="row.create" /></template>
            <template #edit="{ row }"><el-checkbox :model-value="row.edit" /></template>
            <template #delete="{ row }"><el-checkbox :model-value="row.delete" /></template>
            <template #export="{ row }"><el-checkbox :model-value="row.export" /></template>
            <template #all="{ row }"><el-checkbox :model-value="row.all" /></template>
          </AdminTableCard>
        </section>
      </section>
    </div>
  </ResourceShell>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, UserFilled } from '@element-plus/icons-vue'
import { AdminFilterBar, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { buildRolesPage, fetchRolePermissionView, fetchRolesPage } from '../../api/adminModules'
import { permissionPages } from '../../config/adminModules'

const page = reactive({
  ...permissionPages.roles,
  metrics: [],
  roles: [],
  selectedRole: null,
  permissions: [],
})
const columns = [
  { key: 'module', label: '权限模块' },
  { key: 'desc', label: '权限描述' },
  { key: 'view', label: '查看' },
  { key: 'create', label: '创建' },
  { key: 'edit', label: '编辑' },
  { key: 'delete', label: '删除' },
  { key: 'export', label: '导出' },
  { key: 'all', label: '全部' },
]

async function loadRoles() {
  try {
    Object.assign(page, await fetchRolesPage())
  } catch (error) {
    page.metrics = []
    page.roles = []
    page.selectedRole = null
    page.permissions = []
    ElMessage.error(error.message || '获取角色权限失败')
  }
}

async function selectRole(role) {
  try {
    const permissionView = await fetchRolePermissionView(role.id)
    Object.assign(page, buildRolesPage(page.roles, permissionView))
  } catch (error) {
    ElMessage.error(error.message || '获取角色权限失败')
  }
}

onMounted(loadRoles)
</script>

<style scoped>
.role-page {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.role-page :deep(.resource-metrics) {
  margin-top: 0;
}

.role-layout {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr);
  gap: 16px;
}

.role-list,
.permission-panel {
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.role-list {
  overflow: hidden;
}

.role-list header {
  padding: 18px 20px;
  color: #102557;
  font-size: var(--admin-text-section);
  font-weight: var(--admin-weight-strong);
}

.role-item {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 15px 18px;
  border: 0;
  border-top: 1px solid var(--admin-row-border);
  background: transparent;
  color: #40558f;
  text-align: left;
  cursor: pointer;
}

.role-item.active {
  background: #f3f8ff;
  box-shadow: inset 3px 0 0 var(--admin-primary);
}

.role-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

.role-item strong {
  display: block;
  color: #102557;
  font-size: 14px;
}

.role-item em {
  margin-left: 6px;
  color: var(--admin-primary);
  font-size: 11px;
  font-style: normal;
}

.role-item small {
  display: block;
  margin-top: 4px;
}

.role-item b {
  font-size: 12px;
  font-weight: 700;
}

.role-list__add {
  width: calc(100% - 32px);
  margin: 12px 16px 14px;
  height: 38px;
  border-radius: var(--admin-radius-control);
}

.permission-panel {
  overflow: hidden;
}

.permission-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
}

.permission-panel h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #102557;
  font-size: 16px;
  font-weight: 800;
}

.permission-panel p {
  margin: 8px 0 0;
  color: var(--admin-text-muted);
  font-size: 13px;
}

.permission-tabs {
  display: flex;
  gap: 32px;
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-row-border);
}

.permission-tabs button {
  position: relative;
  height: 42px;
  border: 0;
  background: transparent;
  color: #334a80;
  cursor: pointer;
  font-weight: 700;
}

.permission-tabs button.active {
  color: var(--admin-primary);
}

.permission-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--admin-primary);
  content: '';
}

.tone-blue { background: #eff6ff; color: #1476ff; }
.tone-green { background: #ecfdf5; color: #16a34a; }
.tone-purple { background: #f5f3ff; color: #7c3aed; }
.tone-orange { background: #fff7ed; color: #f97316; }
.tone-cyan { background: #ecfeff; color: #0891b2; }
.tone-red { background: #fff1f2; color: #ff3b4f; }

@media (max-width: 1120px) {
  .role-layout {
    grid-template-columns: 1fr;
  }
}
</style>

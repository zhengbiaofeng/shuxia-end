<template>
  <ResourceShell
    :actions="[]"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
  >
    <div class="role-page">
      <ResourceMetricGrid :items="page.metrics" />
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
        </aside>

        <section class="permission-panel">
          <header class="permission-panel__head">
            <div>
              <h2>当前角色：{{ page.selectedRole?.name || '暂无角色' }} <AdminStatusBadge :label="page.selectedRole?.type || '--'" tone="green" /></h2>
              <p>{{ page.selectedRole?.desc || '当前没有可展示的角色权限数据' }}</p>
            </div>
            <el-button
              v-if="canSave"
              type="primary"
              :loading="saving"
              :disabled="!page.selectedRole"
              @click="savePermissions"
            >
              保存授权
            </el-button>
          </header>

          <div v-loading="permissionLoading" class="permission-tree-wrap">
            <el-alert
              v-if="!canSave"
              title="当前账号仅可查看角色授权"
              type="info"
              :closable="false"
              show-icon
            />
            <el-tree
              v-if="page.permissionTree.length"
              ref="treeRef"
              class="permission-tree"
              :class="{ 'is-readonly': !canSave }"
              :data="page.permissionTree"
              node-key="key"
              show-checkbox
              default-expand-all
              :check-strictly="false"
              :props="treeProps"
            />
            <el-empty v-else description="暂无书匣权限节点" />
          </div>
        </section>
      </section>
    </div>
  </ResourceShell>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { AdminStatusBadge } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { buildRolesPage, fetchRolePermissionView, fetchRolesPage, saveRolePermission } from '../../api/adminModules'
import { permissionPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'

const page = reactive({
  ...permissionPages.roles,
  metrics: [],
  roles: [],
  selectedRole: null,
  permissionTree: [],
  checkedIds: [],
  permissions: [],
})
const authStore = useAuthStore()
const treeRef = ref()
const permissionLoading = ref(false)
const saving = ref(false)
const treeProps = { children: 'children', label: 'title' }
const canSave = computed(() => authStore.hasPermission('system:permission:saveRole'))

async function loadRoles() {
  try {
    Object.assign(page, await fetchRolesPage())
  } catch (error) {
    page.metrics = []
    page.roles = []
    page.selectedRole = null
    page.permissionTree = []
    page.checkedIds = []
    page.permissions = []
    ElMessage.error(error.message || '获取角色权限失败')
  }
}

async function selectRole(role) {
  if (!role?.id || permissionLoading.value) return
  try {
    permissionLoading.value = true
    const permissionView = await fetchRolePermissionView(role.id)
    Object.assign(page, buildRolesPage(page.roles, permissionView))
    await syncTreeChecks()
  } catch (error) {
    ElMessage.error(error.message || '获取角色权限失败')
  } finally {
    permissionLoading.value = false
  }
}

async function syncTreeChecks() {
  await nextTick()
  treeRef.value?.setCheckedKeys(page.checkedIds || [], false)
}

async function savePermissions() {
  if (!page.selectedRole?.id || !treeRef.value || saving.value) return
  try {
    saving.value = true
    const permissionIds = [
      ...treeRef.value.getCheckedKeys(false),
      ...treeRef.value.getHalfCheckedKeys(),
    ]
    const permissionView = await saveRolePermission(page.selectedRole.id, [...new Set(permissionIds)])
    Object.assign(page, buildRolesPage(page.roles, permissionView))
    await syncTreeChecks()
    await authStore.refreshPermissions()
    ElMessage.success('角色授权已保存')
  } catch (error) {
    ElMessage.error(error.message || '保存角色权限失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadRoles()
  await syncTreeChecks()
})
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

.permission-tree-wrap {
  min-height: 420px;
  padding: 0 20px 22px;
  border-top: 1px solid var(--admin-row-border);
}

.permission-tree-wrap :deep(.el-alert) {
  margin: 18px 0 12px;
}

.permission-tree {
  padding-top: 16px;
  background: transparent;
}

.permission-tree.is-readonly {
  opacity: 0.78;
  pointer-events: none;
}

.permission-tree :deep(.el-tree-node__content) {
  min-height: 34px;
  border-radius: 5px;
  color: #243b70;
}

.permission-tree :deep(.el-tree-node__content:hover) {
  background: #f2f7ff;
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

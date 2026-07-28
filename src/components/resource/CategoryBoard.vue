<template>
  <section v-if="groups.length" class="category-board">
    <article v-for="group in groups" :key="group.title" class="category-card">
      <header>
        <div class="category-title">
          <span :class="`tone-${group.color}`"><el-icon><FolderOpened /></el-icon></span>
          <strong>{{ group.title }} <small>({{ group.count }})</small></strong>
        </div>
        <div v-if="canManageCategories" class="category-actions">
          <AdminTooltip v-if="authStore.hasPermission('sxbook:category:add')" content="添加子分类">
            <button type="button" aria-label="添加子分类" @click="$emit('add-child', group)">
              <el-icon><Plus /></el-icon>
            </button>
          </AdminTooltip>
          <AdminTooltip v-if="authStore.hasPermission('sxbook:category:edit')" content="编辑分类">
            <button type="button" aria-label="编辑分类" @click="$emit('edit', group)">
              <el-icon><EditPen /></el-icon>
            </button>
          </AdminTooltip>
          <AdminTooltip v-if="authStore.hasPermission('sxbook:category:delete') && canDeleteCategory(group)" content="删除分类">
            <button class="delete-action" type="button" aria-label="删除分类" @click="$emit('delete', group)">
              <el-icon><Delete /></el-icon>
            </button>
          </AdminTooltip>
          <AdminTooltip
            v-if="authStore.hasPermission('sxbook:category:status')"
            :content="group.status === 0 ? '启用分类' : '停用分类'"
          >
            <button
              type="button"
              :class="['status-action', group.status === 0 ? 'is-enable' : 'is-disable']"
              :aria-label="group.status === 0 ? '启用分类' : '停用分类'"
              @click="$emit('toggle-status', group)"
            >
              <el-icon>
                <CircleCheck v-if="group.status === 0" />
                <CircleClose v-else />
              </el-icon>
            </button>
          </AdminTooltip>
        </div>
      </header>

      <ul class="category-tree">
        <li v-for="child in group.children" :key="childKey(child)">
          <span class="tree-branch" />
          <el-icon><Folder /></el-icon>
          <span>{{ childLabel(child) }}</span>
          <div v-if="canManageCategories" class="tree-actions">
            <AdminTooltip v-if="authStore.hasPermission('sxbook:category:edit')" content="编辑分类">
              <button class="tree-action" type="button" aria-label="编辑分类" @click="$emit('edit', child)">
                <el-icon><EditPen /></el-icon>
              </button>
            </AdminTooltip>
            <AdminTooltip v-if="authStore.hasPermission('sxbook:category:delete') && canDeleteCategory(child)" content="删除分类">
              <button class="tree-action delete-action" type="button" aria-label="删除分类" @click="$emit('delete', child)">
                <el-icon><Delete /></el-icon>
              </button>
            </AdminTooltip>
          </div>
        </li>
      </ul>
    </article>
  </section>

  <section v-else class="category-empty">
    <el-icon><FolderOpened /></el-icon>
    <strong>暂无分类</strong>
    <span>当前页签下还没有子分类</span>
  </section>

</template>

<script setup>
import { computed } from 'vue'
import {
  CircleCheck,
  CircleClose,
  Delete,
  EditPen,
  Folder,
  FolderOpened,
  Plus,
} from '@element-plus/icons-vue'
import AdminTooltip from '../admin/AdminTooltip.vue'
import { useAuthStore } from '../../stores/auth'

defineProps({
  groups: { type: Array, default: () => [] },
})

defineEmits(['add-child', 'delete', 'edit', 'toggle-status'])

const authStore = useAuthStore()
const canManageCategories = computed(() => authStore.hasAnyPermission([
  'sxbook:category:add',
  'sxbook:category:edit',
  'sxbook:category:delete',
  'sxbook:category:status',
]))

function childKey(child) {
  return typeof child === 'string' ? child : child.id || child.label
}

function childLabel(child) {
  return typeof child === 'string' ? child : child.label || `${child.title} (${child.count})`
}

function canDeleteCategory(category) {
  return Boolean(category?.id) && !category?.children?.length && Number(category?.usageCount || 0) === 0
}
</script>

<style scoped>
.category-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.category-card,
.category-empty {
  border: 1px solid #e7ecf7;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 50px rgba(35, 56, 118, 0.045);
}

.category-card {
  min-height: 430px;
  padding: 18px 18px 22px;
}

.category-card header,
.category-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.category-title,
.category-empty {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-title > span,
.category-empty .el-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 16px;
}

.category-title strong,
.category-empty strong {
  color: #102557;
  font-size: 14px;
  font-weight: 800;
}

.category-title small,
.category-empty span {
  color: #314a80;
  font-weight: 700;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-actions button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #243d73;
  cursor: pointer;
  font-size: 16px;
}

.category-actions button:last-child {
  width: 30px;
  height: 30px;
  border: 1px solid #dfe7f5;
  border-radius: 6px;
}

.category-actions .status-action {
  border-color: currentColor;
}

.delete-action {
  color: #dc2626;
}

.delete-action:hover {
  color: #b91c1c;
  background: #fff1f2;
}

.status-action.is-enable {
  color: #16a34a;
  background: #ecfdf5;
}

.status-action.is-disable {
  color: #dc2626;
  background: #fff1f2;
}

.status-action.is-enable:hover {
  background: #dcfce7;
}

.status-action.is-disable:hover {
  background: #ffe4e6;
}

.category-tree {
  position: relative;
  display: grid;
  gap: 0;
  margin-top: 22px;
  padding-left: 20px;
}

.category-tree::before {
  position: absolute;
  top: 4px;
  bottom: 10px;
  left: 7px;
  width: 1px;
  background: #dce6f5;
  content: '';
}

.category-tree li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  border-bottom: 1px solid #eef3fa;
  color: #304982;
  font-size: 13px;
  font-weight: 600;
}

.tree-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #40558f;
  cursor: pointer;
}

.tree-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.tree-actions .tree-action {
  margin-left: 0;
}

.category-tree li:last-child {
  border-bottom: 0;
}

.tree-branch {
  position: absolute;
  left: -13px;
  width: 8px;
  height: 1px;
  background: #dce6f5;
}

.category-tree .el-icon {
  color: #1476ff;
}

.category-empty {
  min-height: 160px;
  margin-top: 22px;
  padding: 24px;
  justify-content: center;
  color: #50669c;
}

.category-empty .el-icon {
  background: #eff6ff;
  color: #1476ff;
}

.category-hint {
  min-height: 112px;
  margin-top: 18px;
  padding: 18px 24px;
  border-color: #bdd8ff;
  background: linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(255, 255, 255, 0.98));
  box-shadow: none;
}

.category-hint h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: #153673;
  font-size: 14px;
  font-weight: 800;
}

.category-hint h2 .el-icon {
  color: #1476ff;
}

.hint-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 52px;
}

.hint-grid p {
  position: relative;
  margin: 0;
  padding-left: 12px;
  color: #50669c;
  font-size: 13px;
}

.hint-grid p::before {
  position: absolute;
  top: 8px;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6b83ba;
  content: '';
}

.hint-actions {
  display: flex;
  gap: 14px;
  flex: 0 0 auto;
}

.hint-actions :deep(.el-button) {
  height: 40px;
  padding: 0 22px;
  border-radius: 6px;
  font-weight: 700;
}

.tone-blue { background: #eff6ff; color: #1476ff; }
.tone-green { background: #ecfdf5; color: #16a34a; }
.tone-purple { background: #f5f3ff; color: #7c3aed; }
.tone-orange { background: #fff7ed; color: #f97316; }

@media (max-width: 1320px) {
  .category-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .category-board,
  .hint-grid {
    grid-template-columns: 1fr;
  }

  .category-hint {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

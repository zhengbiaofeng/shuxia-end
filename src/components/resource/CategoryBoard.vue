<template>
  <section v-if="groups.length" class="category-board">
    <article v-for="group in groups" :key="group.title" class="category-card">
      <header>
        <div class="category-title">
          <span :class="`tone-${group.color}`"><el-icon><FolderOpened /></el-icon></span>
          <strong>{{ group.title }} <small>({{ group.count }})</small></strong>
        </div>
        <div class="category-actions">
          <button class="tooltip-button" type="button" aria-label="添加子分类" @click="$emit('add-child', group)">
            <el-icon><Plus /></el-icon>
            <span class="icon-tooltip">添加子分类</span>
          </button>
          <button class="tooltip-button" type="button" aria-label="编辑分类" @click="$emit('edit', group)">
            <el-icon><EditPen /></el-icon>
            <span class="icon-tooltip">编辑分类</span>
          </button>
          <button
            v-if="canDeleteCategory(group)"
            class="tooltip-button delete-action"
            type="button"
            aria-label="删除分类"
            @click="$emit('delete', group)"
          >
            <el-icon><Delete /></el-icon>
            <span class="icon-tooltip">删除分类</span>
          </button>
          <button
            class="tooltip-button"
            type="button"
            :class="['status-action', group.status === 0 ? 'is-enable' : 'is-disable']"
            :aria-label="group.status === 0 ? '启用分类' : '停用分类'"
            @click="$emit('toggle-status', group)"
          >
            <el-icon>
              <CircleCheck v-if="group.status === 0" />
              <CircleClose v-else />
            </el-icon>
            <span class="icon-tooltip">{{ group.status === 0 ? '启用分类' : '停用分类' }}</span>
          </button>
        </div>
      </header>

      <ul class="category-tree">
        <li v-for="child in group.children" :key="childKey(child)">
          <span class="tree-branch" />
          <el-icon><Folder /></el-icon>
          <span>{{ childLabel(child) }}</span>
          <div class="tree-actions">
            <button class="tree-action tooltip-button" type="button" aria-label="编辑分类" @click="$emit('edit', child)">
              <el-icon><EditPen /></el-icon>
              <span class="icon-tooltip">编辑分类</span>
            </button>
            <button
              v-if="canDeleteCategory(child)"
              class="tree-action tooltip-button delete-action"
              type="button"
              aria-label="删除分类"
              @click="$emit('delete', child)"
            >
              <el-icon><Delete /></el-icon>
              <span class="icon-tooltip">删除分类</span>
            </button>
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

  <section class="category-hint">
    <div>
      <h2><el-icon><InfoFilled /></el-icon>使用提示</h2>
      <div class="hint-grid">
        <p>支持拖拽排序：拖拽分类可调整显示顺序</p>
        <p>批量操作：点击右上角 “...” 可批量导入、导出或重置分类</p>
        <p>右键菜单：右键分类可快速添加子分类、重命名或删除分类</p>
        <p>智能分类：系统会根据刮削结果自动推荐合适的分类</p>
      </div>
    </div>
    <div class="hint-actions">
      <el-button :icon="Upload">批量导入分类</el-button>
      <el-button :icon="Download">导出所有分类</el-button>
    </div>
  </section>
</template>

<script setup>
import {
  CircleCheck,
  CircleClose,
  Delete,
  Download,
  EditPen,
  Folder,
  FolderOpened,
  InfoFilled,
  Plus,
  Upload,
} from '@element-plus/icons-vue'

defineProps({
  groups: { type: Array, default: () => [] },
})

defineEmits(['add-child', 'delete', 'edit', 'toggle-status'])

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
.category-empty,
.category-hint {
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
.category-empty,
.category-hint {
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

.tooltip-button {
  position: relative;
}

.icon-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 20;
  padding: 6px 9px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.94);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition: opacity 0.16s ease, transform 0.16s ease;
  white-space: nowrap;
}

.icon-tooltip::after {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: rgba(15, 23, 42, 0.94);
  content: '';
  transform: translate(-50%, -4px) rotate(45deg);
}

.tooltip-button:hover .icon-tooltip,
.tooltip-button:focus-visible .icon-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
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

.tree-action .icon-tooltip {
  right: -6px;
  left: auto;
  transform: translateY(4px);
}

.tree-action .icon-tooltip::after {
  right: 8px;
  left: auto;
  transform: translateY(-4px) rotate(45deg);
}

.tree-action:hover .icon-tooltip,
.tree-action:focus-visible .icon-tooltip {
  transform: translateY(0);
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

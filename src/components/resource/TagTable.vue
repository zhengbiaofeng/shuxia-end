<template>
  <section class="tag-panel">
    <div class="tag-filters">
      <el-input
        :model-value="keyword"
        placeholder="搜索标签名称"
        :prefix-icon="Search"
        class="tag-search"
        clearable
        @update:model-value="$emit('search', $event)"
      />
      <label>
        <span>标签类型</span>
        <el-select :model-value="bizType" class="filter-select" @update:model-value="$emit('filter-change', 'bizType', $event)">
          <el-option v-for="option in bizTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </label>
      <label>
        <span>状态</span>
        <el-select :model-value="status" class="filter-select" @update:model-value="$emit('filter-change', 'status', $event)">
          <el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </label>
      <el-button class="reset-btn" :icon="RefreshRight" @click="$emit('reset')">重置</el-button>
    </div>

    <div class="table-wrap">
      <table class="tag-table">
        <thead>
          <tr>
            <th>标签名称</th>
            <th>类型</th>
            <th>状态</th>
            <th>使用次数</th>
            <th>关联内容</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-if="rows.length">
          <tr v-for="row in rows" :key="row.id || row.name">
            <td>
              <span class="tag-chip" :style="tagStyle(row)" :title="row.name">{{ row.name }}</span>
            </td>
            <td>{{ row.type }}</td>
            <td>
              <span class="status-pill" :class="{ disabled: row.status === 0 }">
                {{ row.statusText }}
              </span>
            </td>
            <td>{{ row.count }}</td>
            <td>{{ row.related }}</td>
            <td>{{ row.createdAt }}</td>
            <td>
              <div class="table-actions">
                <button
                  type="button"
                  title="编辑"
                  @click="$emit('edit', row)"
                >
                  <el-icon><EditPen /></el-icon>
                </button>
                <button
                  type="button"
                  :title="row.status === 0 ? '启用' : '禁用'"
                  @click="$emit('toggle-status', row)"
                >
                  <el-icon><component :is="row.status === 0 ? CircleCheck : CircleClose" /></el-icon>
                </button>
                <button
                  type="button"
                  title="删除"
                  class="danger"
                  @click="$emit('delete', row)"
                >
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="table-empty">
        <strong>暂无标签</strong>
        <span>当前接口没有返回标签数据</span>
      </div>
    </div>

    <footer class="tag-pagination">
      <span>共 {{ total }} 条数据</span>
      <el-pagination
        background
        layout="prev, pager, next, sizes"
        :current-page="pageNo"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        @current-change="$emit('page-change', $event)"
        @size-change="$emit('page-size-change', $event)"
      />
    </footer>
  </section>
</template>

<script setup>
import {
  CircleCheck,
  CircleClose,
  Delete,
  EditPen,
  RefreshRight,
  Search,
} from '@element-plus/icons-vue'

defineProps({
  bizType: { type: String, default: '' },
  bizTypeOptions: { type: Array, default: () => [] },
  keyword: { type: String, default: '' },
  pageNo: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  rows: { type: Array, default: () => [] },
  status: { type: [String, Number], default: '' },
  statusOptions: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})

defineEmits(['delete', 'edit', 'filter-change', 'page-change', 'page-size-change', 'reset', 'search', 'toggle-status'])

function hexToRgb(hex) {
  const fallback = '20, 118, 255'
  if (!hex || typeof hex !== 'string') return fallback
  const clean = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(clean)) return fallback

  const value = parseInt(clean, 16)
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`
}

function tagStyle(row) {
  const color = row.color || '#1476ff'
  const rgb = hexToRgb(color)
  return {
    color,
    borderColor: `rgba(${rgb}, .45)`,
    background: `rgba(${rgb}, .08)`,
  }
}
</script>

<style scoped>
.tag-panel {
  margin-top: 22px;
  overflow: hidden;
  border: 1px solid #e7ecf7;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(35, 56, 118, 0.055);
}

.tag-filters {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid #e9eef8;
}

.tag-search {
  flex: 0 0 250px;
}

.tag-filters label {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 188px;
}

.tag-filters label > span {
  flex: 0 0 auto;
  color: #44588a;
  font-size: 13px;
  font-weight: 700;
}

.filter-select {
  width: 132px;
}

.tag-filters :deep(.el-input__wrapper),
.tag-filters :deep(.el-select__wrapper) {
  min-height: 38px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px #dce4f3 inset;
}

.reset-btn {
  margin-left: auto;
  height: 38px;
  border-radius: 6px;
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
}

.table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 180px;
  gap: 8px;
  border-top: 1px solid #e9eef8;
  color: #50669c;
}

.table-empty strong {
  color: #102557;
  font-size: 15px;
  font-weight: 800;
}

.table-empty span {
  font-size: 13px;
}

.tag-table {
  width: 100%;
  min-width: 1040px;
  border-collapse: collapse;
}

.tag-table th {
  padding: 15px 20px;
  background: #fbfcff;
  color: #102557;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
}

.tag-table td {
  height: 57px;
  padding: 8px 20px;
  border-top: 1px solid #e9eef8;
  color: #41558a;
  font-size: 13px;
  white-space: nowrap;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  max-width: 180px;
  min-width: 52px;
  height: 24px;
  justify-content: center;
  overflow: hidden;
  padding: 0 10px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  background: #ecfdf5;
  color: #16a34a;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.disabled {
  border-color: #e1e7f2;
  background: #f5f7fb;
  color: #6b7897;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #40558f;
  cursor: pointer;
  font-size: 16px;
}

.table-actions button.danger {
  color: #ff3b4f;
}

.tag-pagination {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  border-top: 1px solid #e9eef8;
  color: #42578c;
  font-size: 13px;
}

.tag-pagination :deep(.el-pagination) {
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .tag-filters {
    flex-wrap: wrap;
    gap: 14px;
  }

  .tag-search,
  .tag-filters label {
    flex: 1 1 220px;
  }

  .filter-select {
    flex: 1;
    width: auto;
  }

  .reset-btn {
    margin-left: 0;
  }
}

@media (max-width: 760px) {
  .tag-pagination {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
  }

  .tag-pagination :deep(.el-pagination) {
    justify-content: flex-start;
  }
}
</style>

<template>
  <section class="admin-table-card" :class="{ 'has-top-border': bordered }">
    <div v-if="$slots.header" class="admin-table-card__header">
      <slot name="header" />
    </div>

    <div class="admin-table-card__wrap">
      <table class="admin-table-card__table" :style="{ minWidth }">
        <thead>
          <tr>
            <th v-if="selectable" class="is-check"><el-checkbox /></th>
            <th v-for="column in columns" :key="column.key" :style="column.style">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="row.id || row.name || index"
            :class="{ 'is-clickable': rowClickable }"
            @click="handleRowClick(row)"
          >
            <td v-if="selectable" class="is-check" @click.stop><el-checkbox /></td>
            <td v-for="column in columns" :key="column.key" :style="column.style">
              <slot :name="column.key" :row="row" :column="column" :index="index">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td class="admin-table-card__empty" :colspan="columns.length + (selectable ? 1 : 0)">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ResourcePagination
      v-if="pagination"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total || rows.length"
      @change="$emit('page-change', $event)"
      @page-size-change="$emit('page-size-change', $event)"
    />
  </section>
</template>

<script setup>
import ResourcePagination from '../resource/ResourcePagination.vue'

defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  minWidth: { type: String, default: '1080px' },
  selectable: { type: Boolean, default: false },
  pagination: { type: Boolean, default: true },
  total: { type: Number, default: 0 },
  bordered: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [10, 20, 50] },
  rowClickable: { type: Boolean, default: false },
})

const emit = defineEmits(['page-change', 'page-size-change', 'row-click'])

function handleRowClick(row) {
  if (!row) return
  emit('row-click', row)
}
</script>

<style scoped>
.admin-table-card {
  overflow: hidden;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.admin-table-card__header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--admin-row-border);
}

.admin-table-card__wrap {
  overflow-x: auto;
}

.admin-table-card__table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table-card__table th {
  padding: 15px 20px;
  background: var(--admin-surface-subtle);
  color: #102557;
  font-size: var(--admin-text-sm);
  font-weight: var(--admin-weight-strong);
  text-align: left;
  white-space: nowrap;
}

.admin-table-card__table td {
  height: var(--admin-table-row-min-height);
  padding: 9px 20px;
  border-top: 1px solid var(--admin-row-border);
  color: #41558a;
  font-size: var(--admin-text-sm);
  white-space: nowrap;
}

.admin-table-card__table tbody tr:first-child td {
  border-top: 1px solid var(--admin-row-border);
}

.admin-table-card__table tbody tr.is-clickable {
  cursor: pointer;
}

.admin-table-card__table tbody tr.is-clickable:hover td {
  background: #f8fbff;
}

.admin-table-card__table .is-check {
  width: 36px;
  padding-right: 0;
}

.admin-table-card__empty {
  height: 92px;
  color: #7a89ad;
  text-align: center;
}
</style>

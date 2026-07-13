<template>
  <section class="admin-filter-bar" aria-label="筛选条件">
    <el-input
      v-if="search"
      class="admin-filter-bar__search"
      :placeholder="search.placeholder"
      :prefix-icon="Search"
      :model-value="search.value || ''"
      clearable
      @update:model-value="handleSearchInput"
      @keyup.enter="emitSearch"
    />

    <el-date-picker
      v-if="dateRange"
      class="admin-filter-bar__date"
      type="daterange"
      :model-value="dateRange.value"
      range-separator="→"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      @update:model-value="handleDateChange"
    />

    <el-select
      v-for="filter in filters"
      :key="filter.label"
      class="admin-filter-bar__select"
      :model-value="filter.value"
      :placeholder="filter.label"
      @update:model-value="handleFilterChange(filter, $event)"
    >
      <el-option
        v-for="option in filter.options || [filter.value]"
        :key="option"
        :label="option"
        :value="option"
      />
    </el-select>

    <div class="admin-filter-bar__spacer" />

    <div v-if="$slots.actions" class="admin-filter-bar__actions">
      <slot name="actions" />
    </div>

    <el-button v-if="showReset" class="admin-filter-bar__button" :icon="RefreshRight" @click="$emit('reset')">
      重置
    </el-button>
    <el-button v-if="showSearch" class="admin-filter-bar__button" type="primary" @click="emitSearch">
      查询
    </el-button>
  </section>
</template>

<script setup>
import { RefreshRight, Search } from '@element-plus/icons-vue'

defineProps({
  search: { type: Object, default: null },
  dateRange: { type: Object, default: null },
  filters: { type: Array, default: () => [] },
  showReset: { type: Boolean, default: true },
  showSearch: { type: Boolean, default: false },
})

const emit = defineEmits(['search-input', 'filter-change', 'date-change', 'search', 'reset'])

function handleSearchInput(value) {
  emit('search-input', value)
}

function handleFilterChange(filter, value) {
  emit('filter-change', { ...filter, value })
}

function handleDateChange(value) {
  emit('date-change', value)
}

function emitSearch() {
  emit('search')
}
</script>

<style scoped>
.admin-filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.admin-filter-bar__search {
  flex: 1 1 280px;
  min-width: 220px;
}

.admin-filter-bar__date {
  width: 285px;
}

.admin-filter-bar__select {
  width: 164px;
}

.admin-filter-bar__spacer {
  flex: 1;
  min-width: 0;
}

.admin-filter-bar__actions {
  align-items: center;
  display: flex;
  gap: 10px;
}

.admin-filter-bar__button {
  height: var(--admin-control-height);
  min-width: 72px;
  border-radius: var(--admin-radius-control);
  font-weight: var(--admin-weight-semibold);
}

.admin-filter-bar :deep(.el-input__wrapper),
.admin-filter-bar :deep(.el-select__wrapper),
.admin-filter-bar :deep(.el-date-editor) {
  min-height: var(--admin-input-height);
  border-radius: var(--admin-radius-control);
  box-shadow: 0 0 0 1px var(--admin-border) inset;
}

.admin-filter-bar :deep(.el-button--primary) {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  box-shadow: var(--admin-shadow-primary);
}

@media (max-width: 980px) {
  .admin-filter-bar {
    flex-wrap: wrap;
  }

  .admin-filter-bar__date,
  .admin-filter-bar__select {
    flex: 1 1 180px;
    width: auto;
  }

  .admin-filter-bar__spacer {
    display: none;
  }
}
</style>

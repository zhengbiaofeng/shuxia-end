<template>
  <footer class="resource-pagination">
    <span>共 {{ total }} 条数据</span>
    <el-pagination
      background
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      layout="prev, pager, next, jumper"
      @current-change="handleCurrentChange"
    />
    <el-select :model-value="pageSize" class="page-size" @change="handleSizeChange">
      <el-option
        v-for="size in pageSizes"
        :key="size"
        :label="`${size} 条/页`"
        :value="size"
      />
    </el-select>
  </footer>
</template>

<script setup>
defineProps({
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [10, 20, 50] },
})

const emit = defineEmits(['update:current-page', 'update:page-size', 'change', 'page-size-change'])

function handleCurrentChange(page) {
  emit('update:current-page', page)
  emit('change', page)
}

function handleSizeChange(size) {
  emit('update:page-size', Number(size))
  emit('page-size-change', Number(size))
}
</script>

<style scoped>
.resource-pagination {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  border-top: 1px solid #e9eef8;
  color: #42578c;
  font-size: 13px;
}

.page-size {
  width: 118px;
}

.resource-pagination :deep(.el-pagination) {
  justify-content: flex-end;
}

.resource-pagination :deep(.el-pagination.is-background .el-pager li),
.resource-pagination :deep(.el-pagination.is-background .btn-prev),
.resource-pagination :deep(.el-pagination.is-background .btn-next) {
  border: 1px solid #dfe7f5;
  border-radius: 6px;
  background: #fff;
  color: #43598f;
}

.resource-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  border-color: #1476ff;
  background: #1476ff;
  color: #fff;
}

@media (max-width: 760px) {
  .resource-pagination {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

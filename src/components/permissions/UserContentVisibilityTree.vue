<template>
  <div class="scope-tree">
    <div class="scope-toolbar">
      <el-input
        :model-value="keyword"
        clearable
        :prefix-icon="Search"
        placeholder="搜索分类"
        @input="$emit('update:keyword', $event)"
      />
      <el-button :icon="RefreshLeft" :disabled="disabled" @click="$emit('clear')">
        全部可见
      </el-button>
    </div>

    <div class="tree-heading">
      <span>不可见分类</span>
      <strong>{{ checkedCount }} 项</strong>
    </div>
    <el-tree
      ref="treeRef"
      class="category-tree"
      node-key="id"
      show-checkbox
      default-expand-all
      :data="categories"
      :props="treeProps"
      :empty-text="emptyText"
      :filter-node-method="filterNode"
      @check="syncCheckedCount"
    >
      <template #default="{ data }">
        <span class="category-node">
          <span :title="data.categoryName">{{ data.categoryName }}</span>
          <small>{{ Number(data.usageCount || 0) }} 项内容</small>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { RefreshLeft, Search } from '@element-plus/icons-vue'

const props = defineProps({
  keyword: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无分类' },
})

defineEmits(['update:keyword', 'clear'])
const treeRef = ref(null)
const checkedCount = ref(0)
const treeProps = { children: 'children', label: 'categoryName', disabled: () => props.disabled }

watch(() => props.keyword, (value) => treeRef.value?.filter(value || ''))

function filterNode(value, data) {
  if (!value) return true
  return String(data?.categoryName || '').toLowerCase().includes(String(value).trim().toLowerCase())
}

function syncCheckedCount() {
  checkedCount.value = treeRef.value?.getCheckedKeys(false)?.length || 0
}

async function setCheckedKeys(keys = []) {
  await nextTick()
  treeRef.value?.setCheckedKeys(Array.isArray(keys) ? keys : [], false)
  syncCheckedCount()
}

function getCheckedKeys() {
  return treeRef.value?.getCheckedKeys(false) || []
}

defineExpose({ setCheckedKeys, getCheckedKeys })
</script>

<style scoped>
.scope-tree { min-width: 0; }
.scope-toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) auto; gap: 12px; }
.scope-toolbar :deep(.el-input) { width: 100%; }
.tree-heading { display: flex; align-items: center; justify-content: space-between; min-height: 42px; margin-top: 14px; padding: 0 14px; border: 1px solid #e1e9f5; border-bottom: 0; border-radius: 8px 8px 0 0; background: #f7faff; color: #526987; font-size: 13px; }
.tree-heading strong { color: #1d67ff; font-size: 13px; }
.category-tree { height: clamp(240px, 39vh, 330px); overflow: auto; padding: 8px; border: 1px solid #e1e9f5; border-radius: 0 0 8px 8px; }
.category-tree :deep(.el-tree-node__content) { min-height: 38px; height: auto; border-radius: 6px; }
.category-tree :deep(.el-tree-node__content:hover) { background: #f2f7ff; }
.category-node { display: flex; align-items: center; justify-content: space-between; min-width: 0; width: 100%; gap: 16px; padding-right: 10px; }
.category-node > span { overflow: hidden; color: #18325c; text-overflow: ellipsis; white-space: nowrap; }
.category-node small { flex: 0 0 auto; color: #8291a8; font-size: 12px; }
@media (max-width: 560px) {
  .scope-toolbar { grid-template-columns: 1fr; }
  .category-tree { height: 300px; }
}
</style>

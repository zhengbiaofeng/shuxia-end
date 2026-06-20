<template>
  <ResourceShell
    :actions="pageActions"
    :active-menu="ACTIVE_MENU"
    :active-tab="activeTab"
    :tabs="tabs"
    :title="PAGE_TITLE"
    :subtitle="PAGE_SUBTITLE"
    @action="handleAction"
    @tab-change="handleTabChange"
  >
    <ResourceMetricGrid :items="metrics" />
    <div v-loading="loading">
      <CategoryBoard
        :groups="groups"
        @add-child="openChildCategoryForm"
        @delete="handleDeleteCategory"
        @edit="openCategoryForm"
        @toggle-status="handleToggleCategoryStatus"
      />
    </div>
    <ResourceFormDialog
      v-model="formVisible"
      :fields="categoryFields"
      :initial-values="formInitialValues"
      :submitting="submitting"
      :title="editingCategory ? '编辑分类' : '新增分类'"
      @submit="handleSubmitCategory"
    />
  </ResourceShell>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { Clock, Collection, Files, Folder, Plus } from '@element-plus/icons-vue'
import CategoryBoard from '../components/resource/CategoryBoard.vue'
import ResourceFormDialog from '../components/resource/ResourceFormDialog.vue'
import ResourceMetricGrid from '../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../components/resource/ResourceShell.vue'
import {
  changeCategoryStatus,
  createCategory,
  deleteCategory,
  fetchCategoryPageData,
  updateCategory,
} from '../api/resourceManagement'

const PAGE_TITLE = '分类管理'
const PAGE_SUBTITLE = '管理所有内容的分类，支持多级分类和自定义排序'
const ACTIVE_MENU = '分类管理'

const loading = ref(false)
const submitting = ref(false)
const formVisible = ref(false)
const editingCategory = ref(null)
const parentCategory = ref(null)
const activeTab = ref(0)
const roots = ref([])

const pageActions = [{ label: '添加分类', icon: Plus, type: 'primary' }]
const tabs = computed(() => roots.value.map((root) => `${root.title}分类`))
const activeRoot = computed(() => roots.value[activeTab.value] || null)
const groups = computed(() => activeRoot.value?.children || [])
const metrics = computed(() => buildMetrics(activeRoot.value))

const categoryFields = [
  { key: 'categoryName', label: '分类名称', required: true, placeholder: '请输入分类名称' },
  { key: 'categoryCode', label: '分类编码', required: true, placeholder: '请输入分类编码' },
  { key: 'sortNo', label: '排序', type: 'number', defaultValue: 0 },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    defaultValue: 1,
    options: [
      { label: '启用', value: 1 },
      { label: '停用', value: 0 },
    ],
  },
]

const formInitialValues = computed(() => {
  const raw = editingCategory.value?.raw || {}

  return {
    categoryName: raw.categoryName || '',
    categoryCode: raw.categoryCode || '',
    sortNo: Number(raw.sortNo || 0),
    status: Number(raw.status ?? 1),
  }
})

function handleAction(action) {
  if (action.label === '添加分类') {
    openCategoryForm()
  }
}

function openCategoryForm(row = null) {
  editingCategory.value = row
  parentCategory.value = row ? null : activeRoot.value
  formVisible.value = true
}

function openChildCategoryForm(row) {
  editingCategory.value = null
  parentCategory.value = row
  formVisible.value = true
}

async function handleSubmitCategory(values) {
  submitting.value = true
  try {
    const payload = {
      categoryName: values.categoryName,
      categoryCode: values.categoryCode,
      parentId: editingCategory.value?.raw?.parentId || parentCategory.value?.id || undefined,
      sortNo: Number(values.sortNo || 0),
      status: Number(values.status ?? 1),
    }

    if (editingCategory.value?.id) {
      await updateCategory({ ...payload, id: editingCategory.value.id })
      ElMessage.success('分类已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('分类已新增')
    }

    formVisible.value = false
    await loadCategoryPage()
  } catch (error) {
    ElMessage.error(error?.message || '保存分类失败')
  } finally {
    submitting.value = false
  }
}

async function handleToggleCategoryStatus(row) {
  if (!row?.id) {
    ElMessage.warning('缺少分类 ID，无法切换状态')
    return
  }

  try {
    const nextStatus = row.status === 0 ? 1 : 0
    await changeCategoryStatus(row.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? '分类已启用' : '分类已停用')
    await loadCategoryPage()
  } catch (error) {
    ElMessage.error(error?.message || '切换分类状态失败')
  }
}

async function handleDeleteCategory(row) {
  if (!row?.id) {
    ElMessage.warning('缺少分类 ID，无法删除')
    return
  }

  if (!isEmptyLeafCategory(row)) {
    ElMessage.warning('只能删除没有子分类且没有内容的叶子分类')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除分类「${row.title || row.raw?.categoryName || row.id}」吗？删除后不可恢复。`,
      '删除空分类',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        type: 'warning',
      },
    )
    await deleteCategory(row.id)
    ElMessage.success('分类已删除')
    await loadCategoryPage()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除分类失败')
  }
}

async function loadCategoryPage() {
  loading.value = true
  const previousRootId = activeRoot.value?.id
  try {
    const data = await fetchCategoryPageData()
    roots.value = data.roots
    const nextIndex = previousRootId ? roots.value.findIndex((root) => root.id === previousRootId) : activeTab.value
    activeTab.value = nextIndex >= 0 && nextIndex < roots.value.length ? nextIndex : 0
  } catch (error) {
    roots.value = []
    activeTab.value = 0
    ElMessage.error(error?.message || '分类管理接口加载失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange(index) {
  activeTab.value = index
}

function buildMetrics(root) {
  const topLevelCategories = root?.children || []
  const categories = flattenCategories(topLevelCategories)
  const totalCount = categories.length
  const usedCount = categories.filter((item) => Number(item.usageCount || 0) > 0).length
  const contentCount = sumCategoryUsage(topLevelCategories)
  const usageRate = totalCount ? (usedCount / totalCount) * 100 : 0
  const title = root?.title || '当前'

  return [
    { label: `${title}分类总数`, value: formatNumber(totalCount), unit: '个', sub: `一级分类 ${formatNumber(root?.children?.length || 0)} 个`, color: 'blue', icon: Files },
    { label: `${title}内容数量`, value: formatNumber(contentCount), unit: '本', sub: `有内容 ${formatNumber(usedCount)} 个分类`, color: 'green', icon: Collection },
    { label: '无内容分类', value: formatNumber(Math.max(totalCount - usedCount, 0)), unit: '个', sub: '当前页签空分类', color: 'purple', icon: Folder },
    { label: '覆盖率', value: `${usageRate.toFixed(1)}%`, unit: '', sub: '有内容分类占比', color: 'orange', icon: Clock },
  ]
}

function flattenCategories(items = []) {
  return items.flatMap((item) => [item, ...flattenCategories(item.children)])
}

function sumCategoryUsage(items = []) {
  return items.reduce((total, item) => total + Number(item.usageCount || 0), 0)
}

function isEmptyLeafCategory(category) {
  return Boolean(category?.id) && !category?.children?.length && Number(category?.usageCount || 0) === 0
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

onMounted(() => {
  loadCategoryPage()
})
</script>

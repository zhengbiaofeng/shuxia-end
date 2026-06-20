<template>
  <ResourceShell
    :actions="tagPageConfig.actions"
    :active-menu="tagPageConfig.activeMenu"
    :active-tab="activeTab"
    :tabs="tagTabLabels"
    :title="tagPageConfig.title"
    :subtitle="tagPageConfig.subtitle"
    @action="handleAction"
    @tab-change="handleTabChange"
  >
    <ResourceMetricGrid :items="metrics" />
    <TagTable
      v-loading="loading"
      :biz-type="filters.bizType"
      :biz-type-options="bizTypeFilterOptions"
      :keyword="keyword"
      :page-no="pageNo"
      :page-size="pageSize"
      :rows="rows"
      :status="filters.status"
      :status-options="statusFilterOptions"
      :total="total"
      @delete="handleDeleteTag"
      @edit="openTagForm"
      @filter-change="handleFilterChange"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @reset="handleReset"
      @search="handleSearch"
      @toggle-status="handleToggleTagStatus"
    />
    <ResourceFormDialog
      v-model="formVisible"
      :fields="tagFields"
      :initial-values="formInitialValues"
      :submitting="submitting"
      :title="editingTag ? '编辑标签' : '新增标签'"
      @submit="handleSubmitTag"
    />
  </ResourceShell>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, shallowRef } from 'vue'
import ResourceFormDialog from '../components/resource/ResourceFormDialog.vue'
import ResourceMetricGrid from '../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../components/resource/ResourceShell.vue'
import TagTable from '../components/resource/TagTable.vue'
import {
  changeTagStatus,
  createTag,
  deleteTag,
  fetchTagPageData,
  updateTag,
} from '../api/resourceManagement'
import { tagPageConfig } from '../config/resourceManagement'

const loading = ref(false)
const submitting = ref(false)
const formVisible = ref(false)
const editingTag = ref(null)
const keyword = ref('')
const metrics = shallowRef([])
const rows = shallowRef([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(20)
const summary = shallowRef({})
const filters = ref({
  bizType: '',
  status: '',
})

const tagTabs = [
  { label: '全部标签', value: '', countKey: 'totalTagCount' },
  { label: '书籍标签', value: 'ebook', countKey: 'ebookTagCount' },
  { label: '小说标签', value: 'novel', countKey: 'novelTagCount' },
  { label: '漫画标签', value: 'comic', countKey: 'comicTagCount' },
  { label: '有声标签', value: 'audio', countKey: 'audioTagCount' },
]

const bizTypeFilterOptions = [
  { label: '全部类型', value: '' },
  { label: '书籍', value: 'ebook' },
  { label: '小说', value: 'novel' },
  { label: '漫画', value: 'comic' },
  { label: '有声', value: 'audio' },
]

const statusFilterOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

const formBizTypeOptions = bizTypeFilterOptions.filter((option) => option.value)
const formStatusOptions = statusFilterOptions.filter((option) => option.value !== '')

const activeTab = computed(() => {
  const index = tagTabs.findIndex((tab) => tab.value === filters.value.bizType)
  return index >= 0 ? index : 0
})

const tagTabLabels = computed(() => tagTabs.map((tab) => {
  const count = Number(summary.value?.[tab.countKey] ?? 0)
  return `${tab.label} (${count.toLocaleString()})`
}))

const tagFields = [
  { key: 'tagName', label: '标签名称', required: true, placeholder: '请输入标签名称' },
  {
    key: 'bizType',
    label: '业务类型',
    type: 'select',
    defaultValue: 'ebook',
    options: formBizTypeOptions,
  },
  { key: 'sortNo', label: '排序', type: 'number', defaultValue: 0 },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    defaultValue: 1,
    options: formStatusOptions,
  },
]

const formInitialValues = computed(() => {
  const raw = editingTag.value?.raw || {}

  return {
    tagName: raw.tagName || '',
    bizType: raw.bizType || filters.value.bizType || 'ebook',
    sortNo: Number(raw.sortNo || 0),
    status: Number(raw.status ?? 1),
  }
})

let searchTimer = null

function handleAction(action) {
  if (action.label === '添加标签') {
    openTagForm()
  }
}

function openTagForm(row = null) {
  editingTag.value = row
  formVisible.value = true
}

async function handleSubmitTag(values) {
  submitting.value = true
  try {
    const payload = {
      tagName: values.tagName,
      bizType: values.bizType,
      sortNo: Number(values.sortNo || 0),
      status: Number(values.status ?? 1),
    }

    if (editingTag.value?.id) {
      await updateTag({ ...payload, id: editingTag.value.id })
      ElMessage.success('标签已更新')
    } else {
      await createTag(payload)
      ElMessage.success('标签已新增')
    }

    formVisible.value = false
    await loadTagPage()
  } catch (error) {
    ElMessage.error(error?.message || '保存标签失败')
  } finally {
    submitting.value = false
  }
}

async function handleDeleteTag(row) {
  if (!row?.id) {
    ElMessage.warning('缺少标签 ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除标签', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteTag(row.id)
    ElMessage.success('标签已删除')
    await loadTagPage()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除标签失败')
    }
  }
}

async function handleToggleTagStatus(row) {
  if (!row?.id) {
    ElMessage.warning('缺少标签 ID，无法切换状态')
    return
  }

  try {
    const nextStatus = row.status === 0 ? 1 : 0
    await changeTagStatus(row.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? '标签已启用' : '标签已禁用')
    await loadTagPage()
  } catch (error) {
    ElMessage.error(error?.message || '切换标签状态失败')
  }
}

function handleSearch(value) {
  keyword.value = value
  pageNo.value = 1
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadTagPage(), 300)
}

function handleFilterChange(key, value) {
  filters.value = {
    ...filters.value,
    [key]: value,
  }
  pageNo.value = 1
  loadTagPage()
}

function handleTabChange(index) {
  const tab = tagTabs[index] || tagTabs[0]
  filters.value = {
    ...filters.value,
    bizType: tab.value,
  }
  pageNo.value = 1
  loadTagPage()
}

function handlePageChange(value) {
  pageNo.value = value
  loadTagPage()
}

function handlePageSizeChange(value) {
  pageSize.value = value
  pageNo.value = 1
  loadTagPage()
}

function handleReset() {
  keyword.value = ''
  filters.value = {
    bizType: '',
    status: '',
  }
  pageNo.value = 1
  pageSize.value = 20
  loadTagPage()
}

async function loadTagPage() {
  loading.value = true
  try {
    const data = await fetchTagPageData({
      tagName: keyword.value.trim() || undefined,
      bizType: filters.value.bizType || undefined,
      status: filters.value.status === '' ? undefined : filters.value.status,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
    })
    metrics.value = data.metrics
    rows.value = data.rows
    total.value = data.total || rows.value.length
    pageNo.value = data.pageNo || pageNo.value
    pageSize.value = data.pageSize || pageSize.value
    summary.value = data.summary || {}
  } catch (error) {
    metrics.value = []
    rows.value = []
    total.value = 0
    summary.value = {}
    ElMessage.error(error?.message || '标签管理接口加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTagPage()
})
</script>

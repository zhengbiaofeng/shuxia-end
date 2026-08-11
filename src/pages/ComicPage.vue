<template>
  <ContentManagementPage
    v-model:search-keyword="searchKeyword"
    :active-tab="activeTab"
    :config="pageConfig"
    :filters-state="filters"
    :loading="loading"
    :metrics="metrics"
    :page-count="pageCount"
    :page-no="pageNo"
    :page-size="pageSize"
    :rows="rows"
    :selected-row-keys="selectedIds"
    :total="total"
    @action="handlePageAction"
    @batch-action="handleBatchAction"
    @filter-change="handleFilterChange"
    @page-change="loadPage"
    @page-size-change="handlePageSizeChange"
    @refresh="loadPage(1)"
    @reset="resetFilters"
    @row-action="handleRowAction"
    @search="loadPage(1)"
    @selection-change="handleSelectionChange"
    @tab-change="handleTabChange"
  />

  <ComicImportDialog
    v-model:visible="importDialogVisible"
    :initial-mode="importDialogMode"
    @imported="handleImported"
  />

  <MediaDetailDrawer
    v-model:visible="detailVisible"
    :detail="selectedDetail"
    :items="detailItems"
    :loading="detailLoading"
    type="comic"
    @variant-changed="refreshDetail"
  />

  <ContentMergeDialog
    v-model:visible="mergeVisible"
    v-model:target-id="mergeTargetId"
    :rows="mergeRows"
    domain-label="漫画内容"
    :submitting="mergeSubmitting"
    @confirm="submitMerge"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ContentManagementPage from '../components/content/ContentManagementPage.vue'
import ComicImportDialog from '../components/content/ComicImportDialog.vue'
import MediaDetailDrawer from '../components/content/MediaDetailDrawer.vue'
import ContentMergeDialog from '../components/content/ContentMergeDialog.vue'
import { comicPageConfig, createFilterState } from '../config/contentManagement'
import {
  changeMediaPublishStatus,
  deleteMedia,
  fetchComicPage,
  fetchMediaDetail,
  fetchMediaItems,
  mergeMediaContents,
} from '../api/mediaContent'

const searchKeyword = ref('')
const activeTab = ref('all')
const filters = reactive(createFilterState(comicPageConfig.filters))
const loading = ref(false)
const rows = shallowRef([])
const metrics = shallowRef([])
const tabs = shallowRef(comicPageConfig.tabs)
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
const importDialogVisible = ref(false)
const importDialogMode = ref('upload')
const detailVisible = ref(false)
const detailLoading = ref(false)
const selectedDetail = shallowRef(null)
const detailItems = shallowRef([])
const selectedIds = ref([])
const mergeVisible = ref(false)
const mergeRows = ref([])
const mergeTargetId = ref('')
const mergeSubmitting = ref(false)

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageConfig = computed(() => ({
  ...comicPageConfig,
  tabs: tabs.value,
}))

let searchTimer = null

watch(searchKeyword, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadPage(1), 350)
})

async function loadPage(nextPage = pageNo.value) {
  pageNo.value = Math.max(Number(nextPage) || 1, 1)
  loading.value = true

  try {
    const data = await fetchComicPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value.trim() || undefined,
      categoryId: filters.categoryId || undefined,
      tagName: filters.tagName || undefined,
      publishStatus: filters.publishStatus,
      domainStatus: activeTab.value === 'all' ? undefined : activeTab.value,
    })

    rows.value = data.records
    metrics.value = data.metrics
    tabs.value = data.tabs
    total.value = data.total
    pageNo.value = data.current
  } catch (error) {
    rows.value = []
    metrics.value = []
    total.value = 0
    ElMessage.error(error?.message || '漫画列表接口加载失败')
  } finally {
    loading.value = false
  }
}

function handleFilterChange(key, value) {
  filters[key] = value
  loadPage(1)
}

function handlePageSizeChange(value) {
  pageSize.value = Number(value) || 10
  loadPage(1)
}

function handleTabChange(key) {
  activeTab.value = key || 'all'
  loadPage(1)
}

function handleSelectionChange(keys = []) {
  selectedIds.value = Array.isArray(keys) ? keys : []
}

async function handleBatchAction(action = {}, selectedRows = []) {
  if (String(action.code || '') !== 'merge') return
  if (selectedRows.length < 2) {
    ElMessage.warning('至少选择两条内容再合并')
    return
  }
  if (selectedRows.some((row) => Number(row?.raw?.publishStatus) === 1)) {
    ElMessage.warning('已上架漫画不能合并，请先将所选漫画全部下架')
    return
  }
  mergeRows.value = selectedRows
  mergeTargetId.value = selectedRows[0]?.id || ''
  mergeVisible.value = true
}

function resetFilters() {
  Object.assign(filters, createFilterState(comicPageConfig.filters))
  searchKeyword.value = ''
  activeTab.value = 'all'
  loadPage(1)
}

function handlePageAction(action = {}) {
  const code = String(action.code || '')
  if (!['upload', 'scan'].includes(code)) return
  importDialogMode.value = code
  importDialogVisible.value = true
}

async function handleRowAction(action = {}, row = {}) {
  const code = String(action.code || '')
  if (code === 'view') {
    await openDetail(row)
    return
  }
  if (code === 'shelf') {
    await toggleShelfStatus(row)
    return
  }
  if (code === 'delete') await handleDelete(row)
}

async function openDetail(row = {}) {
  if (!row.id) return
  detailVisible.value = true
  detailLoading.value = true
  selectedDetail.value = null
  detailItems.value = []
  try {
    const [detail, items] = await Promise.all([
      fetchMediaDetail('comic', row.id),
      fetchMediaItems('comic', row.id),
    ])
    selectedDetail.value = detail
    detailItems.value = items
  } catch (error) {
    ElMessage.error(error?.message || '加载漫画详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function refreshDetail({ bookId } = {}) {
  if (!bookId || !detailVisible.value) return
  try {
    const [detail, items] = await Promise.all([
      fetchMediaDetail('comic', bookId),
      fetchMediaItems('comic', bookId),
    ])
    selectedDetail.value = detail
    detailItems.value = items
  } catch (error) {
    ElMessage.error(error?.message || '刷新漫画详情失败')
  }
}

async function submitMerge(targetId) {
  const sourceIds = mergeRows.value.map((row) => row?.id).filter((id) => id && id !== targetId)
  if (!targetId || !sourceIds.length) {
    ElMessage.warning('请选择保留的目标内容')
    return
  }
  mergeSubmitting.value = true
  try {
    await mergeMediaContents(targetId, sourceIds)
    mergeVisible.value = false
    mergeRows.value = []
    mergeTargetId.value = ''
    selectedIds.value = []
    ElMessage.success('内容合并完成，源内容已归档删除')
    await loadPage(pageNo.value)
  } catch (error) {
    ElMessage.error(error?.message || '内容合并失败，请检查格式是否冲突')
  } finally {
    mergeSubmitting.value = false
  }
}

async function toggleShelfStatus(row = {}) {
  if (!row.id) return
  const nextStatus = Number(row.raw?.publishStatus) === 1 ? 2 : 1
  const actionText = nextStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定${actionText}「${row.title}」吗？`, `${actionText}漫画`, {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })
    await changeMediaPublishStatus('comic', row.id, nextStatus)
    ElMessage.success(`漫画已${actionText}`)
    await loadPage(pageNo.value)
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || `${actionText}漫画失败`)
  }
}

async function handleDelete(row = {}) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？删除后不可恢复。`, '删除漫画', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteMedia('comic', row.id)
    detailVisible.value = false
    ElMessage.success('漫画已删除')
    await loadPage(rows.value.length === 1 && pageNo.value > 1 ? pageNo.value - 1 : pageNo.value)
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除漫画失败')
  }
}

function handleImported() {
  loadPage(1)
}

onMounted(() => {
  loadPage(1)
})
</script>

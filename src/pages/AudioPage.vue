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
    :total="total"
    @filter-change="handleFilterChange"
    @page-change="loadPage"
    @page-size-change="handlePageSizeChange"
    @refresh="loadPage(1)"
    @reset="resetFilters"
    @search="loadPage(1)"
    @tab-change="handleTabChange"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ContentManagementPage from '../components/content/ContentManagementPage.vue'
import { audioPageConfig, createFilterState } from '../config/contentManagement'
import { fetchAudioPage } from '../api/mediaContent'

const searchKeyword = ref('')
const activeTab = ref('all')
const filters = reactive(createFilterState(audioPageConfig.filters))
const loading = ref(false)
const rows = shallowRef([])
const metrics = shallowRef([])
const tabs = shallowRef(audioPageConfig.tabs)
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageConfig = computed(() => ({
  ...audioPageConfig,
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
    const data = await fetchAudioPage({
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
    ElMessage.error(error?.message || '有声列表接口加载失败')
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

function resetFilters() {
  Object.assign(filters, createFilterState(audioPageConfig.filters))
  searchKeyword.value = ''
  activeTab.value = 'all'
  loadPage(1)
}

onMounted(() => {
  loadPage(1)
})
</script>

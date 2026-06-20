<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handleAction"
  >
    <div class="automation-stack">
      <AdminFilterBar
        :search="searchConfig"
        show-search
        @reset="resetSearch"
        @search-input="handleSearchInput"
      />
      <AdminTableCard
        v-loading="loading"
        :columns="columns"
        :rows="filteredRows"
        min-width="980px"
        :total="filteredRows.length"
      >
        <template #status="{ row }">
          <AdminStatusBadge :label="row.status" :tone="row.tone" dot />
        </template>
        <template #actions>
          <AdminActionIcons :actions="commonActions.more" />
        </template>
      </AdminTableCard>
    </div>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { AdminActionIcons, AdminFilterBar, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchSubscribePage, refreshSubscribePage } from '../../api/automation'
import { automationPages, commonActions } from '../../config/adminModules'

const loading = ref(false)
const searchKeyword = ref('')
const page = reactive({
  ...automationPages.subscriptions,
  rows: [],
  total: 0,
  summary: null,
})
const searchConfig = computed(() => ({
  ...page.filters.search,
  value: searchKeyword.value,
}))
const filteredRows = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return page.rows
  return page.rows.filter((row) => [row.name, row.type, row.source, row.status]
    .some((value) => String(value || '').toLowerCase().includes(keyword)))
})
const columns = [
  { key: 'name', label: '订阅名称' },
  { key: 'type', label: '内容类型' },
  { key: 'source', label: '来源' },
  { key: 'status', label: '状态' },
  { key: 'cadence', label: '检查频率' },
  { key: 'lastRun', label: '最后检查' },
  { key: 'actions', label: '操作' },
]

async function loadSubscriptions(refresh = false) {
  loading.value = true
  try {
    const data = refresh ? await refreshSubscribePage() : await fetchSubscribePage()
    page.rows = data.rows
    page.total = data.total
    page.summary = data.summary
    if (refresh) ElMessage.success('订阅快照已刷新')
  } catch (error) {
    page.rows = []
    page.total = 0
    page.summary = null
    ElMessage.error(error.message || '获取订阅列表失败')
  } finally {
    loading.value = false
  }
}

function handleAction(action) {
  if (action.label === '刷新订阅快照') {
    loadSubscriptions(true)
  }
}

function handleSearchInput(value) {
  searchKeyword.value = value
}

function resetSearch() {
  searchKeyword.value = ''
}

onMounted(() => loadSubscriptions(false))
</script>

<style scoped>
.automation-stack {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}
</style>

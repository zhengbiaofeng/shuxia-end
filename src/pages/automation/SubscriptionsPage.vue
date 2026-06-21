<template>
  <ResourceShell
    :actions="pageActions"
    active-menu="小说同步"
    title="小说同步"
    subtitle="为本地小说绑定外站详情或目录地址，手动预览解析结果，并按订阅计划同步缺失章节"
    @action="handlePageAction"
  >
    <div class="novel-sync-stack">
      <section class="quick-sync-panel">
        <header class="quick-sync-header">
          <div>
            <span>小说追更</span>
            <h2>粘贴单本链接，自动同步</h2>
          </div>
          <el-tag effect="plain" type="info">仅用于小说站点追更</el-tag>
        </header>

        <el-form class="quick-sync-form" :model="quickForm" label-position="top" @submit.prevent>
          <el-form-item class="quick-url-field" label="小说详情或目录链接">
            <el-input
              v-model="quickForm.detailUrl"
              clearable
              placeholder="https://example.com/novel/123/"
              size="large"
              @keyup.enter="submitQuickSync"
            />
          </el-form-item>
          <el-form-item label="最多章节">
            <el-input-number v-model="quickForm.maxChapters" :max="200" :min="1" class="quick-number" />
          </el-form-item>
          <el-form-item label="请求间隔 ms">
            <el-input-number
              v-model="quickForm.requestDelayMs"
              :max="10000"
              :min="0"
              :step="500"
              class="quick-number"
            />
          </el-form-item>
          <el-form-item label="立即同步">
            <el-switch v-model="quickForm.syncChapters" active-text="同步" inactive-text="预览" />
          </el-form-item>
          <el-button :icon="VideoPlay" :loading="quickLoading" size="large" type="primary" @click="submitQuickSync">
            开始自动同步
          </el-button>
        </el-form>

        <div v-if="quickResult" class="quick-sync-result">
          <div class="quick-result-title">
            <strong>{{ quickResult.bookName }}</strong>
            <span>{{ quickResult.authorName }} / {{ quickResult.sourceName }}</span>
          </div>
          <div class="quick-result-stats">
            <span>新增 {{ quickResult.runResult.addedChapterCount }}</span>
            <span>跳过 {{ quickResult.runResult.skippedChapterCount }}</span>
            <span>失败 {{ quickResult.runResult.failedChapterCount }}</span>
            <span>订阅 {{ quickResult.createdSubscription ? '已创建' : '已复用' }}</span>
          </div>
          <div class="quick-result-actions">
            <el-button text type="primary" @click="openQuickPreview">查看结果</el-button>
            <el-button text @click="router.push('/automation/tasks')">任务中心</el-button>
          </div>
        </div>
      </section>

      <ResourceMetricGrid :items="metrics" />

      <AdminFilterBar
        :filters="filters"
        :search="searchConfig"
        show-search
        @filter-change="handleFilterChange"
        @reset="resetFilters"
        @search="loadSubscriptions(1)"
        @search-input="handleSearchInput"
      />

      <AdminTableCard
        v-loading="loading"
        :columns="columns"
        :current-page="query.pageNo"
        :page-size="query.pageSize"
        :rows="rows"
        min-width="1280px"
        row-clickable
        :total="total"
        @page-change="loadSubscriptions"
        @page-size-change="handlePageSizeChange"
        @row-click="openDetail"
      >
        <template #novel="{ row }">
          <div class="novel-cell">
            <strong :title="row.name">{{ row.name }}</strong>
            <span :title="row.author">{{ row.author }}</span>
          </div>
        </template>
        <template #source="{ row }">
          <div class="url-cell">
            <strong :title="row.source">{{ row.source }}</strong>
            <span :title="row.detailUrl">{{ row.detailUrl }}</span>
          </div>
        </template>
        <template #lastSyncStatus="{ row }">
          <div class="status-stack">
            <AdminStatusBadge :label="row.lastSyncStatus" :tone="row.lastSyncTone" dot />
            <span :title="row.lastSyncMessage">{{ row.lastSyncMessage }}</span>
          </div>
        </template>
        <template #status="{ row }">
          <span @click.stop>
            <el-switch
              :loading="statusLoadingId === row.id"
              :model-value="row.statusValue === 1"
              @change="(value) => toggleStatus(row, value)"
            />
          </span>
        </template>
        <template #actions="{ row }">
          <AdminActionIcons :actions="rowActions(row)" @action="(action) => handleRowAction(row, action)" />
        </template>
      </AdminTableCard>
    </div>

    <el-dialog
      v-model="formVisible"
      :title="editingId ? '编辑小说同步' : '新增小说同步'"
      width="860px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" class="sync-form" label-position="top">
        <section class="form-section">
          <h2>绑定信息</h2>
          <div class="form-grid">
            <el-form-item label="本地小说" prop="bookId">
              <el-select
                v-model="form.bookId"
                filterable
                placeholder="选择已有本地小说"
                remote
                :remote-method="searchNovels"
                :loading="novelsLoading"
              >
                <el-option
                  v-for="novel in novelOptions"
                  :key="novel.id"
                  :label="`${novel.title} / ${novel.author}`"
                  :value="novel.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="来源渠道" prop="sourceId">
              <el-select v-model="form.sourceId" filterable placeholder="选择小说来源渠道" :loading="channelsLoading">
                <el-option
                  v-for="channel in channelOptions"
                  :key="channel.id"
                  :label="`${channel.name} / ${channel.site}`"
                  :value="channel.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="详情或目录 URL" prop="detailUrl" class="is-wide">
              <el-input v-model="form.detailUrl" placeholder="https://example.com/novel/123/" />
            </el-form-item>
            <el-form-item label="同步目标">
              <el-select v-model="form.targetType">
                <el-option label="云端" value="cloud" />
                <el-option label="本地/NAS" value="nas" />
                <el-option label="云端 + 本地/NAS" value="both" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-switch v-model="formEnabled" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </div>
        </section>

        <section class="form-section">
          <h2>计划与运行参数</h2>
          <div class="form-grid">
            <el-form-item label="频率预设">
              <el-select v-model="cronPreset" @change="applyCronPreset">
                <el-option v-for="preset in cronPresets" :key="preset.value" :label="preset.label" :value="preset.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="Cron 表达式" prop="cronExpr">
              <el-input v-model="form.cronExpr" placeholder="0 */6 * * *" />
            </el-form-item>
            <el-form-item label="每次最多章节">
              <el-input-number v-model="form.maxChapters" class="form-control" :min="1" :max="200" />
            </el-form-item>
            <el-form-item label="请求间隔 ms">
              <el-input-number v-model="form.requestDelayMs" class="form-control" :min="0" :max="10000" :step="500" />
            </el-form-item>
            <el-form-item label="同步章节">
              <el-switch v-model="form.syncChapters" active-text="同步" inactive-text="仅预览" />
            </el-form-item>
            <el-form-item label="覆盖元数据">
              <el-switch v-model="form.overwriteMetadata" active-text="允许" inactive-text="关闭" disabled />
            </el-form-item>
          </div>
        </section>

        <section class="form-section">
          <h2>目录与清洗</h2>
          <div class="form-grid">
            <el-form-item label="目录 URL 选择器">
              <el-input v-model="form.catalogUrlSelector" placeholder=".catalog a::attr(href)" />
            </el-form-item>
            <el-form-item label="目录 URL 模板">
              <el-input v-model="form.catalogUrlTemplate" placeholder="/look/{bookId}/list.html" />
            </el-form-item>
            <el-form-item label="推导 list.html">
              <el-switch v-model="form.deriveCatalogListHtml" active-text="启用" inactive-text="关闭" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="内部备注" />
            </el-form-item>
            <el-form-item label="正文移除选择器" class="is-wide">
              <el-input v-model="form.contentRemoveSelectorsText" :rows="3" type="textarea" placeholder=".ad&#10;.footer" />
            </el-form-item>
            <el-form-item label="正文行过滤正则" class="is-wide">
              <el-input v-model="form.contentLineFiltersText" :rows="3" type="textarea" placeholder="最新网址.*&#10;本章未完.*" />
            </el-form-item>
          </div>
        </section>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button :loading="submitting" type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="小说同步详情" size="720px" destroy-on-close>
      <div v-loading="detailLoading" class="detail-panel">
        <template v-if="selectedDetail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="小说">{{ selectedDetail.name }} / {{ selectedDetail.author }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ selectedDetail.source }}</el-descriptions-item>
            <el-descriptions-item label="详情 URL">{{ selectedDetail.detailUrl }}</el-descriptions-item>
            <el-descriptions-item label="Cron">{{ selectedDetail.cron }}</el-descriptions-item>
            <el-descriptions-item label="下次执行">{{ selectedDetail.scheduleNextFireTime || '--' }}</el-descriptions-item>
            <el-descriptions-item label="最近状态">{{ selectedDetail.lastSyncStatus }} / {{ selectedDetail.lastSyncMessage }}</el-descriptions-item>
            <el-descriptions-item label="最近任务">{{ selectedDetail.latestTaskSummary }}</el-descriptions-item>
            <el-descriptions-item label="高级参数">
              最多 {{ selectedDetail.maxChapters }} 章，请求间隔 {{ selectedDetail.requestDelayMs }} ms
            </el-descriptions-item>
          </el-descriptions>
          <section class="detail-actions">
            <el-button :icon="View" @click="previewSubscription(selectedDetail)">预览解析</el-button>
            <el-button type="primary" :icon="VideoPlay" @click="runSubscription(selectedDetail)">立即同步</el-button>
            <el-button :icon="EditPen" @click="openEdit(selectedDetail)">编辑</el-button>
          </section>
        </template>
        <el-empty v-else description="暂无订阅详情" />
      </div>
    </el-drawer>

    <el-dialog v-model="previewVisible" title="解析预览与运行结果" width="880px" destroy-on-close>
      <div v-loading="previewLoading" class="preview-panel">
        <template v-if="previewResult">
          <header class="preview-header">
            <div>
              <h2>{{ previewResult.title }}</h2>
              <p>{{ previewResult.author }} / {{ previewResult.sourceName }} / HTTP {{ previewResult.httpStatus ?? '--' }}</p>
            </div>
            <AdminStatusBadge :label="previewResult.syncChapters ? '已同步' : '仅预览'" :tone="previewResult.syncChapters ? 'green' : 'blue'" dot />
          </header>
          <div class="preview-stats">
            <span>远端章节 {{ previewResult.chapterCount }}</span>
            <span>新增 {{ previewResult.addedChapterCount }}</span>
            <span>跳过 {{ previewResult.skippedChapterCount }}</span>
            <span>失败 {{ previewResult.failedChapterCount }}</span>
            <span>本地章节 {{ previewResult.localChapterCountAfterSync ?? '--' }}</span>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="任务 ID">{{ previewResult.taskId || '--' }}</el-descriptions-item>
            <el-descriptions-item label="最新章节">{{ previewResult.latestChapterTitle }}</el-descriptions-item>
            <el-descriptions-item label="消息">{{ previewResult.message }}</el-descriptions-item>
            <el-descriptions-item label="去重策略">{{ previewResult.chapterDedupMode }}</el-descriptions-item>
          </el-descriptions>
          <section class="sample-grid">
            <article>
              <h3>章节样本</h3>
              <p v-for="item in previewResult.chapterTitleSamples" :key="item">{{ item }}</p>
              <p v-if="!previewResult.chapterTitleSamples.length">--</p>
            </article>
            <article>
              <h3>链接样本</h3>
              <p v-for="item in previewResult.chapterUrlSamples" :key="item" :title="item">{{ item }}</p>
              <p v-if="!previewResult.chapterUrlSamples.length">--</p>
            </article>
            <article class="is-wide">
              <h3>清洗后正文样本</h3>
              <pre>{{ previewResult.contentSample || '--' }}</pre>
            </article>
          </section>
        </template>
        <el-empty v-else description="暂无预览结果" />
      </div>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Delete, EditPen, Plus, RefreshRight, Tickets, VideoPlay, View } from '@element-plus/icons-vue'
import { AdminActionIcons, AdminFilterBar, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchBookList } from '../../api/books'
import {
  changeNovelSyncStatus,
  createNovelSyncSubscription,
  deleteNovelSyncSubscription,
  fetchNovelSyncDetail,
  fetchNovelSyncPage,
  fetchScrapeChannelsPage,
  quickSyncNovelByUrl,
  runNovelSyncNow,
  updateNovelSyncSubscription,
} from '../../api/automation'

const router = useRouter()
const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const formVisible = ref(false)
const previewVisible = ref(false)
const previewLoading = ref(false)
const quickLoading = ref(false)
const submitting = ref(false)
const statusLoadingId = ref('')
const rows = ref([])
const metrics = ref([])
const total = ref(0)
const selectedDetail = ref(null)
const previewResult = ref(null)
const quickResult = ref(null)
const editingId = ref('')
const formRef = ref(null)
const novelOptions = ref([])
const channelOptions = ref([])
const novelsLoading = ref(false)
const channelsLoading = ref(false)
const cronPreset = ref('custom')
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined,
})
const quickForm = reactive({
  detailUrl: '',
  maxChapters: 5,
  requestDelayMs: 1000,
  syncChapters: true,
})
const form = reactive(defaultForm())
const pageActions = [
  { label: '刷新', icon: RefreshRight },
  { label: '新增同步', icon: Plus, type: 'primary' },
]
const columns = [
  { key: 'novel', label: '小说' },
  { key: 'source', label: '来源与地址' },
  { key: 'cron', label: 'Cron' },
  { key: 'latestRemoteChapter', label: '远端最新章节' },
  { key: 'latestSyncTime', label: '最近同步' },
  { key: 'lastSyncStatus', label: '同步状态' },
  { key: 'status', label: '启停' },
  { key: 'actions', label: '操作' },
]
const cronPresets = [
  { label: '每 6 小时', value: '0 */6 * * *' },
  { label: '每 12 小时', value: '0 */12 * * *' },
  { label: '每天凌晨 3 点', value: '0 3 * * *' },
  { label: '自定义', value: 'custom' },
]
const rules = {
  bookId: [{ required: true, message: '请选择本地小说', trigger: 'change' }],
  sourceId: [{ required: true, message: '请选择来源渠道', trigger: 'change' }],
  detailUrl: [{ required: true, message: '请输入详情或目录 URL', trigger: 'blur' }],
  cronExpr: [{ required: true, message: '请输入 5 段 Cron 表达式', trigger: 'blur' }],
}
const searchConfig = computed(() => ({
  placeholder: '搜索小说名、作者或来源',
  value: query.keyword,
}))
const filters = computed(() => [
  {
    label: '全部状态',
    value: query.status === 1 ? '启用' : query.status === 0 ? '停用' : '全部状态',
    options: ['全部状态', '启用', '停用'],
  },
])
const formEnabled = computed({
  get: () => Number(form.status ?? 1) === 1,
  set: (value) => {
    form.status = value ? 1 : 0
  },
})

function defaultForm() {
  return {
    id: '',
    bookId: '',
    sourceId: '',
    detailUrl: '',
    targetType: 'cloud',
    cronExpr: '0 */6 * * *',
    status: 1,
    remark: '',
    maxChapters: 5,
    requestDelayMs: 1000,
    syncChapters: true,
    overwriteMetadata: false,
    catalogUrlSelector: '',
    catalogUrlTemplate: '',
    deriveCatalogListHtml: false,
    contentRemoveSelectorsText: '',
    contentLineFiltersText: '',
  }
}

function rowActions(row) {
  return [
    { label: '预览', icon: View },
    { label: '同步', icon: VideoPlay },
    { label: '任务', icon: Tickets },
    { label: '编辑', icon: EditPen },
    { label: '删除', icon: Delete, danger: true },
  ].map((action) => ({
    ...action,
    loading: (action.label === '同步' || action.label === '预览') && previewLoading.value && previewResult.value?.subscriptionId === row.id,
  }))
}

function handleSearchInput(value) {
  query.keyword = value
}

function handleFilterChange(filter) {
  query.status = filter.value === '启用' ? 1 : filter.value === '停用' ? 0 : undefined
  loadSubscriptions(1)
}

function resetFilters() {
  query.keyword = ''
  query.status = undefined
  loadSubscriptions(1)
}

function handlePageSizeChange(size) {
  query.pageSize = size
  loadSubscriptions(1)
}

function handlePageAction(action) {
  if (action.label === '新增同步') {
    openCreate()
    return
  }
  loadSubscriptions(query.pageNo)
}

async function loadSubscriptions(pageNo = query.pageNo) {
  query.pageNo = pageNo
  loading.value = true
  try {
    const data = await fetchNovelSyncPage(query)
    rows.value = data.rows
    metrics.value = data.metrics
    total.value = data.total
    query.pageNo = data.current || query.pageNo
    query.pageSize = data.pageSize || query.pageSize
  } catch (error) {
    rows.value = []
    metrics.value = []
    total.value = 0
    ElMessage.error(error.message || '获取小说同步订阅失败')
  } finally {
    loading.value = false
  }
}

async function searchNovels(keyword = '') {
  novelsLoading.value = true
  try {
    const data = await fetchBookList({
      pageNo: 1,
      pageSize: 50,
      bizType: 'novel',
      bookType: 'novel',
      bookName: keyword,
    })
    novelOptions.value = data.records
  } catch (error) {
    novelOptions.value = []
    ElMessage.warning(error.message || '获取小说选项失败')
  } finally {
    novelsLoading.value = false
  }
}

async function loadChannelOptions() {
  channelsLoading.value = true
  try {
    const data = await fetchScrapeChannelsPage({ pageNo: 1, pageSize: 100, bizType: 'novel', status: 1 })
    channelOptions.value = data.rows
  } catch (error) {
    channelOptions.value = []
    ElMessage.warning(error.message || '获取来源渠道失败')
  } finally {
    channelsLoading.value = false
  }
}

async function openDetail(row) {
  if (!row?.id) return
  detailVisible.value = true
  detailLoading.value = true
  selectedDetail.value = null
  try {
    selectedDetail.value = await fetchNovelSyncDetail(row.id)
  } catch (error) {
    ElMessage.error(error.message || '获取小说同步详情失败')
  } finally {
    detailLoading.value = false
  }
}

function openCreate() {
  editingId.value = ''
  Object.assign(form, defaultForm())
  cronPreset.value = form.cronExpr
  formVisible.value = true
}

async function openEdit(row) {
  if (!row?.id) return
  editingId.value = row.id
  formVisible.value = true
  try {
    const detail = row.bookId && row.targetType ? row : await fetchNovelSyncDetail(row.id)
    Object.assign(form, defaultForm(), {
      id: detail.id,
      bookId: detail.bookId,
      sourceId: detail.sourceId,
      detailUrl: detail.detailUrl === '--' ? '' : detail.detailUrl,
      targetType: detail.targetType || 'cloud',
      cronExpr: detail.cron === '--' ? '0 */6 * * *' : detail.cron,
      status: detail.statusValue,
      remark: detail.remark || '',
      maxChapters: detail.maxChapters || 5,
      requestDelayMs: detail.requestDelayMs ?? 1000,
      syncChapters: detail.syncChapters !== false,
      overwriteMetadata: Boolean(detail.overwriteMetadata),
      catalogUrlSelector: detail.catalogUrlSelector || '',
      catalogUrlTemplate: detail.catalogUrlTemplate || '',
      deriveCatalogListHtml: Boolean(detail.deriveCatalogListHtml),
      contentRemoveSelectorsText: (detail.contentRemoveSelectors || []).join('\n'),
      contentLineFiltersText: (detail.contentLineFilters || []).join('\n'),
    })
    if (!novelOptions.value.some((item) => item.id === detail.bookId)) {
      novelOptions.value.unshift({ id: detail.bookId, title: detail.name, author: detail.author })
    }
    cronPreset.value = cronPresets.some((item) => item.value === form.cronExpr) ? form.cronExpr : 'custom'
  } catch (error) {
    ElMessage.error(error.message || '获取小说同步详情失败')
  }
}

function resetForm() {
  formRef.value?.clearValidate()
  Object.assign(form, defaultForm())
  editingId.value = ''
}

function applyCronPreset(value) {
  if (value !== 'custom') {
    form.cronExpr = value
  }
}

async function submitForm() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const payload = {
      ...form,
      contentRemoveSelectors: form.contentRemoveSelectorsText,
      contentLineFilters: form.contentLineFiltersText,
    }
    if (editingId.value) {
      await updateNovelSyncSubscription(payload)
      ElMessage.success('小说同步订阅已保存')
    } else {
      await createNovelSyncSubscription(payload)
      ElMessage.success('小说同步订阅已创建')
    }
    formVisible.value = false
    await loadSubscriptions(query.pageNo)
  } catch (error) {
    ElMessage.error(error.message || '保存小说同步订阅失败')
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row, enabled) {
  statusLoadingId.value = row.id
  try {
    await changeNovelSyncStatus({ id: row.id, status: enabled ? 1 : 0 })
    ElMessage.success(enabled ? '同步订阅已启用' : '同步订阅已停用')
    await loadSubscriptions(query.pageNo)
  } catch (error) {
    ElMessage.error(error.message || '切换小说同步状态失败')
  } finally {
    statusLoadingId.value = ''
  }
}

async function previewSubscription(row) {
  await executeSubscription(row, false)
}

async function runSubscription(row) {
  await executeSubscription(row, true)
}

async function executeSubscription(row, syncChapters) {
  if (!row?.id) return
  previewVisible.value = true
  previewLoading.value = true
  previewResult.value = null
  try {
    previewResult.value = await runNovelSyncNow({
      subscriptionId: row.id,
      syncChapters,
      maxChapters: row.maxChapters,
      requestDelayMs: row.requestDelayMs,
    })
    ElMessage.success(syncChapters ? '同步任务已执行' : '解析预览已完成')
    await loadSubscriptions(query.pageNo)
    if (selectedDetail.value?.id === row.id) {
      selectedDetail.value = await fetchNovelSyncDetail(row.id)
    }
  } catch (error) {
    ElMessage.error(error.message || '执行小说同步失败')
  } finally {
    previewLoading.value = false
  }
}

async function handleRowAction(row, action) {
  if (action.label === '预览') {
    await previewSubscription(row)
    return
  }
  if (action.label === '同步') {
    await runSubscription(row)
    return
  }
  if (action.label === '任务') {
    router.push('/automation/tasks')
    return
  }
  if (action.label === '编辑') {
    await openEdit(row)
    return
  }
  if (action.label === '删除') {
    await confirmDelete(row)
  }
}

async function confirmDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除《${row.name}》的小说同步订阅吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteNovelSyncSubscription(row.id)
    ElMessage.success('小说同步订阅已删除')
    await loadSubscriptions(rows.value.length === 1 && query.pageNo > 1 ? query.pageNo - 1 : query.pageNo)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除小说同步订阅失败')
  }
}

onMounted(async () => {
  await Promise.all([searchNovels(), loadChannelOptions(), loadSubscriptions()])
})
</script>

<style scoped>
.novel-sync-stack {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.novel-sync-stack :deep(.resource-metrics) {
  margin-top: 0;
}

.novel-cell,
.url-cell,
.status-stack {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.novel-cell strong,
.url-cell strong {
  color: #102557;
  font-weight: 800;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.novel-cell span,
.url-cell span,
.status-stack span {
  color: #617098;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-form {
  display: grid;
  gap: 20px;
}

.form-section {
  display: grid;
  gap: 14px;
}

.form-section + .form-section {
  border-top: 1px solid var(--admin-row-border);
  padding-top: 18px;
}

.form-section h2 {
  color: #102557;
  font-size: var(--admin-text-section);
  margin: 0;
}

.form-grid {
  display: grid;
  gap: 16px 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid .is-wide {
  grid-column: 1 / -1;
}

.form-control {
  width: 100%;
}

.sync-form :deep(.el-input__wrapper),
.sync-form :deep(.el-select__wrapper),
.sync-form :deep(.el-textarea__inner),
.sync-form :deep(.el-input-number) {
  border-radius: var(--admin-radius-control);
}

.detail-panel {
  min-height: 260px;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.preview-panel {
  min-height: 280px;
}

.preview-header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.preview-header h2 {
  color: #102557;
  font-size: 20px;
  margin: 0 0 6px;
}

.preview-header p {
  color: #617098;
  margin: 0;
}

.preview-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.preview-stats span {
  background: #f1f5ff;
  border: 1px solid #dbe7ff;
  border-radius: 6px;
  color: #314a80;
  font-weight: 700;
  padding: 7px 10px;
}

.sample-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.sample-grid article {
  background: #f8fbff;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  min-width: 0;
  padding: 12px;
}

.sample-grid article.is-wide {
  grid-column: 1 / -1;
}

.sample-grid h3 {
  color: #102557;
  font-size: 14px;
  margin: 0 0 10px;
}

.sample-grid p {
  color: #40558b;
  margin: 0 0 6px;
  overflow-wrap: anywhere;
}

.sample-grid pre {
  color: #1f376b;
  font-family: inherit;
  line-height: 1.65;
  margin: 0;
  max-height: 220px;
  overflow: auto;
  white-space: pre-wrap;
}

@media (max-width: 860px) {
  .form-grid,
  .sample-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handlePageAction"
  >
    <div class="automation-stack">
      <ResourceMetricGrid :items="metrics" />
      <AdminFilterBar
        :filters="filters"
        :search="searchConfig"
        show-search
        @filter-change="handleFilterChange"
        @reset="resetFilters"
        @search="loadRules(1)"
        @search-input="handleSearchInput"
      />

      <AdminTableCard
        v-loading="loading"
        :columns="columns"
        :current-page="query.pageNo"
        :page-size="query.pageSize"
        :rows="rows"
        min-width="1120px"
        row-clickable
        :total="total"
        @page-change="loadRules"
        @page-size-change="handlePageSizeChange"
        @row-click="openRuleDetail"
      >
        <template #name="{ row }">
          <div class="rule-name">
            <span><el-icon><DataAnalysis /></el-icon></span>
            <div>
              <strong :title="row.name">{{ row.name }}</strong>
              <small :title="row.desc">{{ row.desc }}</small>
            </div>
          </div>
        </template>
        <template #content="{ row }">
          <div class="tag-list">
            <AdminStatusBadge v-for="item in row.content" :key="item" :label="item" tone="cyan" />
          </div>
        </template>
        <template #entry="{ row }">
          <div class="entry-url">
            <strong :title="row.entryUrl">{{ row.entryUrl }}</strong>
            <small :title="row.entryLabel">{{ row.entryLabel }}</small>
          </div>
        </template>
        <template #rate="{ row }">
          <AdminTooltip :content="templateBindingTip(row)">
            <span class="binding-badge-trigger" tabindex="0">
              <AdminStatusBadge :label="row.rate" :tone="row.channelCode === '--' ? 'slate' : 'green'" />
            </span>
          </AdminTooltip>
        </template>
        <template #enabled="{ row }">
          <span @click.stop>
            <el-switch
              :loading="statusLoadingId === row.id"
              :disabled="!authStore.hasPermission('sxbook:scrapeRule:status')"
              :model-value="row.enabled"
              @change="(value) => toggleRuleStatus(row, value)"
            />
          </span>
        </template>
        <template #priority="{ row }">
          <AdminTooltip :content="SCRAPE_RULE_PRIORITY_HELP">
            <span class="priority" :class="`is-${priorityTone(row.priorityLabel)}`" tabindex="0">
              {{ row.priorityLabel }} · {{ row.priority }}
            </span>
          </AdminTooltip>
        </template>
        <template #actions="{ row }">
          <div class="rule-actions">
            <el-button v-if="authStore.hasPermission('sxbook:scrapeRule:debug')" size="small" type="primary" plain :icon="DataAnalysis" @click.stop="openRuleBatchSync(row, 'single')">单页发现</el-button>
            <el-button v-if="authStore.hasPermission('sxbook:scrapeRule:debug')" size="small" type="success" :icon="Refresh" @click.stop="openRuleBatchSync(row, 'site')">整站发现</el-button>
            <AdminActionIcons :actions="ruleActions" @action="(action) => handleRowAction(row, action)" />
          </div>
        </template>
      </AdminTableCard>

      <AdminInfoBox title="站点适配说明" :icon="InfoFilled" :items="page.notes" />
    </div>

    <el-drawer v-model="detailVisible" class="rule-detail-drawer" size="min(720px, 100vw)" destroy-on-close>
      <template #header>
        <div class="detail-drawer-heading">
          <span class="detail-drawer-heading__icon"><DataAnalysis /></span>
          <div>
            <strong>站点适配详情</strong>
            <small>查看站点访问配置与字段解析规则</small>
          </div>
        </div>
      </template>
      <div v-loading="detailLoading" class="detail-panel">
        <template v-if="selectedRule">
          <section class="detail-overview">
            <div class="detail-overview__heading">
              <div>
                <span>站点适配</span>
                <h2>{{ selectedRule.ruleName || '--' }}</h2>
              </div>
              <AdminStatusBadge
                :label="selectedRule.status === 1 ? '已启用' : '已禁用'"
                :tone="selectedRule.status === 1 ? 'green' : 'slate'"
                dot
              />
            </div>
            <dl class="detail-facts">
              <div>
                <dt>内容类型</dt>
                <dd>{{ bizLabel(selectedRule.bizType) }}</dd>
              </div>
              <div>
                <dt>目标站点</dt>
                <dd>{{ selectedRule.siteName || '--' }}</dd>
              </div>
              <div>
                <dt>请求方法</dt>
                <dd>{{ selectedRule.requestMethod || '--' }}</dd>
              </div>
              <div>
                <AdminTooltip :content="SCRAPE_RULE_PRIORITY_HELP">
                  <dt class="detail-help-label" tabindex="0">
                    优先级
                    <el-icon><QuestionFilled /></el-icon>
                  </dt>
                </AdminTooltip>
                <dd>{{ selectedRule.priority ?? '--' }}</dd>
              </div>
              <div class="is-wide">
                <dt>连接模板编码</dt>
                <dd>{{ selectedRule.channelCode || '未绑定连接模板' }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-section">
            <header class="detail-section__heading">
              <span><el-icon><Link /></el-icon></span>
              <div>
                <h3>访问地址</h3>
                <p>该适配访问、发现和调试内容时使用的地址</p>
              </div>
            </header>
            <dl class="address-list">
              <div>
                <dt>站点根地址</dt>
                <dd><code>{{ selectedRule.baseUrl || '--' }}</code></dd>
              </div>
              <div>
                <dt>列表地址</dt>
                <dd><code>{{ selectedRule.listUrl || '--' }}</code></dd>
              </div>
              <div>
                <dt>调试地址</dt>
                <dd><code>{{ selectedRule.debugUrl || '--' }}</code></dd>
              </div>
            </dl>
          </section>

          <section class="detail-section">
            <header class="detail-section__heading">
              <span><el-icon><Connection /></el-icon></span>
              <div>
                <h3>正文接口</h3>
                <p>按顺序尝试已启用的接口；未配置时使用普通 HTML 解析</p>
              </div>
            </header>
            <div v-if="selectedRule.apiEndpoints?.length" class="endpoint-summary">
              <article v-for="(endpoint, index) in selectedRule.apiEndpoints" :key="`${endpoint.url}-${index}`">
                <span class="endpoint-summary__index">{{ index + 1 }}</span>
                <div>
                  <strong>{{ endpoint.name || `接口 ${index + 1}` }}</strong>
                  <code>{{ endpoint.url || '--' }}</code>
                </div>
                <AdminStatusBadge :label="endpoint.enabled ? '启用' : '停用'" :tone="endpoint.enabled ? 'green' : 'slate'" />
              </article>
            </div>
            <div v-else class="detail-empty-line">普通 HTML 解析，无独立正文接口</div>
          </section>

          <section class="detail-section selector-grid">
            <header class="detail-section__heading">
              <span><el-icon><SetUp /></el-icon></span>
              <div>
                <h3>选择器配置</h3>
                <p>用于从目标页面定位书名、作者、章节和正文等字段</p>
              </div>
            </header>
            <dl>
              <div v-for="item in selectorFields" :key="item.key">
                <dt>{{ item.label }}</dt>
                <dd><code>{{ selectedRule[item.key] || '--' }}</code></dd>
              </div>
            </dl>
          </section>

          <section v-if="selectedRule.remark" class="detail-section detail-remark">
            <header class="detail-section__heading">
              <span><el-icon><Document /></el-icon></span>
              <div><h3>备注</h3></div>
            </header>
            <p>{{ selectedRule.remark }}</p>
          </section>

          <section class="detail-actions">
            <el-button v-if="authStore.hasPermission('sxbook:scrapeRule:debug')" type="primary" :icon="DataAnalysis" @click="debugSelectedRule">调试适配</el-button>
            <el-button v-if="authStore.hasPermission('sxbook:scrapeRule:debug')" :icon="DataAnalysis" @click="openRuleBatchSync(selectedRule, 'single')">单页发现</el-button>
            <el-button v-if="authStore.hasPermission('sxbook:scrapeRule:debug')" type="success" :icon="Refresh" @click="openRuleBatchSync(selectedRule, 'site')">整站发现</el-button>
            <el-button v-if="authStore.hasPermission('sxbook:scrapeRule:edit')" :icon="EditPen" @click="editRule(selectedRule)">编辑</el-button>
          </section>
        </template>
        <el-empty v-else description="暂无规则详情" />
      </div>
    </el-drawer>

    <el-dialog v-model="debugVisible" title="规则调试结果" width="720px" destroy-on-close>
      <div v-loading="debugLoading" class="debug-result">
        <template v-if="debugResult">
          <div class="debug-result__header" :class="{ 'is-pass': debugResult.passed, 'is-fail': !debugResult.passed }">
            <AdminStatusBadge :label="debugResult.passed ? '调试通过' : '调试未通过'" :tone="debugResult.passed ? 'green' : 'red'" dot />
            <span>{{ debugResult.requestUrl || '--' }}</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="HTTP 状态">{{ debugResult.httpStatus ?? '--' }}</el-descriptions-item>
            <el-descriptions-item label="响应长度">{{ debugResult.responseLength ?? '--' }}</el-descriptions-item>
            <el-descriptions-item label="页面标题">{{ debugResult.documentTitle || '--' }}</el-descriptions-item>
            <el-descriptions-item label="列表命中">{{ debugResult.listMatchCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="章节命中">{{ debugResult.chapterMatchCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="错误信息">{{ debugResult.errorMessage || '--' }}</el-descriptions-item>
          </el-descriptions>
          <section class="sample-grid">
            <article v-for="item in debugSamples" :key="item.label">
              <span>{{ item.label }}</span>
              <p>{{ item.value }}</p>
            </article>
          </section>
        </template>
        <el-empty v-else description="暂无调试结果" />
      </div>
    </el-dialog>

    <el-dialog v-model="batchVisible" :title="batchDialogTitle" width="min(920px, calc(100vw - 32px))" destroy-on-close>
      <div class="batch-sync">
        <section class="batch-sync__summary">
          <div>
            <span>站点适配</span>
            <strong>{{ batchRule?.ruleName || batchRule?.name || '--' }}</strong>
          </div>
          <div>
            <span>列表地址</span>
            <strong>{{ batchRuleListUrl || '--' }}</strong>
          </div>
          <div>
            <span>详情链接</span>
            <strong>{{ batchRuleDetailSelector || '自动识别列表项链接' }}</strong>
          </div>
        </section>

        <section class="batch-sync__form">
          <div class="batch-sync__mode">
            <span>发现范围</span>
            <el-segmented v-model="batchForm.scope" :options="batchScopeOptions" @change="handleBatchScopeChange" />
          </div>
          <el-form label-position="top">
            <el-form-item label="入口地址">
              <el-input
                v-model="batchForm.entryUrlsText"
                type="textarea"
                :rows="batchForm.scope === 'site' ? 3 : 1"
                placeholder="每行一个分类/排行/列表页地址；留空时使用站点适配的列表地址"
              />
            </el-form-item>
            <div class="batch-sync__form-grid">
              <el-form-item label="详情链接选择器">
                <el-input v-model="batchForm.detailUrlSelector" placeholder="可选，例如 a::attr(href)" />
              </el-form-item>
              <el-form-item label="请求间隔毫秒">
                <el-input-number v-model="batchForm.requestDelayMs" class="batch-sync__number" :min="0" :step="500" />
              </el-form-item>
              <el-form-item v-if="batchForm.scope === 'site'" label="分页 URL 模板">
                <el-input v-model="batchForm.paginationUrlTemplate" placeholder="可选，例如 /list/{page}.html" />
              </el-form-item>
              <el-form-item v-if="batchForm.scope === 'site'" label="下一页选择器">
                <el-input v-model="batchForm.nextPageSelector" placeholder="可选，例如 .next a::attr(href)" />
              </el-form-item>
              <el-form-item v-if="batchForm.scope === 'site'" label="起始页码">
                <el-input-number v-model="batchForm.startPage" class="batch-sync__number" :min="1" />
              </el-form-item>
              <el-form-item v-if="batchForm.scope === 'site'" label="最大页数（0=不限）">
                <el-input-number v-model="batchForm.maxPages" class="batch-sync__number" :min="0" />
              </el-form-item>
              <el-form-item label="最大候选数（0=不限）">
                <el-input-number v-model="batchForm.maxItems" class="batch-sync__number" :min="0" />
              </el-form-item>
              <el-form-item label="同步章节">
                <el-switch v-model="batchForm.syncChapters" active-text="同步" inactive-text="只建书" />
              </el-form-item>
              <el-form-item label="小说存储位置">
                <el-select
                  v-model="batchForm.storageLocationId"
                  filterable
                  :loading="storageLocationsLoading"
                  placeholder="从存储管理中选择"
                >
                  <el-option
                    v-for="location in novelStorageLocations"
                    :key="location.id"
                    :label="formatStorageLocationLabel(location)"
                    :value="location.id"
                  />
                </el-select>
              </el-form-item>
            </div>
            <el-checkbox v-model="batchForm.sameHostOnly">仅保留同站详情链接</el-checkbox>
          </el-form>
        </section>

        <div class="batch-sync__toolbar">
          <div>
            <strong>{{ batchStatusText }}</strong>
            <span v-if="batchResult?.requestUrl">{{ batchResult.requestUrl }}</span>
          </div>
          <div class="batch-sync__toolbar-actions">
            <el-button :loading="batchLoading" :icon="DataAnalysis" @click="discoverBatchCandidates">{{ batchDiscoverButtonText }}</el-button>
            <el-button
              v-if="authStore.hasPermission('sxbook:subscription:execute')"
              type="primary"
              :loading="batchSubmitting"
              :disabled="!batchCandidates.length || !batchForm.storageLocationId"
              :icon="Refresh"
              @click="submitBatchSync"
            >
              提交同步
            </el-button>
          </div>
        </div>

        <el-alert
          v-if="batchResult?.errorMessage"
          :title="batchResult.errorMessage"
          type="warning"
          show-icon
          :closable="false"
        />

        <el-table v-loading="batchLoading" :data="batchCandidates" class="batch-sync__table" height="360">
          <el-table-column label="书名" min-width="180">
            <template #default="{ row }">
              <div class="candidate-title">
                <strong>{{ row.title }}</strong>
                <small>{{ row.author }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="latestChapterTitle" label="最新章节" min-width="160" show-overflow-tooltip />
          <el-table-column prop="detailUrl" label="详情地址" min-width="260" show-overflow-tooltip />
          <el-table-column prop="coverUrl" label="封面" width="90">
            <template #default="{ row }">
              <el-image v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="candidate-cover" />
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Connection, DataAnalysis, Delete, Document, EditPen, InfoFilled, Link, QuestionFilled, Refresh, SetUp, View } from '@element-plus/icons-vue'
import { AdminActionIcons, AdminFilterBar, AdminInfoBox, AdminStatusBadge, AdminTableCard, AdminTooltip } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchEligibleStorageLocations } from '../../api/resourceManagement'
import { SCRAPE_RULE_PRIORITY_HELP } from '../../config/adminHelpText'
import { automationPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'
import {
  STATUS_OPTIONS,
  batchSyncScrapeRuleNovels,
  changeScrapeRuleStatus,
  debugScrapeRule,
  deleteScrapeRule,
  discoverScrapeRuleNovels,
  fetchScrapeRuleDetail,
  fetchScrapeRulesPage,
  normalizeBizType,
  statusValue,
} from '../../api/automation'

const router = useRouter()
const authStore = useAuthStore()
const page = {
  ...automationPages.rules,
}
const columns = [
  { key: 'name', label: '站点适配' },
  { key: 'content', label: '内容类型' },
  { key: 'source', label: '目标站点' },
  { key: 'entry', label: '入口地址' },
  { key: 'rate', label: '模板绑定' },
  { key: 'enabled', label: '状态' },
  { key: 'priority', label: '优先级', help: SCRAPE_RULE_PRIORITY_HELP },
  { key: 'lastRun', label: '更新时间' },
  { key: 'actions', label: '操作' },
]
const selectorFields = [
  { key: 'listSelector', label: '列表选择器' },
  { key: 'titleSelector', label: '标题选择器' },
  { key: 'authorSelector', label: '作者选择器' },
  { key: 'introSelector', label: '简介选择器' },
  { key: 'coverSelector', label: '封面选择器' },
  { key: 'chapterSelector', label: '章节列表选择器' },
  { key: 'chapterTitleSelector', label: '章节标题选择器' },
  { key: 'chapterUrlSelector', label: '章节链接选择器' },
  { key: 'contentSelector', label: '正文选择器' },
]
const ruleActions = [
  { label: '查看', tooltip: '查看站点适配详情', icon: View, boxed: true },
  { label: '调试', tooltip: '使用调试地址测试当前适配', icon: DataAnalysis, permission: 'sxbook:scrapeRule:debug' },
  { label: '编辑', tooltip: '编辑站点适配', icon: EditPen, permission: 'sxbook:scrapeRule:edit' },
  { label: '删除', tooltip: '删除站点适配', icon: Delete, danger: true, permission: 'sxbook:scrapeRule:delete' },
]

const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const debugLoading = ref(false)
const debugVisible = ref(false)
const batchLoading = ref(false)
const batchSubmitting = ref(false)
const batchVisible = ref(false)
const statusLoadingId = ref('')
const rows = ref([])
const metrics = ref([])
const total = ref(0)
const selectedRule = ref(null)
const debugResult = ref(null)
const batchRule = ref(null)
const batchResult = ref(null)
const batchCandidates = ref([])
const novelStorageLocations = ref([])
const storageLocationsLoading = ref(false)
const batchForm = reactive(defaultBatchForm())
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  ruleName: '',
  bizType: 'novel',
  status: undefined,
})
const batchScopeOptions = [
  { label: '单页发现', value: 'single' },
  { label: '整站发现', value: 'site' },
]

const searchConfig = computed(() => ({
  placeholder: '搜索站点适配名称',
  value: query.ruleName,
}))
const filters = computed(() => [
  {
    label: '全部状态',
    value: STATUS_OPTIONS.find((item) => item.value === query.status)?.label || '全部状态',
    options: ['全部状态', ...STATUS_OPTIONS.map((item) => item.label)],
  },
])
const debugSamples = computed(() => {
  const result = debugResult.value || {}
  return [
    { label: '标题示例', value: result.titleSample || '--' },
    { label: '作者示例', value: result.authorSample || '--' },
    { label: '简介示例', value: result.introSample || '--' },
    { label: '封面示例', value: result.coverSample || '--' },
    { label: '正文示例', value: result.contentSample || '--' },
    { label: '章节标题', value: (result.chapterTitleSamples || []).join(' / ') || '--' },
    { label: '章节链接', value: (result.chapterUrlSamples || []).join(' / ') || '--' },
  ]
})
const batchRuleListUrl = computed(() => {
  const rule = batchRule.value || {}
  return rule.listUrl || rule.debugUrl || rule.baseUrl || rule.raw?.listUrl || rule.raw?.debugUrl || rule.raw?.baseUrl || ''
})
const batchRuleDetailSelector = computed(() => {
  const rule = batchRule.value || {}
  return rule.detailUrlSelector || rule.chapterUrlSelector || rule.raw?.detailUrlSelector || rule.raw?.chapterUrlSelector || ''
})
const batchDialogTitle = computed(() => (batchForm.scope === 'site' ? '整站发现并同步小说' : '单页发现并同步小说'))
const batchStatusText = computed(() => {
  if (batchLoading.value) return batchForm.scope === 'site' ? '正在整站发现书籍' : '正在按规则发现小说'
  if (!batchResult.value) return '等待发现候选小说'
  const pages = batchResult.value.scannedPageCount ? `，扫描 ${batchResult.value.scannedPageCount} 页` : ''
  return `已发现 ${batchCandidates.value.length} 本${pages}`
})
const batchDiscoverButtonText = computed(() => {
  if (batchLoading.value) return batchForm.scope === 'site' ? '整站发现中' : '发现中'
  if (!batchResult.value) return batchForm.scope === 'site' ? '开始整站发现' : '开始单页发现'
  return batchForm.scope === 'site' ? '重新整站发现' : '重新单页发现'
})

function defaultBatchForm() {
  return {
    scope: 'single',
    entryUrlsText: '',
    detailUrlSelector: '',
    paginationUrlTemplate: '',
    nextPageSelector: '',
    startPage: 1,
    maxPages: 0,
    maxItems: 0,
    requestDelayMs: 1000,
    sameHostOnly: true,
    syncChapters: true,
    storageLocationId: '',
  }
}

function priorityTone(priority) {
  if (priority === '高') return 'red'
  if (priority === '中') return 'orange'
  return 'green'
}

function bizLabel(value) {
  return normalizeBizType(value)
}

function templateBindingTip(row) {
  if (row.channelCode && row.channelCode !== '--') {
    return `已关联连接模板「${row.channelCode}」，采集时可复用该模板的公共连接配置。站点规则和正文接口组仍由当前站点适配维护。`
  }
  return '未关联连接模板，采集时直接使用当前站点适配中填写的请求地址、请求头和正文接口组。'
}

function handlePageAction(action) {
  if (action.label === '添加站点适配') router.push('/automation/rules/new')
  if (action.label === '连接模板') router.push('/automation/channels')
}

function handleSearchInput(value) {
  query.ruleName = value
}

function handleFilterChange(filter) {
  if (filter.label === '全部状态') {
    query.status = filter.value === '全部状态' ? undefined : statusValue(filter.value)
  }
  loadRules(1)
}

function resetFilters() {
  query.ruleName = ''
  query.bizType = 'novel'
  query.status = undefined
  loadRules(1)
}

function handlePageSizeChange(size) {
  query.pageSize = size
  loadRules(1)
}

async function loadRules(pageNo = query.pageNo) {
  query.pageNo = pageNo
  loading.value = true
  try {
    const data = await fetchScrapeRulesPage(query)
    rows.value = data.rows
    metrics.value = data.metrics
    total.value = data.total
    query.pageNo = data.current || query.pageNo
    query.pageSize = data.pageSize || query.pageSize
  } catch (error) {
    rows.value = []
    metrics.value = []
    total.value = 0
    ElMessage.error(error.message || '获取站点适配失败')
  } finally {
    loading.value = false
  }
}

async function openRuleDetail(row) {
  if (!row?.id) return
  detailVisible.value = true
  detailLoading.value = true
  selectedRule.value = null
  try {
    selectedRule.value = await fetchScrapeRuleDetail(row.id)
  } catch (error) {
    ElMessage.error(error.message || '获取站点适配详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function toggleRuleStatus(row, enabled) {
  statusLoadingId.value = row.id
  try {
    await changeScrapeRuleStatus({ id: row.id, status: enabled ? 1 : 0 })
    ElMessage.success(enabled ? '站点适配已启用' : '站点适配已禁用')
    await loadRules(query.pageNo)
  } catch (error) {
    ElMessage.error(error.message || '切换站点适配状态失败')
  } finally {
    statusLoadingId.value = ''
  }
}

function editRule(row) {
  router.push({ path: '/automation/rules/new', query: { id: row.id } })
}

async function handleRowAction(row, action) {
  if (action.label === '查看') {
    await openRuleDetail(row)
    return
  }
  if (action.label === '调试') {
    await runRuleDebug(row.id)
    return
  }
  if (action.label === '编辑') {
    editRule(row)
    return
  }
  if (action.label === '删除') {
    await confirmDeleteRule(row)
  }
}

async function debugSelectedRule() {
  if (selectedRule.value?.id) await runRuleDebug(selectedRule.value.id)
}

async function runRuleDebug(ruleId) {
  debugVisible.value = true
  debugLoading.value = true
  debugResult.value = null
  try {
    debugResult.value = await debugScrapeRule({ ruleId, sampleLimit: 5 })
  } catch (error) {
    ElMessage.error(error.message || '调试站点适配失败')
  } finally {
    debugLoading.value = false
  }
}

async function openRuleBatchSync(row, scope = 'single') {
  if (!row?.id) return
  batchVisible.value = true
  batchLoading.value = false
  batchSubmitting.value = false
  batchResult.value = null
  batchCandidates.value = []
  batchRule.value = null
  Object.assign(batchForm, defaultBatchForm())
  batchForm.scope = scope === 'site' ? 'site' : 'single'
  try {
    await loadNovelStorageLocations()
    batchRule.value = row.ruleName ? row : await fetchScrapeRuleDetail(row.id)
    batchForm.entryUrlsText = batchRuleListUrl.value
    batchForm.detailUrlSelector = batchRuleDetailSelector.value
    if (batchForm.scope !== 'site') {
      await discoverBatchCandidates()
    }
  } catch (error) {
    ElMessage.error(error.message || '获取站点适配详情失败')
  }
}

function handleBatchScopeChange() {
  batchResult.value = null
  batchCandidates.value = []
}

async function discoverBatchCandidates() {
  const ruleId = batchRule.value?.id
  if (!ruleId) {
    ElMessage.warning('请先选择站点适配')
    return
  }
  batchLoading.value = true
  batchResult.value = null
  batchCandidates.value = []
  try {
    const result = await discoverScrapeRuleNovels(buildBatchPayload(ruleId))
    batchResult.value = result
    batchCandidates.value = result.candidates
    if (result.candidates.length) {
      ElMessage.success(`发现 ${result.candidates.length} 本候选小说`)
    } else {
      ElMessage.warning(result.errorMessage || '没有发现候选小说')
    }
  } catch (error) {
    ElMessage.error(error.message || '按规则发现小说失败')
  } finally {
    batchLoading.value = false
  }
}

async function submitBatchSync() {
  const ruleId = batchRule.value?.id
  if (!ruleId || !batchCandidates.value.length) return
  if (!batchForm.storageLocationId) {
    ElMessage.warning('请选择存储管理中的小说存储位置')
    return
  }
  batchSubmitting.value = true
  try {
    const result = await batchSyncScrapeRuleNovels({
      ...buildBatchPayload(ruleId),
      detailUrls: batchCandidates.value.map((item) => item.detailUrl),
    })
    ElMessage.success(`批量同步任务已提交：${result.taskId || '--'}`)
    batchVisible.value = false
  } catch (error) {
    ElMessage.error(error.message || '提交批量同步失败')
  } finally {
    batchSubmitting.value = false
  }
}

function buildBatchPayload(ruleId) {
  const entryUrls = normalizeEntryUrls(batchForm.entryUrlsText)
  return {
    ruleId,
    entryUrls,
    listUrl: entryUrls[0] || batchRuleListUrl.value,
    detailUrlSelector: batchForm.detailUrlSelector || batchRuleDetailSelector.value,
    paginationUrlTemplate: batchForm.scope === 'site' ? batchForm.paginationUrlTemplate : '',
    nextPageSelector: batchForm.scope === 'site' ? batchForm.nextPageSelector : '',
    startPage: batchForm.scope === 'site' ? batchForm.startPage : undefined,
    maxPages: batchForm.scope === 'site' ? optionalPositive(batchForm.maxPages) : undefined,
    maxItems: optionalPositive(batchForm.maxItems),
    sameHostOnly: batchForm.sameHostOnly,
    requestDelayMs: optionalPositive(batchForm.requestDelayMs) ?? 0,
    syncChapters: batchForm.syncChapters,
    storageLocationId: batchForm.storageLocationId,
  }
}

function formatStorageLocationLabel(location = {}) {
  const path = location.path || location.raw?.localBasePath || location.raw?.bucketName || ''
  return path ? `${location.name} - ${path}` : location.name
}

async function loadNovelStorageLocations() {
  storageLocationsLoading.value = true
  try {
    novelStorageLocations.value = await fetchEligibleStorageLocations({ bizType: 'novel', writableOnly: true })
    const preferred = novelStorageLocations.value.find((item) => Number(item.raw?.defaultNovel || 0) === 1)
      || novelStorageLocations.value[0]
    if (preferred) batchForm.storageLocationId = preferred.id
  } catch (error) {
    novelStorageLocations.value = []
    ElMessage.error(error.message || '获取小说存储位置失败')
  } finally {
    storageLocationsLoading.value = false
  }
}

function normalizeEntryUrls(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function optionalPositive(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

async function confirmDeleteRule(row) {
  try {
    await ElMessageBox.confirm(`确认删除站点适配「${row.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteScrapeRule(row.id)
    ElMessage.success('站点适配已删除')
    await loadRules(rows.value.length === 1 && query.pageNo > 1 ? query.pageNo - 1 : query.pageNo)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除站点适配失败')
  }
}

onMounted(() => loadRules())
</script>

<style scoped>
.automation-stack {
  display: grid;
  gap: 22px;
  margin-top: 22px;
}

.automation-stack :deep(.resource-metrics) {
  margin-top: 0;
}

.rule-name {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.rule-name > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: var(--admin-primary);
}

.rule-name strong,
.rule-name small {
  display: block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rule-name strong {
  color: #102557;
  font-size: 14px;
  font-weight: 800;
}

.rule-name small {
  margin-top: 3px;
  color: #617098;
}

.tag-list {
  display: flex;
  gap: 5px;
}

.entry-url {
  display: grid;
  gap: 3px;
  max-width: 280px;
}

.entry-url strong,
.entry-url small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-url strong {
  color: #102557;
  font-size: 13px;
}

.entry-url small {
  color: #617098;
  font-size: 12px;
}

.rule-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.priority {
  display: inline-flex;
  border-radius: 4px;
  cursor: help;
  font-weight: 800;
}

.priority:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--admin-primary) 45%, transparent);
  outline-offset: 3px;
}

.priority.is-red { color: var(--admin-danger); }
.priority.is-orange { color: var(--admin-warning); }
.priority.is-green { color: var(--admin-success); }

.binding-badge-trigger {
  display: inline-flex;
  border-radius: 4px;
  cursor: help;
}

.binding-badge-trigger:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--admin-primary) 55%, transparent);
  outline-offset: 3px;
}

.detail-panel {
  display: grid;
  gap: 16px;
  min-height: 260px;
  padding-bottom: 76px;
}

.detail-drawer-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-drawer-heading__icon,
.detail-section__heading > span {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #eaf2ff;
  color: var(--admin-primary);
  font-size: 18px;
}

.detail-drawer-heading strong,
.detail-drawer-heading small {
  display: block;
}

.detail-drawer-heading strong {
  color: #102557;
  font-size: 17px;
  line-height: 1.35;
}

.detail-drawer-heading small {
  margin-top: 3px;
  color: #7180a3;
  font-size: 12px;
  line-height: 1.4;
}

.detail-overview {
  padding: 18px;
  border: 1px solid #dbe7fb;
  border-radius: 8px;
  background: #f7faff;
}

.detail-overview__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e1e9f7;
}

.detail-overview__heading span {
  display: block;
  color: #7180a3;
  font-size: 12px;
}

.detail-overview__heading h2 {
  margin: 5px 0 0;
  overflow-wrap: anywhere;
  color: #102557;
  font-size: 20px;
  line-height: 1.4;
}

.detail-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 20px;
  margin: 16px 0 0;
}

.detail-facts > div {
  min-width: 0;
}

.detail-facts > .is-wide {
  grid-column: span 2;
}

.detail-facts dt,
.detail-facts dd {
  margin: 0;
}

.detail-facts dt {
  color: #7180a3;
  font-size: 12px;
  line-height: 1.4;
}

.detail-facts dd {
  margin-top: 5px;
  overflow-wrap: anywhere;
  color: #183366;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.detail-help-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  cursor: help;
}

.detail-help-label .el-icon {
  font-size: 13px;
}

.detail-help-label:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--admin-primary) 50%, transparent);
  outline-offset: 3px;
}

.detail-section {
  padding: 18px;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  background: #ffffff;
}

.detail-section__heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-section__heading > span {
  width: 34px;
  height: 34px;
  background: #f0f5ff;
  font-size: 16px;
}

.detail-section__heading h3,
.detail-section__heading p {
  margin: 0;
}

.detail-section__heading h3 {
  color: #102557;
  font-size: 15px;
  line-height: 1.4;
}

.detail-section__heading p {
  margin-top: 3px;
  color: #7180a3;
  font-size: 12px;
  line-height: 1.5;
}

.address-list {
  display: grid;
  gap: 0;
  margin: 0;
}

.address-list > div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  padding: 12px 0;
  border-top: 1px solid #edf1f7;
}

.address-list > div:first-child {
  padding-top: 0;
  border-top: 0;
}

.address-list > div:last-child {
  padding-bottom: 0;
}

.address-list dt,
.address-list dd {
  min-width: 0;
  margin: 0;
}

.address-list dt {
  color: #7180a3;
  font-size: 13px;
  line-height: 1.6;
}

.address-list code,
.selector-grid code,
.endpoint-summary code {
  color: #294a80;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.endpoint-summary {
  display: grid;
  gap: 10px;
}

.endpoint-summary > article {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e1e9f7;
  border-radius: 8px;
  background: #f8fbff;
}

.endpoint-summary__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #e5efff;
  color: var(--admin-primary);
  font-size: 12px;
  font-weight: 800;
}

.endpoint-summary strong,
.endpoint-summary code {
  display: block;
  min-width: 0;
}

.endpoint-summary strong {
  margin-bottom: 3px;
  color: #183366;
  font-size: 13px;
  line-height: 1.5;
}

.detail-empty-line {
  padding: 14px;
  border: 1px dashed #d5dfef;
  border-radius: 8px;
  background: #fafcff;
  color: #617098;
  font-size: 13px;
  text-align: center;
}

.selector-grid dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin: 0;
}

.selector-grid dl > div {
  min-width: 0;
  padding: 12px;
  border: 1px solid #e8edf5;
  border-radius: 8px;
  background: #fafcff;
}

.selector-grid dt {
  margin-bottom: 6px;
  color: #6b7da8;
  font-size: 12px;
}

.selector-grid dd {
  min-width: 0;
  margin: 0;
}

.detail-remark p {
  margin: 0;
  overflow-wrap: anywhere;
  color: #314a80;
  font-size: 13px;
  line-height: 1.7;
}

.detail-actions {
  position: sticky;
  z-index: 2;
  bottom: -20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 4px -20px -20px;
  padding: 14px 20px;
  border-top: 1px solid #e5eaf2;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 24px rgba(27, 55, 99, 0.06);
  backdrop-filter: blur(10px);
}

.debug-result {
  min-height: 220px;
}

.debug-result__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #314a80;
}

.debug-result__header span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.sample-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.sample-grid article {
  min-height: 76px;
  padding: 12px;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  background: #f8fbff;
}

.sample-grid span {
  display: block;
  margin-bottom: 8px;
  color: #6b7da8;
  font-size: 12px;
}

.sample-grid p {
  margin: 0;
  overflow-wrap: anywhere;
  color: #102557;
  line-height: 1.5;
}

.batch-sync {
  display: grid;
  gap: 16px;
}

.batch-sync__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.batch-sync__summary div {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  background: #f8fbff;
}

.batch-sync__summary span,
.batch-sync__summary strong {
  display: block;
}

.batch-sync__summary span {
  margin-bottom: 6px;
  color: #617098;
  font-size: 12px;
}

.batch-sync__summary strong {
  overflow-wrap: anywhere;
  color: #102557;
  font-size: 13px;
  line-height: 1.45;
}

.batch-sync__form {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  background: #ffffff;
}

.batch-sync__mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.batch-sync__mode span {
  color: #102557;
  font-weight: 800;
}

.batch-sync__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}

.batch-sync__number {
  width: 100%;
}

.batch-sync__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  background: #f8fbff;
}

.batch-sync__toolbar strong,
.batch-sync__toolbar span {
  display: block;
}

.batch-sync__toolbar strong {
  color: #102557;
}

.batch-sync__toolbar span {
  max-width: 460px;
  margin-top: 4px;
  overflow-wrap: anywhere;
  color: #617098;
  font-size: 12px;
}

.batch-sync__toolbar-actions {
  display: inline-flex;
  gap: 10px;
  flex: 0 0 auto;
}

.batch-sync__table {
  width: 100%;
}

.candidate-title strong,
.candidate-title small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.candidate-title strong {
  color: #102557;
}

.candidate-title small {
  margin-top: 3px;
  color: #617098;
}

.candidate-cover {
  width: 44px;
  height: 58px;
  border-radius: 6px;
  background: #eef3fb;
}

@media (max-width: 760px) {
  .detail-panel {
    padding-bottom: 68px;
  }

  .detail-overview,
  .detail-section {
    padding: 14px;
  }

  .detail-facts,
  .selector-grid dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-facts > .is-wide {
    grid-column: 1 / -1;
  }

  .address-list > div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .detail-actions {
    margin-inline: -14px;
    padding-inline: 14px;
  }

  .sample-grid {
    grid-template-columns: 1fr;
  }

  .batch-sync__summary,
  .batch-sync__form-grid,
  .batch-sync__toolbar {
    grid-template-columns: 1fr;
  }

  .batch-sync__toolbar {
    display: grid;
  }

  .batch-sync__toolbar-actions {
    flex-wrap: wrap;
  }
}
</style>

<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :active-tab="0"
    :tabs="tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handlePageAction"
    @tab-change="handleTabChange"
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
              <strong>{{ row.name }}</strong>
              <small>{{ row.desc }}</small>
            </div>
          </div>
        </template>
        <template #content="{ row }">
          <div class="tag-list">
            <AdminStatusBadge v-for="item in row.content" :key="item" :label="item" tone="cyan" />
          </div>
        </template>
        <template #enabled="{ row }">
          <span @click.stop>
            <el-switch
              :loading="statusLoadingId === row.id"
              :model-value="row.enabled"
              @change="(value) => toggleRuleStatus(row, value)"
            />
          </span>
        </template>
        <template #priority="{ row }">
          <span class="priority" :class="`is-${priorityTone(row.priorityLabel)}`">
            {{ row.priorityLabel }} · {{ row.priority }}
          </span>
        </template>
        <template #actions="{ row }">
          <AdminActionIcons :actions="ruleActions" @action="(action) => handleRowAction(row, action)" />
        </template>
      </AdminTableCard>

      <AdminInfoBox title="规则说明" :icon="InfoFilled" :items="page.notes" />
    </div>

    <el-drawer v-model="detailVisible" title="扫描规则详情" size="640px" destroy-on-close>
      <div v-loading="detailLoading" class="detail-panel">
        <template v-if="selectedRule">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="规则名称">{{ selectedRule.ruleName || '--' }}</el-descriptions-item>
            <el-descriptions-item label="内容类型">{{ bizLabel(selectedRule.bizType) }}</el-descriptions-item>
            <el-descriptions-item label="站点名称">{{ selectedRule.siteName || '--' }}</el-descriptions-item>
            <el-descriptions-item label="渠道编码">{{ selectedRule.channelCode || '--' }}</el-descriptions-item>
            <el-descriptions-item label="站点根地址">{{ selectedRule.baseUrl || '--' }}</el-descriptions-item>
            <el-descriptions-item label="列表地址">{{ selectedRule.listUrl || '--' }}</el-descriptions-item>
            <el-descriptions-item label="调试地址">{{ selectedRule.debugUrl || '--' }}</el-descriptions-item>
            <el-descriptions-item label="请求方法">{{ selectedRule.requestMethod || '--' }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ selectedRule.priority }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedRule.status === 1 ? '启用' : '禁用' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ selectedRule.remark || '--' }}</el-descriptions-item>
          </el-descriptions>

          <section class="selector-grid">
            <h3>选择器配置</h3>
            <dl>
              <div v-for="item in selectorFields" :key="item.key">
                <dt>{{ item.label }}</dt>
                <dd>{{ selectedRule[item.key] || '--' }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-actions">
            <el-button type="primary" :icon="DataAnalysis" @click="debugSelectedRule">调试规则</el-button>
            <el-button :icon="EditPen" @click="editRule(selectedRule)">编辑</el-button>
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
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { DataAnalysis, Delete, EditPen, InfoFilled, View } from '@element-plus/icons-vue'
import { AdminActionIcons, AdminFilterBar, AdminInfoBox, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { automationPages } from '../../config/adminModules'
import {
  BIZ_TYPE_OPTIONS,
  STATUS_OPTIONS,
  bizTypeValue,
  changeScrapeRuleStatus,
  debugScrapeRule,
  deleteScrapeRule,
  fetchScrapeRuleDetail,
  fetchScrapeRulesPage,
  normalizeBizType,
  statusValue,
} from '../../api/automation'

const router = useRouter()
const tabs = ['扫描规则', '扫描渠道']
const page = {
  ...automationPages.rules,
  subtitle: '配置和管理内容扫描规则，自动识别并获取内容元数据',
}
const columns = [
  { key: 'name', label: '规则名称' },
  { key: 'type', label: '类型' },
  { key: 'content', label: '内容类型' },
  { key: 'source', label: '目标站点' },
  { key: 'enabled', label: '状态' },
  { key: 'priority', label: '优先级' },
  { key: 'lastRun', label: '更新时间' },
  { key: 'rate', label: '渠道' },
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
  { label: '查看', icon: View, boxed: true },
  { label: '调试', icon: DataAnalysis },
  { label: '编辑', icon: EditPen },
  { label: '删除', icon: Delete, danger: true },
]

const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const debugLoading = ref(false)
const debugVisible = ref(false)
const statusLoadingId = ref('')
const rows = ref([])
const metrics = ref([])
const total = ref(0)
const selectedRule = ref(null)
const debugResult = ref(null)
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  ruleName: '',
  bizType: '',
  status: undefined,
})

const searchConfig = computed(() => ({
  placeholder: '搜索规则名称',
  value: query.ruleName,
}))
const filters = computed(() => [
  {
    label: '全部类型',
    value: BIZ_TYPE_OPTIONS.find((item) => item.value === query.bizType)?.label || '全部类型',
    options: ['全部类型', ...BIZ_TYPE_OPTIONS.map((item) => item.label)],
  },
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

function priorityTone(priority) {
  if (priority === '高') return 'red'
  if (priority === '中') return 'orange'
  return 'green'
}

function bizLabel(value) {
  return normalizeBizType(value)
}

function handlePageAction(action) {
  if (action.label === '添加规则') router.push('/automation/rules/new')
}

function handleTabChange(index) {
  if (index === 1) router.push('/automation/channels')
}

function handleSearchInput(value) {
  query.ruleName = value
}

function handleFilterChange(filter) {
  if (filter.label === '全部类型') {
    query.bizType = filter.value === '全部类型' ? '' : bizTypeValue(filter.value)
  }
  if (filter.label === '全部状态') {
    query.status = filter.value === '全部状态' ? undefined : statusValue(filter.value)
  }
  loadRules(1)
}

function resetFilters() {
  query.ruleName = ''
  query.bizType = ''
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
    ElMessage.error(error.message || '获取扫描规则失败')
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
    ElMessage.error(error.message || '获取扫描规则详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function toggleRuleStatus(row, enabled) {
  statusLoadingId.value = row.id
  try {
    await changeScrapeRuleStatus({ id: row.id, status: enabled ? 1 : 0 })
    ElMessage.success(enabled ? '扫描规则已启用' : '扫描规则已禁用')
    await loadRules(query.pageNo)
  } catch (error) {
    ElMessage.error(error.message || '切换扫描规则状态失败')
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
    ElMessage.error(error.message || '调试扫描规则失败')
  } finally {
    debugLoading.value = false
  }
}

async function confirmDeleteRule(row) {
  try {
    await ElMessageBox.confirm(`确认删除扫描规则「${row.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteScrapeRule(row.id)
    ElMessage.success('扫描规则已删除')
    await loadRules(rows.value.length === 1 && query.pageNo > 1 ? query.pageNo - 1 : query.pageNo)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除扫描规则失败')
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

.priority {
  font-weight: 800;
}

.priority.is-red { color: var(--admin-danger); }
.priority.is-orange { color: var(--admin-warning); }
.priority.is-green { color: var(--admin-success); }

.detail-panel {
  min-height: 260px;
}

.selector-grid {
  margin-top: 18px;
}

.selector-grid h3 {
  margin: 0 0 12px;
  color: #102557;
  font-size: 15px;
}

.selector-grid dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.selector-grid div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
}

.selector-grid dt {
  color: #6b7da8;
}

.selector-grid dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #314a80;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
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

@media (max-width: 760px) {
  .sample-grid {
    grid-template-columns: 1fr;
  }
}
</style>

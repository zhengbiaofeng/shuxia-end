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
        @search="loadChannels(1)"
        @search-input="handleSearchInput"
      />

      <AdminTableCard
        v-loading="loading"
        :columns="columns"
        :current-page="query.pageNo"
        :page-size="query.pageSize"
        :rows="rows"
        min-width="1180px"
        row-clickable
        :total="total"
        @page-change="loadChannels"
        @page-size-change="handlePageSizeChange"
        @row-click="openChannelDetail"
      >
        <template #name="{ row }">
          <div class="channel-name">
            <strong>{{ row.name }}</strong>
            <small>{{ row.code }}</small>
          </div>
        </template>
        <template #status="{ row }">
          <span @click.stop>
            <el-switch
              :loading="statusLoadingId === row.id"
              :model-value="row.enabled"
              @change="(value) => toggleChannelStatus(row, value)"
            />
          </span>
        </template>
        <template #lastTest="{ row }">
          <AdminStatusBadge :label="row.lastTest" :tone="row.lastTestTone" dot />
        </template>
        <template #successRate="{ row }">
          <span class="rate-cell">{{ row.successRate }}</span>
        </template>
        <template #actions="{ row }">
          <AdminActionIcons :actions="channelActions" @action="(action) => handleRowAction(row, action)" />
        </template>
      </AdminTableCard>
    </div>

    <el-drawer v-model="detailVisible" title="扫描渠道详情" size="600px" destroy-on-close>
      <div v-loading="detailLoading" class="detail-panel">
        <template v-if="selectedChannel">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="渠道编码">{{ selectedChannel.channelCode || '--' }}</el-descriptions-item>
            <el-descriptions-item label="渠道名称">{{ selectedChannel.channelName || '--' }}</el-descriptions-item>
            <el-descriptions-item label="内容类型">{{ bizLabel(selectedChannel.bizType) }}</el-descriptions-item>
            <el-descriptions-item label="站点名称">{{ selectedChannel.siteName || '--' }}</el-descriptions-item>
            <el-descriptions-item label="站点根地址">{{ selectedChannel.baseUrl || '--' }}</el-descriptions-item>
            <el-descriptions-item label="测试地址">{{ selectedChannel.testUrl || '--' }}</el-descriptions-item>
            <el-descriptions-item label="请求方法">{{ selectedChannel.requestMethod || '--' }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ selectedChannel.priority }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ selectedChannel.status === 1 ? '启用' : '禁用' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ selectedChannel.remark || '--' }}</el-descriptions-item>
          </el-descriptions>
          <section class="detail-actions">
            <el-button :loading="testLoadingId === selectedChannel.id" type="primary" :icon="Connection" @click="testSelectedChannel">
              连接测试
            </el-button>
            <el-button :icon="EditPen" @click="openEditDialog(selectedChannel)">编辑</el-button>
          </section>
        </template>
        <el-empty v-else description="暂无渠道详情" />
      </div>
    </el-drawer>

    <el-dialog
      v-model="formVisible"
      :title="editingChannel ? '编辑扫描渠道' : '添加扫描渠道'"
      width="720px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" class="channel-form" label-position="top">
        <div class="form-grid">
          <el-form-item label="渠道编码" prop="channelCode">
            <el-input v-model="form.channelCode" :disabled="channelCodeLocked" placeholder="小写字母、数字、中划线" />
          </el-form-item>
          <el-form-item label="渠道名称" prop="channelName">
            <el-input v-model="form.channelName" placeholder="请输入渠道名称" />
          </el-form-item>
          <el-form-item label="内容类型" prop="bizType">
            <el-select v-model="form.bizType" placeholder="请选择内容类型" filterable>
              <el-option v-for="option in bizOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="站点名称">
            <el-input v-model="form.siteName" placeholder="例如：豆瓣读书" />
          </el-form-item>
          <el-form-item label="站点根地址">
            <el-input v-model="form.baseUrl" placeholder="https://example.com" />
          </el-form-item>
          <el-form-item label="连接测试地址">
            <el-input v-model="form.testUrl" placeholder="用于后端连接测试的地址" />
          </el-form-item>
          <el-form-item label="请求方法">
            <el-select v-model="form.requestMethod">
              <el-option v-for="method in requestMethods" :key="method" :label="method" :value="method" />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级" prop="priority">
            <el-input-number v-model="form.priority" class="form-control" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="enabled" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </div>
        <el-form-item label="请求头 JSON" prop="requestHeadersJson">
          <el-input
            v-model="form.requestHeadersJson"
            :rows="4"
            placeholder='例如：{"User-Agent":"Mozilla/5.0"}'
            type="textarea"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" :rows="2" placeholder="请输入渠道备注" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button :disabled="!editingChannel" :loading="testLoadingId === form.id" :icon="Connection" @click="testFormChannel">
          连接测试
        </el-button>
        <el-button :loading="submitting" type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testVisible" title="渠道连接测试结果" width="680px" destroy-on-close>
      <div v-loading="testDialogLoading" class="test-result">
        <template v-if="testResult">
          <div class="test-result__header">
            <AdminStatusBadge :label="testResult.passed ? '测试通过' : '测试失败'" :tone="testResult.passed ? 'green' : 'red'" dot />
            <span>{{ testResult.requestUrl || '--' }}</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="HTTP 状态">{{ testResult.httpStatus ?? '--' }}</el-descriptions-item>
            <el-descriptions-item label="响应长度">{{ testResult.responseLength ?? '--' }}</el-descriptions-item>
            <el-descriptions-item label="累计成功">{{ testResult.testSuccessCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="累计失败">{{ testResult.testFailCount ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="成功率">{{ formatRate(testResult.successRate) }}</el-descriptions-item>
            <el-descriptions-item label="错误信息">{{ testResult.errorMessage || '--' }}</el-descriptions-item>
          </el-descriptions>
          <section class="response-preview">
            <h3>响应预览</h3>
            <pre>{{ testResult.responsePreview || '--' }}</pre>
          </section>
        </template>
        <el-empty v-else description="暂无测试结果" />
      </div>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Connection, Delete, EditPen, View } from '@element-plus/icons-vue'
import { AdminActionIcons, AdminFilterBar, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { automationPages } from '../../config/adminModules'
import {
  BIZ_TYPE_OPTIONS,
  REQUEST_METHOD_OPTIONS,
  bizTypeValue,
  changeScrapeChannelStatus,
  createScrapeChannel,
  deleteScrapeChannel,
  fetchScrapeChannelDetail,
  fetchScrapeChannelsPage,
  normalizeBizType,
  statusValue,
  testScrapeChannel,
  updateScrapeChannel,
} from '../../api/automation'

const router = useRouter()
const page = {
  ...automationPages.channels,
}
const columns = [
  { key: 'name', label: '渠道名称' },
  { key: 'type', label: '内容类型' },
  { key: 'site', label: '站点' },
  { key: 'endpoint', label: '接口地址' },
  { key: 'status', label: '状态' },
  { key: 'lastTest', label: '最近测试' },
  { key: 'successRate', label: '成功率' },
  { key: 'rules', label: '关联规则' },
  { key: 'latency', label: '状态码' },
  { key: 'actions', label: '操作' },
]
const channelActions = [
  { label: '查看', icon: View, boxed: true },
  { label: '测试', icon: Connection },
  { label: '编辑', icon: EditPen },
  { label: '删除', icon: Delete, danger: true },
]
const bizOptions = BIZ_TYPE_OPTIONS
const requestMethods = REQUEST_METHOD_OPTIONS
const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const formVisible = ref(false)
const testVisible = ref(false)
const testDialogLoading = ref(false)
const submitting = ref(false)
const statusLoadingId = ref('')
const testLoadingId = ref('')
const rows = ref([])
const metrics = ref([])
const total = ref(0)
const selectedChannel = ref(null)
const editingChannel = ref(null)
const testResult = ref(null)
const formRef = ref(null)
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  bizType: '',
  status: undefined,
})
const form = reactive(defaultForm())
const enabled = computed({
  get: () => Number(form.status ?? 1) === 1,
  set: (value) => {
    form.status = value ? 1 : 0
  },
})
const channelCodeLocked = computed(() => Boolean(editingChannel.value?.raw?.linkedRuleCount))
const searchConfig = computed(() => ({
  placeholder: '搜索渠道编码、名称或站点',
  value: query.keyword,
}))
const filters = computed(() => [
  {
    label: '全部类型',
    value: BIZ_TYPE_OPTIONS.find((item) => item.value === query.bizType)?.label || '全部类型',
    options: ['全部类型', ...BIZ_TYPE_OPTIONS.map((item) => item.label)],
  },
  {
    label: '全部状态',
    value: query.status === 1 ? '启用' : query.status === 0 ? '禁用' : '全部状态',
    options: ['全部状态', '启用', '禁用'],
  },
])
const rules = {
  channelCode: [
    { required: true, message: '请输入渠道编码', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '渠道编码仅支持小写字母、数字和中划线', trigger: 'blur' },
  ],
  channelName: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  bizType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  priority: [{ required: true, message: '请输入优先级', trigger: 'change' }],
  requestHeadersJson: [{ validator: validateJson, trigger: 'blur' }],
}

function defaultForm() {
  return {
    id: '',
    channelCode: '',
    channelName: '',
    bizType: 'ebook',
    siteName: '',
    baseUrl: '',
    testUrl: '',
    requestMethod: 'GET',
    requestHeadersJson: '',
    priority: 50,
    status: 1,
    remark: '',
  }
}

function assignForm(data = {}) {
  Object.assign(form, defaultForm(), data)
}

function validateJson(rule, value, callback) {
  if (!value) {
    callback()
    return
  }
  try {
    JSON.parse(value)
    callback()
  } catch {
    callback(new Error('请输入合法的 JSON'))
  }
}

function bizLabel(value) {
  return normalizeBizType(value)
}

function formatRate(value) {
  if (value === null || value === undefined || value === '') return '--'
  const number = Number(value)
  return Number.isFinite(number) ? `${number.toFixed(number % 1 === 0 ? 0 : 1)}%` : '--'
}

function handlePageAction(action) {
  if (action.label === '返回扫描源') {
    router.push('/automation/rules')
    return
  }
  if (action.label === '添加渠道') openCreateDialog()
}

function handleSearchInput(value) {
  query.keyword = value
}

function handleFilterChange(filter) {
  if (filter.label === '全部类型') {
    query.bizType = filter.value === '全部类型' ? '' : bizTypeValue(filter.value)
  }
  if (filter.label === '全部状态') {
    query.status = filter.value === '全部状态' ? undefined : statusValue(filter.value)
  }
  loadChannels(1)
}

function resetFilters() {
  query.keyword = ''
  query.bizType = ''
  query.status = undefined
  loadChannels(1)
}

function handlePageSizeChange(size) {
  query.pageSize = size
  loadChannels(1)
}

async function loadChannels(pageNo = query.pageNo) {
  query.pageNo = pageNo
  loading.value = true
  try {
    const data = await fetchScrapeChannelsPage(query)
    rows.value = data.rows
    metrics.value = data.metrics
    total.value = data.total
    query.pageNo = data.current || query.pageNo
    query.pageSize = data.pageSize || query.pageSize
  } catch (error) {
    rows.value = []
    metrics.value = []
    total.value = 0
    ElMessage.error(error.message || '获取扫描渠道失败')
  } finally {
    loading.value = false
  }
}

async function openChannelDetail(row) {
  if (!row?.id) return
  detailVisible.value = true
  detailLoading.value = true
  selectedChannel.value = null
  try {
    selectedChannel.value = await fetchScrapeChannelDetail(row.id)
  } catch (error) {
    ElMessage.error(error.message || '获取扫描渠道详情失败')
  } finally {
    detailLoading.value = false
  }
}

function openCreateDialog() {
  editingChannel.value = null
  assignForm()
  formVisible.value = true
}

async function openEditDialog(row) {
  if (!row?.id) return
  editingChannel.value = row
  formVisible.value = true
  try {
    const detail = row.channelCode ? row : await fetchScrapeChannelDetail(row.id)
    assignForm(detail)
  } catch (error) {
    ElMessage.error(error.message || '获取扫描渠道详情失败')
  }
}

function resetForm() {
  formRef.value?.clearValidate()
  assignForm()
  editingChannel.value = null
}

async function toggleChannelStatus(row, enabledValue) {
  statusLoadingId.value = row.id
  try {
    await changeScrapeChannelStatus({ id: row.id, status: enabledValue ? 1 : 0 })
    ElMessage.success(enabledValue ? '扫描渠道已启用' : '扫描渠道已禁用')
    await loadChannels(query.pageNo)
  } catch (error) {
    ElMessage.error(error.message || '切换扫描渠道状态失败')
  } finally {
    statusLoadingId.value = ''
  }
}

async function handleRowAction(row, action) {
  if (action.label === '查看') {
    await openChannelDetail(row)
    return
  }
  if (action.label === '测试') {
    await runChannelTest(row.id)
    return
  }
  if (action.label === '编辑') {
    await openEditDialog(row)
    return
  }
  if (action.label === '删除') {
    await confirmDeleteChannel(row)
  }
}

async function testSelectedChannel() {
  if (selectedChannel.value?.id) await runChannelTest(selectedChannel.value.id)
}

async function testFormChannel() {
  if (form.id) await runChannelTest(form.id)
}

async function runChannelTest(id) {
  testVisible.value = true
  testDialogLoading.value = true
  testLoadingId.value = id
  testResult.value = null
  try {
    testResult.value = await testScrapeChannel(id)
    ElMessage[testResult.value?.passed ? 'success' : 'warning'](testResult.value?.passed ? '连接测试通过' : '连接测试失败')
    await loadChannels(query.pageNo)
    if (selectedChannel.value?.id === id) selectedChannel.value = await fetchScrapeChannelDetail(id)
  } catch (error) {
    ElMessage.error(error.message || '测试扫描渠道失败')
  } finally {
    testDialogLoading.value = false
    testLoadingId.value = ''
  }
}

async function submitForm() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (editingChannel.value) {
      await updateScrapeChannel(form)
      ElMessage.success('扫描渠道已保存')
    } else {
      await createScrapeChannel(form)
      ElMessage.success('扫描渠道已创建')
    }
    formVisible.value = false
    await loadChannels(query.pageNo)
  } catch (error) {
    ElMessage.error(error.message || '保存扫描渠道失败')
  } finally {
    submitting.value = false
  }
}

async function confirmDeleteChannel(row) {
  try {
    await ElMessageBox.confirm(`确认删除扫描渠道「${row.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteScrapeChannel(row.id)
    ElMessage.success('扫描渠道已删除')
    await loadChannels(rows.value.length === 1 && query.pageNo > 1 ? query.pageNo - 1 : query.pageNo)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.message || '删除扫描渠道失败')
  }
}

onMounted(() => loadChannels())
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

.channel-name {
  display: grid;
  gap: 4px;
  min-width: 170px;
}

.channel-name strong {
  max-width: 220px;
  overflow: hidden;
  color: #102557;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
}

.channel-name small {
  color: #617098;
}

.rate-cell {
  color: #102557;
  font-weight: 800;
}

.detail-panel {
  min-height: 240px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
}

.channel-form {
  display: grid;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
}

.form-control {
  width: 100%;
}

.channel-form :deep(.el-input__wrapper),
.channel-form :deep(.el-select__wrapper),
.channel-form :deep(.el-textarea__inner),
.channel-form :deep(.el-input-number) {
  border-radius: var(--admin-radius-control);
}

.test-result {
  min-height: 220px;
}

.test-result__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #314a80;
}

.test-result__header span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.response-preview {
  margin-top: 16px;
}

.response-preview h3 {
  margin: 0 0 10px;
  color: #102557;
  font-size: 15px;
}

.response-preview pre {
  max-height: 220px;
  margin: 0;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--admin-panel-border);
  border-radius: 8px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  white-space: pre-wrap;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

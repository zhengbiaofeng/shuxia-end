<template>
  <ResourceShell
    :actions="pageActions"
    :active-menu="page.activeMenu"
    :active-tab="activeTab"
    :tabs="tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="openCreateDialog"
    @tab-change="changeTab"
  >
    <div class="notify-page-stack">
      <AdminFilterBar
        :filters="statusFilters"
        :search="search"
        show-search
        @filter-change="handleFilterChange"
        @reset="resetFilters"
        @search="applyFilters"
        @search-input="search.value = $event"
      />

      <div v-loading="loading">
        <AdminTableCard
          :columns="columns"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          :rows="currentRows"
          :total="currentTotal"
          min-width="1120px"
          @page-change="changePage"
          @page-size-change="changePageSize"
        >
          <template #status="{ row }">
            <AdminStatusBadge :label="row.status" :tone="row.tone" dot />
          </template>
          <template #content="{ row }">
            <span class="content-preview" :title="row.content">{{ row.content }}</span>
          </template>
          <template #error="{ row }">
            <span class="content-preview" :title="row.error">{{ row.error }}</span>
          </template>
          <template #actions="{ row }">
            <div class="row-actions">
              <el-button v-if="activeTab < 3 && canEditCurrent" link type="primary" @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button
                v-if="activeTab === 2 && canTestSend"
                link
                type="success"
                @click="openTestDialog(row)"
              >
                测试发送
              </el-button>
              <el-button v-if="activeTab === 3" link type="primary" @click="openDispatchDetail(row)">
                详情
              </el-button>
              <el-button
                v-if="activeTab === 3 && canRetryDispatch && ['FAILED', 'SKIPPED'].includes(row.statusCode)"
                link
                type="warning"
                @click="retryDispatch(row)"
              >
                重试
              </el-button>
            </div>
          </template>
        </AdminTableCard>
      </div>

      <AdminInfoBox
        v-if="activeTab === 1"
        title="自动触发范围"
        :icon="InfoFilled"
        :items="['当前已接入任务完成和任务失败事件；人工终止不会作为失败事件发送。其他业务事件将在对应模块明确接入后进入选项。']"
      />
    </div>

    <el-dialog v-model="editorVisible" :title="editorTitle" width="min(760px, 94vw)">
      <el-form label-position="top">
        <template v-if="editorType === 'channel'">
          <div class="form-grid">
            <el-form-item label="渠道编码" required><el-input v-model="channelForm.channelCode" /></el-form-item>
            <el-form-item label="渠道名称" required><el-input v-model="channelForm.channelName" /></el-form-item>
            <el-form-item label="渠道类型" required>
              <el-select v-model="channelForm.channelType">
                <el-option label="站内信" value="system" />
                <el-option label="邮件" value="email" />
                <el-option label="钉钉" value="dingtalk" />
                <el-option label="企业微信" value="wechat_enterprise" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务商"><el-input v-model="channelForm.providerName" /></el-form-item>
            <el-form-item label="接口地址"><el-input v-model="channelForm.endpointUrl" /></el-form-item>
            <el-form-item label="测试接收人"><el-input v-model="channelForm.testReceiver" /></el-form-item>
            <el-form-item label="排序"><el-input-number v-model="channelForm.sortNo" :min="0" controls-position="right" /></el-form-item>
            <el-form-item label="状态"><el-switch v-model="channelForm.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
          </div>
          <el-form-item label="认证配置 JSON"><el-input v-model="channelForm.authConfigJson" type="textarea" :rows="4" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="channelForm.remark" type="textarea" :rows="2" /></el-form-item>
        </template>

        <template v-else-if="editorType === 'rule'">
          <div class="form-grid">
            <el-form-item label="规则编码" required><el-input v-model="ruleForm.ruleCode" /></el-form-item>
            <el-form-item label="规则名称" required><el-input v-model="ruleForm.ruleName" /></el-form-item>
            <el-form-item label="业务事件" required>
              <el-select v-model="ruleForm.bizEvent">
                <el-option
                  v-for="item in eventCatalog"
                  :key="item.code"
                  :label="`${item.name}（${item.code}）`"
                  :value="item.code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="通知模板" required>
              <el-select v-model="ruleForm.templateCode" filterable>
                <el-option v-for="item in templateCatalog" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
            <el-form-item class="form-grid__full" label="通知渠道" required>
              <el-select v-model="ruleForm.channelCodes" filterable multiple>
                <el-option v-for="item in channelCatalog" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
            <el-form-item label="接收范围">
              <el-select v-model="ruleForm.receiverScope">
                <el-option label="指定用户" value="custom" />
                <el-option label="全部正常用户" value="all" />
              </el-select>
            </el-form-item>
            <el-form-item label="指定接收用户">
              <el-input v-model="ruleForm.receiverUsersText" :disabled="ruleForm.receiverScope === 'all'" placeholder="多个登录账号用逗号分隔" />
            </el-form-item>
            <el-form-item label="通知类型">
              <el-select v-model="ruleForm.noticeType">
                <el-option label="系统消息" value="system" />
                <el-option label="知识库" value="file" />
                <el-option label="流程" value="flow" />
                <el-option label="日程计划" value="plan" />
              </el-select>
            </el-form-item>
            <el-form-item label="触发状态">
              <el-select v-model="ruleForm.triggerStatus">
                <el-option label="生效" value="active" />
                <el-option label="暂停" value="paused" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级"><el-input-number v-model="ruleForm.priority" :min="0" controls-position="right" /></el-form-item>
            <el-form-item label="状态"><el-switch v-model="ruleForm.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
          </div>
          <el-form-item label="备注"><el-input v-model="ruleForm.remark" type="textarea" :rows="2" /></el-form-item>
        </template>

        <template v-else>
          <div class="form-grid">
            <el-form-item label="模板编码" required><el-input v-model="templateForm.templateCode" /></el-form-item>
            <el-form-item label="模板名称" required><el-input v-model="templateForm.templateName" /></el-form-item>
            <el-form-item label="模板类型"><el-input v-model="templateForm.templateType" /></el-form-item>
            <el-form-item label="模板分类"><el-input v-model="templateForm.templateCategory" /></el-form-item>
            <el-form-item label="状态"><el-switch v-model="templateForm.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
          </div>
          <el-form-item label="模板内容" required><el-input v-model="templateForm.templateContent" type="textarea" :rows="7" /></el-form-item>
          <el-form-item label="测试数据 JSON"><el-input v-model="templateForm.templateTestJson" type="textarea" :rows="3" /></el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEditor">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testVisible" title="测试发送通知" width="min(560px, 94vw)">
      <el-form label-position="top">
        <el-form-item label="模板"><el-input :model-value="testForm.templateCode" disabled /></el-form-item>
        <el-form-item label="消息类型" required>
          <el-select v-model="testForm.msgType" style="width: 100%">
            <el-option label="站内信" value="system" />
            <el-option label="邮件" value="email" />
            <el-option label="钉钉" value="dingtalk" />
            <el-option label="企业微信" value="wechat_enterprise" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收人" required><el-input v-model="testForm.receiver" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="testForm.title" /></el-form-item>
        <el-form-item label="通知类型"><el-input v-model="testForm.noticeType" /></el-form-item>
        <el-form-item label="测试数据 JSON"><el-input v-model="testForm.testDataJson" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testVisible = false">取消</el-button>
        <el-button type="primary" :loading="testing" @click="sendTest">发送测试</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchDetailVisible" title="通知发送详情" width="min(760px, 94vw)">
      <div v-loading="dispatchDetailLoading">
        <el-descriptions v-if="dispatchDetail" :column="2" border>
          <el-descriptions-item label="业务事件">{{ dispatchDetail.event }}（{{ dispatchDetail.eventCode }}）</el-descriptions-item>
          <el-descriptions-item label="发送状态">
            <AdminStatusBadge :label="dispatchDetail.status" :tone="dispatchDetail.tone" dot />
          </el-descriptions-item>
          <el-descriptions-item label="来源任务">{{ dispatchDetail.source }}</el-descriptions-item>
          <el-descriptions-item label="规则">{{ dispatchDetail.rule }}</el-descriptions-item>
          <el-descriptions-item label="渠道">{{ dispatchDetail.channel }} / {{ dispatchDetail.channelType }}</el-descriptions-item>
          <el-descriptions-item label="接收用户">{{ dispatchDetail.receiver }}</el-descriptions-item>
          <el-descriptions-item label="模板">{{ dispatchDetail.template }}</el-descriptions-item>
          <el-descriptions-item label="尝试次数">{{ dispatchDetail.attempts }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ dispatchDetail.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ dispatchDetail.sentAt }}</el-descriptions-item>
          <el-descriptions-item label="失败原因" :span="2">{{ dispatchDetail.error }}</el-descriptions-item>
          <el-descriptions-item label="模板变量快照" :span="2">
            <pre class="payload-preview">{{ dispatchDetail.raw.payloadJson || '{}' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="dispatchDetailVisible = false">关闭</el-button>
        <el-button
          v-if="dispatchDetail && canRetryDispatch && ['FAILED', 'SKIPPED'].includes(dispatchDetail.statusCode)"
          type="warning"
          :loading="retryingId === dispatchDetail.id"
          @click="retryDispatch(dispatchDetail)"
        >
          重试发送
        </el-button>
      </template>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled, Plus } from '@element-plus/icons-vue'
import { AdminFilterBar, AdminInfoBox, AdminStatusBadge, AdminTableCard } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import {
  fetchNotifyChannelsPage,
  fetchNotifyRulesPage,
  fetchNotifyTemplatesPage,
  fetchNotifyEventOptions,
  fetchNotifyDispatchesPage,
  fetchNotifyDispatchDetail,
  retryNotifyDispatch,
  saveNotifyChannel,
  saveNotifyRule,
  saveNotifyTemplate,
  testNotifyTemplate,
} from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const page = reactive({ ...settingPages.notify })
const tabs = ['通知渠道', '通知规则', '通知模板', '发送记录']
const activeTab = ref(0)
const search = reactive({ placeholder: '搜索名称或编码', value: '' })
const statusFilters = reactive([{ label: '状态', value: '全部状态', options: ['全部状态', '已启用', '已停用'] }])
const lists = reactive({ channels: [], rules: [], templates: [], dispatches: [] })
const totals = reactive({ channels: 0, rules: 0, templates: 0, dispatches: 0 })
const paginations = reactive({
  channels: { pageNo: 1, pageSize: 10 },
  rules: { pageNo: 1, pageSize: 10 },
  templates: { pageNo: 1, pageSize: 10 },
  dispatches: { pageNo: 1, pageSize: 10 },
})
const channelCatalog = ref([])
const templateCatalog = ref([])
const eventCatalog = ref([])
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const editorVisible = ref(false)
const editorType = ref('channel')
const editing = ref(false)
const testVisible = ref(false)
const dispatchDetailVisible = ref(false)
const dispatchDetailLoading = ref(false)
const dispatchDetail = ref(null)
const retryingId = ref('')

const channelForm = reactive({ id: '', channelCode: '', channelName: '', channelType: '', providerName: '', endpointUrl: '', authConfigJson: '', testReceiver: '', sortNo: 0, remark: '', enabled: true })
const ruleForm = reactive({ id: '', ruleCode: '', ruleName: '', bizEvent: '', channelCodes: [], templateCode: '', receiverScope: '', receiverUsersText: '', noticeType: '', triggerStatus: '', priority: 0, remark: '', enabled: true })
const templateForm = reactive({ id: '', templateCode: '', templateName: '', templateContent: '', templateTestJson: '', templateType: '', templateCategory: '', enabled: true })
const testForm = reactive({ templateCode: '', msgType: '', receiver: '', title: '', testDataJson: '', noticeType: '' })

const listKey = computed(() => ['channels', 'rules', 'templates', 'dispatches'][activeTab.value])
const pagination = computed(() => paginations[listKey.value])
const currentRows = computed(() => lists[listKey.value])
const currentTotal = computed(() => totals[listKey.value])
const permissionPrefix = computed(() => ['channel', 'rule', 'template', 'dispatch'][activeTab.value])
const canEditCurrent = computed(() => activeTab.value < 3 && authStore.hasPermission(`sxbook:notifySetting:${permissionPrefix.value}:save`))
const canTestSend = computed(() => authStore.hasPermission('sxbook:notifySetting:testSend'))
const canRetryDispatch = computed(() => authStore.hasPermission('sxbook:notifySetting:dispatch:retry'))
const pageActions = computed(() => activeTab.value === 3 ? [] : [{
  label: ['新增渠道', '新增规则', '新增模板'][activeTab.value],
  type: 'primary',
  icon: Plus,
  permission: `sxbook:notifySetting:${permissionPrefix.value}:save`,
}])
const editorTitle = computed(() => `${editing.value ? '编辑' : '新增'}${['渠道', '规则', '模板'][activeTab.value]}`)
const columns = computed(() => {
  if (activeTab.value === 0) return [
    { key: 'name', label: '渠道名称' }, { key: 'code', label: '渠道编码' }, { key: 'type', label: '类型' },
    { key: 'provider', label: '服务商' }, { key: 'endpoint', label: '接口地址' }, { key: 'status', label: '状态' },
    { key: 'updatedAt', label: '更新时间' }, { key: 'actions', label: '操作' },
  ]
  if (activeTab.value === 1) return [
    { key: 'name', label: '规则名称' }, { key: 'event', label: '业务事件' }, { key: 'channels', label: '渠道' },
    { key: 'template', label: '模板' }, { key: 'receiver', label: '接收范围' }, { key: 'priority', label: '优先级' },
    { key: 'status', label: '状态' }, { key: 'actions', label: '操作' },
  ]
  if (activeTab.value === 2) return [
    { key: 'name', label: '模板名称' }, { key: 'code', label: '模板编码' }, { key: 'type', label: '类型' },
    { key: 'category', label: '分类' }, { key: 'content', label: '内容预览', style: { width: '300px' } },
    { key: 'status', label: '状态' }, { key: 'updatedAt', label: '更新时间' }, { key: 'actions', label: '操作' },
  ]
  return [
    { key: 'event', label: '业务事件' }, { key: 'source', label: '来源任务' }, { key: 'rule', label: '规则' },
    { key: 'channel', label: '渠道' }, { key: 'receiver', label: '接收用户' }, { key: 'status', label: '状态' },
    { key: 'attempts', label: '尝试次数' }, { key: 'error', label: '失败原因', style: { width: '260px' } },
    { key: 'createdAt', label: '创建时间' }, { key: 'sentAt', label: '发送时间' }, { key: 'actions', label: '操作' },
  ]
})

function buildQuery() {
  const statusValue = statusFilters[0].value
  const base = { keyword: search.value.trim() || undefined, ...pagination.value }
  if (activeTab.value < 2) base.status = statusValue === '已启用' ? 1 : statusValue === '已停用' ? 0 : undefined
  if (activeTab.value === 2) base.useStatus = statusValue === '已启用' ? '1' : statusValue === '已停用' ? '0' : undefined
  return base
}

async function loadCurrent() {
  loading.value = true
  try {
    const loaders = [fetchNotifyChannelsPage, fetchNotifyRulesPage, fetchNotifyTemplatesPage]
    const result = await loaders[activeTab.value](buildQuery())
    lists[listKey.value] = result.rows
    totals[listKey.value] = result.total
  } catch (error) {
    lists[listKey.value] = []
    totals[listKey.value] = 0
    ElMessage.error(error.message || '获取通知设置失败')
  } finally {
    loading.value = false
  }
}

async function loadCatalogs() {
  const [channels, templates] = await Promise.all([
    fetchNotifyChannelsPage({ pageNo: 1, pageSize: 100, status: 1 }),
    fetchNotifyTemplatesPage({ pageNo: 1, pageSize: 100, useStatus: '1' }),
  ])
  channelCatalog.value = channels.rows
  templateCatalog.value = templates.rows
}

function changeTab(index) {
  activeTab.value = index
  search.value = ''
  statusFilters[0].value = '全部状态'
  loadCurrent()
}

function handleFilterChange(filter) { statusFilters[0].value = filter.value }
function applyFilters() { pagination.value.pageNo = 1; loadCurrent() }
function resetFilters() { search.value = ''; statusFilters[0].value = '全部状态'; pagination.value.pageNo = 1; loadCurrent() }
function changePage(pageNo) { pagination.value.pageNo = pageNo; loadCurrent() }
function changePageSize(pageSize) { pagination.value.pageSize = pageSize; pagination.value.pageNo = 1; loadCurrent() }

async function openCreateDialog() {
  editing.value = false
  editorType.value = ['channel', 'rule', 'template'][activeTab.value]
  resetEditor(editorType.value)
  if (editorType.value === 'rule') await safeLoadCatalogs()
  editorVisible.value = true
}

async function openEditDialog(row) {
  editing.value = true
  editorType.value = ['channel', 'rule', 'template'][activeTab.value]
  fillEditor(editorType.value, row.raw)
  if (editorType.value === 'rule') await safeLoadCatalogs()
  editorVisible.value = true
}

function resetEditor(type) {
  if (type === 'channel') Object.assign(channelForm, { id: '', channelCode: '', channelName: '', channelType: '', providerName: '', endpointUrl: '', authConfigJson: '', testReceiver: '', sortNo: 0, remark: '', enabled: true })
  if (type === 'rule') Object.assign(ruleForm, { id: '', ruleCode: '', ruleName: '', bizEvent: '', channelCodes: [], templateCode: '', receiverScope: '', receiverUsersText: '', noticeType: '', triggerStatus: '', priority: 0, remark: '', enabled: true })
  if (type === 'template') Object.assign(templateForm, { id: '', templateCode: '', templateName: '', templateContent: '', templateTestJson: '', templateType: '', templateCategory: '', enabled: true })
}

function fillEditor(type, raw = {}) {
  resetEditor(type)
  if (type === 'channel') Object.assign(channelForm, raw, { enabled: Number(raw.status ?? 1) === 1 })
  if (type === 'rule') Object.assign(ruleForm, raw, { channelCodes: [...(raw.channelCodes || [])], receiverUsersText: (raw.receiverUsers || []).join(','), enabled: Number(raw.status ?? 1) === 1 })
  if (type === 'template') Object.assign(templateForm, raw, { enabled: String(raw.useStatus ?? '1') !== '0' })
}

async function safeLoadCatalogs() {
  try { await loadCatalogs() } catch (error) { ElMessage.error(error.message || '获取渠道和模板选项失败') }
}

function requireFields(values, message) {
  if (values.some((value) => !String(value || '').trim())) {
    ElMessage.warning(message)
    return false
  }
  return true
}

async function saveEditor() {
  let payload
  let saver
  if (editorType.value === 'channel') {
    if (!requireFields([channelForm.channelCode, channelForm.channelName, channelForm.channelType], '请填写渠道编码、名称和类型')) return
    payload = { ...channelForm, status: channelForm.enabled ? 1 : 0 }
    delete payload.enabled
    saver = saveNotifyChannel
  } else if (editorType.value === 'rule') {
    if (!requireFields([ruleForm.ruleCode, ruleForm.ruleName, ruleForm.bizEvent, ruleForm.templateCode], '请填写规则必填项')) return
    if (!ruleForm.channelCodes.length) return ElMessage.warning('至少选择一个通知渠道')
    payload = { ...ruleForm, status: ruleForm.enabled ? 1 : 0, receiverUsers: ruleForm.receiverUsersText.split(/[,，]/).map((item) => item.trim()).filter(Boolean) }
    delete payload.enabled
    delete payload.receiverUsersText
    saver = saveNotifyRule
  } else {
    if (!requireFields([templateForm.templateCode, templateForm.templateName, templateForm.templateContent], '请填写模板编码、名称和内容')) return
    payload = { ...templateForm, useStatus: templateForm.enabled ? '1' : '0' }
    delete payload.enabled
    saver = saveNotifyTemplate
  }
  saving.value = true
  try {
    await saver(payload)
    editorVisible.value = false
    ElMessage.success('通知配置已保存')
    await loadCurrent()
  } catch (error) {
    ElMessage.error(error.message || '保存通知配置失败')
  } finally {
    saving.value = false
  }
}

function openTestDialog(row) {
  Object.assign(testForm, { templateCode: row.code, msgType: row.raw.templateType || '', receiver: '', title: row.name, testDataJson: row.raw.templateTestJson || '', noticeType: '' })
  testVisible.value = true
}

async function sendTest() {
  if (!requireFields([testForm.templateCode, testForm.msgType, testForm.receiver], '请填写消息类型和接收人')) return
  testing.value = true
  try {
    await testNotifyTemplate({ ...testForm })
    testVisible.value = false
    ElMessage.success('测试通知已发送')
  } catch (error) {
    ElMessage.error(error.message || '测试发送失败')
  } finally {
    testing.value = false
  }
}

onMounted(loadCurrent)
</script>

<style scoped>
.notify-page-stack { display: grid; min-width: 0; gap: 22px; margin-top: 22px; }
.notify-page-stack > * { min-width: 0; }
.row-actions { display: inline-flex; align-items: center; gap: 2px; }
.content-preview { display: block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
.form-grid__full { grid-column: 1 / -1; }
.form-grid :deep(.el-select), .form-grid :deep(.el-input-number) { width: 100%; }
@media (max-width: 680px) { .form-grid { grid-template-columns: 1fr; } .form-grid__full { grid-column: auto; } }
</style>

<template>
  <ResourceShell
    active-menu="扫描源管理"
    :actions="actions"
    :subtitle="pageSubtitle"
    :tabs="['基础信息']"
    :title="pageTitle"
    @action="handleAction"
  >
    <section class="rule-form">
      <el-form
        ref="formRef"
        v-loading="loading"
        class="rule-form__main"
        label-position="top"
        :model="form"
        :rules="rules"
      >
        <section class="form-section">
          <h2>基础信息</h2>
          <div class="form-grid">
            <el-form-item label="扫描源名称" prop="ruleName">
              <el-input v-model="form.ruleName" placeholder="请输入扫描源名称" />
            </el-form-item>
            <el-form-item label="内容类型" prop="bizType">
              <el-select v-model="form.bizType" placeholder="请选择内容类型" filterable @change="loadChannelOptions">
                <el-option v-for="option in bizOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="站点名称" prop="siteName">
              <el-input v-model="form.siteName" placeholder="例如：豆瓣读书" />
            </el-form-item>
            <el-form-item label="连接模板">
              <el-select v-model="form.channelCode" placeholder="可选，复用已配置连接模板" filterable clearable allow-create>
                <el-option
                  v-for="channel in channelOptions"
                  :key="channel.code"
                  :label="`${channel.name}（${channel.code}）`"
                  :value="channel.code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
              <el-input-number v-model="form.priority" class="form-control" :min="0" :max="999" />
            </el-form-item>
            <el-form-item label="状态">
              <el-switch v-model="enabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </div>
          <el-form-item label="备注">
            <el-input v-model="form.remark" :rows="2" placeholder="用于规则列表和运维备注" type="textarea" />
          </el-form-item>
        </section>

        <section class="form-section">
          <header class="form-section__header">
            <h2>请求配置</h2>
            <el-button size="small" :loading="analyzing" :icon="DataAnalysis" @click="runAnalyze">自动分析</el-button>
          </header>
          <div class="form-grid">
            <el-form-item label="站点根地址">
              <el-input v-model="form.baseUrl" placeholder="https://example.com" />
            </el-form-item>
            <el-form-item label="列表地址">
              <el-input v-model="form.listUrl" placeholder="可选，内容列表页地址" />
            </el-form-item>
            <el-form-item label="调试地址" prop="debugUrl">
              <el-input v-model="form.debugUrl" placeholder="用于调试选择器的页面地址" />
            </el-form-item>
            <el-form-item label="请求方法">
              <el-select v-model="form.requestMethod">
                <el-option v-for="method in requestMethods" :key="method" :label="method" :value="method" />
              </el-select>
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
        </section>

        <section class="form-section">
          <h2>字段选择器</h2>
          <div class="form-grid is-selectors">
            <el-form-item v-for="field in selectorFields" :key="field.key" :label="field.label">
              <el-input v-model="form[field.key]" :placeholder="field.placeholder" />
            </el-form-item>
          </div>
        </section>
      </el-form>

      <aside class="rule-form__side">
        <h2>{{ isEdit ? '编辑扫描源' : '创建扫描源' }}</h2>
        <div class="preview-step active"><span>1</span><strong>配置来源</strong><p>填写站点、渠道、请求地址和请求头</p></div>
        <div class="preview-step active"><span>2</span><strong>调试选择器</strong><p>保存前可以请求真实页面，确认字段命中情况</p></div>
        <div class="preview-step"><span>3</span><strong>写入扫描源</strong><p>保存后会刷新扫描源列表，可启停、发现小说和再次调试</p></div>

        <section v-if="debugResult" class="debug-card" :class="{ 'is-pass': debugResult.passed }">
          <header>
            <AdminStatusBadge :label="debugResult.passed ? '调试通过' : '调试未通过'" :tone="debugResult.passed ? 'green' : 'red'" dot />
            <span>HTTP {{ debugResult.httpStatus ?? '--' }}</span>
          </header>
          <dl>
            <div>
              <dt>列表命中</dt>
              <dd>{{ debugResult.listMatchCount ?? 0 }}</dd>
            </div>
            <div>
              <dt>章节命中</dt>
              <dd>{{ debugResult.chapterMatchCount ?? 0 }}</dd>
            </div>
            <div>
              <dt>页面标题</dt>
              <dd>{{ debugResult.documentTitle || '--' }}</dd>
            </div>
            <div>
              <dt>错误信息</dt>
              <dd>{{ debugResult.errorMessage || '--' }}</dd>
            </div>
          </dl>
        </section>

        <div class="side-actions">
          <el-button :loading="analyzing" :icon="DataAnalysis" @click="runAnalyze">自动分析非必填项</el-button>
          <el-button :loading="debugging" :icon="DataAnalysis" @click="runDebug">调试扫描源</el-button>
          <el-button :loading="submitting" type="primary" @click="submitForm">保存扫描源</el-button>
        </div>

        <AdminInfoBox title="表单提示" :icon="InfoFilled" :items="tips" />
      </aside>
    </section>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { DataAnalysis, InfoFilled } from '@element-plus/icons-vue'
import { AdminInfoBox, AdminStatusBadge } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import {
  BIZ_TYPE_OPTIONS,
  REQUEST_METHOD_OPTIONS,
  analyzeScrapeRule,
  createScrapeRule,
  debugScrapeRule,
  fetchScrapeChannelsPage,
  fetchScrapeRuleDetail,
  updateScrapeRule,
} from '../../api/automation'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const analyzing = ref(false)
const debugging = ref(false)
const debugResult = ref(null)
const channelOptions = ref([])
const isEdit = computed(() => Boolean(route.query.id))
const pageTitle = computed(() => (isEdit.value ? '编辑扫描源' : '添加扫描源'))
const pageSubtitle = computed(() => '在一个页面内配置内容来源、请求策略和字段选择器，保存前可直接调试真实页面')
const ACTION_ANALYZE = '自动分析'
const actions = computed(() => [
  { label: '取消' },
  { label: ACTION_ANALYZE, icon: DataAnalysis },
  { label: '调试扫描源', icon: DataAnalysis },
  { label: '保存扫描源', type: 'primary' },
])
const bizOptions = BIZ_TYPE_OPTIONS
const requestMethods = REQUEST_METHOD_OPTIONS
const form = reactive(defaultForm())
const enabled = computed({
  get: () => Number(form.status ?? 1) === 1,
  set: (value) => {
    form.status = value ? 1 : 0
  },
})

const selectorFields = [
  { key: 'listSelector', label: '列表选择器', placeholder: '.book-list li' },
  { key: 'titleSelector', label: '标题选择器', placeholder: '.title, h1' },
  { key: 'authorSelector', label: '作者选择器', placeholder: '.author' },
  { key: 'introSelector', label: '简介选择器', placeholder: '.intro' },
  { key: 'coverSelector', label: '封面选择器', placeholder: '.cover img' },
  { key: 'chapterSelector', label: '章节列表选择器', placeholder: '.chapter-list li' },
  { key: 'chapterTitleSelector', label: '章节标题选择器', placeholder: 'a' },
  { key: 'chapterUrlSelector', label: '章节链接选择器', placeholder: 'a' },
  { key: 'contentSelector', label: '正文选择器', placeholder: '.content' },
]
const rules = {
  ruleName: [{ required: true, message: '请输入扫描源名称', trigger: 'blur' }],
  bizType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  priority: [{ required: true, message: '请输入优先级', trigger: 'change' }],
  requestHeadersJson: [{ validator: validateJson, trigger: 'blur' }],
}
const tips = [
  '业务类型会按后端规则保存为 ebook、novel、comic、audio',
  '请求配置和字段选择器都在基础信息页内维护，避免重复配置',
  '连接模板是可选复用项；没有独立模板时，也可以直接在本页填写站点请求配置',
  '请求头 JSON 留空时后端会使用默认 User-Agent',
  '调试至少需要调试地址和一个选择器命中项',
]

function defaultForm() {
  return {
    id: '',
    ruleName: '',
    bizType: 'ebook',
    siteName: '',
    channelCode: '',
    baseUrl: '',
    listUrl: '',
    debugUrl: '',
    requestMethod: 'GET',
    requestHeadersJson: '',
    listSelector: '',
    titleSelector: '',
    authorSelector: '',
    introSelector: '',
    coverSelector: '',
    chapterSelector: '',
    chapterTitleSelector: '',
    chapterUrlSelector: '',
    contentSelector: '',
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

function handleAction(action) {
  if (action.label === '取消') {
    router.push('/automation/rules')
    return
  }
  if (action.label === ACTION_ANALYZE) {
    runAnalyze()
    return
  }
  if (action.label === '调试扫描源') {
    runDebug()
    return
  }
  if (action.label === '保存扫描源') {
    submitForm()
  }
}

async function loadRule() {
  if (!isEdit.value) return
  loading.value = true
  try {
    assignForm(await fetchScrapeRuleDetail(route.query.id))
    await loadChannelOptions()
  } catch (error) {
    ElMessage.error(error.message || '获取扫描源详情失败')
  } finally {
    loading.value = false
  }
}

async function loadChannelOptions() {
  try {
    const data = await fetchScrapeChannelsPage({ pageNo: 1, pageSize: 100, bizType: form.bizType })
    channelOptions.value = data.rows
  } catch (error) {
    channelOptions.value = []
    ElMessage.warning(error.message || '连接模板选项获取失败')
  }
}

async function runAnalyze() {
  await formRef.value?.validateField(['requestHeadersJson']).catch(() => {
    throw new Error('请先修正请求头 JSON')
  })
  const url = firstFilled(form.debugUrl, form.listUrl, form.baseUrl)
  if (!url) {
    ElMessage.warning('请先填写调试地址、列表地址或站点根地址')
    return
  }
  analyzing.value = true
  debugResult.value = null
  try {
    const result = await analyzeScrapeRule({
      url,
      bizType: form.bizType,
      requestMethod: form.requestMethod,
      requestHeadersJson: form.requestHeadersJson,
    })
    const filledCount = applyAnalyzeResult(result)
    debugResult.value = {
      passed: result.passed,
      requestUrl: result.requestUrl,
      httpStatus: result.httpStatus,
      responseLength: result.responseLength,
      listMatchCount: result.listMatchCount,
      chapterMatchCount: result.chapterMatchCount,
      documentTitle: result.documentTitle,
      errorMessage: result.errorMessage || (result.notes || []).join('；'),
    }
    if (filledCount > 0) {
      ElMessage.success(`已自动填充 ${filledCount} 个空字段，请继续调试确认`)
    } else {
      ElMessage.info('没有新的空字段可填充，请查看调试结果')
    }
  } catch (error) {
    ElMessage.error(error.message || '自动分析扫描源失败')
  } finally {
    analyzing.value = false
  }
}

function applyAnalyzeResult(result = {}) {
  const fields = [
    'baseUrl',
    'listUrl',
    'debugUrl',
    'requestMethod',
    'requestHeadersJson',
    'listSelector',
    'titleSelector',
    'authorSelector',
    'introSelector',
    'coverSelector',
    'chapterSelector',
    'chapterTitleSelector',
    'chapterUrlSelector',
    'contentSelector',
  ]
  let filledCount = 0
  fields.forEach((field) => {
    if (!form[field] && result[field]) {
      form[field] = result[field]
      filledCount += 1
    }
  })
  return filledCount
}

function firstFilled(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || ''
}

async function runDebug() {
  await formRef.value?.validateField(['debugUrl', 'requestHeadersJson']).catch(() => {
    throw new Error('请先修正请求配置')
  })
  debugging.value = true
  debugResult.value = null
  try {
    debugResult.value = await debugScrapeRule(buildDebugPayload())
    ElMessage[debugResult.value?.passed ? 'success' : 'warning'](debugResult.value?.passed ? '调试通过' : '调试未通过，请检查选择器')
  } catch (error) {
    ElMessage.error(error.message || '调试扫描源失败')
  } finally {
    debugging.value = false
  }
}

function buildDebugPayload() {
  return {
    ruleId: form.id || undefined,
    debugUrl: form.debugUrl,
    requestMethod: form.requestMethod,
    requestHeadersJson: form.requestHeadersJson,
    listSelector: form.listSelector,
    titleSelector: form.titleSelector,
    authorSelector: form.authorSelector,
    introSelector: form.introSelector,
    coverSelector: form.coverSelector,
    chapterSelector: form.chapterSelector,
    chapterTitleSelector: form.chapterTitleSelector,
    chapterUrlSelector: form.chapterUrlSelector,
    contentSelector: form.contentSelector,
    sampleLimit: 5,
  }
}

async function submitForm() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateScrapeRule(form)
      ElMessage.success('扫描源已保存')
    } else {
      await createScrapeRule(form)
      ElMessage.success('扫描源已创建')
    }
    router.push('/automation/rules')
  } catch (error) {
    ElMessage.error(error.message || '保存扫描源失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadChannelOptions()
  await loadRule()
})
</script>

<style scoped>
.rule-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  margin-top: 22px;
}

.rule-form__main,
.rule-form__side {
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.rule-form__main {
  display: grid;
  gap: 22px;
  padding: 26px 28px;
}

.rule-form__side {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 20px;
}

.form-section {
  display: grid;
  gap: 16px;
}

.form-section + .form-section {
  padding-top: 22px;
  border-top: 1px solid var(--admin-row-border);
}

.form-section h2,
.rule-form__side h2 {
  margin: 0;
  color: #102557;
  font-size: var(--admin-text-section);
}

.form-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
}

.form-grid.is-selectors {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-control {
  width: 100%;
}

.rule-form :deep(.el-input__wrapper),
.rule-form :deep(.el-select__wrapper),
.rule-form :deep(.el-textarea__inner),
.rule-form :deep(.el-input-number) {
  border-radius: var(--admin-radius-control);
}

.preview-step {
  position: relative;
  padding-left: 44px;
}

.preview-step span {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #edf2fa;
  color: #50679b;
  font-weight: 800;
}

.preview-step.active span {
  background: var(--admin-primary);
  color: #fff;
}

.preview-step strong {
  color: #102557;
  font-size: 14px;
}

.preview-step p {
  margin: 5px 0 0;
  color: #50679b;
  font-size: 13px;
  line-height: 1.45;
}

.debug-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff7f7;
}

.debug-card.is-pass {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.debug-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.debug-card dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.debug-card div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
}

.debug-card dt {
  color: #6b7da8;
}

.debug-card dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #102557;
}

.side-actions {
  display: grid;
  gap: 10px;
}

.side-actions :deep(.el-button) {
  width: 100%;
  margin-left: 0;
}

@media (max-width: 1200px) {
  .rule-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .form-grid,
  .form-grid.is-selectors {
    grid-template-columns: 1fr;
  }
}
</style>

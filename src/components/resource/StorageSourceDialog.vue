<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="760px"
    destroy-on-close
    class="storage-source-dialog"
    @close="close"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="storage-source-form">
      <section class="form-section">
        <div class="section-heading">
          <strong>存储类型</strong>
        </div>
        <el-radio-group v-model="form.sourceType" class="source-type-group">
          <el-radio-button value="local">
            <el-icon><FolderOpened /></el-icon>
            本地目录
          </el-radio-button>
          <el-radio-button value="minio">
            <el-icon><Cloudy /></el-icon>
            MinIO
          </el-radio-button>
        </el-radio-group>
      </section>

      <section class="form-section form-grid">
        <el-form-item label="存储名称" prop="sourceName">
          <el-input v-model.trim="form.sourceName" placeholder="例如：书籍盘、小说盘" />
        </el-form-item>
        <el-form-item label="存储键">
          <el-input v-model.trim="form.sourceKey" placeholder="留空时自动生成" />
        </el-form-item>
      </section>

      <section v-if="isLocal" class="form-section">
        <el-form-item label="目录路径" prop="localBasePath">
          <div class="path-control">
            <el-input
              v-model.trim="form.localBasePath"
              placeholder="输入后端可见的绝对目录路径"
              @input="clearProbe"
            />
            <el-button :icon="FolderOpened" @click="openPathBrowser">选择</el-button>
            <el-button :icon="CircleCheck" :loading="probing" @click="probeCurrentPath">检测</el-button>
          </div>
        </el-form-item>

        <el-alert
          v-if="probeResult?.containerized"
          title="当前后端运行在容器中，只能使用已经挂载到容器内的目录。"
          type="warning"
          :closable="false"
          show-icon
          class="path-alert"
        />

        <div v-if="probeResult" class="probe-result" :class="`is-${probeTone}`">
          <div class="probe-result__status">
            <el-icon><CircleCheckFilled v-if="probeTone === 'success'" /><WarningFilled v-else /></el-icon>
            <div>
              <strong>{{ probeTitle }}</strong>
              <span>{{ probeResult.message }}</span>
            </div>
          </div>
          <dl v-if="probeResult.capacityKnown" class="probe-stats">
            <div><dt>所在卷</dt><dd>{{ probeVolume }}</dd></div>
            <div><dt>总容量</dt><dd>{{ formatBytes(probeResult.totalBytes) }}</dd></div>
            <div><dt>已使用</dt><dd>{{ formatBytes(probeResult.usedBytes) }}</dd></div>
            <div><dt>可用空间</dt><dd>{{ formatBytes(probeResult.availableBytes) }}</dd></div>
          </dl>
        </div>
      </section>

      <section v-else class="form-section form-grid">
        <el-form-item label="MinIO 端点">
          <el-input v-model.trim="form.endpoint" placeholder="例如：http://minio:9000" />
        </el-form-item>
        <el-form-item label="桶名称" prop="bucketName">
          <el-input v-model.trim="form.bucketName" placeholder="例如：sx-book 或 novel" />
        </el-form-item>
        <el-alert
          title="MinIO 桶只提供逻辑对象用量，不提供宿主磁盘总容量；未配置独立监控时容量将显示为未知。"
          type="info"
          :closable="false"
          show-icon
          class="minio-alert"
        />
      </section>

      <section class="form-section form-grid">
        <el-form-item label="内容范围">
          <el-segmented v-model="form.bizScope" :options="bizScopeOptions" />
        </el-form-item>
        <el-form-item label="存储前缀">
          <el-input v-model.trim="form.objectPrefix" placeholder="例如：library" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </section>

      <section class="form-section switch-grid">
        <label class="switch-row">
          <span><strong>允许写入</strong><small>关闭后仅用于读取和扫描</small></span>
          <el-switch v-model="form.writable" />
        </label>
        <label class="switch-row" :class="{ disabled: !supportsEbook }">
          <span><strong>书籍默认位置</strong><small>本地上传书籍的默认目标</small></span>
          <el-switch v-model="form.defaultEbook" :disabled="!supportsEbook" />
        </label>
        <label class="switch-row" :class="{ disabled: !supportsNovel }">
          <span><strong>小说默认位置</strong><small>网络小说同步的默认目标</small></span>
          <el-switch v-model="form.defaultNovel" :disabled="!supportsNovel" />
        </label>
      </section>

      <el-form-item label="备注">
        <el-input v-model.trim="form.remark" type="textarea" :rows="2" placeholder="记录盘符、用途或 NAS 位置" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="browserVisible"
    title="选择目录"
    width="620px"
    append-to-body
    class="storage-path-dialog"
  >
    <div class="browser-toolbar">
      <AdminTooltip content="返回上级目录">
        <el-button aria-label="返回上级目录" :icon="ArrowLeft" circle :disabled="browserLoading || !browserPath" @click="goParent" />
      </AdminTooltip>
      <el-input :model-value="browserPath || '可见根目录与挂载点'" readonly />
      <el-button
        v-if="browserPath"
        type="primary"
        :icon="Check"
        @click="selectBrowserPath(browserPath)"
      >
        选择当前目录
      </el-button>
    </div>

    <div v-loading="browserLoading" class="browser-list">
      <button
        v-for="item in browserItems"
        :key="item.path"
        type="button"
        class="browser-item"
        @click="loadDirectory(item.path)"
      >
        <span class="browser-item__icon"><el-icon><Folder /></el-icon></span>
        <span class="browser-item__main">
          <strong>{{ item.name || item.path }}</strong>
          <small>{{ item.path }}</small>
        </span>
        <span v-if="item.capacityKnown" class="browser-item__capacity">
          {{ formatBytes(item.availableBytes) }} 可用
        </span>
        <el-icon><ArrowRight /></el-icon>
      </button>
      <el-empty v-if="!browserLoading && !browserItems.length" description="当前目录没有可进入的子目录" :image-size="72" />
    </div>
  </el-dialog>
</template>

<script setup>
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleCheckFilled,
  Cloudy,
  Folder,
  FolderOpened,
  WarningFilled,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import AdminTooltip from '../admin/AdminTooltip.vue'
import {
  fetchStorageDirectories,
  fetchStoragePathRoots,
  probeStoragePath,
} from '../../api/resourceManagement'

const props = defineProps({
  initialValues: { type: Object, default: () => ({}) },
  modelValue: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  title: { type: String, default: '配置存储源' },
})

const emit = defineEmits(['submit', 'update:modelValue'])
const formRef = ref()
const probing = ref(false)
const probeResult = ref(null)
const browserVisible = ref(false)
const browserLoading = ref(false)
const browserPath = ref('')
const browserCurrent = ref(null)
const browserItems = ref([])

const defaultForm = {
  sourceType: 'local',
  sourceKey: '',
  sourceName: '',
  endpoint: '',
  bucketName: '',
  localBasePath: '',
  bizScope: 'both',
  objectPrefix: '',
  writable: true,
  defaultEbook: false,
  defaultNovel: false,
  enabled: true,
  sortNo: 0,
  remark: '',
}
const form = reactive({ ...defaultForm })

const bizScopeOptions = [
  { label: '书籍', value: 'ebook' },
  { label: '小说', value: 'novel' },
  { label: '书籍 + 小说', value: 'both' },
]

const isLocal = computed(() => form.sourceType === 'local')
const supportsEbook = computed(() => form.bizScope === 'ebook' || form.bizScope === 'both')
const supportsNovel = computed(() => form.bizScope === 'novel' || form.bizScope === 'both')
const probeTone = computed(() => probeResult.value?.status === 'AVAILABLE' ? 'success' : 'warning')
const probeTitle = computed(() => {
  if (probeResult.value?.status === 'AVAILABLE') return '路径可用'
  if (probeResult.value?.status === 'READ_ONLY') return '路径只读'
  return '路径不可用'
})
const probeVolume = computed(() => [probeResult.value?.volumeName, probeResult.value?.fileSystemType].filter(Boolean).join(' · ') || '--')

const rules = {
  sourceName: [{ required: true, message: '请输入存储名称', trigger: 'blur' }],
  localBasePath: [{
    validator: (_rule, value, callback) => {
      if (isLocal.value && !String(value || '').trim()) callback(new Error('请输入或选择目录路径'))
      else callback()
    },
    trigger: 'blur',
  }],
  bucketName: [{
    validator: (_rule, value, callback) => {
      if (!isLocal.value && !String(value || '').trim()) callback(new Error('请输入桶名称'))
      else callback()
    },
    trigger: 'blur',
  }],
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  const initial = props.initialValues || {}
  Object.assign(form, defaultForm, initial, {
    writable: Number(initial.writable ?? 1) === 1,
    defaultEbook: Number(initial.defaultEbook ?? 0) === 1,
    defaultNovel: Number(initial.defaultNovel ?? 0) === 1,
    enabled: Number(initial.status ?? 1) === 1,
  })
  probeResult.value = initial.pathStatus ? {
    status: initial.pathStatus,
    message: initial.pathMessage,
    readable: initial.pathReadable,
    writable: initial.pathWritable,
    capacityKnown: initial.capacityKnown,
    totalBytes: initial.totalBytes,
    usedBytes: initial.usedBytes,
    availableBytes: initial.availableBytes,
    volumeName: initial.volumeName,
    fileSystemType: initial.fileSystemType,
    containerized: initial.containerized,
  } : null
})

watch(() => form.bizScope, () => {
  if (!supportsEbook.value) form.defaultEbook = false
  if (!supportsNovel.value) form.defaultNovel = false
})

watch(() => form.sourceType, () => {
  probeResult.value = null
  formRef.value?.clearValidate()
})

function close() {
  if (props.submitting) return
  emit('update:modelValue', false)
}

function clearProbe() {
  probeResult.value = null
}

async function probeCurrentPath() {
  if (!String(form.localBasePath || '').trim()) {
    ElMessage.warning('请先输入或选择目录路径')
    return null
  }
  probing.value = true
  try {
    const result = await probeStoragePath({ path: form.localBasePath, writeTest: form.writable })
    probeResult.value = result
    if (result.status === 'AVAILABLE') ElMessage.success('目录检测通过')
    else ElMessage.warning(result.message || '目录不可用')
    return result
  } catch (error) {
    probeResult.value = null
    ElMessage.error(error?.message || '目录检测失败')
    return null
  } finally {
    probing.value = false
  }
}

async function openPathBrowser() {
  browserVisible.value = true
  if (form.localBasePath) {
    try {
      await loadDirectory(form.localBasePath)
      return
    } catch {
      // Fall back to visible roots when the typed path cannot be browsed.
    }
  }
  await loadRoots()
}

async function loadRoots() {
  browserLoading.value = true
  browserPath.value = ''
  browserCurrent.value = null
  try {
    browserItems.value = await fetchStoragePathRoots()
  } catch (error) {
    browserItems.value = []
    ElMessage.error(error?.message || '获取可见目录失败')
  } finally {
    browserLoading.value = false
  }
}

async function loadDirectory(path) {
  browserLoading.value = true
  try {
    const [items, current] = await Promise.all([
      fetchStorageDirectories(path),
      probeStoragePath({ path, writeTest: false }),
    ])
    browserPath.value = current.path || path
    browserCurrent.value = current
    browserItems.value = items
  } catch (error) {
    ElMessage.error(error?.message || '读取目录失败')
    throw error
  } finally {
    browserLoading.value = false
  }
}

async function goParent() {
  const parentPath = browserCurrent.value?.parentPath
  if (!parentPath) {
    await loadRoots()
    return
  }
  await loadDirectory(parentPath)
}

async function selectBrowserPath(path) {
  form.localBasePath = path
  form.endpoint = path
  browserVisible.value = false
  await probeCurrentPath()
}

async function submit() {
  await formRef.value?.validate()
  if (isLocal.value && form.enabled) {
    const result = await probeCurrentPath()
    const usable = result?.readable && (!form.writable || result?.writeTestPassed)
    if (!usable) return
  }
  emit('submit', {
    sourceType: form.sourceType,
    sourceKey: form.sourceKey || undefined,
    sourceName: form.sourceName,
    endpoint: isLocal.value ? form.localBasePath : form.endpoint || undefined,
    bucketName: isLocal.value ? undefined : form.bucketName,
    localBasePath: isLocal.value ? form.localBasePath : undefined,
    bizScope: form.bizScope,
    objectPrefix: form.objectPrefix || undefined,
    writable: form.writable ? 1 : 0,
    defaultEbook: form.defaultEbook ? 1 : 0,
    defaultNovel: form.defaultNovel ? 1 : 0,
    status: form.enabled ? 1 : 0,
    sortNo: Number(form.sortNo || 0),
    remark: form.remark || undefined,
  })
}

function formatBytes(value) {
  const size = Number(value || 0)
  if (size >= 1024 ** 4) return `${(size / 1024 ** 4).toFixed(2)} TB`
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GB`
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(2)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${size} B`
}
</script>

<style scoped>
:global(.storage-source-dialog) {
  display: flex;
  flex-direction: column;
  width: min(760px, calc(100vw - 24px)) !important;
  max-height: 92vh;
  margin-top: 4vh !important;
  overflow: hidden;
}

:global(.storage-path-dialog) {
  width: min(620px, calc(100vw - 24px)) !important;
}

:global(.storage-source-dialog .el-dialog__header),
:global(.storage-source-dialog .el-dialog__footer) {
  flex: 0 0 auto;
}

:global(.storage-source-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.storage-source-form {
  display: grid;
  gap: 18px;
}

.form-section {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--admin-row-border);
}

.form-section:last-of-type {
  border-bottom: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.section-heading {
  margin-bottom: 10px;
  color: var(--admin-title);
  font-size: 14px;
}

.source-type-group :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 132px;
  justify-content: center;
}

.path-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  width: 100%;
}

.path-alert,
.minio-alert {
  grid-column: 1 / -1;
}

.probe-result {
  padding: 14px 16px;
  border: 1px solid #fed7aa;
  border-radius: 7px;
  background: #fffaf3;
}

.probe-result.is-success {
  border-color: #bbf7d0;
  background: #f2fbf5;
}

.probe-result__status {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #d66a0a;
}

.probe-result.is-success .probe-result__status {
  color: var(--admin-success);
}

.probe-result__status .el-icon {
  margin-top: 2px;
  font-size: 18px;
}

.probe-result__status strong,
.probe-result__status span {
  display: block;
}

.probe-result__status span {
  margin-top: 3px;
  color: var(--admin-text-muted);
  font-size: 12px;
}

.probe-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid rgba(98, 122, 164, 0.18);
}

.probe-stats dt {
  color: var(--admin-text-muted);
  font-size: 12px;
}

.probe-stats dd {
  margin: 5px 0 0;
  overflow: hidden;
  color: var(--admin-title);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 64px;
  padding: 10px 12px;
  border: 1px solid var(--admin-border);
  border-radius: 7px;
}

.switch-row strong,
.switch-row small {
  display: block;
}

.switch-row strong {
  color: var(--admin-title);
  font-size: 13px;
}

.switch-row small {
  margin-top: 3px;
  color: var(--admin-text-muted);
  font-size: 11px;
  line-height: 1.4;
}

.switch-row.disabled {
  opacity: 0.55;
}

.browser-toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  margin-bottom: 14px;
}

.browser-list {
  min-height: 240px;
  max-height: min(480px, 55vh);
  overflow-y: auto;
  border: 1px solid var(--admin-border);
  border-radius: 7px;
}

.browser-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 62px;
  padding: 9px 14px;
  border: 0;
  border-bottom: 1px solid var(--admin-row-border);
  background: #fff;
  color: var(--admin-text);
  cursor: pointer;
  text-align: left;
}

.browser-item:last-child {
  border-bottom: 0;
}

.browser-item:hover {
  background: var(--admin-primary-soft);
}

.browser-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  font-size: 17px;
}

.browser-item__main {
  min-width: 0;
}

.browser-item__main strong,
.browser-item__main small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-item__main strong {
  color: var(--admin-title);
  font-size: 13px;
}

.browser-item__main small,
.browser-item__capacity {
  margin-top: 3px;
  color: var(--admin-text-muted);
  font-size: 11px;
}

@media (max-width: 720px) {
  .form-grid,
  .switch-grid,
  .probe-stats {
    grid-template-columns: 1fr;
  }

  .path-control {
    grid-template-columns: 1fr 1fr;
  }

  .path-control .el-input {
    grid-column: 1 / -1;
  }

  .browser-toolbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .browser-toolbar > .el-button:last-child {
    grid-column: 1 / -1;
  }

  .browser-item {
    grid-template-columns: 34px minmax(0, 1fr) 18px;
  }

  .browser-item__capacity {
    display: none;
  }
}
</style>

<template>
  <teleport to="body">
    <div v-if="modelValue" class="storage-modal" role="dialog" aria-modal="true" :aria-label="current.title">
      <div class="storage-modal__scrim" @click="close" />

      <section class="storage-modal__panel" :class="[`is-${activeType}`, { 'has-subtitle': current.subtitle }]">
        <header class="storage-modal__header">
          <div class="storage-modal__title">
            <span v-if="current.headerIcon" class="storage-modal__title-icon" :class="`tone-${current.tone}`">
              <el-icon><component :is="current.headerIcon" /></el-icon>
            </span>
            <div>
              <h2>{{ current.title }}</h2>
              <p v-if="current.subtitle">{{ current.subtitle }}</p>
            </div>
          </div>
          <button class="storage-modal__close" type="button" aria-label="关闭" @click="close">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <div class="storage-modal__body">
          <section class="modal-section">
            <h3><i />存储类型</h3>
            <div class="storage-type-grid">
              <button
                v-for="type in storageTypes"
                :key="type.key"
                class="storage-type-card"
                :class="{ active: type.key === activeType, disabled: type.disabled }"
                type="button"
                @click="selectType(type)"
              >
                <span class="storage-type-card__icon" :class="`tone-${type.tone}`">
                  <el-icon><component :is="type.icon" /></el-icon>
                </span>
                <div>
                  <strong>{{ type.label }}</strong>
                  <span>{{ type.desc }}</span>
                  <small v-if="type.disabled">后端待支持</small>
                </div>
              </button>
            </div>
          </section>

          <section v-if="activeType === 'cloud'" class="modal-section">
            <h3><i />选择网盘类型</h3>
            <div class="cloud-provider-grid">
              <button
                v-for="provider in cloudProviders"
                :key="provider.key"
                class="cloud-provider"
                :class="{ active: provider.key === activeProvider }"
                type="button"
                @click="activeProvider = provider.key"
              >
                <span class="cloud-provider__mark" :class="provider.key">
                  <el-icon v-if="provider.icon"><component :is="provider.icon" /></el-icon>
                  <span v-else>{{ provider.mark }}</span>
                </span>
                <strong>{{ provider.label }}</strong>
              </button>
            </div>
          </section>

          <section v-for="section in current.sections" :key="section.title" class="modal-section">
            <h3><i />{{ section.title }}</h3>

            <div class="modal-form">
              <template v-for="field in section.fields" :key="field.key">
                <label v-if="field.type !== 'availability' && field.type !== 'test' && field.type !== 'auth'" class="modal-field" :class="field.class">
                  <span class="modal-field__label">
                    {{ field.label }}<em v-if="field.required">*</em>
                  </span>

                  <span class="modal-field__control">
                    <span v-if="field.type === 'select'" class="modal-input modal-select">
                      {{ field.value || field.placeholder }}
                      <el-icon><ArrowDown /></el-icon>
                    </span>

                    <span v-else-if="field.type === 'path'" class="modal-path-input">
                      <input
                        v-model.trim="form[field.key]"
                        :placeholder="field.placeholder"
                        :readonly="submitting"
                      />
                      <button type="button" tabindex="-1">
                        <el-icon><Folder /></el-icon>
                        选择
                      </button>
                    </span>

                    <input
                      v-else-if="field.type === 'password'"
                      v-model.trim="form[field.key]"
                      class="modal-input"
                      :placeholder="field.placeholder"
                      :readonly="submitting"
                      type="password"
                    />

                    <textarea
                      v-else-if="field.type === 'textarea'"
                      v-model.trim="form[field.key]"
                      class="modal-textarea"
                      :placeholder="field.placeholder"
                      :readonly="submitting"
                    />

                    <input
                      v-else
                      v-model.trim="form[field.key]"
                      class="modal-input"
                      :placeholder="field.placeholder"
                      :readonly="submitting"
                      type="text"
                    />

                    <small v-if="field.hint">{{ field.hint }}</small>
                  </span>
                </label>

                <div v-else-if="field.type === 'availability'" class="modal-field availability-row">
                  <span class="modal-field__label">{{ field.label }}</span>
                  <span class="availability-row__status">
                    <el-icon><CircleCheckFilled /></el-icon>
                    <strong>自动检测</strong>
                    <small>保存后将自动计算可用空间</small>
                  </span>
                </div>

                <div v-else-if="field.type === 'test'" class="modal-field test-row">
                  <span class="modal-field__label" />
                  <span class="modal-field__control">
                    <button type="button" disabled>测试连接</button>
                    <small>{{ field.hint }}</small>
                  </span>
                </div>

                <div v-else-if="field.type === 'auth'" class="modal-field auth-field">
                  <span class="modal-field__label">{{ field.label }}</span>
                  <span class="modal-field__control">
                    <button type="button" class="auth-option active">
                      <strong>自动授权（推荐）</strong>
                      <small>通过官方 OAuth 2.0 安全授权</small>
                    </button>
                    <button type="button" class="auth-option">
                      <strong>手动授权</strong>
                      <small>使用 Refresh Token 连接</small>
                    </button>
                  </span>
                </div>
              </template>
            </div>
          </section>

          <div v-if="current.disabledReason" class="storage-modal__notice">
            {{ current.disabledReason }}
          </div>
        </div>

        <footer class="storage-modal__footer">
          <button class="plain-btn" type="button" :disabled="submitting" @click="close">取消</button>
          <button class="primary-btn" type="button" :disabled="submitting || Boolean(current.disabledReason)" @click="confirm">
            {{ submitting ? '保存中...' : '确定' }}
          </button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  CircleCheckFilled,
  Close,
  Cloudy,
  Connection,
  Folder,
  FolderOpened,
  Link,
  MostlyCloudy,
  Share,
} from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialType: { type: String, default: 'local' },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const storageTypes = [
  { key: 'local', label: '本地目录', desc: '将本地磁盘目录添加到书匣', icon: FolderOpened, tone: 'blue' },
  { key: 'minio', label: 'MinIO', desc: '连接对象存储桶作为内容来源', icon: Cloudy, tone: 'purple' },
  { key: 'smb', label: 'SMB', desc: '通过 SMB 协议访问网络共享', icon: Connection, tone: 'green', disabled: true },
  { key: 'webdav', label: 'WebDAV', desc: '通过 WebDAV 协议访问远程存储', icon: Share, tone: 'orange', disabled: true },
]

const cloudProviders = [
  { key: 'aliyun', label: '阿里云盘', mark: '阿', tone: 'blue' },
  { key: 'baidu', label: '百度网盘', mark: '百', tone: 'blue' },
  { key: 'tianyi', label: '天翼云盘', icon: Cloudy, tone: 'orange' },
  { key: 'onedrive', label: 'OneDrive', icon: MostlyCloudy, tone: 'blue' },
  { key: 'google', label: 'Google Drive', mark: 'G', tone: 'green' },
  { key: 'custom', label: '自定义', icon: Link, tone: 'slate' },
]

const defaultForm = {
  name: '',
  path: '',
  endpoint: '',
  bucketName: '',
  sourceKey: '',
  server: '',
  share: '',
  port: '',
  username: '',
  password: '',
  prefix: '',
  account: '',
  desc: '',
}

const form = reactive({ ...defaultForm })
const activeType = ref(props.initialType)
const activeProvider = ref('aliyun')

const typeMap = computed(() => ({
  local: {
    title: '添加本地存储',
    subtitle: '将本地磁盘目录添加到书匣',
    headerIcon: FolderOpened,
    tone: 'blue',
    sections: [
      {
        title: '基本设置',
        fields: [
          { key: 'name', label: '存储名称', required: true, placeholder: '请输入存储名称' },
          { key: 'type', label: '类型', required: true, type: 'select', value: '本地目录' },
          { key: 'path', label: '目录路径', required: true, type: 'path', placeholder: '输入本地目录路径', hint: '例如：/volume1/books 或 Docker 挂载后的 /jeecg-boot/books' },
          { key: 'availability', label: '可用空间', type: 'availability' },
        ],
      },
      {
        title: '高级选项',
        fields: [
          { key: 'sourceKey', label: '存储键（可选）', placeholder: '为空时后端自动生成' },
          { key: 'desc', label: '描述（可选）', type: 'textarea', placeholder: '请输入存储描述，便于管理和识别' },
        ],
      },
    ],
  },
  minio: {
    title: '添加 MinIO 存储',
    subtitle: '连接 MinIO 或兼容 S3 的对象存储桶',
    headerIcon: Cloudy,
    tone: 'purple',
    sections: [
      {
        title: '连接设置',
        fields: [
          { key: 'endpoint', label: '端点地址', placeholder: '例如：http://minio:9000' },
          { key: 'bucketName', label: '桶名称', required: true, placeholder: '请输入 bucket 名称' },
          { key: 'sourceKey', label: '存储键（可选）', placeholder: '为空时后端自动生成' },
        ],
      },
      {
        title: '基本设置',
        fields: [
          { key: 'name', label: '存储名称', required: true, placeholder: '请输入存储名称' },
          { key: 'desc', label: '描述（可选）', type: 'textarea', placeholder: '请输入存储描述，便于管理和识别' },
          { key: 'availability', label: '可用空间', type: 'availability' },
        ],
      },
    ],
  },
  smb: {
    title: '添加 SMB 存储',
    subtitle: '通过 SMB 协议访问网络共享目录',
    headerIcon: Connection,
    tone: 'green',
    disabledReason: '当前后端存储源配置仅支持 local/minio，SMB 接口放开后这里可以直接提交真实配置。',
    sections: [
      {
        title: '连接设置',
        fields: [
          { key: 'server', label: '服务器地址', required: true, placeholder: '请输入服务器 IP 或主机名', hint: '例如：192.168.1.100 或 nas.local' },
          { key: 'share', label: '共享名称', required: true, placeholder: '请输入共享名称', hint: '例如：books、media、data' },
          { key: 'port', label: '端口', placeholder: '445', hint: '默认 445，通常无需修改' },
          { key: 'username', label: '用户名', required: true, placeholder: '请输入用户名' },
          { key: 'password', label: '密码', required: true, type: 'password', placeholder: '请输入密码' },
          { key: 'test', label: '', class: 'test-row', type: 'test', hint: '测试连接到 SMB 服务器' },
        ],
      },
      {
        title: '基本设置',
        fields: [
          { key: 'name', label: '存储名称', required: true, placeholder: '请输入存储名称' },
          { key: 'path', label: '目录路径', placeholder: '/', hint: '留空表示使用共享根目录' },
          { key: 'desc', label: '描述（可选）', type: 'textarea', placeholder: '请输入存储描述，便于管理和识别' },
        ],
      },
    ],
  },
  webdav: {
    title: '添加 WebDAV 存储',
    subtitle: '通过 WebDAV 协议访问远程 WebDAV 服务器',
    headerIcon: Share,
    tone: 'orange',
    disabledReason: '当前后端存储源配置仅支持 local/minio，WebDAV 接口放开后这里可以直接提交真实配置。',
    sections: [
      {
        title: '连接设置',
        fields: [
          { key: 'server', label: '服务器地址', required: true, placeholder: '请输入 WebDAV 服务器地址', hint: '例：https://dav.example.com/dav' },
          { key: 'port', label: '端口', placeholder: '443', hint: '默认 443，通常无需修改' },
          { key: 'prefix', label: '路径前缀', placeholder: '可选，WebDAV 根路径的子路径', hint: '例：/books' },
          { key: 'username', label: '用户名', required: true, placeholder: '请输入用户名' },
          { key: 'password', label: '密码', required: true, type: 'password', placeholder: '请输入密码' },
          { key: 'test', label: '', class: 'test-row', type: 'test', hint: '测试连接到 WebDAV 服务器' },
        ],
      },
      {
        title: '基本设置',
        fields: [
          { key: 'name', label: '存储名称', required: true, placeholder: '请输入存储名称' },
          { key: 'path', label: '目录路径', placeholder: '/', hint: '留空表示使用共享根目录' },
          { key: 'desc', label: '描述（可选）', type: 'textarea', placeholder: '请输入存储描述，便于管理和识别' },
          { key: 'availability', label: '可用空间', type: 'availability' },
        ],
      },
    ],
  },
}))

const current = computed(() => typeMap.value[activeType.value] || typeMap.value.local)

watch(() => props.modelValue, (open) => {
  if (open) {
    activeType.value = storageTypes.some((type) => type.key === props.initialType) ? props.initialType : 'local'
    activeProvider.value = 'aliyun'
    resetForm()
  }
})

function selectType(type) {
  activeType.value = type.key
}

function resetForm() {
  Object.assign(form, defaultForm)
}

function close() {
  if (props.submitting) return
  emit('update:modelValue', false)
}

function confirm() {
  const payload = buildPayload()
  if (!payload) return
  emit('confirm', payload)
}

function buildPayload() {
  if (activeType.value === 'local') {
    if (!form.name || !form.path) {
      ElMessage.warning('请填写存储名称和目录路径')
      return null
    }

    return {
      sourceType: 'local',
      sourceKey: form.sourceKey || undefined,
      sourceName: form.name,
      localBasePath: form.path,
      endpoint: form.path,
      status: 1,
      sortNo: 0,
      remark: form.desc || undefined,
    }
  }

  if (activeType.value === 'minio') {
    if (!form.name || !form.bucketName) {
      ElMessage.warning('请填写存储名称和桶名称')
      return null
    }

    return {
      sourceType: 'minio',
      sourceKey: form.sourceKey || undefined,
      sourceName: form.name,
      endpoint: form.endpoint || undefined,
      bucketName: form.bucketName,
      status: 1,
      sortNo: 0,
      remark: form.desc || undefined,
    }
  }

  ElMessage.warning('当前后端暂不支持该存储类型')
  return null
}
</script>

<style scoped>
.storage-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 28px;
}

.storage-modal__scrim {
  position: absolute;
  inset: 0;
  background: var(--admin-overlay);
  backdrop-filter: blur(2px);
}

.storage-modal__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(var(--admin-modal-lg), calc(100vw - 48px));
  max-height: calc(100vh - 40px);
  overflow: hidden;
  border: 1px solid var(--admin-modal-divider);
  border-radius: var(--admin-radius-card);
  background: var(--admin-modal-body-bg);
  box-shadow: var(--admin-shadow-modal);
  color: var(--admin-text);
}

.storage-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex: 0 0 auto;
  min-height: 72px;
  padding: var(--admin-modal-header-padding);
  border-bottom: 1px solid var(--admin-modal-divider);
  background: var(--admin-modal-header-bg);
}

.storage-modal__panel.has-subtitle .storage-modal__header {
  min-height: 98px;
}

.storage-modal__title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.storage-modal__title h2 {
  margin: 0;
  color: var(--admin-title);
  font-size: var(--admin-text-modal-title);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.1;
}

.storage-modal__title p {
  margin: 7px 0 0;
  color: var(--admin-text-muted);
  font-size: var(--admin-text-md);
  font-weight: 600;
}

.storage-modal__title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--admin-radius-card);
  font-size: 25px;
}

.storage-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1e315f;
  cursor: pointer;
  font-size: 18px;
}

.storage-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--admin-modal-body-padding);
  background: var(--admin-modal-body-bg);
}

.modal-section + .modal-section {
  margin-top: 28px;
}

.modal-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: #0e2a63;
  font-size: var(--admin-text-section);
  font-weight: 800;
  letter-spacing: 0;
}

.modal-section h3 i {
  width: 3px;
  height: 16px;
  border-radius: 999px;
  background: var(--admin-primary);
}

.storage-type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.storage-type-card,
.cloud-provider {
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-control);
  background: #fff;
  color: var(--admin-text);
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.storage-type-card {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 116px;
  padding: 18px 16px;
  text-align: left;
}

.storage-type-card.active,
.cloud-provider.active {
  border-color: #9ec5ff;
  background: #fbfdff;
  box-shadow: 0 0 0 1px rgba(20, 118, 255, 0.05);
}

.storage-type-card.disabled {
  background: #fbfcff;
  color: #7282a4;
}

.storage-type-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 7px;
  font-size: 21px;
}

.storage-type-card strong {
  display: block;
  color: var(--admin-text);
  font-size: var(--admin-text-section);
  font-weight: 800;
}

.storage-type-card span:last-child {
  display: block;
  margin-top: 8px;
  color: var(--admin-text-muted);
  font-size: var(--admin-text-xs);
  line-height: 1.45;
}

.storage-type-card small {
  display: inline-flex;
  margin-top: 8px;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
}

.cloud-provider-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.cloud-provider {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 13px;
  min-height: 118px;
  padding: 14px 8px;
}

.cloud-provider__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 800;
}

.cloud-provider strong {
  color: var(--admin-text);
  font-size: var(--admin-text-sm);
  font-weight: 800;
  white-space: nowrap;
}

.cloud-provider__mark.aliyun { background: #eaf2ff; color: #1677ff; }
.cloud-provider__mark.baidu { background: #f3fbff; color: #168bff; }
.cloud-provider__mark.tianyi { background: #fff7ed; color: #f97316; }
.cloud-provider__mark.onedrive { background: #eaf4ff; color: #0b74da; }
.cloud-provider__mark.google { background: #f4fbf2; color: #16a34a; }
.cloud-provider__mark.custom { background: #f8fafc; color: #334155; }

.modal-form {
  display: grid;
  gap: 14px;
}

.modal-field {
  display: grid;
  grid-template-columns: var(--admin-modal-label-width) minmax(0, 1fr);
  align-items: start;
  gap: 18px;
}

.storage-modal__panel.is-smb .modal-field {
  grid-template-columns: var(--admin-modal-label-width-compact) minmax(0, 1fr);
}

.modal-field__label {
  padding-top: 10px;
  color: #314a80;
  font-size: var(--admin-text-md);
  font-weight: 700;
}

.modal-field__label em {
  margin-left: 4px;
  color: #ff4d4f;
  font-style: normal;
}

.modal-field__control {
  display: block;
  min-width: 0;
}

.modal-input,
.modal-path-input,
.modal-textarea {
  width: 100%;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-control);
  background: #fff;
  color: var(--admin-text);
  box-shadow: 0 1px 2px rgba(31, 55, 99, 0.02);
}

.modal-input,
.modal-path-input {
  display: flex;
  align-items: center;
  min-height: var(--admin-input-height);
  padding: 0 13px;
  font-size: var(--admin-text-md);
}

input.modal-input::placeholder,
.modal-path-input input::placeholder {
  color: var(--admin-placeholder);
}

.modal-select {
  justify-content: space-between;
  color: #203968;
  font-weight: 700;
}

.modal-path-input {
  padding: 0;
}

.modal-path-input input {
  min-width: 0;
  flex: 1;
  height: 100%;
  min-height: var(--admin-input-height);
  padding: 0 13px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--admin-text);
  font: inherit;
}

.modal-path-input button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 78px;
  min-height: 39px;
  border: 0;
  border-left: 1px solid var(--admin-border);
  background: #fff;
  color: #102557;
  cursor: default;
  font-weight: 800;
}

.modal-textarea {
  display: block;
  min-height: 78px;
  padding: 11px 13px;
  resize: vertical;
  color: var(--admin-text);
  font: inherit;
}

.modal-textarea::placeholder {
  color: var(--admin-placeholder);
}

.modal-field small {
  display: block;
  margin-top: 8px;
  color: #697da7;
  font-size: var(--admin-text-sm);
  line-height: 1.35;
}

.availability-row {
  min-height: 46px;
}

.availability-row__status {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #19ad64;
  font-size: var(--admin-text-sm);
}

.availability-row__status .el-icon {
  margin-top: 2px;
}

.availability-row__status strong {
  font-weight: 800;
}

.availability-row__status small {
  display: block;
  margin: 23px 0 0 -70px;
  color: #697da7;
}

.test-row .modal-field__control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-row button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 39px;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-control);
  background: #fff;
  color: #102557;
  font-size: var(--admin-text-md);
  font-weight: 800;
}

.test-row small {
  margin: 0;
  color: #697da7;
}

.auth-field .modal-field__control {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.auth-option {
  min-height: 64px;
  padding: 12px 14px 12px 33px;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-control);
  background: #fff;
  color: var(--admin-text);
  text-align: left;
}

.auth-option.active {
  border-color: #9ec5ff;
  background:
    radial-gradient(circle at 16px 18px, var(--admin-primary) 0 5px, transparent 6px),
    radial-gradient(circle at 16px 18px, #fff 0 1.6px, transparent 2px),
    #fbfdff;
}

.auth-option:not(.active) {
  background:
    radial-gradient(circle at 16px 18px, transparent 0 5px, #b8c4d9 5px 6px, transparent 7px),
    #fff;
}

.auth-option strong {
  display: block;
  font-size: var(--admin-text-md);
  font-weight: 800;
}

.auth-option small {
  margin-top: 4px;
}

.storage-modal__notice {
  margin-top: 22px;
  padding: 12px 14px;
  border: 1px solid #fed7aa;
  border-radius: var(--admin-radius-control);
  background: #fff7ed;
  color: #c2410c;
  font-size: var(--admin-text-sm);
  font-weight: 700;
}

.storage-modal__footer {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: 14px;
  padding: var(--admin-modal-footer-padding);
  border-top: 1px solid var(--admin-modal-divider);
  background: var(--admin-modal-footer-bg);
  box-shadow: 0 -8px 18px rgba(42, 82, 150, 0.035);
}

.plain-btn,
.primary-btn {
  min-width: var(--admin-button-min-width);
  height: var(--admin-control-height);
  border-radius: var(--admin-radius-control);
  cursor: pointer;
  font-weight: 800;
}

.plain-btn {
  border: 1px solid var(--admin-border);
  background: #fff;
  color: var(--admin-text);
}

.primary-btn {
  border: 1px solid var(--admin-primary);
  background: var(--admin-primary);
  color: #fff;
  box-shadow: var(--admin-shadow-primary);
}

.plain-btn:disabled,
.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.tone-blue { background: #eaf2ff; color: #1476ff; }
.tone-green { background: #ecfdf5; color: #16a34a; }
.tone-purple { background: #f5f3ff; color: #7c3aed; }
.tone-orange { background: #fff7ed; color: #f97316; }
.tone-slate { background: #f8fafc; color: #334155; }

@media (max-width: 760px) {
  .storage-modal {
    padding: 14px;
  }

  .storage-modal__panel {
    width: var(--admin-modal-mobile-width);
  }

  .storage-modal__header,
  .storage-modal__body,
  .storage-modal__footer {
    padding-right: 18px;
    padding-left: 18px;
  }

  .storage-type-grid,
  .cloud-provider-grid,
  .auth-field .modal-field__control {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-field,
  .storage-modal__panel.is-smb .modal-field {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .modal-field__label {
    padding-top: 0;
  }
}
</style>

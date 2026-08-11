<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'scan' ? '扫描有声目录' : '上传有声文件'"
    width="680px"
    destroy-on-close
    @closed="reset"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-alert
      class="audio-import-dialog__notice"
      :title="mode === 'scan'
        ? '一个目录识别为一个专辑，目录内音频按文件名自然排序生成分集；重复扫描不会重复导入同一路径。'
        : '本次选择的音频会组成一个专辑，导入后默认下架，由管理员确认内容后再上架。'"
      type="info"
      show-icon
      :closable="false"
    />

    <el-form label-position="top">
      <el-form-item v-if="mode === 'upload'" label="内容归属">
        <el-radio-group v-model="importMode">
          <el-radio-button value="new">新建有声内容</el-radio-button>
          <el-radio-button value="merge">合并为已有内容的新格式</el-radio-button>
        </el-radio-group>
        <p class="audio-import-dialog__help">
          只有内容完全相同、仅音频格式不同的文件才可合并；不同演播版本应新建为独立内容。
        </p>
      </el-form-item>

      <template v-if="mode === 'upload' && importMode === 'merge'">
        <el-form-item label="已有有声内容" required>
          <el-select
            v-model="mergeBookId"
            :loading="candidatesLoading"
            filterable
            class="audio-import-dialog__control"
            placeholder="搜索并选择要合并的有声内容"
          >
            <el-option
              v-for="item in mergeCandidates"
              :key="item.id"
              :label="`${item.title} · ${item.anchor || '未知演播者'}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <div class="audio-import-dialog__grid">
          <el-form-item label="格式版本名称">
            <el-input v-model="variantLabel" maxlength="80" placeholder="可选，如 FLAC 无损版" />
          </el-form-item>
          <el-form-item label="默认格式">
            <el-checkbox v-model="makeDefaultVariant">导入后设为默认播放格式</el-checkbox>
          </el-form-item>
        </div>
      </template>

      <el-form-item label="目标存储" required>
        <el-select
          v-model="storageLocationId"
          :loading="locationsLoading"
          filterable
          class="audio-import-dialog__control"
          :placeholder="mode === 'scan' ? '请选择已登记的有声本地目录' : '请选择有声存储位置'"
        >
          <el-option
            v-for="location in availableLocations"
            :key="location.id"
            :label="formatLocation(location)"
            :value="location.id"
          />
        </el-select>
        <p class="audio-import-dialog__help">
          {{ mode === 'scan' ? '这里只展示存储管理中已启用、后端可读取且业务范围为“有声”的本地目录；扫描不会改写原文件。' : '这里只展示存储管理中已启用、可写且业务范围为“有声”的位置。' }}
        </p>
      </el-form-item>

      <template v-if="mode === 'upload'">
        <div v-if="importMode === 'new'" class="audio-import-dialog__grid">
          <el-form-item label="专辑名称">
            <el-input v-model="albumName" maxlength="120" show-word-limit placeholder="未填写时使用首个音频文件名" />
          </el-form-item>
          <el-form-item label="主播 / 演播者">
            <el-input v-model="narratorName" maxlength="80" placeholder="可选" />
          </el-form-item>
        </div>

        <el-form-item label="音频文件" required>
          <input
            ref="audioInputRef"
            class="audio-import-dialog__native-input"
            type="file"
            accept=".mp3,.m4a,.aac,.wav,.flac,.ogg,.opus,.wma,audio/*"
            multiple
            @change="handleAudioFiles"
          />
          <div class="audio-import-dialog__picker">
            <el-button @click="audioInputRef?.click()">选择音频</el-button>
            <span>{{ audioFiles.length ? `已选择 ${audioFiles.length} 个文件` : '支持 MP3、M4A、AAC、WAV、FLAC、OGG、OPUS、WMA' }}</span>
          </div>
          <div v-if="audioFiles.length" class="audio-import-dialog__files">
            <span v-for="file in audioFiles.slice(0, 5)" :key="`${file.name}-${file.size}`" :title="file.name">{{ file.name }}</span>
            <strong v-if="audioFiles.length > 5">另有 {{ audioFiles.length - 5 }} 个文件</strong>
          </div>
        </el-form-item>

        <el-form-item label="专辑封面">
          <input
            ref="coverInputRef"
            class="audio-import-dialog__native-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/*"
            @change="handleCoverFile"
          />
          <div class="audio-import-dialog__picker">
            <el-button @click="coverInputRef?.click()">选择封面</el-button>
            <span :title="coverFile?.name">{{ coverFile?.name || '可选，支持 JPG、PNG、WEBP' }}</span>
          </div>
        </el-form-item>
      </template>

      <el-form-item v-else label="本次最多扫描文件数">
        <el-input-number v-model="maxFiles" :min="1" :max="20000" :step="100" />
        <p class="audio-import-dialog__help">用于控制单次扫描规模，不会删除或移动原文件。</p>
      </el-form-item>
    </el-form>

    <el-empty
      v-if="!locationsLoading && availableLocations.length === 0"
      :description="mode === 'scan' ? '暂无可扫描的有声本地目录' : '暂无可用的有声存储位置'"
      :image-size="72"
    />

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button :loading="submitting" type="primary" @click="submit">
        {{ mode === 'scan' ? '提交扫描任务' : '开始上传' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEligibleStorageLocations } from '../../api/resourceManagement'
import { fetchAudioPage, importAudioMedia, scanAudioLocal } from '../../api/mediaContent'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialMode: { type: String, default: 'upload' },
})

const emit = defineEmits(['update:visible', 'imported'])
const mode = ref('upload')
const importMode = ref('new')
const locations = ref([])
const mergeCandidates = ref([])
const locationsLoading = ref(false)
const candidatesLoading = ref(false)
const submitting = ref(false)
const storageLocationId = ref('')
const albumName = ref('')
const narratorName = ref('')
const audioFiles = ref([])
const coverFile = ref(null)
const mergeBookId = ref('')
const variantLabel = ref('')
const makeDefaultVariant = ref(false)
const maxFiles = ref(5000)
const audioInputRef = ref(null)
const coverInputRef = ref(null)

const availableLocations = computed(() => mode.value === 'scan'
  ? locations.value.filter((item) => String(item.raw?.sourceType || '').toLowerCase() === 'local')
  : locations.value)

watch(() => props.visible, async (value) => {
  if (!value) return
  mode.value = props.initialMode === 'scan' ? 'scan' : 'upload'
  await nextTick()
  await Promise.all([loadLocations(), loadMergeCandidates()])
})

watch(mode, selectPreferredLocation)

async function loadLocations() {
  locationsLoading.value = true
  try {
    locations.value = await fetchEligibleStorageLocations({
      bizType: 'audio',
      writableOnly: mode.value !== 'scan',
    })
    selectPreferredLocation()
  } catch (error) {
    locations.value = []
    ElMessage.error(error.message || '获取有声存储位置失败')
  } finally {
    locationsLoading.value = false
  }
}

async function loadMergeCandidates() {
  candidatesLoading.value = true
  try {
    const page = await fetchAudioPage({ pageNo: 1, pageSize: 200 })
    mergeCandidates.value = page.records || []
  } catch (error) {
    mergeCandidates.value = []
    ElMessage.error(error.message || '获取已有有声内容失败')
  } finally {
    candidatesLoading.value = false
  }
}

function selectPreferredLocation() {
  if (availableLocations.value.some((item) => item.id === storageLocationId.value)) return
  const preferred = availableLocations.value.find((item) => item.defaultAudio)
    || availableLocations.value[0]
  storageLocationId.value = preferred?.id || ''
}

function handleAudioFiles(event) {
  audioFiles.value = Array.from(event.target.files || [])
}

function handleCoverFile(event) {
  coverFile.value = event.target.files?.[0] || null
}

async function submit() {
  if (!storageLocationId.value) {
    ElMessage.warning(mode.value === 'scan' ? '请选择可扫描的有声本地目录' : '请选择有声存储位置')
    return
  }
  if (mode.value === 'upload' && audioFiles.value.length === 0) {
    ElMessage.warning('请至少选择一个音频文件')
    return
  }
  if (mode.value === 'upload' && importMode.value === 'merge' && !mergeBookId.value) {
    ElMessage.warning('请选择要合并的已有有声内容')
    return
  }

  submitting.value = true
  try {
    const result = mode.value === 'scan' ? await submitScan() : await submitUpload()
    if (mode.value === 'scan') {
      ElMessage.success(result.message || '有声目录扫描已进入任务中心')
      emit('imported', result)
      emit('update:visible', false)
      return
    }
    const imported = Number(result.trackCount || 0)
    const albums = Number(result.albumCount || 0)
    const skipped = Number(result.skippedCount || 0)
    ElMessage.success(`处理完成：${albums} 个有声内容、${imported} 个分集${skipped ? `，跳过 ${skipped} 个重复文件` : ''}`)
    emit('imported', result)
    emit('update:visible', false)
  } catch (error) {
    ElMessage.error(error.message || '有声导入失败')
  } finally {
    submitting.value = false
  }
}

async function submitUpload() {
  const formData = new FormData()
  if (albumName.value.trim()) formData.append('albumName', albumName.value.trim())
  if (narratorName.value.trim()) formData.append('narratorName', narratorName.value.trim())
  if (importMode.value === 'merge') {
    formData.append('mergeBookId', mergeBookId.value)
    if (variantLabel.value.trim()) formData.append('variantLabel', variantLabel.value.trim())
    formData.append('makeDefaultVariant', String(makeDefaultVariant.value))
  }
  formData.append('storageLocationId', storageLocationId.value)
  audioFiles.value.forEach((file) => formData.append('files', file))
  if (coverFile.value) formData.append('cover', coverFile.value)
  return importAudioMedia(formData)
}

function submitScan() {
  return scanAudioLocal({
    storageLocationId: storageLocationId.value,
    maxFiles: maxFiles.value,
  })
}

function formatLocation(location = {}) {
  const type = String(location.raw?.sourceType || '').toLowerCase() === 'local' ? '本地' : 'MinIO'
  const path = location.raw?.localBasePath || location.raw?.bucketName || location.path || ''
  return `${location.name} · ${type}${path ? ` · ${path}` : ''}`
}

function reset() {
  storageLocationId.value = ''
  albumName.value = ''
  narratorName.value = ''
  importMode.value = 'new'
  mergeBookId.value = ''
  variantLabel.value = ''
  makeDefaultVariant.value = false
  audioFiles.value = []
  coverFile.value = null
  maxFiles.value = 5000
}
</script>

<style src="../../assets/style/components/media-import-dialog.css"></style>

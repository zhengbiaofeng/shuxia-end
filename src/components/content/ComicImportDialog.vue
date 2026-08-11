<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="680px"
    destroy-on-close
    @closed="reset"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-alert
      class="comic-import-dialog__notice"
      :title="mode === 'scan'
        ? '所选目录下的一级文件夹识别为漫画，下一层文件夹识别为章节；封面图片请命名为 cover、folder、front 或封面。重复扫描不会重复导入同一路径。'
        : uploadKind === 'archive'
          ? '支持 ZIP、CBZ、无密码单卷 RAR4/CBR 压缩包；根目录图片组成一章，子目录按目录生成章节。RAR5、加密包和多卷包暂不支持。导入后默认下架。'
          : '本次选择的图片按文件名自然排序，组成一部漫画的一个章节；导入后默认下架，由管理员确认内容后再上架。'"
      type="info"
      show-icon
      :closable="false"
    />

    <el-form label-position="top">
      <el-form-item v-if="mode === 'upload'" label="内容归属">
        <el-radio-group v-model="importMode">
          <el-radio-button value="new">新建漫画内容</el-radio-button>
          <el-radio-button value="merge">合并为已有内容的新格式</el-radio-button>
        </el-radio-group>
        <p class="comic-import-dialog__help">
          只有内容完全相同、仅容器或图片格式不同的文件才可合并；不同版本、画集或扫描版应独立新建。
        </p>
      </el-form-item>

      <template v-if="mode === 'upload' && importMode === 'merge'">
        <el-form-item label="已有漫画内容" required>
          <el-select
            v-model="mergeBookId"
            :loading="candidatesLoading"
            filterable
            class="comic-import-dialog__control"
            placeholder="搜索并选择要合并的漫画内容"
          >
            <el-option
              v-for="item in mergeCandidates"
              :key="item.id"
              :label="`${item.title} · ${item.author || '未知作者'}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <div class="comic-import-dialog__grid">
          <el-form-item label="格式版本名称">
            <el-input v-model="variantLabel" maxlength="80" placeholder="可选，如 CBZ 高清版" />
          </el-form-item>
          <el-form-item label="默认格式">
            <el-checkbox v-model="makeDefaultVariant">导入后设为默认阅读格式</el-checkbox>
          </el-form-item>
        </div>
      </template>

      <el-form-item label="目标存储" required>
        <el-select
          v-model="storageLocationId"
          :loading="locationsLoading"
          filterable
          class="comic-import-dialog__control"
          :placeholder="mode === 'scan' ? '请选择已登记的漫画本地目录' : '请选择漫画存储位置'"
        >
          <el-option
            v-for="location in availableLocations"
            :key="location.id"
            :label="formatLocation(location)"
            :value="location.id"
          />
        </el-select>
        <p class="comic-import-dialog__help">
          {{ mode === 'scan'
            ? '仅展示存储管理中已启用、后端可读取且业务范围包含“漫画”的本地目录；扫描不会改写原文件。'
            : '仅展示存储管理中已启用、可写且业务范围包含“漫画”的位置。' }}
        </p>
      </el-form-item>

      <template v-if="mode === 'upload'">
        <el-form-item label="导入方式">
          <el-radio-group v-model="uploadKind">
            <el-radio-button value="pages">章节图片</el-radio-button>
            <el-radio-button value="archive">ZIP / CBZ / CBR</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-if="importMode === 'new'" class="comic-import-dialog__grid">
          <el-form-item label="漫画名称" :required="uploadKind === 'pages'">
            <el-input v-model="comicName" maxlength="120" show-word-limit :placeholder="uploadKind === 'archive' ? '可选，默认使用压缩包文件名' : '请输入漫画名称'" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="authorName" maxlength="80" placeholder="可选" />
          </el-form-item>
        </div>

        <el-form-item v-if="uploadKind === 'pages'" label="章节名称">
          <el-input v-model="episodeTitle" maxlength="120" placeholder="未填写时使用“第 1 话”" />
        </el-form-item>

        <el-form-item v-if="uploadKind === 'pages'" label="章节图片" required>
          <input
            ref="pageInputRef"
            class="comic-import-dialog__native-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/*"
            multiple
            @change="handlePageFiles"
          />
          <div class="comic-import-dialog__picker">
            <el-button @click="pageInputRef?.click()">选择图片</el-button>
            <span>{{ pageFiles.length ? `已选择 ${pageFiles.length} 张图片` : '支持 JPG、PNG、WEBP，按文件名自然排序' }}</span>
          </div>
          <div v-if="pageFiles.length" class="comic-import-dialog__files">
            <span v-for="file in pageFiles.slice(0, 8)" :key="`${file.name}-${file.size}`" :title="file.name">{{ file.name }}</span>
            <strong v-if="pageFiles.length > 8">另有 {{ pageFiles.length - 8 }} 张图片</strong>
          </div>
        </el-form-item>

        <el-form-item v-else label="漫画压缩包" required>
          <input
            ref="archiveInputRef"
            class="comic-import-dialog__native-input"
            type="file"
            accept=".zip,.cbz,.cbr,.rar,application/zip,application/vnd.rar,application/x-rar-compressed"
            @change="handleArchiveFile"
          />
          <div class="comic-import-dialog__picker">
            <el-button @click="archiveInputRef?.click()">选择压缩包</el-button>
            <span :title="archiveFile?.name">{{ archiveFile?.name || '支持 ZIP、CBZ、CBR、RAR，最大规模由服务端安全限制控制' }}</span>
          </div>
        </el-form-item>

        <el-form-item label="漫画封面">
          <input
            ref="coverInputRef"
            class="comic-import-dialog__native-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/*"
            @change="handleCoverFile"
          />
          <div class="comic-import-dialog__picker">
            <el-button @click="coverInputRef?.click()">选择封面</el-button>
            <span :title="coverFile?.name">{{ coverFile?.name || '可选，支持 JPG、PNG、WEBP' }}</span>
          </div>
        </el-form-item>
      </template>

      <el-form-item v-else label="本次最多扫描源文件数">
        <el-input-number v-model="maxFiles" :min="1" :max="20000" :step="100" />
        <p class="comic-import-dialog__help">支持图片目录与 PDF；用于控制单次扫描规模，不会删除或移动原文件。</p>
      </el-form-item>
    </el-form>

    <el-empty
      v-if="!locationsLoading && availableLocations.length === 0"
      :description="mode === 'scan' ? '暂无可扫描的漫画本地目录' : '暂无可用的漫画存储位置'"
      :image-size="72"
    />

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button :loading="submitting" type="primary" @click="submit">
        {{ mode === 'scan' ? '提交扫描任务' : uploadKind === 'archive' ? '导入压缩包' : '开始上传' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEligibleStorageLocations } from '../../api/resourceManagement'
import { fetchComicPage, importComicArchive, importComicMedia, scanComicLocal } from '../../api/mediaContent'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialMode: { type: String, default: 'upload' },
})

const emit = defineEmits(['update:visible', 'imported'])
const mode = ref('upload')
const importMode = ref('new')
const uploadKind = ref('pages')
const locations = ref([])
const mergeCandidates = ref([])
const locationsLoading = ref(false)
const candidatesLoading = ref(false)
const submitting = ref(false)
const storageLocationId = ref('')
const comicName = ref('')
const authorName = ref('')
const episodeTitle = ref('')
const pageFiles = ref([])
const coverFile = ref(null)
const archiveFile = ref(null)
const mergeBookId = ref('')
const variantLabel = ref('')
const makeDefaultVariant = ref(false)
const maxFiles = ref(5000)
const pageInputRef = ref(null)
const coverInputRef = ref(null)
const archiveInputRef = ref(null)

const dialogTitle = computed(() => {
  if (mode.value === 'scan') return '扫描漫画目录'
  return uploadKind.value === 'archive' ? '导入漫画压缩包' : '上传漫画图片'
})

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
      bizType: 'comic',
      writableOnly: mode.value !== 'scan',
    })
    selectPreferredLocation()
  } catch (error) {
    locations.value = []
    ElMessage.error(error.message || '获取漫画存储位置失败')
  } finally {
    locationsLoading.value = false
  }
}

async function loadMergeCandidates() {
  candidatesLoading.value = true
  try {
    const page = await fetchComicPage({ pageNo: 1, pageSize: 200 })
    mergeCandidates.value = page.records || []
  } catch (error) {
    mergeCandidates.value = []
    ElMessage.error(error.message || '获取已有漫画内容失败')
  } finally {
    candidatesLoading.value = false
  }
}

function selectPreferredLocation() {
  if (availableLocations.value.some((item) => item.id === storageLocationId.value)) return
  const preferred = availableLocations.value.find((item) => item.defaultComic)
    || availableLocations.value[0]
  storageLocationId.value = preferred?.id || ''
}

function handlePageFiles(event) {
  pageFiles.value = Array.from(event.target.files || [])
}

function handleCoverFile(event) {
  coverFile.value = event.target.files?.[0] || null
}

function handleArchiveFile(event) {
  archiveFile.value = event.target.files?.[0] || null
}

async function submit() {
  if (!storageLocationId.value) {
    ElMessage.warning(mode.value === 'scan' ? '请选择可扫描的漫画本地目录' : '请选择漫画存储位置')
    return
  }
  if (mode.value === 'upload' && importMode.value === 'new'
      && uploadKind.value === 'pages' && !comicName.value.trim()) {
    ElMessage.warning('请输入漫画名称')
    return
  }
  if (mode.value === 'upload' && uploadKind.value === 'pages' && pageFiles.value.length === 0) {
    ElMessage.warning('请至少选择一张章节图片')
    return
  }
  if (mode.value === 'upload' && uploadKind.value === 'archive' && !archiveFile.value) {
    ElMessage.warning('请选择 ZIP、CBZ、CBR 或 RAR 漫画压缩包')
    return
  }
  if (mode.value === 'upload' && importMode.value === 'merge' && !mergeBookId.value) {
    ElMessage.warning('请选择要合并的已有漫画内容')
    return
  }

  submitting.value = true
  try {
    const result = mode.value === 'scan'
      ? await submitScan()
      : uploadKind.value === 'archive' ? await submitArchive() : await submitUpload()
    if (mode.value === 'scan') {
      ElMessage.success(result.message || '漫画目录扫描已进入任务中心')
      emit('imported', result)
      emit('update:visible', false)
      return
    }
    const comics = Number(result.comicCount || 0)
    const episodes = Number(result.episodeCount || 0)
    const pages = Number(result.pageCount || 0)
    const skipped = Number(result.skippedCount || 0)
    ElMessage.success(`处理完成：${comics} 部漫画内容、${episodes} 个章节、${pages} 张图片${skipped ? `，跳过 ${skipped} 张重复图片` : ''}`)
    emit('imported', result)
    emit('update:visible', false)
  } catch (error) {
    ElMessage.error(error.message || '漫画导入失败')
  } finally {
    submitting.value = false
  }
}

async function submitUpload() {
  const formData = new FormData()
  if (comicName.value.trim()) formData.append('comicName', comicName.value.trim())
  if (authorName.value.trim()) formData.append('authorName', authorName.value.trim())
  if (episodeTitle.value.trim()) formData.append('episodeTitle', episodeTitle.value.trim())
  appendMergeFields(formData)
  formData.append('storageLocationId', storageLocationId.value)
  pageFiles.value.forEach((file) => formData.append('pages', file))
  if (coverFile.value) formData.append('cover', coverFile.value)
  return importComicMedia(formData)
}

function submitScan() {
  return scanComicLocal({
    storageLocationId: storageLocationId.value,
    maxFiles: maxFiles.value,
  })
}

function submitArchive() {
  const formData = new FormData()
  if (comicName.value.trim()) formData.append('comicName', comicName.value.trim())
  if (authorName.value.trim()) formData.append('authorName', authorName.value.trim())
  appendMergeFields(formData)
  formData.append('storageLocationId', storageLocationId.value)
  formData.append('archive', archiveFile.value)
  if (coverFile.value) formData.append('cover', coverFile.value)
  return importComicArchive(formData)
}

function appendMergeFields(formData) {
  if (importMode.value !== 'merge') return
  formData.append('mergeBookId', mergeBookId.value)
  if (variantLabel.value.trim()) formData.append('variantLabel', variantLabel.value.trim())
  formData.append('makeDefaultVariant', String(makeDefaultVariant.value))
}

function formatLocation(location = {}) {
  const type = String(location.raw?.sourceType || '').toLowerCase() === 'local' ? '本地' : 'MinIO'
  const path = location.raw?.localBasePath || location.raw?.bucketName || location.path || ''
  return `${location.name} · ${type}${path ? ` · ${path}` : ''}`
}

function reset() {
  storageLocationId.value = ''
  comicName.value = ''
  authorName.value = ''
  importMode.value = 'new'
  mergeBookId.value = ''
  variantLabel.value = ''
  makeDefaultVariant.value = false
  episodeTitle.value = ''
  pageFiles.value = []
  coverFile.value = null
  archiveFile.value = null
  uploadKind.value = 'pages'
  maxFiles.value = 5000
}
</script>

<style src="../../assets/style/components/media-import-dialog.css"></style>

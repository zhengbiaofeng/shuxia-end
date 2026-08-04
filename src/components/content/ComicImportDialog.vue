<template>
  <el-dialog
    :model-value="visible"
    :title="mode === 'scan' ? '扫描漫画目录' : '上传漫画图片'"
    width="680px"
    destroy-on-close
    @closed="reset"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-alert
      class="comic-import-dialog__notice"
      :title="mode === 'scan'
        ? '所选目录下的一级文件夹识别为漫画，下一层文件夹识别为章节；封面图片请命名为 cover、folder、front 或封面。重复扫描不会重复导入同一路径。'
        : '本次选择的图片按文件名自然排序，组成一部漫画的一个章节；导入后默认下架，由管理员确认内容后再上架。'"
      type="info"
      show-icon
      :closable="false"
    />

    <el-form label-position="top">
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
            ? '仅展示存储管理中已启用、可写且业务范围包含“漫画”的本地目录。'
            : '仅展示存储管理中已启用、可写且业务范围包含“漫画”的位置。' }}
        </p>
      </el-form-item>

      <template v-if="mode === 'upload'">
        <div class="comic-import-dialog__grid">
          <el-form-item label="漫画名称" required>
            <el-input v-model="comicName" maxlength="120" show-word-limit placeholder="请输入漫画名称" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="authorName" maxlength="80" placeholder="可选" />
          </el-form-item>
        </div>

        <el-form-item label="章节名称">
          <el-input v-model="episodeTitle" maxlength="120" placeholder="未填写时使用“第 1 话”" />
        </el-form-item>

        <el-form-item label="章节图片" required>
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

      <el-form-item v-else label="本次最多扫描图片数">
        <el-input-number v-model="maxFiles" :min="1" :max="20000" :step="100" />
        <p class="comic-import-dialog__help">用于控制单次扫描规模，不会删除或移动原图片。</p>
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
        {{ mode === 'scan' ? '开始扫描' : '开始上传' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEligibleStorageLocations } from '../../api/resourceManagement'
import { importComicMedia, scanComicLocal } from '../../api/mediaContent'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialMode: { type: String, default: 'upload' },
})

const emit = defineEmits(['update:visible', 'imported'])
const mode = ref('upload')
const locations = ref([])
const locationsLoading = ref(false)
const submitting = ref(false)
const storageLocationId = ref('')
const comicName = ref('')
const authorName = ref('')
const episodeTitle = ref('')
const pageFiles = ref([])
const coverFile = ref(null)
const maxFiles = ref(5000)
const pageInputRef = ref(null)
const coverInputRef = ref(null)

const availableLocations = computed(() => mode.value === 'scan'
  ? locations.value.filter((item) => String(item.raw?.sourceType || '').toLowerCase() === 'local')
  : locations.value)

watch(() => props.visible, async (value) => {
  if (!value) return
  mode.value = props.initialMode === 'scan' ? 'scan' : 'upload'
  await nextTick()
  await loadLocations()
})

watch(mode, selectPreferredLocation)

async function loadLocations() {
  locationsLoading.value = true
  try {
    locations.value = await fetchEligibleStorageLocations({ bizType: 'comic', writableOnly: true })
    selectPreferredLocation()
  } catch (error) {
    locations.value = []
    ElMessage.error(error.message || '获取漫画存储位置失败')
  } finally {
    locationsLoading.value = false
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

async function submit() {
  if (!storageLocationId.value) {
    ElMessage.warning(mode.value === 'scan' ? '请选择可扫描的漫画本地目录' : '请选择漫画存储位置')
    return
  }
  if (mode.value === 'upload' && !comicName.value.trim()) {
    ElMessage.warning('请输入漫画名称')
    return
  }
  if (mode.value === 'upload' && pageFiles.value.length === 0) {
    ElMessage.warning('请至少选择一张章节图片')
    return
  }

  submitting.value = true
  try {
    const result = mode.value === 'scan' ? await submitScan() : await submitUpload()
    const comics = Number(result.comicCount || 0)
    const episodes = Number(result.episodeCount || 0)
    const pages = Number(result.pageCount || 0)
    const skipped = Number(result.skippedCount || 0)
    ElMessage.success(`处理完成：新增 ${comics} 部漫画、${episodes} 个章节、${pages} 张图片${skipped ? `，跳过 ${skipped} 张重复图片` : ''}`)
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
  formData.append('comicName', comicName.value.trim())
  if (authorName.value.trim()) formData.append('authorName', authorName.value.trim())
  if (episodeTitle.value.trim()) formData.append('episodeTitle', episodeTitle.value.trim())
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

function formatLocation(location = {}) {
  const type = String(location.raw?.sourceType || '').toLowerCase() === 'local' ? '本地' : 'MinIO'
  const path = location.raw?.localBasePath || location.raw?.bucketName || location.path || ''
  return `${location.name} · ${type}${path ? ` · ${path}` : ''}`
}

function reset() {
  storageLocationId.value = ''
  comicName.value = ''
  authorName.value = ''
  episodeTitle.value = ''
  pageFiles.value = []
  coverFile.value = null
  maxFiles.value = 5000
}
</script>

<style src="../../assets/style/components/media-import-dialog.css"></style>

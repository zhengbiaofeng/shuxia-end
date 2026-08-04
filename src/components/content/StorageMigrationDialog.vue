<template>
  <el-dialog
    :model-value="visible"
    :title="`迁移${contentLabel}`"
    width="560px"
    destroy-on-close
    @closed="resetForm"
    @open="loadLocations"
    @update:model-value="updateVisible"
  >
    <div class="storage-migration__summary">
      <span>已选择</span>
      <strong>{{ selectedCount }}</strong>
      <span>项{{ contentLabel }}，将迁移其已关联的文件{{ isNovel ? '和章节正文' : '' }}。</span>
    </div>

    <el-alert
      class="storage-migration__notice"
      title="迁移完成前会保留源文件；仅在目标文件写入并校验成功后才更新内容引用。"
      type="info"
      :closable="false"
      show-icon
    />

    <el-form label-position="top">
      <el-form-item label="目标存储位置" required>
        <el-select
          v-model="targetLocationId"
          :loading="loadingLocations"
          clearable
          filterable
          placeholder="请选择可写入的目标位置"
          style="width: 100%"
        >
          <el-option
            v-for="location in locations"
            :key="location.id"
            :label="formatLocation(location)"
            :value="location.id"
          />
        </el-select>
        <p v-if="!loadingLocations && !locations.length" class="storage-migration__empty">
          当前没有可用于{{ contentLabel }}的可写存储位置，请先在存储管理中配置。
        </p>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="updateVisible(false)">取消</el-button>
      <el-button :disabled="!selectedCount || !targetLocationId" :loading="submitting" type="primary" @click="submit">
        创建迁移任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEligibleStorageLocations, submitStorageMigration } from '../../api/resourceManagement'

const props = defineProps({
  visible: Boolean,
  bookIds: {
    type: Array,
    default: () => [],
  },
  bizType: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:visible', 'submitted'])

const locations = ref([])
const loadingLocations = ref(false)
const submitting = ref(false)
const targetLocationId = ref('')

const isNovel = computed(() => props.bizType === 'novel')
const contentLabel = computed(() => ({ ebook: '书籍', novel: '小说', audio: '有声读物', comic: '漫画' })[props.bizType] || '内容')
const selectedCount = computed(() => [...new Set(props.bookIds.filter(Boolean))].length)

function updateVisible(value) {
  emit('update:visible', value)
}

function formatLocation(location) {
  const scopeLabel = ({ both: '书籍 + 小说', ebook: '书籍', novel: '小说', audio: '有声', comic: '漫画' })[location.bizScope] || '未指定'
  const prefix = location.objectPrefix ? ` / ${location.objectPrefix}` : ''
  return `${location.name} (${scopeLabel}${prefix})`
}

async function loadLocations() {
  loadingLocations.value = true
  try {
    locations.value = await fetchEligibleStorageLocations({ bizType: props.bizType, writableOnly: true })
  } catch (error) {
    locations.value = []
    ElMessage.error(error?.message || `获取${contentLabel.value}存储位置失败`)
  } finally {
    loadingLocations.value = false
  }
}

async function submit() {
  const bookIds = [...new Set(props.bookIds.filter(Boolean))]
  if (!bookIds.length) {
    ElMessage.warning(`请先选择要迁移的${contentLabel.value}`)
    return
  }
  if (!targetLocationId.value) {
    ElMessage.warning('请选择目标存储位置')
    return
  }

  submitting.value = true
  try {
    const result = await submitStorageMigration({
      bookIds,
      targetLocationId: targetLocationId.value,
    })
    ElMessage.success(`已创建 ${bookIds.length} 项${contentLabel.value}的迁移任务，可在任务中心查看进度`)
    emit('submitted', result)
    updateVisible(false)
  } catch (error) {
    ElMessage.error(error?.message || '创建迁移任务失败')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  targetLocationId.value = ''
}
</script>

<style scoped>
.storage-migration__summary {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--el-text-color-regular);
  line-height: 1.65;
}

.storage-migration__summary strong {
  color: var(--el-color-primary);
  font-size: 24px;
}

.storage-migration__notice {
  margin: 18px 0;
}

.storage-migration__empty {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}
</style>

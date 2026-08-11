<template>
  <el-drawer
    :model-value="visible"
    :title="`${domainLabel}详情`"
    size="min(680px, 94vw)"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-loading="loading" class="media-detail">
      <template v-if="detail">
        <header class="media-detail__header">
          <AuthenticatedImage
            class="media-detail__cover"
            :src="coverUrl"
            :alt="detail.bookName || domainLabel"
          />
          <div class="media-detail__identity">
            <span class="media-detail__eyebrow">{{ domainLabel }}</span>
            <h2>{{ detail.bookName || `未命名${domainLabel}` }}</h2>
            <p>{{ detail.authorName || '作者未知' }}</p>
            <div class="media-detail__badges">
              <el-tag :type="Number(detail.publishStatus) === 1 ? 'success' : 'info'" effect="light">
                {{ publishStatusText }}
              </el-tag>
              <el-tag effect="plain">{{ domainStatusText }}</el-tag>
            </div>
          </div>
        </header>

        <el-descriptions :column="2" border class="media-detail__facts">
          <el-descriptions-item label="分类">{{ detail.categoryName || '未分类' }}</el-descriptions-item>
          <el-descriptions-item :label="type === 'comic' ? '章节数' : '单集数'">
            {{ formatNumber(detail.chapterCount) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="type === 'audio'" label="主播">
            {{ detail.narratorName || detail.authorName || '--' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="type === 'audio'" label="总时长">
            {{ formatDuration(detail.totalDurationSeconds) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">
            {{ formatDateTime(detail.updateTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="简介" :span="2">
            <span class="media-detail__introduction">{{ detail.introduction || '暂无简介' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <section class="media-detail__variants">
          <div class="media-detail__section-title">
            <div>
              <h3>格式版本</h3>
              <p>同一内容的不同文件格式；阅读端会在开始播放或阅读时提供选择。</p>
            </div>
            <span>共 {{ variants.length.toLocaleString('zh-CN') }} 种</span>
          </div>

          <el-table v-loading="variantLoading" :data="variants" size="small" class="media-detail__variant-table">
            <el-table-column label="格式" min-width="142">
              <template #default="{ row }">
                <div class="media-detail__format">
                  <strong>{{ row.formatCode }}</strong>
                  <span>{{ row.label }}</span>
                  <small v-if="!row.readable" class="media-detail__unreadable">仅存档，暂不可在线阅读</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="内容量" min-width="130">
              <template #default="{ row }">{{ variantContentText(row) }}</template>
            </el-table-column>
            <el-table-column label="文件大小" prop="fileSizeText" width="108" />
            <el-table-column label="默认" width="82" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.defaultVariant" type="success" effect="light">默认</el-tag>
                <span v-else class="media-detail__muted">--</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="148" align="right">
              <template #default="{ row }">
                <el-button
                  v-if="!row.defaultVariant && row.readable"
                  link
                  type="primary"
                  :loading="variantActionId === row.id"
                  @click="makeDefault(row)"
                >
                  设为默认
                </el-button>
                <span v-else class="media-detail__muted">当前默认</span>
                <el-tag v-if="!row.defaultVariant && !row.readable" type="warning" effect="light">不可阅读</el-tag>
                <el-button
                  link
                  type="danger"
                  :disabled="contentPublished"
                  :loading="variantActionId === `${row.id}:delete`"
                  @click="removeVariant(row)"
                >删除格式</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无格式版本" :image-size="64" />
            </template>
          </el-table>
        </section>

        <section class="media-detail__items">
          <div class="media-detail__section-title">
            <div>
              <h3>{{ type === 'comic' ? '章节' : '单集' }}</h3>
            </div>
            <span>共 {{ items.length.toLocaleString('zh-CN') }} 项</span>
          </div>
          <el-table :data="items" max-height="360" size="small">
            <el-table-column label="序号" prop="chapterNo" width="72" />
            <el-table-column :label="type === 'comic' ? '章节标题' : '单集标题'" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ row.chapterTitle || '--' }}</template>
            </el-table-column>
            <el-table-column :label="type === 'comic' ? '页数' : '时长'" width="112">
              <template #default="{ row }">
                {{ type === 'comic' ? `${formatNumber(row.pageCount)} 页` : formatDuration(row.durationSeconds) }}
              </template>
            </el-table-column>
            <el-table-column label="资源状态" prop="resourceStatus" width="112">
              <template #default="{ row }">{{ row.resourceStatus || '就绪' }}</template>
            </el-table-column>
            <template #empty>
              <el-empty :description="`暂无${type === 'comic' ? '章节' : '单集'}`" :image-size="72" />
            </template>
          </el-table>
        </section>
      </template>
      <el-empty v-else description="暂无详情" />
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteBookVariant, fetchBookVariants, setDefaultBookVariant } from '../../api/books'
import AuthenticatedImage from '../common/AuthenticatedImage.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, required: true },
  detail: { type: Object, default: null },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'default-changed', 'variant-changed'])

const variants = ref([])
const variantLoading = ref(false)
const variantActionId = ref('')

const domainLabel = computed(() => props.type === 'comic' ? '漫画' : '有声')
const coverUrl = computed(() => props.detail?.coverUrl || (props.detail?.coverFileId
  ? `/sx/book/preview?fileId=${encodeURIComponent(props.detail.coverFileId)}`
  : ''))
const publishStatusText = computed(() => ({ 0: '未上架', 1: '已上架', 2: '已下架' })[props.detail?.publishStatus] || '状态未知')
const contentPublished = computed(() => Number(props.detail?.publishStatus) === 1)
const domainStatusText = computed(() => ({
  serializing: '更新中',
  completed: '已完成',
  finished: '已完成',
  paused: '已暂停',
})[String(props.detail?.domainStatus || '').toLowerCase()] || props.detail?.domainStatus || '状态未知')

watch(
  () => [props.visible, props.detail?.id],
  ([visible, bookId]) => {
    if (visible && bookId) loadVariants(bookId)
    if (!visible) variants.value = []
  },
  { immediate: true },
)

async function loadVariants(bookId = props.detail?.id) {
  if (!bookId) return
  variantLoading.value = true
  try {
    variants.value = await fetchBookVariants(bookId)
  } catch (error) {
    variants.value = []
    ElMessage.error(error?.message || '格式版本加载失败')
  } finally {
    variantLoading.value = false
  }
}

async function makeDefault(row) {
  const bookId = props.detail?.id
  if (!bookId || !row?.id) return
  variantActionId.value = row.id
  try {
    await setDefaultBookVariant(bookId, row.id)
    await loadVariants(bookId)
    emit('default-changed', { bookId, variantId: row.id })
    ElMessage.success(`已将 ${row.label || row.formatCode} 设为默认格式`)
  } catch (error) {
    ElMessage.error(error?.message || '设置默认格式失败')
  } finally {
    variantActionId.value = ''
  }
}

async function removeVariant(row) {
  const bookId = props.detail?.id
  if (!bookId || !row?.id) return
  if (contentPublished.value) {
    ElMessage.warning(`已上架${domainLabel.value}不能删除格式，请先下架`)
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.formatCode}」格式吗？该格式的章节或分集也会从当前内容中移除。`,
      '删除格式版本',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
    variantActionId.value = `${row.id}:delete`
    await deleteBookVariant(bookId, row.id)
    await loadVariants(bookId)
    emit('variant-changed', { bookId })
    ElMessage.success(`已删除 ${row.formatCode} 格式`)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error?.message || '删除格式版本失败')
  } finally {
    variantActionId.value = ''
  }
}

function variantContentText(row) {
  if (props.type === 'audio') {
    const count = Number(row.itemCount || 0)
    const duration = formatDuration(Number(row.totalDurationMillis || 0) / 1000)
    return count ? `${count.toLocaleString('zh-CN')} 集${duration === '--' ? '' : ` · ${duration}`}` : duration
  }
  const pages = Number(row.pageCount || 0)
  const chapters = Number(row.itemCount || 0)
  if (pages) return `${pages.toLocaleString('zh-CN')} 页`
  return chapters ? `${chapters.toLocaleString('zh-CN')} 章` : '--'
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)))
  if (!total) return '--'
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const restSeconds = total % 60
  if (hours) return `${hours} 小时 ${minutes} 分钟`
  if (minutes) return `${minutes} 分钟 ${restSeconds} 秒`
  return `${restSeconds} 秒`
}

function formatDateTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 19)
}
</script>

<style scoped>
.media-detail {
  min-height: 240px;
}

.media-detail__header {
  align-items: flex-start;
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.media-detail__cover {
  border-radius: 6px;
  box-shadow: 0 8px 22px rgba(22, 54, 101, 0.13);
  flex: 0 0 108px;
  height: 148px;
  object-fit: cover;
  width: 108px;
}

.media-detail__identity {
  min-width: 0;
  padding-top: 4px;
}

.media-detail__eyebrow {
  color: #3478f6;
  font-size: 13px;
  font-weight: 700;
}

.media-detail__identity h2 {
  color: #10234a;
  font-size: 22px;
  line-height: 1.35;
  margin: 7px 0 6px;
  overflow-wrap: anywhere;
}

.media-detail__identity p {
  color: #7181a3;
  margin: 0 0 14px;
}

.media-detail__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.media-detail__facts,
.media-detail__variants {
  margin-bottom: 24px;
}

.media-detail__introduction {
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.media-detail__section-title {
  align-items: flex-end;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.media-detail__section-title h3 {
  color: #10234a;
  font-size: 16px;
  margin: 0;
}

.media-detail__section-title p {
  color: #8795b1;
  font-size: 13px;
  line-height: 1.5;
  margin: 5px 0 0;
}

.media-detail__section-title > span,
.media-detail__muted {
  color: #8795b1;
  font-size: 13px;
  white-space: nowrap;
}

.media-detail__variant-table {
  border-top: 1px solid #e5ebf5;
}

.media-detail__format {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.media-detail__format strong {
  color: #17305f;
  font-size: 13px;
}

.media-detail__format span {
  color: #7181a3;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-detail__unreadable {
  color: #b45309;
  font-size: 11px;
  line-height: 1.35;
}

@media (max-width: 560px) {
  .media-detail__header {
    gap: 14px;
  }

  .media-detail__cover {
    flex-basis: 84px;
    height: 116px;
    width: 84px;
  }

  .media-detail__identity h2 {
    font-size: 18px;
  }
}
</style>

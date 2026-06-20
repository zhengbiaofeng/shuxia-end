<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handlePageAction"
  >
    <div class="smart-scrape">
      <section class="url-panel">
        <div class="url-panel__main">
          <el-input
            v-model="url"
            class="url-input"
            clearable
            placeholder="https://book.douban.com/subject/1007305/"
            size="large"
            @keyup.enter="analyzeUrl"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <el-button :icon="Search" :loading="analyzing" size="large" type="primary" @click="analyzeUrl">
            解析
          </el-button>
        </div>
        <div class="url-panel__meta">
          <span>公开页面</span>
          <span>豆瓣元数据</span>
          <span>预览确认后入库</span>
        </div>
      </section>

      <ResourceMetricGrid :items="metrics" />

      <section v-if="preview" class="preview-layout">
        <aside class="cover-panel">
          <div class="cover-frame">
            <img v-if="previewCoverSrc" :src="previewCoverSrc" alt="" @error="handleCoverError" />
            <span v-else>{{ preview.bookName.slice(0, 1) || '书' }}</span>
          </div>
          <AdminStatusBadge
            :label="preview.conflict ? '检测到冲突' : '可导入'"
            :tone="preview.conflict ? 'orange' : 'green'"
            dot
          />
          <a v-if="preview.sourceUrl" :href="preview.sourceUrl" rel="noreferrer" target="_blank">
            来源链接
          </a>
        </aside>

        <section class="preview-panel">
          <div class="preview-panel__header">
            <div>
              <p>字段预览</p>
              <h2>{{ preview.bookName || '未识别书名' }}</h2>
            </div>
            <el-button :icon="Download" :loading="importing" type="primary" @click="confirmImport">
              导入书籍库
            </el-button>
          </div>

          <el-alert
            v-if="preview.conflict"
            class="conflict-alert"
            :closable="false"
            show-icon
            type="warning"
          >
            <template #title>
              {{ preview.conflict.message }}：{{ preview.conflict.bookName }} / {{ preview.conflict.authorName || '--' }}
            </template>
          </el-alert>

          <el-form label-position="top">
            <div class="field-grid">
              <el-form-item label="书名">
                <el-input v-model="preview.bookName" />
              </el-form-item>
              <el-form-item label="作者">
                <el-input v-model="preview.authorName" />
              </el-form-item>
              <el-form-item label="出版社">
                <el-input v-model="preview.publisher" />
              </el-form-item>
              <el-form-item label="出版年">
                <el-input v-model="preview.publishYear" />
              </el-form-item>
              <el-form-item label="ISBN">
                <el-input v-model="preview.isbn" />
              </el-form-item>
              <el-form-item label="评分">
                <el-input :model-value="ratingText" disabled />
              </el-form-item>
            </div>
            <el-form-item label="内容简介">
              <el-input v-model="preview.introduction" :autosize="{ minRows: 4, maxRows: 8 }" type="textarea" />
            </el-form-item>
            <el-form-item label="目录">
              <el-input v-model="preview.catalog" :autosize="{ minRows: 3, maxRows: 7 }" type="textarea" />
            </el-form-item>
          </el-form>

          <section v-if="warnings.length" class="warning-list">
            <h3>提示</h3>
            <p v-for="item in warnings" :key="item">{{ item }}</p>
          </section>
        </section>
      </section>

      <section class="content-panel">
        <div class="content-panel__header">
          <div>
            <p>正文补充</p>
            <h2>网页正文抓取</h2>
            <span>{{ importedBookId ? `书籍 ID：${importedBookId}` : '先完成元数据导入，再抓取公开章节页或目录页' }}</span>
          </div>
          <el-button :disabled="!importedBookId" :icon="View" @click="goBooks">查看书籍库</el-button>
        </div>

        <el-alert
          class="content-alert"
          :closable="false"
          :type="webImportResult ? (webImportResult.failedCount > 0 ? 'warning' : 'success') : webAnalyzeResult ? 'info' : 'info'"
          show-icon
        >
          <template #title>
            {{ webContentStatusText }}
          </template>
        </el-alert>

        <div class="web-content-form">
          <el-input
            v-model="webContentUrl"
            :disabled="!importedBookId"
            clearable
            placeholder="公开目录页或章节页 URL"
            size="large"
            @keyup.enter="analyzeWebContent"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <el-button
            :disabled="!importedBookId"
            :icon="Search"
            :loading="webAnalyzing"
            size="large"
            type="primary"
            @click="analyzeWebContent"
          >
            解析正文
          </el-button>
        </div>

        <div class="web-options">
          <el-checkbox v-model="webOverwriteExisting" :disabled="!importedBookId">覆盖相同序号章节</el-checkbox>
          <span>最多章节</span>
          <el-input-number v-model="webMaxChapters" :disabled="!importedBookId" :max="300" :min="1" size="small" />
          <el-button
            :disabled="!importedBookId || !webAnalyzeResult"
            :loading="webImporting"
            type="primary"
            @click="startWebContentScrape"
          >
            确认抓取入库
          </el-button>
        </div>

        <section v-if="webAnalyzeResult" class="web-preview">
          <div class="web-summary">
            <div>
              <span>站点</span>
              <strong>{{ webAnalyzeResult.siteName || webAnalyzeResult.siteType || '--' }}</strong>
            </div>
            <div>
              <span>页面</span>
              <strong>{{ webPageTypeText }}</strong>
            </div>
            <div>
              <span>规则</span>
              <strong>{{ webAnalyzeResult.ruleName || '--' }}</strong>
            </div>
            <div>
              <span>章节</span>
              <strong>{{ webAnalyzeResult.chapterCount || 0 }}</strong>
            </div>
          </div>

          <div v-if="webAnalyzeResult.sampleChapters.length" class="web-sample-list">
            <article v-for="chapter in webAnalyzeResult.sampleChapters" :key="`${chapter.chapterNo}-${chapter.chapterUrl}`" class="web-sample-item">
              <div>
                <strong>{{ chapter.chapterNo }}. {{ chapter.chapterTitle || '未命名章节' }}</strong>
                <span>{{ chapter.wordCount || 0 }} 字</span>
              </div>
              <p>{{ chapter.contentSample || '未抓取到正文样例' }}</p>
            </article>
          </div>

          <section v-if="webAnalyzeResult.warnings.length" class="warning-list">
            <h3>正文抓取提示</h3>
            <p v-for="item in webAnalyzeResult.warnings" :key="item">{{ item }}</p>
          </section>
        </section>
      </section>

      <el-empty v-if="!preview" class="empty-state" description="粘贴豆瓣读书详情页 URL 后开始解析" />

      <AdminInfoBox title="边界说明" :icon="InfoFilled" :items="page.notes" />
    </div>

    <el-dialog v-model="conflictDialogVisible" title="选择冲突处理方式" width="520px">
      <div class="conflict-dialog">
        <p>系统检测到 ISBN 或书名、作者、出版社疑似已存在。</p>
        <el-radio-group v-model="conflictStrategy">
          <el-radio value="update_existing">更新已有书籍</el-radio>
          <el-radio value="create_new_version">创建新版本</el-radio>
          <el-radio value="cancel">取消导入</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="conflictDialogVisible = false">取消</el-button>
        <el-button :loading="importing" type="primary" @click="runImport">确认</el-button>
      </template>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { DataAnalysis, Download, InfoFilled, Link, Search, View } from '@element-plus/icons-vue'
import { AdminInfoBox, AdminStatusBadge } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { automationPages } from '../../config/adminModules'
import {
  analyzeSmartScrapeUrl,
  analyzeSmartScrapeWebContent,
  importSmartScrapeBook,
  startSmartScrapeWebContent,
} from '../../api/automation'

const router = useRouter()
const page = automationPages.smartScrape
const url = ref('')
const analyzing = ref(false)
const importing = ref(false)
const conflictDialogVisible = ref(false)
const conflictStrategy = ref('update_existing')
const preview = ref(null)
const analyzeResult = ref(null)
const importResult = ref(null)
const importedBookId = ref('')
const coverLoadFailed = ref(false)
const webContentUrl = ref('')
const webAnalyzeResult = ref(null)
const webAnalyzing = ref(false)
const webImporting = ref(false)
const webImportResult = ref(null)
const webOverwriteExisting = ref(false)
const webMaxChapters = ref(100)

const metrics = computed(() => [
  metric('站点类型', analyzeResult.value?.siteType || '待识别', '', '自动识别适配器', 'blue', DataAnalysis),
  metric('页面类型', analyzeResult.value?.pageType || '待解析', '', '详情页优先', 'purple', Search),
  metric('置信度', analyzeResult.value?.confidenceText || '--', '', '字段命中率', 'green', InfoFilled),
  metric('冲突状态', preview.value?.conflict ? '需确认' : preview.value ? '无冲突' : '--', '', 'ISBN 优先去重', preview.value?.conflict ? 'orange' : 'cyan', Link),
])

const warnings = computed(() => preview.value?.warnings || [])
const previewCoverSrc = computed(() => {
  if (coverLoadFailed.value) return ''
  return preview.value?.coverPreviewUrl || preview.value?.coverUrl || ''
})
const ratingText = computed(() => {
  if (!preview.value) return '--'
  const rating = preview.value.rating || '--'
  const count = preview.value.ratingCount || 0
  return count ? `${rating} / ${count} 人评价` : String(rating)
})
const webContentStatusText = computed(() => {
  if (webImportResult.value) {
    return webImportResult.value.message || `网页正文抓取完成，成功 ${webImportResult.value.successCount || 0} 章`
  }
  if (webAnalyzeResult.value) {
    return `已识别 ${webAnalyzeResult.value.chapterCount || 0} 个章节，确认后写入书籍库`
  }
  return '导入书籍后可粘贴公开目录页或章节页 URL，系统按高级规则抓取正文'
})
const webPageTypeText = computed(() => {
  const map = {
    chapter_list: '目录页',
    chapter_detail: '章节页',
    unsupported: '未支持',
  }
  return map[webAnalyzeResult.value?.pageType] || webAnalyzeResult.value?.pageType || '--'
})

function metric(label, value, unit, sub, color, icon) {
  return { label, value, unit, sub, color, icon }
}

function handlePageAction(action) {
  if (action.label === '高级规则') {
    router.push('/automation/rules')
  }
}

async function analyzeUrl() {
  if (!url.value.trim()) {
    ElMessage.warning('请先粘贴豆瓣图书详情页 URL')
    return
  }
  analyzing.value = true
  preview.value = null
  coverLoadFailed.value = false
  analyzeResult.value = null
  importResult.value = null
  importedBookId.value = ''
  resetWebContent()
  try {
    const result = await analyzeSmartScrapeUrl(url.value)
    analyzeResult.value = result
    preview.value = { ...result.preview }
    coverLoadFailed.value = false
    ElMessage.success('解析完成，请确认字段')
  } catch (error) {
    ElMessage.error(error.message || '解析失败')
  } finally {
    analyzing.value = false
  }
}

function handleCoverError() {
  coverLoadFailed.value = true
}

function confirmImport() {
  if (!preview.value?.bookName) {
    ElMessage.warning('书名不能为空')
    return
  }
  if (preview.value.conflict) {
    conflictStrategy.value = 'update_existing'
    conflictDialogVisible.value = true
    return
  }
  conflictStrategy.value = ''
  runImport()
}

async function runImport() {
  if (conflictStrategy.value === 'cancel') {
    conflictDialogVisible.value = false
    return
  }
  importing.value = true
  try {
    const result = await importSmartScrapeBook({
      preview: buildImportPreview(),
      conflictStrategy: conflictStrategy.value,
    })
    ElMessage.success(result.message || '导入成功')
    conflictDialogVisible.value = false
    if (result.bookId) {
      importResult.value = result
      importedBookId.value = result.bookId
      resetWebContent()
    }
  } catch (error) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

async function analyzeWebContent() {
  if (!importedBookId.value) {
    ElMessage.warning('请先导入书籍库')
    return
  }
  if (!webContentUrl.value.trim()) {
    ElMessage.warning('请粘贴公开目录页或章节页 URL')
    return
  }
  webAnalyzing.value = true
  webAnalyzeResult.value = null
  webImportResult.value = null
  try {
    const result = await analyzeSmartScrapeWebContent({
      url: webContentUrl.value,
      bookId: importedBookId.value,
    })
    webAnalyzeResult.value = result
    ElMessage.success(`正文解析完成，识别 ${result.chapterCount || 0} 个章节`)
  } catch (error) {
    ElMessage.error(error.message || '解析网页正文失败')
  } finally {
    webAnalyzing.value = false
  }
}

async function startWebContentScrape() {
  if (!importedBookId.value) {
    ElMessage.warning('请先导入书籍库')
    return
  }
  if (!webAnalyzeResult.value) {
    ElMessage.warning('请先解析网页正文')
    return
  }
  webImporting.value = true
  try {
    const result = await startSmartScrapeWebContent({
      url: webContentUrl.value,
      bookId: importedBookId.value,
      ruleId: webAnalyzeResult.value.ruleId,
      overwriteExisting: webOverwriteExisting.value,
      maxChapters: webMaxChapters.value,
    })
    webImportResult.value = result
    if (result.failedCount > 0) {
      ElMessage.warning(result.message || '网页正文抓取完成，但有章节失败')
    } else {
      ElMessage.success(result.message || '网页正文已入库')
    }
  } catch (error) {
    ElMessage.error(error.message || '抓取网页正文失败')
  } finally {
    webImporting.value = false
  }
}

function resetWebContent() {
  webContentUrl.value = ''
  webAnalyzeResult.value = null
  webImportResult.value = null
  webOverwriteExisting.value = false
  webMaxChapters.value = 100
}

function goBooks() {
  router.push('/books')
}

function buildImportPreview() {
  const data = preview.value || {}
  return {
    bookName: data.bookName,
    authorName: data.authorName,
    coverUrl: data.coverUrl,
    publisher: data.publisher,
    publishYear: data.publishYear,
    isbn: data.isbn,
    pageCount: data.pageCount,
    price: data.price,
    rating: data.rating,
    ratingCount: data.ratingCount,
    introduction: data.introduction,
    authorIntro: data.authorIntro,
    catalog: data.catalog,
    sourceSite: data.sourceSite,
    sourceUrl: data.sourceUrl,
    externalId: data.externalId,
    metadata: data.metadata,
    warnings: data.warnings,
  }
}
</script>

<style scoped>
.smart-scrape {
  display: grid;
  gap: 20px;
}

.url-panel,
.preview-panel,
.cover-panel,
.content-panel {
  border: 1px solid var(--admin-border, #d9e2f2);
  border-radius: var(--admin-radius-card);
  background: #fff;
}

.url-panel {
  padding: 20px;
}

.url-panel__main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.url-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: #64748b;
  font-size: var(--admin-text-sm);
}

.url-panel__meta span {
  padding: 4px 9px;
  border-radius: 999px;
  background: #f3f6fb;
}

.preview-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.cover-panel {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 18px;
}

.cover-frame {
  display: grid;
  place-items: center;
  width: 160px;
  aspect-ratio: 3 / 4.2;
  overflow: hidden;
  border-radius: 6px;
  background: linear-gradient(145deg, #1f2937, #475569);
  color: #fff;
  font-size: 42px;
  font-weight: 700;
}

.cover-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-panel a {
  color: var(--admin-primary);
  font-size: var(--admin-text-sm);
  text-decoration: none;
}

.preview-panel {
  min-width: 0;
  padding: 20px;
}

.preview-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.preview-panel__header p {
  margin: 0 0 4px;
  color: #64748b;
  font-size: var(--admin-text-sm);
}

.preview-panel__header h2 {
  margin: 0;
  color: #172033;
  font-size: 22px;
}

.conflict-alert {
  margin-bottom: 16px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.warning-list {
  display: grid;
  gap: 8px;
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 6px;
  background: #fff7ed;
  color: #9a3412;
}

.warning-list h3,
.warning-list p,
.conflict-dialog p {
  margin: 0;
}

.warning-list h3 {
  font-size: var(--admin-text-md);
}

.warning-list p {
  font-size: var(--admin-text-sm);
}

.content-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.content-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.content-panel__header p,
.content-panel__header h2,
.content-panel__header span {
  margin: 0;
}

.content-panel__header p {
  color: #64748b;
  font-size: var(--admin-text-sm);
}

.content-panel__header h2 {
  color: #172033;
  font-size: 20px;
}

.content-panel__header span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: var(--admin-text-sm);
}

.content-alert {
  align-items: center;
}

.web-content-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.web-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: #64748b;
  font-size: var(--admin-text-sm);
}

.web-preview {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.web-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.web-summary div {
  min-width: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.web-summary span {
  display: block;
  color: #64748b;
  font-size: var(--admin-text-xs);
}

.web-summary strong {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  color: #172033;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.web-sample-list {
  display: grid;
  gap: 10px;
}

.web-sample-item {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.web-sample-item div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.web-sample-item strong {
  overflow: hidden;
  color: #172033;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.web-sample-item span {
  flex: 0 0 auto;
  color: #64748b;
  font-size: var(--admin-text-sm);
}

.web-sample-item p {
  display: -webkit-box;
  margin: 8px 0 0;
  overflow: hidden;
  color: #475569;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.empty-state {
  padding: 36px 0;
  border: 1px dashed #cbd5e1;
  border-radius: var(--admin-radius-card);
  background: #fff;
}

.conflict-dialog {
  display: grid;
  gap: 16px;
}

.conflict-dialog :deep(.el-radio-group) {
  display: grid;
  gap: 10px;
}

@media (max-width: 900px) {
  .url-panel__main,
  .web-content-form,
  .web-summary,
  .preview-layout,
  .field-grid {
    grid-template-columns: 1fr;
  }

  .preview-panel__header,
  .content-panel__header {
    flex-direction: column;
  }
}
</style>

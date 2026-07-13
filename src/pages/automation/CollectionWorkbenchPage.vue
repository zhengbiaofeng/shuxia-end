<template>
  <ResourceShell
    :actions="pageActions"
    :active-tab="activeTab"
    active-menu="采集工作台"
    subtitle="粘贴一个网址完成识别、预览和采集；列表页可切换到批量采集"
    :tabs="['单本采集', '批量采集']"
    title="采集工作台"
    @action="handlePageAction"
    @tab-change="handleTabChange"
  >
    <div class="collection-workbench">
      <section v-if="activeTab === 0" class="single-collection">
        <ol class="flow-steps" aria-label="单本采集流程">
          <li v-for="(step, index) in singleSteps" :key="step" :class="{ active: index <= singleStepIndex }">
            <span>{{ index + 1 }}</span>
            <strong>{{ step }}</strong>
          </li>
        </ol>

        <section class="source-panel">
          <div class="source-panel__intro">
            <div>
              <span class="section-kicker">单本采集</span>
              <h2>输入书籍或小说网址</h2>
              <p>系统自动区分元数据页面与小说详情页，不需要预先选择抓取方式。</p>
            </div>
            <span class="source-detection" :class="`is-${singleKind}`">
              <el-icon><Compass /></el-icon>
              {{ singleKindLabel }}
            </span>
          </div>

          <div class="source-input-row">
            <el-input
              v-model="singleUrl"
              clearable
              placeholder="粘贴豆瓣图书页、小说详情页或目录页 URL"
              size="large"
              @clear="resetSingle"
              @keyup.enter="analyzeSingle"
            >
              <template #prefix>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
            <el-button :icon="Search" :loading="singleAnalyzing" size="large" type="primary" @click="analyzeSingle">
              解析预览
            </el-button>
          </div>

          <div class="source-panel__footer">
            <span>支持 http / https 公开页面</span>
            <el-button v-if="singleKind === 'batch'" text type="primary" @click="switchToBatch">
              作为批量入口处理
            </el-button>
            <el-button v-else text @click="advancedVisible = !advancedVisible">
              {{ advancedVisible ? '收起高级选项' : '高级选项' }}
              <el-icon><ArrowDown :class="{ rotated: advancedVisible }" /></el-icon>
            </el-button>
          </div>

          <div v-if="advancedVisible" class="advanced-options">
            <label>
              <span>请求间隔</span>
              <el-input-number v-model="singleOptions.requestDelayMs" :max="10000" :min="0" :step="500" />
              <small>毫秒</small>
            </label>
            <el-checkbox v-model="singleOptions.syncChapters">采集正文与章节</el-checkbox>
          </div>
        </section>

        <el-alert
          v-if="singleKind === 'batch'"
          :closable="false"
          show-icon
          title="这个地址看起来更像排行榜、分类页或列表页，建议使用批量采集。"
          type="warning"
        />

        <section v-if="metadataPreview" class="preview-shell">
          <header class="preview-header">
            <div>
              <span class="section-kicker">解析预览</span>
              <h2>{{ metadataPreview.bookName || '未识别书名' }}</h2>
              <p>{{ metadataPreview.authorName || '作者未知' }} · {{ metadataPreview.publisher || '出版社未知' }}</p>
            </div>
            <AdminStatusBadge
              :label="metadataPreview.conflict ? '检测到重复书籍' : '可以入库'"
              :tone="metadataPreview.conflict ? 'orange' : 'green'"
              dot
            />
          </header>

          <div class="metadata-preview">
            <aside class="book-cover">
              <img
                v-if="metadataCoverSrc"
                :src="metadataCoverSrc"
                :alt="`${metadataPreview.bookName || '书籍'}封面`"
                @error="coverLoadFailed = true"
              />
              <span v-else>{{ (metadataPreview.bookName || '书').slice(0, 1) }}</span>
              <a v-if="metadataPreview.sourceUrl" :href="metadataPreview.sourceUrl" rel="noreferrer" target="_blank">查看来源页</a>
            </aside>

            <el-form class="metadata-form" label-position="top">
              <div class="field-grid">
                <el-form-item label="书名"><el-input v-model="metadataPreview.bookName" /></el-form-item>
                <el-form-item label="作者"><el-input v-model="metadataPreview.authorName" /></el-form-item>
                <el-form-item label="出版社"><el-input v-model="metadataPreview.publisher" /></el-form-item>
                <el-form-item label="出版年"><el-input v-model="metadataPreview.publishYear" /></el-form-item>
                <el-form-item label="ISBN"><el-input v-model="metadataPreview.isbn" /></el-form-item>
                <el-form-item label="评分"><el-input :model-value="metadataRatingText" disabled /></el-form-item>
              </div>
              <el-form-item label="内容简介">
                <el-input v-model="metadataPreview.introduction" :autosize="{ minRows: 3, maxRows: 7 }" type="textarea" />
              </el-form-item>
            </el-form>
          </div>

          <div v-if="metadataWarnings.length" class="inline-notes">
            <span v-for="item in metadataWarnings" :key="item">{{ item }}</span>
          </div>

          <footer class="preview-actions">
            <el-button @click="resetSingle">重新输入</el-button>
            <el-button :icon="Download" :loading="metadataImporting" type="primary" @click="confirmMetadataImport">
              导入书籍库
            </el-button>
          </footer>
        </section>

        <section v-if="novelResult" class="preview-shell novel-preview">
          <header class="preview-header">
            <div>
              <span class="section-kicker">小说识别结果</span>
              <h2>{{ novelResult.bookName }}</h2>
              <p>{{ novelResult.authorName }} · {{ novelResult.sourceName }}</p>
            </div>
            <AdminStatusBadge
              :label="novelResult.createdSubscription ? '已建立追更' : '已匹配追更'"
              tone="green"
              dot
            />
          </header>

          <div class="result-facts">
            <div><span>站点适配</span><strong>{{ novelResult.ruleName || '--' }}</strong></div>
            <div><span>识别章节</span><strong>{{ novelResult.runResult.chapterCount || 0 }}</strong></div>
            <div><span>新增章节</span><strong>{{ novelResult.runResult.addedChapterCount || 0 }}</strong></div>
            <div><span>失败章节</span><strong>{{ novelResult.runResult.failedChapterCount || 0 }}</strong></div>
          </div>

          <el-alert
            :closable="false"
            :title="novelResult.message || novelResult.runResult.message"
            :type="novelResult.runResult.failedChapterCount ? 'warning' : 'info'"
            show-icon
          />

          <footer class="preview-actions">
            <el-button @click="resetSingle">重新输入</el-button>
            <el-button @click="router.push('/automation/following')">查看追更</el-button>
            <el-button
              :icon="VideoPlay"
              :loading="novelExecuting"
              type="primary"
              @click="executeNovelCollection"
            >
              {{ singleOptions.syncChapters ? '采集正文并追更' : '仅建立追更' }}
            </el-button>
          </footer>
        </section>

        <section v-if="importedBookId" class="continuation-panel">
          <header>
            <div>
              <span class="section-kicker">可选下一步</span>
              <h2>为已入库书籍补充网页正文</h2>
              <p>豆瓣只提供元数据。如需正文，请再粘贴公开目录页或章节页。</p>
            </div>
            <AdminStatusBadge label="元数据已入库" tone="green" dot />
          </header>

          <div class="source-input-row">
            <el-input
              v-model="contentUrl"
              clearable
              placeholder="公开目录页或章节页 URL"
              size="large"
              @keyup.enter="analyzeContent"
            />
            <el-button :icon="Search" :loading="contentAnalyzing" size="large" @click="analyzeContent">解析正文</el-button>
          </div>

          <div v-if="contentAnalyzeResult" class="content-result">
            <div class="result-facts">
              <div><span>站点</span><strong>{{ contentAnalyzeResult.siteName || contentAnalyzeResult.siteType || '--' }}</strong></div>
              <div><span>页面类型</span><strong>{{ contentPageTypeText }}</strong></div>
              <div><span>使用规则</span><strong>{{ contentAnalyzeResult.ruleName || '--' }}</strong></div>
              <div><span>识别章节</span><strong>{{ contentAnalyzeResult.chapterCount || 0 }}</strong></div>
            </div>
            <div class="content-options">
              <el-checkbox v-model="contentOverwrite">覆盖相同序号章节</el-checkbox>
              <label>
                <span>最多章节</span>
                <el-input-number v-model="contentMaxChapters" :max="300" :min="1" />
              </label>
              <el-button :loading="contentImporting" type="primary" @click="startContentCollection">确认抓取入库</el-button>
            </div>
          </div>
        </section>

        <section v-if="singlePhase === 'result' && novelResult?.submittedAsync" class="task-result-panel">
          <div>
            <el-icon><CircleCheck /></el-icon>
            <span><strong>采集任务已经提交</strong>可以离开当前页面，任务会继续在后台运行。</span>
          </div>
          <el-button :icon="Tickets" type="primary" plain @click="router.push('/automation/tasks')">查看任务进度</el-button>
        </section>

        <el-empty
          v-if="!metadataPreview && !novelResult && !importedBookId"
          description="输入网址后，解析预览会显示在这里"
        />
      </section>

      <section v-else class="batch-collection">
        <section class="batch-source-panel">
          <header class="preview-header">
            <div>
              <span class="section-kicker">批量采集</span>
              <h2>从列表页发现小说</h2>
              <p>选择站点适配后，粘贴分类页、排行榜或多个入口地址。</p>
            </div>
            <el-button :icon="Setting" @click="router.push('/automation/rules')">管理站点适配</el-button>
          </header>

          <el-form label-position="top">
            <div class="batch-basic-grid">
              <el-form-item label="站点适配">
                <el-select
                  v-model="selectedRuleId"
                  :loading="rulesLoading"
                  filterable
                  placeholder="选择已启用的小说站点适配"
                  @change="selectBatchRule"
                >
                  <el-option
                    v-for="rule in ruleOptions"
                    :key="rule.id"
                    :label="`${rule.name} · ${rule.source}`"
                    :value="rule.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="发现范围">
                <el-segmented v-model="batchForm.scope" :options="batchScopeOptions" @change="resetBatchResult" />
              </el-form-item>
            </div>

            <el-form-item label="入口地址">
              <el-input
                v-model="batchForm.entryUrlsText"
                :rows="batchForm.scope === 'site' ? 3 : 2"
                placeholder="每行一个分类页、排行榜或列表页地址"
                type="textarea"
              />
            </el-form-item>

            <el-collapse class="advanced-collapse">
              <el-collapse-item name="advanced" title="高级发现选项">
                <div class="batch-advanced-grid">
                  <el-form-item label="详情链接选择器"><el-input v-model="batchForm.detailUrlSelector" placeholder="默认使用站点适配配置" /></el-form-item>
                  <el-form-item label="请求间隔毫秒"><el-input-number v-model="batchForm.requestDelayMs" :min="0" :step="500" /></el-form-item>
                  <el-form-item v-if="batchForm.scope === 'site'" label="分页 URL 模板"><el-input v-model="batchForm.paginationUrlTemplate" placeholder="例如 /list/{page}.html" /></el-form-item>
                  <el-form-item v-if="batchForm.scope === 'site'" label="下一页选择器"><el-input v-model="batchForm.nextPageSelector" /></el-form-item>
                  <el-form-item v-if="batchForm.scope === 'site'" label="起始页码"><el-input-number v-model="batchForm.startPage" :min="1" /></el-form-item>
                  <el-form-item v-if="batchForm.scope === 'site'" label="最大页数（0 为不限）"><el-input-number v-model="batchForm.maxPages" :min="0" /></el-form-item>
                  <el-form-item label="最大候选数（0 为不限）"><el-input-number v-model="batchForm.maxItems" :min="0" /></el-form-item>
                  <el-form-item label="采集方式"><el-switch v-model="batchForm.syncChapters" active-text="同步章节" inactive-text="只建书" /></el-form-item>
                </div>
                <el-checkbox v-model="batchForm.sameHostOnly">仅保留同站详情链接</el-checkbox>
              </el-collapse-item>
            </el-collapse>
          </el-form>

          <footer class="preview-actions">
            <span v-if="selectedRuleDetail">当前适配：{{ selectedRuleDetail.siteName || selectedRuleDetail.ruleName }}</span>
            <span v-else>需要先选择一个已启用的小说站点适配</span>
            <el-button
              :disabled="!selectedRuleId"
              :icon="Search"
              :loading="batchDiscovering"
              type="primary"
              @click="discoverCandidates"
            >
              {{ batchDiscovering ? '正在发现' : '发现候选小说' }}
            </el-button>
          </footer>
        </section>

        <section v-if="batchResult" class="candidate-panel">
          <header class="candidate-header">
            <div>
              <span class="section-kicker">发现结果</span>
              <h2>{{ batchCandidates.length }} 本候选小说</h2>
              <p>扫描 {{ batchResult.scannedPageCount || 0 }} 页，已选择 {{ selectedCandidates.length }} 本</p>
            </div>
            <div>
              <el-button :loading="batchDiscovering" @click="discoverCandidates">重新发现</el-button>
              <el-button
                :disabled="!selectedCandidates.length"
                :icon="VideoPlay"
                :loading="batchSubmitting"
                type="primary"
                @click="submitBatchCollection"
              >
                提交选中小说
              </el-button>
            </div>
          </header>

          <el-alert
            v-if="batchResult.errorMessage"
            :closable="false"
            :title="batchResult.errorMessage"
            show-icon
            type="warning"
          />

          <el-table
            ref="candidateTableRef"
            v-loading="batchDiscovering"
            :data="batchCandidates"
            height="440"
            @selection-change="selectedCandidates = $event"
          >
            <el-table-column type="selection" width="52" />
            <el-table-column label="小说" min-width="220">
              <template #default="{ row }">
                <div class="candidate-book">
                  <el-image v-if="row.coverUrl" :alt="`${row.title}封面`" :src="row.coverUrl" fit="cover" />
                  <span v-else>{{ row.title.slice(0, 1) }}</span>
                  <div><strong>{{ row.title }}</strong><small>{{ row.author }}</small></div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="最新章节" min-width="180" prop="latestChapterTitle" show-overflow-tooltip />
            <el-table-column label="详情地址" min-width="320" prop="detailUrl" show-overflow-tooltip />
          </el-table>
        </section>

        <el-empty v-else-if="!ruleOptions.length && !rulesLoading" description="还没有可用的小说站点适配">
          <el-button type="primary" @click="router.push('/automation/rules/new')">添加站点适配</el-button>
        </el-empty>
        <el-empty v-else description="选择站点适配并发现候选小说" />
      </section>
    </div>

    <el-dialog v-model="conflictDialogVisible" title="选择重复书籍处理方式" width="520px">
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
        <el-button :loading="metadataImporting" type="primary" @click="importMetadata">确认</el-button>
      </template>
    </el-dialog>
  </ResourceShell>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowDown,
  CircleCheck,
  Compass,
  Download,
  Link,
  Search,
  Setting,
  Tickets,
  VideoPlay,
} from '@element-plus/icons-vue'
import { AdminStatusBadge } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import {
  analyzeSmartScrapeUrl,
  analyzeSmartScrapeWebContent,
  batchSyncScrapeRuleNovels,
  discoverScrapeRuleNovels,
  fetchScrapeRuleDetail,
  fetchScrapeRulesPage,
  importSmartScrapeBook,
  quickSyncNovelByUrl,
  startSmartScrapeWebContent,
} from '../../api/automation'

const router = useRouter()
const route = useRoute()
const activeTab = ref(route.query.tab === 'batch' ? 1 : 0)
const pageActions = [
  { label: '采集设置', icon: Setting },
  { label: '任务中心', icon: Tickets },
]
const singleSteps = ['输入网址', '解析预览', '确认采集']
const singleUrl = ref('')
const singleAnalyzing = ref(false)
const novelExecuting = ref(false)
const singlePhase = ref('input')
const advancedVisible = ref(false)
const novelResult = ref(null)
const singleOptions = reactive({ requestDelayMs: 1000, syncChapters: true })

const metadataPreview = ref(null)
const metadataImporting = ref(false)
const conflictDialogVisible = ref(false)
const conflictStrategy = ref('update_existing')
const importedBookId = ref('')
const coverLoadFailed = ref(false)
const contentUrl = ref('')
const contentAnalyzeResult = ref(null)
const contentAnalyzing = ref(false)
const contentImporting = ref(false)
const contentOverwrite = ref(false)
const contentMaxChapters = ref(100)

const rulesLoading = ref(false)
const ruleOptions = ref([])
const selectedRuleId = ref('')
const selectedRuleDetail = ref(null)
const batchDiscovering = ref(false)
const batchSubmitting = ref(false)
const batchResult = ref(null)
const batchCandidates = ref([])
const selectedCandidates = ref([])
const candidateTableRef = ref(null)
const batchScopeOptions = [
  { label: '当前页面', value: 'single' },
  { label: '连续翻页', value: 'site' },
]
const batchForm = reactive({
  scope: 'single',
  entryUrlsText: '',
  detailUrlSelector: '',
  paginationUrlTemplate: '',
  nextPageSelector: '',
  startPage: 1,
  maxPages: 0,
  maxItems: 0,
  requestDelayMs: 1000,
  sameHostOnly: true,
  syncChapters: true,
})

const singleKind = computed(() => detectUrlKind(singleUrl.value))
const singleKindLabel = computed(() => ({
  empty: '等待输入',
  invalid: '网址格式待确认',
  metadata: '图书元数据页',
  novel: '小说详情或目录页',
  batch: '列表或排行页',
}[singleKind.value] || '自动识别'))
const singleStepIndex = computed(() => ({ input: 0, preview: 1, result: 2 }[singlePhase.value] ?? 0)
const metadataWarnings = computed(() => metadataPreview.value?.warnings || [])
const metadataCoverSrc = computed(() => {
  if (coverLoadFailed.value) return ''
  return metadataPreview.value?.coverPreviewUrl || metadataPreview.value?.coverUrl || ''
})
const metadataRatingText = computed(() => {
  if (!metadataPreview.value) return '--'
  const rating = metadataPreview.value.rating || '--'
  const count = metadataPreview.value.ratingCount || 0
  return count ? `${rating} / ${count} 人评价` : String(rating)
})
const contentPageTypeText = computed(() => ({
  chapter_list: '目录页',
  chapter_detail: '章节页',
  unsupported: '暂不支持',
}[contentAnalyzeResult.value?.pageType] || contentAnalyzeResult.value?.pageType || '--'))

function handlePageAction(action) {
  if (action.label === '采集设置') router.push('/automation/rules')
  if (action.label === '任务中心') router.push('/automation/tasks')
}

function handleTabChange(index) {
  activeTab.value = index
  router.replace({ query: index === 1 ? { tab: 'batch' } : {} })
}

function detectUrlKind(value) {
  const text = String(value || '').trim()
  if (!text) return 'empty'
  try {
    const parsed = new URL(text)
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'invalid'
    if (parsed.hostname === 'book.douban.com') return 'metadata'
    if (/(?:list|rank|category|sort|top|排行|分类)/i.test(`${parsed.pathname}${parsed.hash}`)) return 'batch'
    return 'novel'
  } catch {
    return 'invalid'
  }
}

async function analyzeSingle() {
  if (singleKind.value === 'empty') {
    ElMessage.warning('请先粘贴网址')
    return
  }
  if (singleKind.value === 'invalid') {
    ElMessage.warning('请输入 http 或 https 开头的完整网址')
    return
  }
  if (singleKind.value === 'batch') {
    switchToBatch()
    return
  }

  resetSingleResults()
  singleAnalyzing.value = true
  try {
    if (singleKind.value === 'metadata') {
      const result = await analyzeSmartScrapeUrl(singleUrl.value)
      metadataPreview.value = { ...result.preview }
      coverLoadFailed.value = false
      singlePhase.value = 'preview'
      ElMessage.success('元数据解析完成，请确认字段')
      return
    }

    novelResult.value = await quickSyncNovelByUrl({
      detailUrl: singleUrl.value,
      requestDelayMs: singleOptions.requestDelayMs,
      syncChapters: false,
    })
    singlePhase.value = 'preview'
    ElMessage.success('小说信息解析完成，已创建或复用追更记录')
  } catch (error) {
    ElMessage.error(error.message || '网址解析失败')
  } finally {
    singleAnalyzing.value = false
  }
}

async function executeNovelCollection() {
  novelExecuting.value = true
  try {
    novelResult.value = await quickSyncNovelByUrl({
      detailUrl: singleUrl.value,
      requestDelayMs: singleOptions.requestDelayMs,
      syncChapters: singleOptions.syncChapters,
    })
    singlePhase.value = 'result'
    ElMessage.success(singleOptions.syncChapters ? '采集任务已提交' : '追更记录已建立')
  } catch (error) {
    ElMessage.error(error.message || '小说采集失败')
  } finally {
    novelExecuting.value = false
  }
}

function confirmMetadataImport() {
  if (!metadataPreview.value?.bookName) {
    ElMessage.warning('书名不能为空')
    return
  }
  if (metadataPreview.value.conflict) {
    conflictStrategy.value = 'update_existing'
    conflictDialogVisible.value = true
    return
  }
  conflictStrategy.value = ''
  importMetadata()
}

async function importMetadata() {
  if (conflictStrategy.value === 'cancel') {
    conflictDialogVisible.value = false
    return
  }
  metadataImporting.value = true
  try {
    const result = await importSmartScrapeBook({
      preview: buildMetadataImportPreview(),
      conflictStrategy: conflictStrategy.value,
    })
    importedBookId.value = result.bookId || ''
    conflictDialogVisible.value = false
    singlePhase.value = 'result'
    ElMessage.success(result.message || '书籍已入库')
  } catch (error) {
    ElMessage.error(error.message || '导入书籍库失败')
  } finally {
    metadataImporting.value = false
  }
}

function buildMetadataImportPreview() {
  const data = metadataPreview.value || {}
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

async function analyzeContent() {
  if (!contentUrl.value.trim()) {
    ElMessage.warning('请粘贴公开目录页或章节页网址')
    return
  }
  contentAnalyzing.value = true
  contentAnalyzeResult.value = null
  try {
    contentAnalyzeResult.value = await analyzeSmartScrapeWebContent({
      url: contentUrl.value,
      bookId: importedBookId.value,
    })
    ElMessage.success(`已识别 ${contentAnalyzeResult.value.chapterCount || 0} 个章节`)
  } catch (error) {
    ElMessage.error(error.message || '正文解析失败')
  } finally {
    contentAnalyzing.value = false
  }
}

async function startContentCollection() {
  contentImporting.value = true
  try {
    const result = await startSmartScrapeWebContent({
      url: contentUrl.value,
      bookId: importedBookId.value,
      ruleId: contentAnalyzeResult.value?.ruleId,
      overwriteExisting: contentOverwrite.value,
      maxChapters: contentMaxChapters.value,
    })
    const failedCount = Number(result.failedCount || 0)
    const message = result.message || `正文采集完成，成功 ${result.successCount || 0} 章`
    failedCount ? ElMessage.warning(message) : ElMessage.success(message)
  } catch (error) {
    ElMessage.error(error.message || '正文采集失败')
  } finally {
    contentImporting.value = false
  }
}

function resetSingleResults() {
  metadataPreview.value = null
  novelResult.value = null
  importedBookId.value = ''
  contentUrl.value = ''
  contentAnalyzeResult.value = null
  coverLoadFailed.value = false
  singlePhase.value = 'input'
}

function resetSingle() {
  singleUrl.value = ''
  resetSingleResults()
}

function switchToBatch() {
  batchForm.entryUrlsText = singleUrl.value.trim()
  handleTabChange(1)
}

async function loadRuleOptions() {
  rulesLoading.value = true
  try {
    const data = await fetchScrapeRulesPage({ pageNo: 1, pageSize: 100, bizType: 'novel', status: 1 })
    ruleOptions.value = data.rows.filter((item) => item.enabled)
  } catch (error) {
    ruleOptions.value = []
    ElMessage.error(error.message || '获取站点适配失败')
  } finally {
    rulesLoading.value = false
  }
}

async function selectBatchRule(ruleId) {
  resetBatchResult()
  selectedRuleDetail.value = null
  if (!ruleId) return
  try {
    selectedRuleDetail.value = await fetchScrapeRuleDetail(ruleId)
    batchForm.entryUrlsText = selectedRuleDetail.value.listUrl || selectedRuleDetail.value.debugUrl || batchForm.entryUrlsText
    batchForm.detailUrlSelector = selectedRuleDetail.value.chapterUrlSelector || ''
  } catch (error) {
    ElMessage.error(error.message || '获取站点适配详情失败')
  }
}

function resetBatchResult() {
  batchResult.value = null
  batchCandidates.value = []
  selectedCandidates.value = []
}

async function discoverCandidates() {
  if (!selectedRuleId.value) {
    ElMessage.warning('请先选择站点适配')
    return
  }
  batchDiscovering.value = true
  resetBatchResult()
  try {
    batchResult.value = await discoverScrapeRuleNovels(buildBatchPayload())
    batchCandidates.value = batchResult.value.candidates || []
    await nextTick()
    candidateTableRef.value?.toggleAllSelection()
    if (batchCandidates.value.length) {
      ElMessage.success(`发现 ${batchCandidates.value.length} 本候选小说`)
    } else {
      ElMessage.warning(batchResult.value.errorMessage || '没有发现候选小说')
    }
  } catch (error) {
    ElMessage.error(error.message || '发现候选小说失败')
  } finally {
    batchDiscovering.value = false
  }
}

async function submitBatchCollection() {
  batchSubmitting.value = true
  try {
    const result = await batchSyncScrapeRuleNovels({
      ...buildBatchPayload(),
      detailUrls: selectedCandidates.value.map((item) => item.detailUrl),
    })
    ElMessage.success(result.message || `批量采集任务已提交：${result.taskId || '--'}`)
    router.push('/automation/tasks')
  } catch (error) {
    ElMessage.error(error.message || '提交批量采集失败')
  } finally {
    batchSubmitting.value = false
  }
}

function buildBatchPayload() {
  const entryUrls = normalizeEntryUrls(batchForm.entryUrlsText)
  return {
    ruleId: selectedRuleId.value,
    entryUrls,
    listUrl: entryUrls[0] || selectedRuleDetail.value?.listUrl || '',
    detailUrlSelector: batchForm.detailUrlSelector || selectedRuleDetail.value?.chapterUrlSelector || '',
    paginationUrlTemplate: batchForm.scope === 'site' ? batchForm.paginationUrlTemplate : '',
    nextPageSelector: batchForm.scope === 'site' ? batchForm.nextPageSelector : '',
    startPage: batchForm.scope === 'site' ? batchForm.startPage : undefined,
    maxPages: batchForm.scope === 'site' ? optionalPositive(batchForm.maxPages) : undefined,
    maxItems: optionalPositive(batchForm.maxItems),
    sameHostOnly: batchForm.sameHostOnly,
    requestDelayMs: optionalPositive(batchForm.requestDelayMs) ?? 0,
    syncChapters: batchForm.syncChapters,
  }
}

function normalizeEntryUrls(value) {
  return String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
}

function optionalPositive(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

onMounted(loadRuleOptions)
</script>

<style scoped>
.collection-workbench {
  display: grid;
  gap: 24px;
  margin-top: 22px;
}

.single-collection,
.batch-collection {
  display: grid;
  gap: 22px;
}

.flow-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.flow-steps li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #8190ad;
  font-size: 13px;
}

.flow-steps li:not(:last-child)::after {
  position: absolute;
  top: 15px;
  right: 14px;
  left: 124px;
  height: 1px;
  background: #dce5f2;
  content: '';
}

.flow-steps li span {
  display: inline-grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  border: 1px solid #dce5f2;
  border-radius: 50%;
  background: #fff;
  font-weight: 700;
}

.flow-steps li.active {
  color: #0f3675;
}

.flow-steps li.active span {
  border-color: #2f80ed;
  background: #2f80ed;
  color: #fff;
}

.source-panel,
.preview-shell,
.continuation-panel,
.batch-source-panel,
.candidate-panel,
.task-result-panel {
  border: 1px solid #e1e8f3;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(46, 74, 125, 0.06);
}

.source-panel,
.preview-shell,
.continuation-panel,
.batch-source-panel,
.candidate-panel {
  padding: 24px;
}

.source-panel__intro,
.preview-header,
.continuation-panel > header,
.candidate-header,
.preview-actions,
.source-panel__footer,
.task-result-panel,
.task-result-panel > div,
.content-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.source-panel__intro h2,
.preview-header h2,
.continuation-panel h2,
.candidate-header h2 {
  margin: 4px 0 6px;
  color: #112a56;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: 0;
}

.source-panel__intro p,
.preview-header p,
.continuation-panel header p,
.candidate-header p {
  margin: 0;
  color: #7483a0;
  font-size: 13px;
  line-height: 1.6;
}

.section-kicker {
  color: #2f80ed;
  font-size: 12px;
  font-weight: 700;
}

.source-detection {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #dbe5f2;
  border-radius: 6px;
  background: #f8faff;
  color: #5f6f8d;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.source-detection.is-metadata,
.source-detection.is-novel {
  border-color: #b9e4d0;
  background: #f0fbf5;
  color: #18794e;
}

.source-detection.is-batch {
  border-color: #f1d6a6;
  background: #fff9ed;
  color: #9a6700;
}

.source-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  margin-top: 22px;
}

.source-input-row :deep(.el-input__wrapper) {
  min-height: 46px;
}

.source-input-row :deep(.el-button) {
  min-width: 128px;
  min-height: 46px;
}

.source-panel__footer {
  margin-top: 10px;
  color: #8a98b2;
  font-size: 12px;
}

.source-panel__footer :deep(.el-icon) {
  margin-left: 4px;
  transition: transform 180ms ease;
}

.source-panel__footer .rotated {
  transform: rotate(180deg);
}

.advanced-options {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-top: 12px;
  padding: 16px;
  border-top: 1px solid #edf1f7;
  background: #fafcff;
}

.advanced-options label,
.content-options label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #415678;
  font-size: 13px;
}

.advanced-options small {
  color: #8492ac;
}

.preview-header,
.continuation-panel > header,
.candidate-header {
  align-items: flex-start;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf1f7;
}

.metadata-preview {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 28px;
  padding-top: 22px;
}

.book-cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.book-cover img,
.book-cover > span {
  display: grid;
  width: 130px;
  aspect-ratio: 3 / 4;
  place-items: center;
  border-radius: 6px;
  background: #eaf1fb;
  color: #315a93;
  object-fit: cover;
  font-size: 42px;
  font-weight: 800;
}

.book-cover a {
  color: #2f80ed;
  font-size: 12px;
  text-decoration: none;
}

.field-grid,
.batch-basic-grid,
.batch-advanced-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.metadata-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.inline-notes {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  padding: 12px 14px;
  border-left: 3px solid #efb84d;
  background: #fffbf2;
  color: #795a19;
  font-size: 12px;
}

.preview-actions {
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #edf1f7;
}

.preview-actions > span:first-child {
  margin-right: auto;
  color: #7483a0;
  font-size: 12px;
}

.result-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 20px 0;
}

.result-facts div {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e7edf6;
  border-radius: 6px;
  background: #f9fbfe;
}

.result-facts span,
.result-facts strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-facts span {
  margin-bottom: 8px;
  color: #8492ab;
  font-size: 12px;
}

.result-facts strong {
  color: #172f5b;
  font-size: 15px;
}

.continuation-panel .source-input-row {
  margin-top: 20px;
}

.content-result {
  margin-top: 16px;
}

.content-options {
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #edf1f7;
}

.task-result-panel {
  padding: 18px 20px;
}

.task-result-panel > div {
  justify-content: flex-start;
  color: #47607f;
  font-size: 13px;
}

.task-result-panel > div :deep(.el-icon) {
  color: #20a66a;
  font-size: 24px;
}

.task-result-panel strong {
  display: block;
  margin-bottom: 3px;
  color: #173462;
  font-size: 14px;
}

.batch-source-panel :deep(.el-select),
.batch-source-panel :deep(.el-input-number) {
  width: 100%;
}

.advanced-collapse {
  margin-top: 2px;
  border-top: 1px solid #edf1f7;
  border-bottom: 1px solid #edf1f7;
}

.advanced-collapse :deep(.el-collapse-item__header) {
  color: #415678;
  font-weight: 700;
}

.candidate-header > div:last-child {
  display: flex;
  gap: 10px;
}

.candidate-panel :deep(.el-table) {
  margin-top: 18px;
}

.candidate-book {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.candidate-book > .el-image,
.candidate-book > span {
  display: grid;
  width: 38px;
  height: 50px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 4px;
  background: #eaf1fb;
  color: #315a93;
  font-weight: 800;
}

.candidate-book div {
  min-width: 0;
}

.candidate-book strong,
.candidate-book small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-book strong {
  color: #15315e;
}

.candidate-book small {
  margin-top: 5px;
  color: #8090aa;
}

.conflict-dialog p {
  margin: 0 0 18px;
  color: #5d6f8d;
}

.conflict-dialog :deep(.el-radio-group) {
  display: grid;
  gap: 12px;
}

@media (max-width: 900px) {
  .metadata-preview,
  .field-grid,
  .batch-basic-grid,
  .batch-advanced-grid,
  .result-facts {
    grid-template-columns: 1fr 1fr;
  }

  .metadata-preview {
    grid-template-columns: 120px minmax(0, 1fr);
  }

  .flow-steps li:not(:last-child)::after {
    display: none;
  }
}

@media (max-width: 640px) {
  .flow-steps,
  .field-grid,
  .batch-basic-grid,
  .batch-advanced-grid,
  .result-facts,
  .metadata-preview,
  .source-input-row {
    grid-template-columns: 1fr;
  }

  .flow-steps {
    gap: 8px;
  }

  .source-panel,
  .preview-shell,
  .continuation-panel,
  .batch-source-panel,
  .candidate-panel {
    padding: 18px;
  }

  .source-panel__intro,
  .preview-header,
  .continuation-panel > header,
  .candidate-header,
  .source-panel__footer,
  .preview-actions,
  .task-result-panel,
  .content-options,
  .advanced-options {
    align-items: stretch;
    flex-direction: column;
  }

  .source-detection {
    align-self: flex-start;
  }

  .candidate-header > div:last-child {
    display: grid;
  }

  .book-cover {
    align-items: flex-start;
  }
}
</style>

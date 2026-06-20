<template>
  <ContentManagementPage
    v-model:search-keyword="searchKeyword"
    :active-tab="activeTab"
    :config="pageConfig"
    :filters-state="filters"
    :loading="loading"
    :page-count="pageCount"
    :page-no="pageNo"
    :page-size="pageSize"
    :rows="novels"
    :selected-row-keys="selectedNovelIds"
    :total="total"
    @batch-action="handleBatchAction"
    @action="handlePageAction"
    @filter-change="handleFilterChange"
    @page-change="loadNovels"
    @page-size-change="handlePageSizeChange"
    @refresh="refreshPage"
    @reset="resetFilters"
    @row-action="handleRowAction"
    @search="loadNovels(1)"
    @selection-change="handleSelectionChange"
    @tab-change="handleTabChange"
  />

  <el-dialog v-model="novelFormVisible" :title="editingNovel ? '编辑小说' : '添加小说'" width="620px" destroy-on-close @closed="resetNovelForm">
    <el-form ref="novelFormRef" :model="novelForm" :rules="novelRules" class="novel-form" label-position="top">
      <div class="form-grid">
        <el-form-item label="小说名称" prop="bookName">
          <el-input v-model="novelForm.bookName" placeholder="请输入小说名称" />
        </el-form-item>
        <el-form-item label="作者" prop="authorName">
          <el-input v-model="novelForm.authorName" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="novelForm.categoryId" placeholder="请选择分类" clearable filterable>
            <el-option v-for="option in categorySelectOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="novelForm.sortNo" :min="0" class="form-control" />
        </el-form-item>
      </div>
      <el-form-item label="副标题">
        <el-input v-model="novelForm.subtitle" placeholder="请输入副标题" />
      </el-form-item>
      <el-form-item label="封面文件ID">
        <el-input v-model="novelForm.coverFileId" placeholder="可选，填写已上传封面文件 ID" />
      </el-form-item>
      <el-form-item label="简介">
        <el-input v-model="novelForm.introduction" :rows="4" placeholder="请输入小说简介" type="textarea" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="novelForm.remark" :rows="2" placeholder="请输入备注" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="novelFormVisible = false">取消</el-button>
      <el-button :loading="formSubmitting" type="primary" @click="submitNovelForm">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="localImportVisible"
    title="批量导入小说"
    width="1080px"
    destroy-on-close
    @closed="resetLocalImportForm"
  >
    <input
      ref="localImportDirectoryInputRef"
      class="directory-input"
      type="file"
      accept=".txt"
      webkitdirectory
      multiple
      @change="handleLocalDirectoryChange"
    />

    <section class="local-import-picker">
      <div class="local-import-picker__main">
        <span>本地小说目录</span>
        <strong>{{ localImportDirectoryName || '未选择目录' }}</strong>
      </div>
      <el-button :loading="localImportScanning" type="primary" @click="chooseLocalImportDirectory">
        {{ localImportDirectoryName ? '重新选择目录' : '选择目录' }}
      </el-button>
    </section>

    <section v-if="localImportRows.length || localImportDuplicateRows.length || localImportUnsupportedCount" class="local-import-summary">
      <article v-for="item in localImportSummary" :key="item.label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <el-alert
      v-if="localImportDuplicateRows.length"
      class="local-import-alert"
      :title="`已按文件名和目录去重 ${localImportDuplicateRows.length} 个重复 TXT 文件`"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-alert
      v-if="localImportExistingCount"
      class="local-import-alert"
      :title="`已识别 ${localImportExistingCount} 本库中已有小说，默认不会导入`"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-table
      v-if="localImportRows.length"
      ref="localImportTableRef"
      :data="localImportRows"
      class="local-import-table"
      height="360"
      row-key="key"
      @selection-change="handleLocalImportSelectionChange"
    >
      <el-table-column type="selection" width="48" reserve-selection :selectable="isSelectableLocalImportRow" />
      <el-table-column label="状态" width="96">
        <template #default="{ row }">
          <el-tag :type="localImportStatusType(row.status)" size="small">{{ localImportStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="识别书名" min-width="190" show-overflow-tooltip>
        <template #default="{ row }">{{ row.bookName }}</template>
      </el-table-column>
      <el-table-column label="类型" width="96">
        <template #default>
          <el-tag size="small">TXT</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="180">
        <template #default="{ row }">
          <el-tag v-if="row.categoryName" size="small" type="success">{{ row.categoryName }}</el-tag>
          <el-tag v-else size="small" type="info">未匹配</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="说明" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.message || row.existingBookName || '--' }}</template>
      </el-table-column>
      <el-table-column label="来源" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">{{ row.relativePath }}</template>
      </el-table-column>
      <el-table-column label="大小" prop="fileSizeText" width="110" />
      <el-table-column label="修改时间" prop="lastModifiedTime" width="150" />
    </el-table>

    <section v-if="localImportResult" class="local-import-result">
      <div class="local-import-result__summary">
        <span v-for="item in localImportResultSummary" :key="item.label">
          {{ item.label }} <strong>{{ item.value }}</strong>
        </span>
      </div>
      <el-table :data="localImportResult.items" max-height="220" size="small">
        <el-table-column label="状态" width="92">
          <template #default="{ row }">
            <el-tag :type="localImportStatusType(row.status)" size="small">{{ localImportStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="书名" prop="bookName" min-width="160" show-overflow-tooltip />
        <el-table-column label="说明" prop="message" min-width="240" show-overflow-tooltip />
        <el-table-column label="路径" prop="relativePath" min-width="260" show-overflow-tooltip />
      </el-table>
    </section>

    <template #footer>
      <el-button @click="localImportVisible = false">{{ localImportResult ? '关闭' : '取消' }}</el-button>
      <el-button @click="chooseLocalImportDirectory">{{ localImportDirectoryName ? '重新选择' : '选择目录' }}</el-button>
      <el-button :disabled="!localImportCanCommit" :loading="localImportCommitting" type="primary" @click="commitLocalImport">
        导入选中 {{ localImportSelectedImportableCount }} 项
      </el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="chapterVisible" size="760px" title="章节管理" destroy-on-close>
    <div class="chapter-panel">
      <header v-if="selectedNovel" class="chapter-header">
        <span class="chapter-cover" :style="coverStyle(selectedNovel.cover)" />
        <div>
          <h2>{{ selectedNovel.title }}</h2>
          <p>{{ selectedNovel.author }}</p>
          <span>{{ selectedNovel.chapterCount }}</span>
        </div>
      </header>

      <div class="chapter-toolbar">
        <el-input
          v-model="chapterKeyword"
          clearable
          placeholder="搜索章节标题"
          @keyup.enter="loadChapters(1)"
        />
        <el-button :loading="chapterLoading" @click="loadChapters(1)">查询</el-button>
        <el-button :loading="chapterSorting" @click="refreshChapterOrder">同步排序</el-button>
        <el-button type="primary" @click="openChapterForm()">新增章节</el-button>
      </div>

      <el-table v-loading="chapterLoading" :data="chapterRows" class="chapter-table" size="small">
        <el-table-column label="序号" prop="chapterNo" width="76" />
        <el-table-column label="章节标题" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">{{ row.chapterTitle }}</template>
        </el-table-column>
        <el-table-column label="字数" prop="wordCountText" width="110" />
        <el-table-column label="切片状态" prop="sliceStatus" width="100" />
        <el-table-column label="版本" prop="parseVersion" width="72" />
        <el-table-column label="更新时间" prop="updateTime" width="138" />
        <el-table-column label="操作" width="188" fixed="right">
          <template #default="{ row, $index }">
            <el-button link :disabled="chapterSorting" @click="moveChapter(row, -1)">上移</el-button>
            <el-button link :disabled="chapterSorting || isLastChapterRow($index)" @click="moveChapter(row, 1)">下移</el-button>
            <el-button link type="primary" @click="openChapterForm(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteChapter(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无章节" :image-size="72" />
        </template>
      </el-table>

      <footer class="chapter-footer">
        <span>共 {{ chapterTotal.toLocaleString('zh-CN') }} 章</span>
        <el-pagination
          v-model:current-page="chapterPageNo"
          v-model:page-size="chapterPageSize"
          :total="chapterTotal"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          small
          @current-change="loadChapters"
          @size-change="handleChapterPageSizeChange"
        />
      </footer>
    </div>
  </el-drawer>

  <el-dialog v-model="chapterFormVisible" :title="editingChapter ? '编辑章节' : '新增章节'" width="640px" destroy-on-close @closed="resetChapterForm">
    <el-form ref="chapterFormRef" :model="chapterForm" :rules="chapterRules" class="chapter-form" label-position="top">
      <div class="form-grid">
        <el-form-item label="章节序号">
          <el-input-number v-model="chapterForm.chapterNo" :min="1" class="form-control" />
        </el-form-item>
        <el-form-item label="章节标题" prop="chapterTitle">
          <el-input v-model="chapterForm.chapterTitle" placeholder="请输入章节标题" />
        </el-form-item>
      </div>
      <el-form-item label="章节正文" prop="content">
        <el-input
          v-model="chapterForm.content"
          :rows="12"
          placeholder="请输入章节正文"
          resize="vertical"
          type="textarea"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="chapterFormVisible = false">取消</el-button>
      <el-button :loading="chapterSubmitting" type="primary" @click="submitChapterForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, markRaw, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Delete,
  Document,
  EditPen,
  Files,
  FolderOpened,
  MoreFilled,
  Plus,
  RefreshRight,
  Tickets,
} from '@element-plus/icons-vue'
import ContentManagementPage from '../components/content/ContentManagementPage.vue'
import {
  batchChangeBookShelfStatus,
  batchDeleteBooks,
  changeBookShelfStatus,
  checkBookImportDuplicates,
  createNovel,
  createNovelChapter,
  deleteBook,
  deleteNovelChapter,
  fetchBookCategories,
  fetchBookDetail,
  fetchBookFilterOptions,
  fetchBookList,
  fetchChapterRead,
  fetchNovelChapterList,
  reorderNovelChapters,
  updateBook,
  updateNovelChapter,
  uploadBookFile,
} from '../api/books'

const NOVEL_BIZ_TYPE = 'novel'
const LOCAL_IMPORT_SUPPORTED_EXTENSION = 'txt'
const LOCAL_IMPORT_CATEGORY_MIN_SCORE = 4
const LOCAL_IMPORT_CATEGORY_FIELDS = [
  { key: 'parentPath', weight: 10 },
  { key: 'relativePath', weight: 8 },
  { key: 'title', weight: 5 },
  { key: 'fileName', weight: 4 },
]
const LOCAL_IMPORT_GENERIC_CATEGORY_NAMES = new Set(['小说', '网络小说', '全部分类', '未分类'])
const LOCAL_IMPORT_GENERIC_CATEGORY_CODES = new Set(['novel', 'all', 'uncategorized'])

const baseFilters = [
  { key: 'categoryId', label: '分类', options: [{ label: '全部分类', value: '' }] },
  { key: 'tagName', label: '标签', options: [{ label: '全部标签', value: '' }] },
  { key: 'storageSource', label: '存储位置', options: [{ label: '全部存储', value: '' }] },
  {
    key: 'publishStatus',
    label: '上架状态',
    options: [
      { label: '全部状态', value: '' },
      { label: '未上架', value: 0 },
      { label: '已上架', value: 1 },
      { label: '已下架', value: 2 },
    ],
  },
]

const columns = [
  { key: 'cover', label: '封面', type: 'cover' },
  { key: 'title', label: '小说 / 作者', type: 'title', subKey: 'author' },
  { key: 'category', label: '分类', type: 'chip' },
  { key: 'source', label: '来源', type: 'source', subKey: 'path' },
  { key: 'status', label: '状态', type: 'status', subKey: 'statusSub' },
  { key: 'latest', label: '最新章节', type: 'dual', subKey: 'chapterCount' },
  { key: 'updatedAt', label: '更新时间' },
  { key: 'words', label: '字数' },
  { key: 'actions', label: '操作', type: 'actions' },
]

const rowActions = [
  { code: 'chapters', label: '章节', icon: Collection },
  { code: 'shelf', label: '上下架', icon: RefreshRight },
  { code: 'edit', label: '编辑', icon: EditPen },
  { code: 'delete', label: '删除', icon: Delete, danger: true },
]

const searchKeyword = ref('')
const filters = reactive(createFilterState(baseFilters))
const activeTab = ref('all')
const loading = ref(false)
const batchLoading = ref(false)
const novels = ref([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
const categoryOptions = ref([])
const filterOptions = ref({ tagOptions: [], storageOptions: [] })
const novelFormVisible = ref(false)
const formSubmitting = ref(false)
const novelFormRef = ref()
const novelForm = reactive(createEmptyNovelForm())
const editingNovel = ref(null)
const selectedNovel = ref(null)
const chapterVisible = ref(false)
const chapterLoading = ref(false)
const chapterSorting = ref(false)
const chapterRows = ref([])
const chapterTotal = ref(0)
const chapterPageNo = ref(1)
const chapterPageSize = ref(10)
const chapterKeyword = ref('')
const chapterFormVisible = ref(false)
const chapterSubmitting = ref(false)
const chapterFormRef = ref()
const chapterForm = reactive(createEmptyChapterForm())
const editingChapter = ref(null)
const selectedNovelIds = ref([])
const localImportVisible = ref(false)
const localImportScanning = ref(false)
const localImportCommitting = ref(false)
const localImportDirectoryInputRef = ref()
const localImportDirectoryName = ref('')
const localImportRows = ref([])
const localImportDuplicateRows = ref([])
const localImportUnsupportedCount = ref(0)
const localImportSourceFileCount = ref(0)
const localImportSelectedRows = ref([])
const localImportResult = ref(null)
const localImportTableRef = ref()

const novelRules = {
  bookName: [{ required: true, message: '请输入小说名称', trigger: 'blur' }],
  authorName: [{ required: true, message: '请输入作者', trigger: 'blur' }],
}

const chapterRules = {
  chapterTitle: [{ required: true, message: '请输入章节标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入章节正文', trigger: 'blur' }],
}

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const categorySelectOptions = computed(() => categoryOptions.value.map((item) => ({ label: item.name, value: item.id })))
const localImportSelectedImportableCount = computed(() => localImportSelectedRows.value.filter(isImportableLocalRow).length)
const localImportCanCommit = computed(() => localImportSelectedImportableCount.value > 0 && !localImportCommitting.value && !localImportScanning.value)
const localImportExistingCount = computed(() => localImportRows.value.filter((row) => row.status === 'exists').length)
const localImportSummary = computed(() => {
  if (!localImportRows.value.length && !localImportDuplicateRows.value.length && !localImportUnsupportedCount.value) return []

  const totalFileSize = localImportRows.value.reduce((sum, row) => sum + Number(row.fileSize || 0), 0)
  const matchedCategoryCount = localImportRows.value.filter((row) => row.categoryId).length

  return [
    { label: '选中文件', value: formatNumber(localImportSourceFileCount.value) },
    { label: '待导入', value: formatNumber(localImportRows.value.filter(isImportableLocalRow).length) },
    { label: '已匹配分类', value: formatNumber(matchedCategoryCount) },
    { label: '库中已有', value: formatNumber(localImportExistingCount.value) },
    { label: '已去重', value: formatNumber(localImportDuplicateRows.value.length) },
    { label: '已忽略', value: formatNumber(localImportUnsupportedCount.value) },
    { label: '总大小', value: formatBrowserFileSize(totalFileSize) },
  ]
})
const localImportResultSummary = computed(() => {
  const result = localImportResult.value
  if (!result) return []

  return [
    { label: '请求', value: formatNumber(result.requestedCount) },
    { label: '入库', value: formatNumber(result.createdCount) },
    { label: '跳过', value: formatNumber(result.skippedCount) },
    { label: '重复', value: formatNumber(result.duplicateCount) },
    { label: '失败', value: formatNumber(result.failedCount) },
  ]
})
const pageConfig = computed(() => ({
  activeMenu: '小说',
  title: '小说',
  subtitle: '管理所有网络小说，支持新增小说、章节维护和元数据管理',
  searchPlaceholder: '搜索小说名、作者...',
  pageSizeOptions: [10, 20, 50],
  tabs: buildTabs(),
  actions: [
    { label: '刷新', icon: RefreshRight },
    { label: '批量导入', icon: FolderOpened },
    { label: '添加小说', icon: Plus, tone: 'primary' },
  ],
  metrics: buildMetrics(),
  filters: buildFilters(),
  columns,
  rowActions,
  selectable: true,
  batchActions: [
    { code: 'batch-online', label: '批量上架', tone: 'primary', loading: batchLoading.value },
    { code: 'batch-offline', label: '批量下架', loading: batchLoading.value },
    { code: 'batch-delete', label: '批量删除', tone: 'danger', loading: batchLoading.value },
  ],
}))

let searchTimer = null

watch(searchKeyword, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadNovels(1), 350)
})

async function refreshPage() {
  await loadFilterData()
  await loadNovels(1)
}

async function loadFilterData() {
  const [categoriesResult, optionsResult] = await Promise.allSettled([
    fetchBookCategories({ rootCode: NOVEL_BIZ_TYPE }),
    fetchBookFilterOptions({ bizType: NOVEL_BIZ_TYPE, bookType: 'novel' }),
  ])

  categoryOptions.value = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
  if (categoriesResult.status === 'rejected') {
    console.warn('小说分类接口加载失败。', categoriesResult.reason)
  }

  filterOptions.value = optionsResult.status === 'fulfilled'
    ? optionsResult.value
    : { tagOptions: [], storageOptions: [] }
  if (optionsResult.status === 'rejected') {
    console.warn('小说筛选项接口加载失败。', optionsResult.reason)
  }
}

async function loadNovels(nextPage = pageNo.value) {
  pageNo.value = Math.min(Math.max(Number(nextPage) || 1, 1), pageCount.value)
  loading.value = true
  try {
    const response = await fetchBookList({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      bookName: searchKeyword.value.trim() || undefined,
      bookType: 'novel',
      bizType: NOVEL_BIZ_TYPE,
      categoryId: filters.categoryId || undefined,
      tagName: filters.tagName || undefined,
      storageSource: filters.storageSource || undefined,
      publishStatus: activePublishStatus(),
    })

    novels.value = response.records
    selectedNovelIds.value = selectedNovelIds.value.filter((id) => response.records.some((row) => row.id === id))
    total.value = Number(response.total) || 0
    pageNo.value = Number(response.current) || pageNo.value
  } catch (error) {
    console.warn('小说列表接口加载失败。', error)
    novels.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleFilterChange(key, value) {
  filters[key] = value
  loadNovels(1)
}

function handlePageSizeChange(value) {
  pageSize.value = value
  loadNovels(1)
}

function handleTabChange(key) {
  activeTab.value = key || 'all'
  loadNovels(1)
}

function handlePageAction(action) {
  const code = action?.code

  if (action.label === '刷新' || code === 'refresh') {
    refreshPage()
    return
  }

  if (action.label === '批量导入' || code === 'local-import') {
    openLocalImportDialog()
    return
  }

  if (action.label === '添加小说') {
    openNovelForm()
  }
}

function resetFilters() {
  Object.assign(filters, createFilterState(baseFilters))
  searchKeyword.value = ''
  activeTab.value = 'all'
  loadNovels(1)
}

function handleRowAction(action, row) {
  const code = normalizeActionCode(action)

  if (code === 'chapters') {
    openChapters(row)
    return
  }

  if (code === 'shelf' || code === 'publish' || code === 'offline' || code === 'online') {
    toggleShelfStatus(row)
    return
  }

  if (code === 'edit') {
    openNovelForm(row)
    return
  }

  if (code === 'delete' || code === 'remove') {
    handleDeleteNovel(row)
    return
  }

  ElMessage.info(`暂未接入「${action.label}」操作。`)
}

function handleSelectionChange(keys = []) {
  selectedNovelIds.value = Array.isArray(keys) ? keys : []
}

async function handleBatchAction(action, selectedRows = []) {
  const ids = selectedNovelIds.value.filter(Boolean)
  if (!ids.length) {
    ElMessage.warning('请先选择要操作的小说')
    return
  }

  const code = String(action?.code || '')
  if (code === 'batch-online') {
    await batchShelfNovels(ids, selectedRows, 1)
    return
  }

  if (code === 'batch-offline') {
    await batchShelfNovels(ids, selectedRows, 2)
    return
  }

  if (code === 'batch-delete') {
    await batchDeleteSelectedNovels(ids, selectedRows)
  }
}

async function batchShelfNovels(ids, rows, publishStatus) {
  const actionText = publishStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(
      `确定批量${actionText}已选择的 ${ids.length} 本小说吗？`,
      `批量${actionText}`,
      {
        confirmButtonText: actionText,
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    batchLoading.value = true
    const result = await batchChangeBookShelfStatus(ids, publishStatus)
    showBatchResult(result, `批量${actionText}完成`)
    selectedNovelIds.value = []
    await loadNovels(pageNo.value)
    await refreshSelectedNovelIfNeeded(rows)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || `批量${actionText}小说失败`)
    }
  } finally {
    batchLoading.value = false
  }
}

async function batchDeleteSelectedNovels(ids, rows = []) {
  try {
    await ElMessageBox.confirm(
      `确定批量删除已选择的 ${ids.length} 本小说吗？删除后不可恢复。`,
      '批量删除小说',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    batchLoading.value = true
    const result = await batchDeleteBooks(ids)
    showBatchResult(result, '批量删除完成')
    selectedNovelIds.value = []
    if (selectedNovel.value?.id && ids.includes(selectedNovel.value.id)) {
      chapterVisible.value = false
      selectedNovel.value = null
    }
    await loadNovels(pageNo.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量删除小说失败')
    }
  } finally {
    batchLoading.value = false
  }
}

function showBatchResult(result = {}, fallbackMessage) {
  const message = buildBatchResultMessage(result, fallbackMessage)
  if (Number(result.failedCount || 0) > 0) {
    ElMessage.warning(message)
  } else {
    ElMessage.success(message)
  }
}

function buildBatchResultMessage(result = {}, fallbackMessage) {
  const baseMessage = result.summary || `${fallbackMessage}，成功 ${result.successCount ?? 0} 条，失败 ${result.failedCount ?? 0} 条`
  const failedItems = Array.isArray(result.items) ? result.items.filter((item) => item?.success === false || item?.status === 'failed') : []
  if (!failedItems.length) return baseMessage

  const details = failedItems
    .slice(0, 3)
    .map((item) => `${item.bookName || item.id || '未命名'}：${item.message || '操作失败'}`)
    .join('；')
  const suffix = failedItems.length > 3 ? `；等 ${failedItems.length} 条失败` : ''
  return `${baseMessage}。${details}${suffix}`
}

async function refreshSelectedNovelIfNeeded(rows = []) {
  if (!chapterVisible.value || !selectedNovel.value?.id) return
  if (!rows.some((row) => row.id === selectedNovel.value.id)) return

  try {
    selectedNovel.value = await fetchBookDetail(selectedNovel.value.id)
  } catch (error) {
    console.warn('批量操作后刷新小说详情失败。', error)
  }
}

async function openNovelForm(row = null) {
  editingNovel.value = row
  Object.assign(novelForm, createEmptyNovelForm())
  novelFormVisible.value = true

  if (!row?.id) return

  formSubmitting.value = true
  try {
    const detail = await fetchBookDetail(row.id)
    Object.assign(novelForm, createNovelFormFromBook(detail.raw || {}, detail))
    editingNovel.value = detail
  } catch (error) {
    ElMessage.error(error?.message || '获取小说详情失败')
  } finally {
    formSubmitting.value = false
  }
}

async function submitNovelForm() {
  if (!novelFormRef.value) return
  await novelFormRef.value.validate()

  formSubmitting.value = true
  try {
    const payload = buildNovelPayload()
    if (editingNovel.value?.id) {
      await updateBook({ ...payload, id: editingNovel.value.id, bookType: 'novel' })
      ElMessage.success('小说已更新')
    } else {
      await createNovel(payload)
      ElMessage.success('小说已创建')
    }
    novelFormVisible.value = false
    await loadNovels(editingNovel.value?.id ? pageNo.value : 1)
  } catch (error) {
    ElMessage.error(error?.message || '保存小说失败')
  } finally {
    formSubmitting.value = false
  }
}

async function handleDeleteNovel(row) {
  if (!row?.id) {
    ElMessage.warning('缺少小说 ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？删除后不可恢复。`, '删除小说', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteBook(row.id)
    ElMessage.success('小说已删除')
    await loadNovels(pageNo.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除小说失败')
    }
  }
}

async function toggleShelfStatus(row) {
  if (!row?.id) {
    ElMessage.warning('缺少小说 ID，无法切换上下架')
    return
  }

  const currentStatus = Number(row.raw?.publishStatus ?? -1)
  const nextStatus = currentStatus === 1 ? 2 : 1
  const actionText = nextStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定${actionText}「${row.title}」吗？`, `${actionText}小说`, {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })

    batchLoading.value = true
    await changeBookShelfStatus(row.id, nextStatus)
    ElMessage.success(`小说已${actionText}`)
    await loadNovels(pageNo.value)

    if (chapterVisible.value && selectedNovel.value?.id === row.id) {
      selectedNovel.value = await fetchBookDetail(row.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || `${actionText}小说失败`)
    }
  } finally {
    batchLoading.value = false
  }
}

async function openChapters(row) {
  if (!row?.id) {
    ElMessage.warning('缺少小说 ID，无法查看章节')
    return
  }

  selectedNovel.value = row
  chapterVisible.value = true
  chapterKeyword.value = ''
  chapterPageNo.value = 1
  await loadChapters(1)
}

async function loadChapters(nextPage = chapterPageNo.value) {
  if (!selectedNovel.value?.id) return
  chapterPageNo.value = Number(nextPage) || 1
  chapterLoading.value = true
  try {
    const response = await fetchNovelChapterList({
      bookId: selectedNovel.value.id,
      chapterTitle: chapterKeyword.value.trim() || undefined,
      pageNo: chapterPageNo.value,
      pageSize: chapterPageSize.value,
    })
    chapterRows.value = response.records
    chapterTotal.value = Number(response.total) || 0
    chapterPageNo.value = Number(response.current) || chapterPageNo.value
  } catch (error) {
    console.warn('小说章节接口加载失败。', error)
    chapterRows.value = []
    chapterTotal.value = 0
    ElMessage.error(error?.message || '获取章节列表失败')
  } finally {
    chapterLoading.value = false
  }
}

function handleChapterPageSizeChange(value) {
  chapterPageSize.value = value
  loadChapters(1)
}

async function openChapterForm(row = null) {
  if (!selectedNovel.value?.id) {
    ElMessage.warning('请先选择小说')
    return
  }

  editingChapter.value = row
  Object.assign(chapterForm, createEmptyChapterForm())
  chapterFormVisible.value = true

  if (!row?.id) return

  chapterSubmitting.value = true
  try {
    const detail = await fetchChapterRead(row.id)
    Object.assign(chapterForm, createChapterFormFromRecord(detail))
    editingChapter.value = detail
  } catch (error) {
    Object.assign(chapterForm, createChapterFormFromRecord(row))
    ElMessage.warning(error?.message || '章节正文读取失败，请重新填写正文后保存')
  } finally {
    chapterSubmitting.value = false
  }
}

async function submitChapterForm() {
  if (!chapterFormRef.value || !selectedNovel.value?.id) return
  await chapterFormRef.value.validate()

  chapterSubmitting.value = true
  try {
    const payload = {
      bookId: selectedNovel.value.id,
      chapterNo: chapterForm.chapterNo || undefined,
      chapterTitle: chapterForm.chapterTitle.trim(),
      content: chapterForm.content.trim(),
    }

    if (editingChapter.value?.id) {
      await updateNovelChapter({
        id: editingChapter.value.id,
        chapterNo: payload.chapterNo,
        chapterTitle: payload.chapterTitle,
        content: payload.content,
      })
      ElMessage.success('章节已更新')
    } else {
      await createNovelChapter(payload)
      ElMessage.success('章节已新增')
    }
    chapterFormVisible.value = false
    await loadChapters(editingChapter.value?.id ? chapterPageNo.value : 1)
    await loadNovels(pageNo.value)
  } catch (error) {
    ElMessage.error(error?.message || '保存章节失败')
  } finally {
    chapterSubmitting.value = false
  }
}

async function refreshChapterOrder() {
  await loadChapters(chapterPageNo.value)
}

function isLastChapterRow(index) {
  const absoluteIndex = (chapterPageNo.value - 1) * chapterPageSize.value + index
  return absoluteIndex >= chapterTotal.value - 1
}

async function moveChapter(row, offset) {
  if (!selectedNovel.value?.id || !row?.id) return

  chapterSorting.value = true
  try {
    const orderedIds = await fetchAllChapterIds()
    const currentIndex = orderedIds.indexOf(row.id)
    const nextIndex = currentIndex + offset

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) {
      return
    }

    const nextIds = [...orderedIds]
    const [movedId] = nextIds.splice(currentIndex, 1)
    nextIds.splice(nextIndex, 0, movedId)
    await reorderNovelChapters(selectedNovel.value.id, nextIds)
    ElMessage.success('章节顺序已更新')
    await loadChapters(chapterPageNo.value)
    await loadNovels(pageNo.value)
  } catch (error) {
    ElMessage.error(error?.message || '章节排序失败')
  } finally {
    chapterSorting.value = false
  }
}

async function fetchAllChapterIds() {
  const pageSizeForSort = Math.max(Number(chapterTotal.value || 0), 1000)
  const response = await fetchNovelChapterList({
    bookId: selectedNovel.value.id,
    pageNo: 1,
    pageSize: pageSizeForSort,
  })
  return response.records.map((item) => item.id).filter(Boolean)
}

async function handleDeleteChapter(row) {
  if (!row?.id) {
    ElMessage.warning('缺少章节 ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除「${row.chapterTitle}」吗？`, '删除章节', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteNovelChapter(row.id)
    ElMessage.success('章节已删除')
    await loadChapters(chapterPageNo.value)
    await loadNovels(pageNo.value)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除章节失败')
    }
  }
}

async function openLocalImportDialog() {
  localImportVisible.value = true
}

function chooseLocalImportDirectory() {
  localImportDirectoryInputRef.value?.click()
}

async function handleLocalDirectoryChange(event) {
  const files = Array.from(event.target?.files || [])
  if (event.target) {
    event.target.value = ''
  }

  if (!files.length) {
    return
  }

  localImportScanning.value = true
  localImportRows.value = []
  localImportDuplicateRows.value = []
  localImportUnsupportedCount.value = 0
  localImportSourceFileCount.value = files.length
  localImportSelectedRows.value = []
  localImportResult.value = null

  try {
    if (!categoryOptions.value.length) {
      await loadFilterData()
    }

    localImportDirectoryName.value = resolveDirectoryName(files)
    const prepared = buildLocalDirectoryImportRows(files)
    localImportRows.value = prepared.rows
    localImportDuplicateRows.value = prepared.duplicates
    localImportUnsupportedCount.value = prepared.unsupportedCount
    await applyLocalImportDuplicateCheck(localImportRows.value)

    await nextTick()
    const selectableRows = localImportRows.value.filter(isImportableLocalRow)
    selectableRows.forEach((row) => localImportTableRef.value?.toggleRowSelection(row, true))
    localImportSelectedRows.value = selectableRows

    if (!localImportRows.value.length) {
      ElMessage.warning('目录中没有找到可导入的 TXT 小说')
    } else if (localImportExistingCount.value > 0) {
      ElMessage.success(`已识别 ${localImportRows.value.length} 本小说，其中 ${localImportExistingCount.value} 本库中已有`)
    } else if (localImportDuplicateRows.value.length > 0) {
      ElMessage.success(`已识别 ${localImportRows.value.length} 本小说，并去重 ${localImportDuplicateRows.value.length} 个重复文件`)
    } else {
      ElMessage.success(`已识别 ${localImportRows.value.length} 本小说`)
    }
  } catch (error) {
    ElMessage.error(error?.message || '读取本地小说目录失败')
  } finally {
    localImportScanning.value = false
  }
}

function handleLocalImportSelectionChange(rows = []) {
  localImportSelectedRows.value = rows
}

async function commitLocalImport() {
  const pendingRows = localImportSelectedRows.value.filter(isImportableLocalRow)
  if (!pendingRows.length) {
    ElMessage.warning('请先选择要导入的小说')
    return
  }

  localImportCommitting.value = true
  localImportResult.value = buildLocalImportResultShell(pendingRows.length)

  try {
    for (const row of pendingRows) {
      await uploadLocalImportRow(row)
    }

    const result = localImportResult.value
    if (result.failedCount > 0) {
      result.summary = `批量导入完成，成功 ${result.createdCount} 项，跳过 ${result.skippedCount} 项，失败 ${result.failedCount} 项`
      ElMessage.warning(result.summary)
    } else {
      result.summary = `批量导入完成，成功 ${result.createdCount} 项，跳过 ${result.skippedCount} 项`
      ElMessage.success(result.summary)
    }
    resetListViewAfterUpload()
    await Promise.allSettled([loadNovels(1), loadFilterData()])
  } catch (error) {
    ElMessage.error(error?.message || '批量导入小说失败')
  } finally {
    localImportCommitting.value = false
  }
}

function buildFilters() {
  return baseFilters.map((filter) => {
    if (filter.key === 'categoryId') {
      return withOptions(filter, [
        { label: '全部分类', value: '' },
        ...categoryOptions.value.map((item) => ({ label: item.name, value: item.id })),
      ])
    }

    if (filter.key === 'tagName') {
      return withOptions(filter, [{ label: '全部标签', value: '' }, ...(filterOptions.value.tagOptions || [])])
    }

    if (filter.key === 'storageSource') {
      return withOptions(filter, [{ label: '全部存储', value: '' }, ...(filterOptions.value.storageOptions || [])])
    }

    return filter
  })
}

function buildTabs() {
  return [
    { key: 'all', label: `全部小说 (${formatNumber(total.value)})` },
    { key: 'online', label: '已上架' },
    { key: 'offline', label: '未上架' },
  ]
}

function buildMetrics() {
  const currentTotal = Number(total.value || 0)
  const online = novels.value.filter((row) => Number(row.raw?.publishStatus) === 1).length
  const offline = novels.value.filter((row) => Number(row.raw?.publishStatus) !== 1).length
  const chapterTotal = novels.value.reduce((sum, row) => sum + Number(row.raw?.chapterCount || 0), 0)
  const wordTotal = novels.value.reduce((sum, row) => sum + Number(row.raw?.wordCount || row.raw?.totalWords || 0), 0)

  return [
    { title: '小说总数', value: formatNumber(currentTotal), unit: '本', footLabel: '当前筛选', footValue: '', footTone: 'blue', icon: Document, color: 'blue' },
    { title: '已上架', value: formatNumber(online), unit: '本', footLabel: '本页统计', footValue: '', footTone: 'green', icon: Collection, color: 'green' },
    { title: '未上架', value: formatNumber(offline), unit: '本', footLabel: '本页统计', footValue: '', footTone: 'orange', icon: Tickets, color: 'purple' },
    { title: '章节数', value: formatNumber(chapterTotal), unit: '章', footLabel: '本页合计', footValue: '', footTone: 'blue', icon: Files, color: 'orange' },
    { title: '字数', value: formatCompact(wordTotal), unit: '', footLabel: '本页合计', footValue: '', footTone: 'blue', icon: Document, color: 'cyan' },
  ]
}

function activePublishStatus() {
  if (filters.publishStatus !== '') return filters.publishStatus
  if (activeTab.value === 'online') return 1
  if (activeTab.value === 'offline') return 0
  return undefined
}

function buildNovelPayload() {
  const category = categoryOptions.value.find((item) => item.id === novelForm.categoryId)
  const payload = {
    bookName: novelForm.bookName.trim(),
    subtitle: novelForm.subtitle.trim() || undefined,
    authorName: novelForm.authorName.trim(),
    bookType: 'novel',
    categoryId: novelForm.categoryId || undefined,
    categoryName: category?.name || undefined,
    introduction: novelForm.introduction.trim() || undefined,
    coverFileId: novelForm.coverFileId.trim() || undefined,
    sortNo: Number(novelForm.sortNo || 0),
    remark: novelForm.remark.trim() || undefined,
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
      delete payload[key]
    }
  })

  return payload
}

function createNovelFormFromBook(raw = {}, normalized = {}) {
  return {
    bookName: raw.bookName || normalized.title || '',
    subtitle: raw.subtitle || '',
    authorName: raw.authorName || normalized.author || '',
    categoryId: raw.categoryId || '',
    introduction: raw.introduction || '',
    coverFileId: raw.coverFileId || '',
    sortNo: Number(raw.sortNo || 0),
    remark: raw.remark || '',
  }
}

function createEmptyNovelForm() {
  return {
    bookName: '',
    subtitle: '',
    authorName: '',
    categoryId: '',
    introduction: '',
    coverFileId: '',
    sortNo: 0,
    remark: '',
  }
}

function createEmptyChapterForm() {
  return {
    chapterNo: undefined,
    chapterTitle: '',
    content: '',
  }
}

function createChapterFormFromRecord(record = {}) {
  return {
    chapterNo: record.raw?.chapterNo ?? record.chapterNo ?? undefined,
    chapterTitle: record.raw?.chapterTitle || record.chapterTitle || '',
    content: record.raw?.content || record.content || '',
  }
}

function resetNovelForm() {
  editingNovel.value = null
  Object.assign(novelForm, createEmptyNovelForm())
  novelFormRef.value?.clearValidate?.()
}

function resetChapterForm() {
  editingChapter.value = null
  Object.assign(chapterForm, createEmptyChapterForm())
  chapterFormRef.value?.clearValidate?.()
}

function normalizeActionCode(action = {}) {
  const code = String(action.code || '').toLowerCase()
  const label = String(action.label || '')

  if (code) return code
  if (label.includes('章节')) return 'chapters'
  if (label.includes('编辑')) return 'edit'
  if (label.includes('删除')) return 'delete'
  if (label.includes('上架') || label.includes('下架')) return 'shelf'
  return label
}

function resetLocalImportForm() {
  localImportScanning.value = false
  localImportCommitting.value = false
  localImportDirectoryName.value = ''
  localImportRows.value = []
  localImportDuplicateRows.value = []
  localImportUnsupportedCount.value = 0
  localImportSourceFileCount.value = 0
  localImportSelectedRows.value = []
  localImportResult.value = null
}

function resetListViewAfterUpload() {
  Object.assign(filters, createFilterState(baseFilters))
  searchKeyword.value = ''
  activeTab.value = 'all'
  window.clearTimeout(searchTimer)
}

function localImportStatusType(status) {
  if (status === 'created') return 'success'
  if (status === 'exists') return 'warning'
  if (status === 'skipped') return 'warning'
  if (status === 'failed') return 'danger'
  if (status === 'uploading') return 'primary'
  return 'info'
}

function localImportStatusText(status) {
  const map = {
    ready: '待导入',
    uploading: '上传中',
    created: '已入库',
    exists: '已存在',
    skipped: '已跳过',
    failed: '失败',
  }
  return map[status] || status || '--'
}

function buildLocalDirectoryImportRows(files = []) {
  const candidates = []
  let unsupportedCount = 0

  files.forEach((file, index) => {
    const candidate = createLocalImportCandidate(file, index)
    if (candidate) {
      candidates.push(candidate)
    } else {
      unsupportedCount += 1
    }
  })

  const grouped = new Map()
  const duplicates = []

  candidates.forEach((candidate) => {
    const groupKey = `${normalizePathKey(candidate.directoryPath)}::${normalizeBookIdentity(candidate.bookName, candidate.fileName)}`
    const current = grouped.get(groupKey)
    if (!current) {
      grouped.set(groupKey, candidate)
      return
    }

    const winner = pickPreferredLocalImportCandidate(current, candidate)
    const loser = winner === current ? candidate : current
    grouped.set(groupKey, winner)
    duplicates.push(createLocalImportDuplicateRow(loser, winner))
  })

  return {
    rows: Array.from(grouped.values()).sort(compareLocalImportRows),
    duplicates: duplicates.sort(compareLocalImportRows),
    unsupportedCount,
  }
}

function createLocalImportCandidate(file, index) {
  if (!(file instanceof File) || isDirectoryLikeFile(file)) return null

  const extension = extractFileExtension(file.name)
  if (extension !== LOCAL_IMPORT_SUPPORTED_EXTENSION) return null

  const relativePath = normalizeBrowserRelativePath(file.webkitRelativePath || file.name)
  const directoryPath = relativePath.includes('/') ? relativePath.slice(0, relativePath.lastIndexOf('/')) : ''
  const bookName = stripFileExtension(file.name)
  const authorName = extractLocalImportAuthor(file.name)
  const category = guessCategoryForLocalItem({
    parentPath: directoryPath,
    relativePath,
    fileName: file.name,
    title: bookName,
  })

  return {
    key: `${relativePath}-${file.size}-${file.lastModified}-${index}`,
    file: markRaw(file),
    fileName: file.name,
    bookName,
    authorName,
    bookType: NOVEL_BIZ_TYPE,
    extension,
    directoryPath,
    relativePath,
    fileSize: Number(file.size || 0),
    fileSizeText: formatBrowserFileSize(file.size),
    lastModifiedTime: formatBrowserFileTime(file.lastModified),
    categoryId: category?.id || '',
    categoryName: category?.name || '',
    status: 'ready',
    message: '',
    bookId: '',
    contentFileId: '',
  }
}

function pickPreferredLocalImportCandidate(first, second) {
  if (Number(first.fileSize || 0) !== Number(second.fileSize || 0)) {
    return Number(first.fileSize || 0) > Number(second.fileSize || 0) ? first : second
  }
  return first
}

function createLocalImportDuplicateRow(loser, winner) {
  return {
    ...loser,
    status: 'skipped',
    message: `已保留 ${winner.fileName}`,
    keptFileName: winner.fileName,
  }
}

async function applyLocalImportDuplicateCheck(rows = []) {
  const checkRows = rows.filter((row) => row?.status === 'ready')
  if (!checkRows.length) return

  try {
    const result = await checkBookImportDuplicates(checkRows.map((row) => ({
      key: row.key,
      bookName: row.bookName,
      authorName: row.authorName,
      fileName: row.fileName,
      bookType: row.bookType,
      fileSize: row.fileSize,
      relativePath: row.relativePath,
    })))
    if (result.unavailable) {
      console.info('小说批量导入重复预检接口暂不可用，已跳过选择阶段预检。')
      return
    }

    const itemMap = new Map((result.items || []).map((item) => [item.key, item]))
    checkRows.forEach((row) => {
      const duplicate = itemMap.get(row.key)
      if (!duplicate?.duplicate) return
      row.status = 'exists'
      row.message = duplicate.reason || '库中已存在'
      row.existingBookId = duplicate.existingBookId || ''
      row.existingBookName = duplicate.existingBookName || ''
      row.existingAuthorName = duplicate.existingAuthorName || ''
      row.existingBookType = duplicate.existingBookType || ''
      row.existingCategoryName = duplicate.existingCategoryName || ''
    })
    localImportSelectedRows.value = localImportSelectedRows.value.filter(isImportableLocalRow)
  } catch (error) {
    console.warn('小说批量导入重复预检失败。', error)
    if (!isDuplicateCheckUnavailableError(error)) {
      ElMessage.warning(localizeImportError(error, '重复预检失败，将在导入时再次校验'))
    }
  }
}

function compareLocalImportRows(first, second) {
  return String(first.relativePath || '').localeCompare(String(second.relativePath || ''), 'zh-CN')
}

function isImportableLocalRow(row = {}) {
  return row.status === 'ready' || row.status === 'failed'
}

function isSelectableLocalImportRow(row = {}) {
  return isImportableLocalRow(row)
}

function buildLocalImportResultShell(requestedCount) {
  return {
    requestedCount,
    createdCount: 0,
    skippedCount: 0,
    failedCount: 0,
    duplicateCount: localImportDuplicateRows.value.length,
    summary: '',
    items: [],
  }
}

async function uploadLocalImportRow(row) {
  row.status = 'uploading'
  row.message = '上传中'

  try {
    const uploaded = await uploadBookFileWithRetry({
      file: row.file,
      fileType: 'content',
      bookType: NOVEL_BIZ_TYPE,
      categoryId: row.categoryId || undefined,
    })
    row.bookId = uploaded.bookId || ''
    row.contentFileId = uploaded.id || ''
    if (uploaded.duplicate) {
      row.status = 'exists'
      row.message = uploaded.duplicateReason || `库中已存在：${uploaded.duplicateBookName || uploaded.bookName || uploaded.bookId || row.bookName}`
      row.existingBookId = uploaded.duplicateBookId || uploaded.bookId || ''
      row.existingBookName = uploaded.duplicateBookName || uploaded.bookName || ''
      localImportResult.value.skippedCount += 1
      localImportResult.value.duplicateCount += 1
    } else {
      row.status = uploaded.bookId ? 'created' : 'skipped'
      row.message = uploaded.bookId ? '已自动入库并触发解析' : '已上传，未自动建书'
      localImportResult.value.createdCount += uploaded.bookId ? 1 : 0
      localImportResult.value.skippedCount += uploaded.bookId ? 0 : 1
    }
  } catch (error) {
    row.status = 'failed'
    row.message = localizeImportError(error, '导入失败')
    localImportResult.value.failedCount += 1
  }

  localImportResult.value.items.push({
    status: row.status,
    bookName: row.bookName,
    message: row.message,
    relativePath: row.relativePath,
    bookId: row.bookId,
    contentFileId: row.contentFileId,
    existingBookId: row.existingBookId || '',
    existingBookName: row.existingBookName || '',
  })
}

async function uploadBookFileWithRetry(payload) {
  try {
    return await uploadBookFile(payload)
  } catch (error) {
    if (!isClockRollbackError(error)) {
      throw error
    }

    await delay(resolveClockRollbackRetryDelay(error))
    return uploadBookFile(payload)
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function resolveClockRollbackRetryDelay(error) {
  const message = collectErrorMessage(error)
  const milliseconds = Number(message.match(/for\s+(\d+)\s+milliseconds/i)?.[1] || 0)
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return 1600
  }
  return Math.min(Math.max(milliseconds + 150, 600), 2500)
}

function isClockRollbackError(error) {
  return /Clock moved backwards|Refusing to generate id|系统时钟短暂回拨/i.test(collectErrorMessage(error))
}

function isDuplicateCheckUnavailableError(error) {
  return /duplicate-check|No static resource|接口暂不可用|接口不存在|404/i.test(collectErrorMessage(error))
}

function localizeImportError(error, fallback = '操作失败') {
  const message = collectErrorMessage(error)
  if (/Clock moved backwards|Refusing to generate id|系统时钟短暂回拨/i.test(message)) {
    return '系统时钟短暂回拨，请稍后重试'
  }
  if (/No static resource/i.test(message)) {
    return '接口暂不可用，请确认后端服务已更新'
  }
  if (/Error updating database|nested exception|Cause:/i.test(message)) {
    return '数据写入失败，请稍后重试'
  }
  return error?.message || fallback
}

function collectErrorMessage(error) {
  return `${error?.message || ''} ${error?.rawMessage || ''}`
}

function guessCategoryForLocalItem(item = {}) {
  if (!categoryOptions.value.length) return null

  const matches = categoryOptions.value
    .map((category) => ({
      category,
      score: scoreCategoryForLocalItem(category, item),
    }))
    .filter((match) => match.score >= LOCAL_IMPORT_CATEGORY_MIN_SCORE)
    .sort((first, second) => (
      second.score - first.score
      || getCategoryDepth(second.category) - getCategoryDepth(first.category)
      || Number(second.category.raw?.sortNo || 0) - Number(first.category.raw?.sortNo || 0)
    ))

  return matches[0]?.category || null
}

function scoreCategoryForLocalItem(category = {}, item = {}) {
  const name = normalizeKeyword(category.name)
  const code = normalizeKeyword(category.code)
  if (isGenericLocalImportCategory(name, code)) return 0

  const aliases = buildLocalImportCategoryAliases(category)
  if (!aliases.length) return 0

  return LOCAL_IMPORT_CATEGORY_FIELDS.reduce((total, field) => {
    const text = normalizeSearchText(item[field.key])
    if (!text) return total

    const fieldScore = aliases.reduce((score, alias) => {
      if (!alias.value || !text.includes(alias.value)) return score
      return Math.max(score, field.weight * alias.weight)
    }, 0)
    return total + fieldScore
  }, 0)
}

function buildLocalImportCategoryAliases(category = {}) {
  const aliases = []
  addLocalImportAlias(aliases, category.name, 1)
  addLocalImportAlias(aliases, normalizeCategoryCodeToken(category.code), 0.9)
  return aliases
}

function addLocalImportAlias(aliases, value, weight) {
  const normalized = normalizeSearchText(value)
  if (!normalized || aliases.some((item) => item.value === normalized)) return
  aliases.push({ value: normalized, weight })
}

function isGenericLocalImportCategory(name, code) {
  return LOCAL_IMPORT_GENERIC_CATEGORY_NAMES.has(name) || LOCAL_IMPORT_GENERIC_CATEGORY_CODES.has(code)
}

function getCategoryDepth(category = {}) {
  const code = String(category.code || '')
  return code ? code.split('_').filter(Boolean).length : 0
}

function normalizeCategoryCodeToken(code) {
  const parts = String(code || '').toLowerCase().split('_').filter(Boolean)
  return parts[parts.length - 1] || code
}

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeSearchText(value) {
  return normalizeKeyword(value)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_\-.,;:()[\]{}'"“”‘’【】《》<>/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeBookIdentity(bookName, fileName = '') {
  const value = bookName || stripFileExtension(fileName)
  return normalizeKeyword(value)
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/^\s*\d+\s*[、.．)_-]+\s*/, '')
    .replace(/[（(【\[][^）)】\]]*(z-library|zlib|libgen|annas|library|电子书|ebook)[^）)】\]]*[）)】\]]/gi, '')
    .replace(/[（(【\[][^）)】\]]+[）)】\]]/g, ' ')
    .replace(/\b(z-library|zlib|libgen|annas|library|ebook|txt)\b/gi, '')
    .replace(/[._\-—–·•,;:()[\]{}'"“”‘’【】《》<>/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLocalImportAuthor(fileName = '') {
  const title = stripFileExtension(fileName)
  const match = title.match(/[（(]\s*([^）)]+?)\s*[）)]/)
  if (!match) return ''
  const value = match[1]
    .replace(/z-library|zlib|libgen|annas|library|电子书|ebook/gi, '')
    .replace(/作者|著|编著|编/g, '')
    .trim()
  return value || ''
}

function normalizePathKey(value) {
  return normalizeKeyword(value).replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '')
}

function normalizeBrowserRelativePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '')
}

function resolveDirectoryName(files = []) {
  const relativePath = normalizeBrowserRelativePath(files[0]?.webkitRelativePath || '')
  if (!relativePath) return '已选择目录'
  return relativePath.split('/')[0] || '已选择目录'
}

function extractFileExtension(fileName) {
  const match = String(fileName || '').trim().toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

function stripFileExtension(fileName) {
  return String(fileName || '').replace(/\.[^.]+$/, '').trim() || '未命名小说'
}

function formatBrowserFileSize(value) {
  const size = Number(value || 0)
  if (!size) return '--'
  if (size >= 1024 ** 4) return `${(size / 1024 ** 4).toFixed(2)} TB`
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GB`
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(2)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(2)} KB`
  return `${size} B`
}

function formatBrowserFileTime(value) {
  const date = new Date(Number(value || 0))
  if (Number.isNaN(date.getTime())) return '--'
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function isDirectoryLikeFile(file) {
  return file instanceof File && Number(file.size || 0) === 0 && !file.type && !file.name?.includes('.')
}

function createFilterState(filtersConfig = []) {
  return filtersConfig.reduce((state, filter) => {
    const firstOption = filter.options?.[0]
    state[filter.key] = typeof firstOption === 'object' ? firstOption.value : firstOption || ''
    return state
  }, {})
}

function withOptions(filter, options) {
  return { ...filter, options }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatCompact(value) {
  const number = Number(value || 0)
  if (!number) return '--'
  if (number >= 100000000) return `${(number / 100000000).toFixed(1)} 亿字`
  if (number >= 10000) return `${(number / 10000).toFixed(1)} 万字`
  return `${number.toLocaleString('zh-CN')} 字`
}

function coverStyle(cover) {
  if (!cover) {
    return { background: 'linear-gradient(145deg, #dbeafe, #2563eb)' }
  }
  if (cover.startsWith?.('http') || cover.startsWith?.('/') || cover.startsWith?.('data:')) {
    return { backgroundImage: `url("${cover}")` }
  }
  return { background: cover }
}

onMounted(async () => {
  await loadFilterData()
  await loadNovels(1)
})
</script>

<style scoped>
.novel-form,
.chapter-form,
.chapter-panel {
  max-width: 100%;
  min-width: 0;
}

.form-grid {
  display: grid;
  gap: 0 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-control,
.novel-form :deep(.el-select),
.chapter-form :deep(.el-select) {
  width: 100%;
}

.chapter-header {
  align-items: center;
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
  min-width: 0;
}

.chapter-cover {
  background-position: center;
  background-size: cover;
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(20, 39, 84, 0.16);
  flex: 0 0 auto;
  height: 88px;
  width: 66px;
}

.chapter-header h2 {
  color: #071f56;
  font-size: 20px;
  line-height: 1.3;
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}

.chapter-header p,
.chapter-header span {
  color: #526796;
  margin: 0 0 6px;
}

.chapter-toolbar {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  margin-bottom: 14px;
}

.chapter-table {
  max-width: 100%;
}

.chapter-footer {
  align-items: center;
  border-top: 1px solid #e7ecf7;
  color: #42578c;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
}

.directory-input {
  display: none;
}

.local-import-table,
.local-import-result {
  max-width: 100%;
  min-width: 0;
}

.local-import-picker {
  align-items: center;
  background: #f8fbff;
  border: 1px solid #dfe8f6;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  min-width: 0;
  padding: 14px 16px;
}

.local-import-picker__main {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.local-import-picker__main span {
  color: #6f82ad;
  font-size: 12px;
}

.local-import-picker__main strong {
  color: #102557;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-import-summary {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin: 16px 0;
}

.local-import-summary article {
  background: #f8fbff;
  border: 1px solid #dfe8f6;
  border-radius: 8px;
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 12px;
}

.local-import-summary span {
  color: #6f82ad;
  font-size: 12px;
}

.local-import-summary strong {
  color: #102557;
  font-size: 18px;
}

.local-import-alert,
.local-import-table,
.local-import-result {
  margin-top: 14px;
}

.local-import-result {
  background: #fbfcff;
  border: 1px solid #e7ecf7;
  border-radius: 8px;
  padding: 12px;
}

.local-import-result__summary {
  color: #42578c;
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 14px;
  margin-bottom: 10px;
}

.local-import-result__summary strong {
  color: #102557;
}

@media (max-width: 720px) {
  .form-grid,
  .chapter-toolbar,
  .local-import-summary {
    grid-template-columns: 1fr;
  }

  .local-import-picker {
    align-items: stretch;
    flex-direction: column;
  }

  .chapter-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

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
    :total="total"
    @action="handlePageAction"
    @filter-change="handleFilterChange"
    @page-change="loadNovels"
    @page-size-change="handlePageSizeChange"
    @refresh="refreshPage"
    @reset="resetFilters"
    @row-action="handleRowAction"
    @search="loadNovels(1)"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Delete,
  Document,
  EditPen,
  Files,
  MoreFilled,
  Plus,
  RefreshRight,
  Tickets,
} from '@element-plus/icons-vue'
import ContentManagementPage from '../components/content/ContentManagementPage.vue'
import {
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
} from '../api/books'

const NOVEL_BIZ_TYPE = 'novel'

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
  { code: 'edit', label: '编辑', icon: EditPen },
  { code: 'delete', label: '删除', icon: Delete, danger: true },
  { code: 'more', label: '更多', icon: MoreFilled },
]

const searchKeyword = ref('')
const filters = reactive(createFilterState(baseFilters))
const activeTab = ref('all')
const loading = ref(false)
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
const pageConfig = computed(() => ({
  activeMenu: '小说',
  title: '小说',
  subtitle: '管理所有网络小说，支持新增小说、章节维护和元数据管理',
  searchPlaceholder: '搜索小说名、作者...',
  pageSizeOptions: [10, 20, 50],
  tabs: buildTabs(),
  actions: [
    { label: '刷新', icon: RefreshRight },
    { label: '添加小说', icon: Plus, tone: 'primary' },
  ],
  metrics: buildMetrics(),
  filters: buildFilters(),
  columns,
  rowActions,
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

    novels.value = response.records.map((row) => ({ ...row, availableActions: [] }))
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
  if (action.label === '刷新') {
    refreshPage()
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
  if (action.code === 'chapters') {
    openChapters(row)
    return
  }

  if (action.code === 'edit') {
    openNovelForm(row)
    return
  }

  if (action.code === 'delete') {
    handleDeleteNovel(row)
    return
  }

  ElMessage.info(`暂未接入「${action.label}」操作。`)
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

@media (max-width: 720px) {
  .form-grid,
  .chapter-toolbar {
    grid-template-columns: 1fr;
  }

  .chapter-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

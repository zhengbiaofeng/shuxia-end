<template>
  <ContentManagementPage
    v-model:search-keyword="searchKeyword"
    :config="pageConfig"
    :filters-state="filters"
    :loading="loading"
    :page-count="pageCount"
    :page-no="pageNo"
    :page-size="pageSize"
    :rows="books"
    :selected-row-keys="selectedBookIds"
    :total="total"
    @batch-action="handleBatchAction"
    @filter-change="handleFilterChange"
    @page-change="loadBooks"
    @page-size-change="handlePageSizeChange"
    @action="handlePageAction"
    @refresh="refreshPage"
    @reset="resetFilters"
    @row-action="handleRowAction"
    @search="loadBooks(1)"
    @selection-change="handleSelectionChange"
  />

  <el-drawer v-model="detailVisible" size="720px" title="书籍详情" destroy-on-close>
    <div v-loading="detailLoading" class="book-detail">
      <template v-if="selectedBook">
        <div class="detail-header">
          <span class="detail-cover" :style="coverStyle(selectedBook.cover)" />
          <div>
            <h2>{{ selectedBook.title }}</h2>
            <p>{{ selectedBook.author }}</p>
            <span class="detail-status">{{ selectedBook.publishStatus }}</span>
          </div>
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="field in detailFields" :key="field.label" :label="field.label">
            <span class="detail-value">{{ field.value }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <el-button :loading="actionLoading" type="primary" @click="toggleShelfStatus(selectedBook)">
            {{ selectedBook.raw?.publishStatus === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button :loading="actionLoading" type="danger" plain @click="handleDeleteBook(selectedBook)">删除</el-button>
        </div>

        <el-tabs class="manage-tabs" model-value="history">
          <el-tab-pane label="文件历史" name="history">
            <el-table v-loading="historyLoading" :data="fileHistoryRows" size="small" class="manage-table">
              <el-table-column label="版本" prop="versionNo" width="72" />
              <el-table-column label="类型" prop="fileType" width="86" />
              <el-table-column label="动作" prop="actionType" width="100" />
              <el-table-column label="源文件" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">{{ row.sourceFileName }}</template>
              </el-table-column>
              <el-table-column label="目标文件" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">{{ row.targetFileName }}</template>
              </el-table-column>
              <el-table-column label="操作人" prop="operateByName" width="96" show-overflow-tooltip />
              <el-table-column label="时间" prop="operateTime" width="136" />
              <template #empty>
                <el-empty description="暂无文件历史" :image-size="72" />
              </template>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="操作日志" name="logs">
            <el-table v-loading="logLoading" :data="operateLogRows" size="small" class="manage-table">
              <el-table-column label="类型" prop="operateType" width="100" />
              <el-table-column label="描述" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">{{ row.operateDesc }}</template>
              </el-table-column>
              <el-table-column label="操作人" prop="operateByName" width="100" show-overflow-tooltip />
              <el-table-column label="时间" prop="operateTime" width="136" />
              <template #empty>
                <el-empty description="暂无操作日志" :image-size="72" />
              </template>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else description="暂无详情" />
    </div>
  </el-drawer>

  <el-dialog
    v-model="formVisible"
    :title="editingBook ? '编辑书籍' : '新增书籍'"
    width="640px"
    destroy-on-close
    @closed="resetBookForm"
  >
    <el-form ref="bookFormRef" :model="bookForm" :rules="bookRules" class="book-form" label-position="top">
      <div class="form-grid">
        <el-form-item label="书名" prop="bookName">
          <el-input v-model="bookForm.bookName" placeholder="请输入书名" />
        </el-form-item>
        <el-form-item label="作者" prop="authorName">
          <el-input v-model="bookForm.authorName" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="类型" prop="bookType">
          <el-select v-model="bookForm.bookType" placeholder="请选择类型" filterable>
            <el-option v-for="option in bookTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="bookForm.categoryId" placeholder="请选择分类" clearable filterable>
            <el-option v-for="option in categorySelectOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="bookForm.subtitle" placeholder="请输入副标题" />
        </el-form-item>
        <el-form-item label="访问类型">
          <el-select v-model="bookForm.accessType" placeholder="请选择访问类型">
            <el-option label="免费" value="free" />
            <el-option label="会员" value="vip" />
            <el-option label="付费" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="bookForm.sortNo" :min="0" class="form-control" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="bookForm.priceAmount" :min="0" :precision="2" class="form-control" />
        </el-form-item>
      </div>

      <el-form-item label="标签">
        <el-select v-model="bookForm.tagNames" placeholder="请选择或输入标签" multiple filterable allow-create clearable>
          <el-option v-for="option in tagSelectOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </el-form-item>

      <div class="file-bind-row">
        <el-form-item label="正文文件ID">
          <el-input v-model="bookForm.contentFileId" placeholder="上传正文后自动填入，也可手动输入" />
        </el-form-item>
        <el-form-item label="封面文件ID">
          <el-input v-model="bookForm.coverFileId" placeholder="上传封面后自动填入，也可手动输入" />
        </el-form-item>
      </div>

      <el-form-item label="简介">
        <el-input v-model="bookForm.introduction" :rows="4" placeholder="请输入书籍简介" type="textarea" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="bookForm.remark" :rows="2" placeholder="请输入备注" type="textarea" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="formVisible = false">取消</el-button>
      <el-button :loading="formSubmitting" type="primary" @click="submitBookForm">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="uploadVisible" title="上传书籍文件" width="520px" destroy-on-close @closed="resetUploadForm">
    <el-form class="upload-form" label-position="top">
      <el-form-item label="文件用途">
        <el-select v-model="uploadForm.fileType" placeholder="自动识别">
          <el-option label="自动识别" value="" />
          <el-option label="正文文件" value="content" />
          <el-option label="封面图片" value="cover" />
        </el-select>
      </el-form-item>
      <el-form-item label="书籍类型">
        <el-select v-model="uploadForm.bookType" placeholder="自动识别" clearable filterable>
          <el-option label="自动识别" value="" />
          <el-option v-for="option in bookTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </el-form-item>
      <el-upload
        :auto-upload="false"
        :limit="1"
        :on-change="handleUploadFileChange"
        :on-remove="handleUploadFileRemove"
        :file-list="uploadFileList"
        @drop.prevent="handleUploadDrop"
        drag
      >
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或点击选择</div>
      </el-upload>

      <div v-if="uploadedFile" class="uploaded-file" :class="{ 'uploaded-file--imported': uploadedFileAutoImported }">
        <div class="uploaded-file__header">
          <span class="uploaded-file__state">{{ uploadResultTitle }}</span>
          <strong>{{ uploadedFile.fileName }}</strong>
        </div>
        <dl class="uploaded-file__meta">
          <div v-for="item in uploadResultMeta" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="uploadVisible = false">{{ uploadedFile ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!uploadedFile" :loading="uploading" type="primary" @click="submitUpload">上传</el-button>
      <el-button v-if="uploadedFileAutoImported" type="primary" @click="uploadVisible = false">查看列表</el-button>
      <el-button v-if="uploadedFileCanFillForm" type="success" plain @click="useUploadedFile">填入新增表单</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="localImportVisible"
    title="批量导入书籍"
    width="1080px"
    destroy-on-close
    @closed="resetLocalImportForm"
  >
    <input
      ref="localImportDirectoryInputRef"
      class="directory-input"
      type="file"
      accept=".txt,.pdf,.epub,.mobi,.azw3"
      webkitdirectory
      multiple
      @change="handleLocalDirectoryChange"
    />

    <section class="local-import-picker">
      <div class="local-import-picker__main">
        <span>本地书籍目录</span>
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
      :title="`已按 EPUB 优先规则去重 ${localImportDuplicateRows.length} 个重复文件`"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-alert
      v-if="localImportExistingCount"
      class="local-import-alert"
      :title="`已识别 ${localImportExistingCount} 本库中已有书籍，默认不会导入`"
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
        <template #default="{ row }">
          <el-tag size="small">{{ row.bookType.toUpperCase() }}</el-tag>
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
</template>

<script setup>
import { computed, markRaw, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection,
  Delete,
  Document,
  EditPen,
  FolderOpened,
  MoreFilled,
  Notebook,
  RefreshRight,
  Tickets,
  Upload,
  VideoPlay,
} from '@element-plus/icons-vue'
import ContentManagementPage from '../components/content/ContentManagementPage.vue'
import {
  batchChangeBookShelfStatus,
  batchDeleteBooks,
  changeBookShelfStatus,
  checkBookImportDuplicates,
  createBook,
  deleteBook,
  fetchBookActionMetas,
  fetchBookCategories,
  fetchBookDetail,
  fetchBookFileHistory,
  fetchBookFilterOptions,
  fetchBookList,
  fetchBookOperateLogs,
  fetchBookPageSummary,
  updateBook,
  uploadBookFile,
} from '../api/books'

const BOOKS_BIZ_TYPE = 'ebook'
const BOOK_TYPE_FALLBACK_OPTIONS = [
  { label: 'TXT', value: 'txt' },
  { label: 'PDF', value: 'pdf' },
  { label: 'EPUB', value: 'epub' },
  { label: 'MOBI', value: 'mobi' },
  { label: 'AZW3', value: 'azw3' },
  { label: '图文', value: 'graphic' },
]
const BOOK_TYPE_OPTION_VALUES = new Set(BOOK_TYPE_FALLBACK_OPTIONS.map((item) => item.value))
const LOCAL_IMPORT_EXTENSION_MAP = {
  txt: 'txt',
  pdf: 'pdf',
  epub: 'epub',
  mobi: 'mobi',
  azw3: 'azw3',
}
const LOCAL_IMPORT_FORMAT_PRIORITY = {
  epub: 1,
  pdf: 2,
  mobi: 3,
  azw3: 4,
  txt: 5,
}
const LOCAL_IMPORT_CATEGORY_MIN_SCORE = 10
const LOCAL_IMPORT_CATEGORY_FIELDS = [
  { key: 'parentPath', weight: 14 },
  { key: 'title', weight: 8 },
  { key: 'fileName', weight: 7 },
  { key: 'relativePath', weight: 6 },
]
const LOCAL_IMPORT_GENERIC_CATEGORY_CODES = new Set(['ebook', 'book'])
const LOCAL_IMPORT_GENERIC_CATEGORY_NAMES = new Set(['书籍', '电子书', '全部分类'])
const LOCAL_IMPORT_CATEGORY_RULES = [
  {
    keys: ['history', '历史'],
    keywords: [
      '历史', '中国史', '国史', '通史', '史纲', '史记', '资治通鉴', '春秋', '战国', '秦汉', '汉朝', '三国',
      '魏晋', '东晋', '南北朝', '隋唐', '唐代', '宋史', '元史', '明史', '清史', '近代史', '古代史',
      '断代史', '世界史', '史学', '王朝', '帝国', '门阀', '士族', '考古', '文物', '敦煌', '丝绸之路',
    ],
  },
  {
    keys: ['politics', '政治'],
    keywords: ['政治', '政制', '制度', '国家', '治理', '革命', '党史', '国际关系', '地缘政治', '民主', '宪政', '权力', '公共政策'],
  },
  {
    keys: ['biography', '传记'],
    keywords: ['传记', '人物', '自传', '回忆录', '口述史', '年谱', '生平', '访谈录'],
  },
  {
    keys: ['psychology', '心理'],
    keywords: ['心理', '心理学', '认知', '情绪', '人格', '咨询', '治疗', '精神分析', '行为心理'],
  },
  {
    keys: ['philosophy', '哲学'],
    keywords: ['哲学', '思想', '思想史', '伦理', '逻辑', '美学', '形而上', '存在主义', '康德', '尼采', '柏拉图', '亚里士多德'],
  },
  {
    keys: ['sociology', '社会学'],
    keywords: ['社会学', '社会观察', '社会研究', '群体', '阶层', '城市', '乡土', '民族志', '人类学'],
  },
  {
    keys: ['religion', '宗教'],
    keywords: ['宗教', '佛教', '基督教', '伊斯兰', '道教', '禅宗', '神学', '经文'],
  },
  {
    keys: ['art', '艺术'],
    keywords: ['艺术', '美术', '绘画', '音乐', '电影', '建筑', '博物馆', '艺术史', '书法', '摄影史'],
  },
  {
    keys: ['novel', '小说'],
    keywords: ['小说', '长篇', '短篇', '中篇', '文学奖', '侦探小说', '科幻小说', '历史小说', '小说集'],
  },
  {
    keys: ['chinese', '中国文学'],
    keywords: ['中国文学', '鲁迅', '茅盾', '老舍', '沈从文', '汪曾祺', '莫言', '余华', '苏童', '格非'],
  },
  {
    keys: ['foreign', '外国文学'],
    keywords: ['外国文学', '欧美文学', '日本文学', '俄国文学', '英国文学', '法国文学', '美国文学', '世界文学'],
  },
  {
    keys: ['classic', '经典'],
    keywords: ['经典', '名著', '大师', '译文', '文库', '典藏', '必读'],
  },
  {
    keys: ['essay', '随笔'],
    keywords: ['随笔', '杂文', '书话', '札记', '散记', '读书笔记'],
  },
  {
    keys: ['prose', '散文'],
    keywords: ['散文', '散文集', '游记', '小品文'],
  },
  {
    keys: ['poetry', '诗歌'],
    keywords: ['诗歌', '诗集', '诗词', '唐诗', '宋词', '现代诗'],
  },
  {
    keys: ['classical', '古典文学'],
    keywords: ['古典文学', '古文', '先秦', '楚辞', '诗经', '红楼梦', '三国演义', '水浒传', '西游记'],
  },
  {
    keys: ['children', '儿童文学'],
    keywords: ['儿童文学', '童书', '童话', '绘本', '少年', '小王子'],
  },
  {
    keys: ['mystery', '推理'],
    keywords: ['推理', '侦探', '悬案', '密室', '东野圭吾', '阿加莎', '福尔摩斯'],
  },
  {
    keys: ['suspense', '悬疑'],
    keywords: ['悬疑', '惊悚', '犯罪', '谜案', '心理悬疑'],
  },
  {
    keys: ['scifi', '科幻'],
    keywords: ['科幻', '三体', '银河', '机器人', '宇宙', '星际', '赛博朋克', '刘慈欣'],
  },
  {
    keys: ['fantasy', '奇幻'],
    keywords: ['奇幻', '魔幻', '魔法', '精灵', '龙与地下城'],
  },
  {
    keys: ['wuxia', '武侠'],
    keywords: ['武侠', '江湖', '金庸', '古龙', '梁羽生', '侠客'],
  },
  {
    keys: ['romance', '言情'],
    keywords: ['言情', '爱情', '恋爱', '婚恋'],
  },
  {
    keys: ['economics', '经济学'],
    keywords: ['经济学', '经济', '宏观', '微观', '货币', '贸易', '财政', '博弈论'],
  },
  {
    keys: ['manage', '管理'],
    keywords: ['管理', '组织', '领导力', '团队', '战略', '运营', '项目管理'],
  },
  {
    keys: ['business', '商业'],
    keywords: ['商业', '创业', '公司', '企业', '增长', '产品经理', '商业模式'],
  },
  {
    keys: ['finance', '金融'],
    keywords: ['金融', '银行', '证券', '基金', '保险', '资本市场'],
  },
  {
    keys: ['invest', '投资'],
    keywords: ['投资', '股票', '基金', '价值投资', '巴菲特', '理财', '资产配置'],
  },
  {
    keys: ['marketing', '营销'],
    keywords: ['营销', '销售', '品牌', '广告', '传播', '用户增长'],
  },
  {
    keys: ['popular', '科普'],
    keywords: ['科普', '科学普及', '百科', '万物', '自然史'],
  },
  {
    keys: ['internet', '互联网'],
    keywords: ['互联网', '网络', '平台', '电商', '社交媒体'],
  },
  {
    keys: ['science', '科学'],
    keywords: ['科学', '物理', '数学', '生物', '化学', '天文', '宇宙', '进化', '基因', '脑科学'],
  },
  {
    keys: ['program', '编程'],
    keywords: ['编程', '程序', '代码', 'javascript', 'python', 'java', 'vue', 'react', '架构', '软件工程'],
  },
  {
    keys: ['algorithm', '算法'],
    keywords: ['算法', '数据结构', '机器学习', '深度学习', '人工智能', 'ai'],
  },
  {
    keys: ['ux', '交互设计'],
    keywords: ['交互设计', '用户体验', 'ux', 'ui', '设计系统', '可用性'],
  },
  {
    keys: ['travel', '旅行'],
    keywords: ['旅行', '旅游', '游记', '地理', '地图', '城市漫步'],
  },
  {
    keys: ['education', '教育'],
    keywords: ['教育', '学习', '考试', '课程', '教学', '学校'],
  },
  {
    keys: ['growth', '成长'],
    keywords: ['成长', '自我提升', '时间管理', '习惯', '效率', '沟通'],
  },
  {
    keys: ['health', '健康'],
    keywords: ['健康', '医学', '疾病', '营养', '运动', '睡眠', '养生'],
  },
  {
    keys: ['food', '美食'],
    keywords: ['美食', '烹饪', '食谱', '料理', '饮食'],
  },
  {
    keys: ['photo', '摄影'],
    keywords: ['摄影', '相机', '镜头', '拍摄', '影像'],
  },
]

const baseFilters = [
  { key: 'storageSource', label: '存储位置', options: [{ label: '全部存储', value: '' }] },
  { key: 'categoryId', label: '分类', options: [{ label: '全部分类', value: '' }] },
  { key: 'tagName', label: '标签', options: [{ label: '全部标签', value: '' }] },
  { key: 'bookType', label: '类型', options: [{ label: '全部类型', value: '' }] },
  {
    key: 'fileFormat',
    label: '格式',
    options: [
      { label: '全部格式', value: '' },
      { label: 'TXT', value: 'txt' },
      { label: 'PDF', value: 'pdf' },
      { label: 'EPUB', value: 'epub' },
    ],
  },
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

const baseColumns = [
  { key: 'cover', label: '封面', type: 'cover' },
  { key: 'title', label: '书名', type: 'title', subKey: 'isbn' },
  { key: 'author', label: '作者' },
  { key: 'category', label: '分类', type: 'chip' },
  { key: 'tags', label: '标签', type: 'tags' },
  { key: 'store', label: '存储位置', type: 'source', subKey: 'path' },
  { key: 'format', label: '格式' },
  { key: 'size', label: '文件大小' },
  { key: 'publishStatus', label: '上架状态', type: 'status' },
  { key: 'scrapeStatus', label: '解析状态', type: 'status' },
  { key: 'addedAt', label: '添加时间' },
  { key: 'actions', label: '操作', type: 'actions' },
]

const defaultRowActions = [
  { code: 'detail', label: '查看', icon: VideoPlay },
  { code: 'shelf', label: '上下架', icon: RefreshRight },
  { code: 'delete', label: '删除', icon: Delete, danger: true },
]

const searchKeyword = ref('')
const filters = reactive(createFilterState(baseFilters))
const loading = ref(false)
const books = ref([])
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
const categoryOptions = ref([])
const filterOptions = ref({
  tagOptions: [],
  bookTypeOptions: [],
  storageOptions: [],
})
const actionMetas = ref([])
const pageSummary = ref(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const actionLoading = ref(false)
const batchLoading = ref(false)
const selectedBookIds = ref([])
const selectedBook = ref(null)
const historyLoading = ref(false)
const logLoading = ref(false)
const fileHistoryRows = ref([])
const operateLogRows = ref([])
const formVisible = ref(false)
const formSubmitting = ref(false)
const editingBook = ref(null)
const bookFormRef = ref()
const bookForm = reactive(createEmptyBookForm())
const uploadVisible = ref(false)
const uploading = ref(false)
const uploadFileList = ref([])
const uploadRawFile = ref(null)
const uploadDirectoryScanning = ref(false)
const uploadedFile = ref(null)
const uploadForm = reactive({
  fileType: '',
  bookType: '',
})
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

const bookRules = {
  bookName: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  authorName: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  bookType: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const pageConfig = computed(() => ({
  activeMenu: '书籍',
  title: '书籍管理',
  subtitle: '管理所有书籍资源，支持筛选、批量操作和元数据维护',
  searchPlaceholder: '搜索书名、作者、ISBN、路径...',
  pageSizeOptions: [10, 20, 50],
  actions: [
    { label: '刷新', icon: RefreshRight },
    { label: '导入书籍', icon: Upload },
    { label: '批量导入', icon: FolderOpened },
    { label: '添加书籍', icon: FolderOpened, tone: 'primary' },
  ],
  metrics: buildMetrics(pageSummary.value),
  filters: buildFilters(),
  columns: baseColumns,
  rowActions: buildRowActions(actionMetas.value),
  selectable: true,
  batchActions: [
    { code: 'batch-online', label: '批量上架', tone: 'primary', loading: batchLoading.value },
    { code: 'batch-offline', label: '批量下架', loading: batchLoading.value },
    { code: 'batch-delete', label: '批量删除', tone: 'danger', loading: batchLoading.value },
  ],
}))

const detailFields = computed(() => {
  const raw = selectedBook.value?.raw || {}
  const tags = Array.isArray(raw.tagNames) ? raw.tagNames.join('、') : selectedBook.value?.tags?.join('、')

  return [
    { label: '书籍ID', value: selectedBook.value?.id || '--' },
    { label: '副标题', value: raw.subtitle || '--' },
    { label: '书籍类型', value: raw.bookType || selectedBook.value?.format || '--' },
    { label: '分类', value: raw.categoryName || selectedBook.value?.category || '--' },
    { label: '标签', value: tags || '--' },
    { label: '文件格式', value: raw.fileFormat || selectedBook.value?.format || '--' },
    { label: '文件大小', value: selectedBook.value?.size || '--' },
    { label: '解析状态', value: selectedBook.value?.scrapeStatus || '--' },
    { label: '转码状态', value: selectedBook.value?.transcodeStatus || '--' },
    { label: '存储源', value: raw.storageSourceName || selectedBook.value?.store || '--' },
    { label: '存储路径', value: raw.storagePath || selectedBook.value?.path || '--' },
    { label: '创建时间', value: selectedBook.value?.addedAt || '--' },
    { label: '简介', value: raw.introduction || '--' },
    { label: '备注', value: raw.remark || '--' },
  ]
})
const bookTypeOptions = computed(() => {
  const options = (filterOptions.value.bookTypeOptions || []).filter((item) => BOOK_TYPE_OPTION_VALUES.has(item.value))
  return options.length
    ? options
    : BOOK_TYPE_FALLBACK_OPTIONS
})
const categorySelectOptions = computed(() => categoryOptions.value.map((item) => ({ label: item.name, value: item.id })))
const tagSelectOptions = computed(() => filterOptions.value.tagOptions || [])
const uploadedFileIsContent = computed(() => (uploadedFile.value?.fileType || uploadForm.fileType) === 'content')
const uploadedFileAutoImported = computed(() => Boolean(uploadedFile.value?.bookId && uploadedFileIsContent.value && !uploadedFile.value?.duplicate))
const uploadedFileIsCover = computed(() => (uploadedFile.value?.fileType || uploadForm.fileType) === 'cover')
const uploadedFileCanFillForm = computed(() => Boolean(uploadedFile.value && !uploadedFileAutoImported.value && !uploadedFile.value?.duplicate))
const localImportSelectedImportableCount = computed(() => localImportSelectedRows.value.filter(isImportableLocalRow).length)
const localImportCanCommit = computed(() => localImportSelectedImportableCount.value > 0 && !localImportCommitting.value && !localImportScanning.value)
const localImportSummary = computed(() => {
  if (!localImportRows.value.length && !localImportDuplicateRows.value.length && !localImportUnsupportedCount.value) return []
  const totalFileSize = localImportRows.value.reduce((sum, row) => sum + Number(row.fileSize || 0), 0)
  const matchedCategoryCount = localImportRows.value.filter((row) => row.categoryId).length
  const existingCount = localImportRows.value.filter((row) => row.status === 'exists').length

  return [
    { label: '选中文件', value: formatNumber(localImportSourceFileCount.value) },
    { label: '待导入', value: formatNumber(localImportRows.value.filter(isImportableLocalRow).length) },
    { label: '库中已有', value: formatNumber(existingCount) },
    { label: '已去重', value: formatNumber(localImportDuplicateRows.value.length) },
    { label: '匹配分类', value: formatNumber(matchedCategoryCount) },
    { label: '总大小', value: formatBrowserFileSize(totalFileSize) },
  ]
})
const localImportExistingCount = computed(() => localImportRows.value.filter((row) => row.status === 'exists').length)
const localImportResultSummary = computed(() => {
  const result = localImportResult.value
  if (!result) return []
  return [
    { label: '请求', value: formatNumber(result.requestedCount) },
    { label: '入库', value: formatNumber(result.createdCount) },
    { label: '跳过', value: formatNumber(result.skippedCount) },
    { label: '失败', value: formatNumber(result.failedCount) },
    { label: '去重', value: formatNumber(result.duplicateCount) },
  ]
})
const uploadResultTitle = computed(() => {
  if (!uploadedFile.value) return ''
  if (uploadedFile.value.duplicate) return '库中已存在'
  if (uploadedFileAutoImported.value) return '已自动入库'
  if (uploadedFileIsCover.value) return '封面已上传'
  if (uploadedFileIsContent.value) return '正文已上传'
  return '文件已上传'
})
const uploadResultMeta = computed(() => {
  const file = uploadedFile.value
  if (!file) return []

  const items = [
    { label: '文件大小', value: file.fileSize || '--' },
    { label: '文件类型', value: displayUploadType(file) },
    { label: '文件 ID', value: file.id || '--' },
  ]

  if (file.bookId) {
    items.splice(1, 0, { label: '入库书籍', value: file.bookName || file.bookId })
    items.push({ label: '书籍 ID', value: file.bookId })
  }

  if (file.duplicate) {
    items.push({ label: '处理结果', value: file.duplicateReason || '库中已存在，已跳过导入' })
  }

  if (file.storageStatusText) {
    items.push({ label: '绑定状态', value: file.storageStatusText })
  }

  if (file.parseStatusText) {
    items.push({ label: '解析状态', value: file.parseStatusText })
  }

  return items
})

let searchTimer = null

watch(searchKeyword, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadBooks(1), 350)
})

async function refreshPage() {
  await Promise.allSettled([loadSummary(), loadFilterData()])
  await loadBooks(1)
}

async function loadFilterData() {
  const [categoriesResult, optionsResult, actionsResult] = await Promise.allSettled([
    fetchBookCategories({ rootCode: BOOKS_BIZ_TYPE }),
    fetchBookFilterOptions({ bizType: BOOKS_BIZ_TYPE }),
    fetchBookActionMetas(),
  ])

  if (categoriesResult.status === 'fulfilled') {
    categoryOptions.value = categoriesResult.value
  } else {
    console.warn('分类接口加载失败。', categoriesResult.reason)
    categoryOptions.value = []
  }

  if (optionsResult.status === 'fulfilled') {
    filterOptions.value = optionsResult.value
  } else {
    console.warn('书籍筛选项接口加载失败。', optionsResult.reason)
    filterOptions.value = { tagOptions: [], bookTypeOptions: [], storageOptions: [] }
  }

  if (actionsResult.status === 'fulfilled') {
    actionMetas.value = actionsResult.value
  } else {
    console.warn('书籍操作元数据接口加载失败。', actionsResult.reason)
    actionMetas.value = []
  }
}

async function loadSummary() {
  try {
    pageSummary.value = await fetchBookPageSummary({ bizType: BOOKS_BIZ_TYPE })
  } catch (error) {
    console.warn('书籍统计接口加载失败。', error)
    pageSummary.value = null
  }
}

async function loadBooks(nextPage = pageNo.value) {
  pageNo.value = Math.min(Math.max(Number(nextPage) || 1, 1), pageCount.value)
  loading.value = true
  try {
    const response = await fetchBookList({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      bookName: searchKeyword.value.trim() || undefined,
      bizType: BOOKS_BIZ_TYPE,
      categoryId: filters.categoryId || undefined,
      tagName: filters.tagName || undefined,
      storageSource: filters.storageSource || undefined,
      bookType: filters.bookType || undefined,
      fileFormat: filters.fileFormat || undefined,
      publishStatus: filters.publishStatus === '' ? undefined : filters.publishStatus,
    })
    books.value = response.records
    selectedBookIds.value = selectedBookIds.value.filter((id) => response.records.some((row) => row.id === id))
    total.value = Number(response.total) || 0
    pageNo.value = Number(response.current) || pageNo.value
  } catch (error) {
    console.warn('书籍接口加载失败。', error)
    books.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleFilterChange(key, value) {
  filters[key] = value
  loadBooks(1)
}

function handlePageSizeChange(value) {
  pageSize.value = value
  loadBooks(1)
}

function handlePageAction(action) {
  const code = action?.code || action?.label
  if (action.label === '刷新') {
    refreshPage()
    return
  }

  if (action.label === '批量导入' || code === 'local-import') {
    openLocalImportDialog()
    return
  }

  if (action.label === '添加书籍' || action.label === '导入书籍') {
    if (action.label === '导入书籍') {
      openUploadDialog()
      return
    }
    openBookForm()
  }
}

function resetFilters() {
  Object.assign(filters, createFilterState(baseFilters))
  searchKeyword.value = ''
  loadBooks(1)
}

function handleRowAction(action, row) {
  const code = normalizeActionCode(action)

  if (code === 'detail' || code === 'view') {
    openDetail(row)
    return
  }

  if (code === 'shelf' || code === 'publish' || code === 'offline' || code === 'online') {
    toggleShelfStatus(row)
    return
  }

  if (code === 'delete' || code === 'remove') {
    handleDeleteBook(row)
    return
  }

  if (code === 'edit') {
    openBookForm(row)
    return
  }

  ElMessage.info(`暂未接入「${action.label || action.code}」操作。`)
}

function handleSelectionChange(keys = []) {
  selectedBookIds.value = Array.isArray(keys) ? keys : []
}

async function handleBatchAction(action, selectedRows = []) {
  const ids = selectedBookIds.value.filter(Boolean)
  if (!ids.length) {
    ElMessage.warning('请先选择要操作的书籍')
    return
  }

  const code = String(action?.code || '')
  if (code === 'batch-online') {
    await batchShelfBooks(ids, selectedRows, 1)
    return
  }

  if (code === 'batch-offline') {
    await batchShelfBooks(ids, selectedRows, 2)
    return
  }

  if (code === 'batch-delete') {
    await batchDeleteSelectedBooks(ids, selectedRows)
  }
}

async function batchShelfBooks(ids, rows, publishStatus) {
  const actionText = publishStatus === 1 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(
      `确定批量${actionText}已选择的 ${ids.length} 本书籍吗？`,
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
    selectedBookIds.value = []
    await Promise.allSettled([loadBooks(pageNo.value), loadSummary()])
    await refreshSelectedDetailIfNeeded(rows)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || `批量${actionText}失败`)
    }
  } finally {
    batchLoading.value = false
  }
}

async function batchDeleteSelectedBooks(ids, rows) {
  try {
    await ElMessageBox.confirm(
      `确定批量删除已选择的 ${ids.length} 本书籍吗？删除后不可恢复。`,
      '批量删除书籍',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    batchLoading.value = true
    const result = await batchDeleteBooks(ids)
    showBatchResult(result, '批量删除完成')
    selectedBookIds.value = []
    if (selectedBook.value?.id && ids.includes(selectedBook.value.id)) {
      detailVisible.value = false
      selectedBook.value = null
    }
    await Promise.allSettled([loadBooks(pageNo.value), loadSummary()])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量删除失败')
    }
  } finally {
    batchLoading.value = false
  }
}

function showBatchResult(result = {}, fallbackMessage) {
  const message = result.summary || `${fallbackMessage}，成功 ${result.successCount ?? 0} 条，失败 ${result.failedCount ?? 0} 条`
  if (Number(result.failedCount || 0) > 0) {
    ElMessage.warning(message)
  } else {
    ElMessage.success(message)
  }
}

async function refreshSelectedDetailIfNeeded(rows = []) {
  if (!detailVisible.value || !selectedBook.value?.id) return
  if (!rows.some((row) => row.id === selectedBook.value.id)) return

  try {
    selectedBook.value = await fetchBookDetail(selectedBook.value.id)
  } catch (error) {
    console.warn('批量操作后刷新书籍详情失败。', error)
  }
}

async function openBookForm(row = null) {
  editingBook.value = row
  Object.assign(bookForm, createEmptyBookForm())

  if (row?.id) {
    formVisible.value = true
    formSubmitting.value = true
    try {
      const detail = await fetchBookDetail(row.id)
      Object.assign(bookForm, createFormFromBook(detail.raw || {}, detail))
      editingBook.value = detail
    } catch (error) {
      ElMessage.error(error?.message || '获取书籍详情失败')
    } finally {
      formSubmitting.value = false
    }
    return
  }

  if (uploadedFile.value) {
    applyUploadedFileToForm(uploadedFile.value)
  }
  formVisible.value = true
}

async function submitBookForm() {
  if (!bookFormRef.value) return
  await bookFormRef.value.validate()

  formSubmitting.value = true
  try {
    const payload = buildBookPayload()

    if (editingBook.value?.id) {
      await updateBook({ ...payload, id: editingBook.value.id })
      ElMessage.success('书籍已更新')
    } else {
      await createBook(payload)
      ElMessage.success('书籍已新增')
    }

    formVisible.value = false
    await Promise.allSettled([loadBooks(1), loadSummary()])
  } catch (error) {
    ElMessage.error(error?.message || '保存书籍失败')
  } finally {
    formSubmitting.value = false
  }
}

function openUploadDialog() {
  uploadVisible.value = true
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
      ElMessage.warning('目录中没有找到可导入的书籍文件')
    } else if (localImportExistingCount.value > 0) {
      ElMessage.success(`已识别 ${localImportRows.value.length} 本书籍，其中 ${localImportExistingCount.value} 本库中已有`)
    } else if (localImportDuplicateRows.value.length > 0) {
      ElMessage.success(`已识别 ${localImportRows.value.length} 本书籍，并去重 ${localImportDuplicateRows.value.length} 个重复文件`)
    } else {
      ElMessage.success(`已识别 ${localImportRows.value.length} 本书籍`)
    }
  } catch (error) {
    ElMessage.error(error?.message || '读取本地目录失败')
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
    ElMessage.warning('请先选择要导入的书籍')
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
    await Promise.allSettled([loadBooks(1), loadSummary(), loadFilterData()])
  } catch (error) {
    ElMessage.error(error?.message || '批量导入书籍失败')
  } finally {
    localImportCommitting.value = false
  }
}

async function handleUploadFileChange(file, fileList) {
  if (uploadDirectoryScanning.value) return

  const rawFile = file.raw || null
  if (isDirectoryLikeFile(rawFile)) {
    uploadFileList.value = []
    uploadRawFile.value = null
    ElMessage.warning('当前接口只支持上传单个文件。拖拽文件夹时会自动尝试提取其中的书籍文件。')
    return
  }

  uploadFileList.value = fileList.slice(-1)
  uploadRawFile.value = rawFile
}

function handleUploadFileRemove() {
  uploadFileList.value = []
  uploadRawFile.value = null
}

async function handleUploadDrop(event) {
  const items = Array.from(event.dataTransfer?.items || [])
  if (!items.length || !items.some((item) => item.webkitGetAsEntry?.()?.isDirectory)) return

  uploadDirectoryScanning.value = true
  try {
    const files = await collectDroppedFiles(items)
    const targetFile = files.find(isSupportedUploadFile) || files[0]

    if (!targetFile) {
      ElMessage.warning('文件夹中没有找到可上传的文件')
      return
    }

    uploadRawFile.value = targetFile
    uploadFileList.value = [createUploadListItem(targetFile)]
    ElMessage.success(`已从文件夹中选择文件：${targetFile.name}`)
  } catch (error) {
    ElMessage.error(error?.message || '读取拖拽文件夹失败')
  } finally {
    window.setTimeout(() => {
      uploadDirectoryScanning.value = false
    })
  }
}

async function submitUpload() {
  if (!uploadRawFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  if (isDirectoryLikeFile(uploadRawFile.value)) {
    ElMessage.warning('请选择具体文件，不要直接上传文件夹')
    return
  }

  uploading.value = true
  try {
    uploadedFile.value = await uploadBookFileWithRetry({
      file: uploadRawFile.value,
      fileType: uploadForm.fileType || undefined,
      bookType: uploadForm.bookType || undefined,
    })

    if (uploadedFileAutoImported.value) {
      ElMessage.success('书籍已自动入库，正在刷新列表')
      resetListViewAfterUpload()
      await Promise.allSettled([loadBooks(1), loadSummary(), loadFilterData()])
    } else if (uploadedFileIsContent.value) {
      ElMessage.success('正文文件已上传，正在刷新书库')
      resetListViewAfterUpload()
      await Promise.allSettled([loadBooks(1), loadSummary(), loadFilterData()])
    } else if (uploadedFileIsCover.value) {
      ElMessage.success('封面已上传，可填入新增表单')
    } else {
      ElMessage.success('文件已上传')
    }
  } catch (error) {
    ElMessage.error(localizeImportError(error, '上传文件失败'))
  } finally {
    uploading.value = false
  }
}

function useUploadedFile() {
  if (!uploadedFile.value) return
  const file = uploadedFile.value
  uploadVisible.value = false
  openBookForm()
  applyUploadedFileToForm(file)
}

async function openDetail(row) {
  if (!row?.id) {
    ElMessage.warning('缺少书籍 ID，无法查看详情')
    return
  }

  selectedBook.value = row
  detailVisible.value = true
  detailLoading.value = true

  try {
    selectedBook.value = await fetchBookDetail(row.id)
    loadBookManageInfo(row.id)
  } catch (error) {
    ElMessage.error(error?.message || '获取书籍详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function loadBookManageInfo(bookId) {
  if (!bookId) return
  historyLoading.value = true
  logLoading.value = true

  const [historyResult, logResult] = await Promise.allSettled([
    fetchBookFileHistory({ bookId, pageNo: 1, pageSize: 5 }),
    fetchBookOperateLogs({ bookId, pageNo: 1, pageSize: 5 }),
  ])

  if (historyResult.status === 'fulfilled') {
    fileHistoryRows.value = historyResult.value.records
  } else {
    fileHistoryRows.value = []
    console.warn('书籍文件历史接口加载失败。', historyResult.reason)
  }

  if (logResult.status === 'fulfilled') {
    operateLogRows.value = logResult.value.records
  } else {
    operateLogRows.value = []
    console.warn('书籍操作日志接口加载失败。', logResult.reason)
  }

  historyLoading.value = false
  logLoading.value = false
}

async function toggleShelfStatus(row) {
  if (!row?.id) {
    ElMessage.warning('缺少书籍 ID，无法切换上下架')
    return
  }

  const currentStatus = Number(row.raw?.publishStatus ?? -1)
  const nextStatus = currentStatus === 1 ? 2 : 1
  const actionText = nextStatus === 1 ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(`确定${actionText}「${row.title}」吗？`, `${actionText}书籍`, {
      confirmButtonText: actionText,
      cancelButtonText: '取消',
      type: 'warning',
    })

    actionLoading.value = true
    await changeBookShelfStatus(row.id, nextStatus)
    ElMessage.success(`书籍已${actionText}`)
    await Promise.allSettled([loadBooks(pageNo.value), loadSummary()])

    if (detailVisible.value && selectedBook.value?.id === row.id) {
      selectedBook.value = await fetchBookDetail(row.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || `${actionText}书籍失败`)
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteBook(row) {
  if (!row?.id) {
    ElMessage.warning('缺少书籍 ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？删除后不可恢复。`, '删除书籍', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    actionLoading.value = true
    await deleteBook(row.id)
    ElMessage.success('书籍已删除')
    if (selectedBook.value?.id === row.id) {
      detailVisible.value = false
      selectedBook.value = null
    }
    await Promise.allSettled([loadBooks(pageNo.value), loadSummary()])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除书籍失败')
    }
  } finally {
    actionLoading.value = false
  }
}

function buildFilters() {
  return baseFilters.map((filter) => {
    if (filter.key === 'storageSource') {
      return withOptions(filter, [{ label: '全部存储', value: '' }, ...filterOptions.value.storageOptions])
    }

    if (filter.key === 'categoryId') {
      return withOptions(filter, [
        { label: '全部分类', value: '' },
        ...categoryOptions.value.map((item) => ({ label: item.name, value: item.id })),
      ])
    }

    if (filter.key === 'tagName') {
      return withOptions(filter, [{ label: '全部标签', value: '' }, ...filterOptions.value.tagOptions])
    }

    if (filter.key === 'bookType') {
      return withOptions(filter, [{ label: '全部类型', value: '' }, ...bookTypeOptions.value])
    }

    return filter
  })
}

function createEmptyBookForm() {
  return {
    bookName: '',
    subtitle: '',
    authorName: '',
    bookType: '',
    categoryId: '',
    introduction: '',
    accessType: 'free',
    priceAmount: 0,
    memberFree: 0,
    coverFileId: '',
    contentFileId: '',
    sortNo: 0,
    remark: '',
    tagNames: [],
  }
}

function createFormFromBook(raw = {}, normalized = {}) {
  return {
    bookName: raw.bookName || normalized.title || '',
    subtitle: raw.subtitle || '',
    authorName: raw.authorName || normalized.author || '',
    bookType: raw.bookType || '',
    categoryId: raw.categoryId || '',
    introduction: raw.introduction || '',
    accessType: raw.accessType || 'free',
    priceAmount: Number(raw.priceAmount || 0),
    memberFree: Number(raw.memberFree || 0),
    coverFileId: raw.coverFileId || '',
    contentFileId: raw.contentFileId || '',
    sortNo: Number(raw.sortNo || 0),
    remark: raw.remark || '',
    tagNames: Array.isArray(raw.tagNames) ? raw.tagNames : [],
  }
}

function buildBookPayload() {
  const category = categoryOptions.value.find((item) => item.id === bookForm.categoryId)
  const payload = {
    bookName: bookForm.bookName.trim(),
    subtitle: bookForm.subtitle.trim() || undefined,
    authorName: bookForm.authorName.trim(),
    bookType: bookForm.bookType,
    categoryId: bookForm.categoryId || undefined,
    categoryName: category?.name || undefined,
    introduction: bookForm.introduction.trim() || undefined,
    accessType: bookForm.accessType || 'free',
    priceAmount: Number(bookForm.priceAmount || 0),
    memberFree: Number(bookForm.memberFree || 0),
    coverFileId: bookForm.coverFileId || undefined,
    contentFileId: bookForm.contentFileId || undefined,
    sortNo: Number(bookForm.sortNo || 0),
    remark: bookForm.remark.trim() || undefined,
    tagNames: Array.isArray(bookForm.tagNames) ? bookForm.tagNames.filter(Boolean) : [],
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
      delete payload[key]
    }
  })

  return payload
}

function applyUploadedFileToForm(file) {
  if (!file?.id) return

  const fileType = file.fileType || uploadForm.fileType
  if (fileType === 'cover') {
    bookForm.coverFileId = file.id
  } else {
    bookForm.contentFileId = file.id
  }

  if (!bookForm.bookType && (file.bookType || uploadForm.bookType)) {
    bookForm.bookType = file.bookType || uploadForm.bookType
  }
}

function resetBookForm() {
  editingBook.value = null
  Object.assign(bookForm, createEmptyBookForm())
  bookFormRef.value?.clearValidate?.()
}

function resetUploadForm() {
  uploading.value = false
  uploadFileList.value = []
  uploadRawFile.value = null
  uploadDirectoryScanning.value = false
  uploadedFile.value = null
  uploadForm.fileType = ''
  uploadForm.bookType = ''
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
  selectedBookIds.value = []
  window.clearTimeout(searchTimer)
}

function displayUploadType(file = {}) {
  const fileTypeMap = {
    content: '正文文件',
    cover: '封面图片',
  }
  const bookTypeMap = {
    txt: 'TXT',
    pdf: 'PDF',
    epub: 'EPUB',
    mobi: 'MOBI',
    azw3: 'AZW3',
    novel: '网络小说',
    comic: '漫画',
    audio: '有声',
  }
  const fileType = fileTypeMap[file.fileType] || file.fileType || '自动识别'
  const bookType = bookTypeMap[String(file.bookType || '').toLowerCase()] || file.bookType
  return bookType ? `${fileType} / ${bookType}` : fileType
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
  const bookType = LOCAL_IMPORT_EXTENSION_MAP[extension]
  if (!bookType) return null

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
    bookType,
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
  const firstPriority = LOCAL_IMPORT_FORMAT_PRIORITY[first.bookType] || 99
  const secondPriority = LOCAL_IMPORT_FORMAT_PRIORITY[second.bookType] || 99
  if (firstPriority !== secondPriority) {
    return firstPriority < secondPriority ? first : second
  }
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
      console.info('批量导入重复预检接口暂不可用，已跳过选择阶段预检。')
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
    console.warn('批量导入重复预检失败。', error)
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
      bookType: row.bookType,
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
      row.message = uploaded.bookId ? '已自动入库' : '已上传，未自动建书'
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
    bookType: row.bookType,
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

  const identity = [category.name, category.code].map(normalizeSearchText).join(' ')
  LOCAL_IMPORT_CATEGORY_RULES.forEach((rule) => {
    const applies = rule.keys.some((key) => {
      const normalizedKey = normalizeSearchText(key)
      return normalizedKey && identity.includes(normalizedKey)
    })
    if (!applies) return
    rule.keywords.forEach((keyword) => addLocalImportAlias(aliases, keyword, 1.15))
  })

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
    .replace(/\b(z-library|zlib|libgen|annas|library|ebook|pdf|epub|mobi|azw3|txt)\b/gi, '')
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
  return String(fileName || '').replace(/\.[^.]+$/, '').trim() || '未命名书籍'
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

function isSupportedUploadFile(file) {
  if (!(file instanceof File) || isDirectoryLikeFile(file)) return false
  const lowerName = file.name.toLowerCase()
  return /\.(txt|pdf|epub|mobi|azw3|zip|cbz|jpg|jpeg|png|webp)$/.test(lowerName)
}

function createUploadListItem(file) {
  return {
    name: file.name,
    percentage: 0,
    raw: file,
    size: file.size,
    status: 'ready',
    uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  }
}

async function collectDroppedFiles(items) {
  const entries = items
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean)
  const files = []

  for (const entry of entries) {
    files.push(...await readEntryFiles(entry))
  }

  return files
}

async function readEntryFiles(entry) {
  if (!entry) return []

  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject))
    return file ? [file] : []
  }

  if (!entry.isDirectory) return []

  const reader = entry.createReader()
  const entries = await readAllDirectoryEntries(reader)
  const nestedFiles = await Promise.all(entries.map(readEntryFiles))
  return nestedFiles.flat()
}

async function readAllDirectoryEntries(reader) {
  const entries = []
  let batch = []

  do {
    batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
    entries.push(...batch)
  } while (batch.length > 0)

  return entries
}

function buildMetrics(summary) {
  const totalBooks = summary?.totalBooks ?? total.value
  const onlineBooks = summary?.onlineBooks ?? 0
  const offlineBooks = summary?.offlineBooks ?? 0
  const localFileCount = summary?.localFileCount ?? 0
  const localFileSizeText = summary?.localFileSizeText ?? '--'
  const recentAddedBooks = summary?.recentAddedBooks ?? 0
  const readingBooks = summary?.readingBooks ?? 0
  const onlineRate = totalBooks ? `${((onlineBooks / totalBooks) * 100).toFixed(1)}%` : '0%'

  return [
    {
      title: '全部书籍',
      value: formatNumber(totalBooks),
      unit: '本',
      footLabel: '已上架',
      footValue: formatNumber(onlineBooks),
      footTone: 'green',
      icon: Tickets,
      color: 'blue',
    },
    {
      title: '已上架',
      value: formatNumber(onlineBooks),
      unit: '本',
      footLabel: '上架率',
      footValue: onlineRate,
      footTone: 'blue',
      icon: Notebook,
      color: 'green',
    },
    {
      title: '已下架',
      value: formatNumber(offlineBooks),
      unit: '本',
      footLabel: '需维护',
      footValue: '',
      footTone: 'orange',
      icon: Document,
      color: 'orange',
    },
    {
      title: '本地文件',
      value: formatNumber(localFileCount),
      unit: '个',
      footLabel: '总大小',
      footValue: localFileSizeText,
      footTone: 'blue',
      icon: FolderOpened,
      color: 'blue',
    },
    {
      title: '最近新增',
      value: formatNumber(recentAddedBooks),
      unit: '本',
      footLabel: '近 7 天',
      footValue: '',
      footTone: 'green',
      icon: RefreshRight,
      color: 'green',
    },
    {
      title: '阅读中',
      value: formatNumber(readingBooks),
      unit: '本',
      footLabel: '阅读进度',
      footValue: '',
      footTone: 'purple',
      icon: Collection,
      color: 'purple',
    },
  ]
}

function buildRowActions(actions = []) {
  const supportedCodes = new Set(['detail', 'view', 'edit', 'shelf', 'publish', 'offline', 'online', 'delete', 'remove'])
  const visibleActions = actions
    .filter((action) => !action.batchSupported && supportedCodes.has(normalizeActionCode(action)))
    .slice(0, 4)
    .map((action, index) => ({
      ...action,
      icon: actionIcon(normalizeActionCode(action), index),
    }))

  return visibleActions.length ? visibleActions : defaultRowActions
}

function actionIcon(code, index) {
  if (code === 'detail' || code === 'view') return VideoPlay
  if (code === 'edit') return EditPen
  if (code === 'delete' || code === 'remove') return Delete
  if (code === 'shelf' || code === 'publish' || code === 'offline' || code === 'online') return RefreshRight
  return index === 0 ? VideoPlay : index === 1 ? EditPen : MoreFilled
}

function normalizeActionCode(action = {}) {
  const code = String(action.code || '').toLowerCase()
  const label = String(action.label || '')

  if (code) return code
  if (label.includes('查看') || label.includes('详情')) return 'detail'
  if (label.includes('编辑')) return 'edit'
  if (label.includes('删除')) return 'delete'
  if (label.includes('上架') || label.includes('下架')) return 'shelf'
  return label
}

function withOptions(filter, options) {
  return {
    ...filter,
    options,
  }
}

function createFilterState(filtersConfig = []) {
  return filtersConfig.reduce((state, filter) => {
    const firstOption = filter.options?.[0]
    state[filter.key] = typeof firstOption === 'object' ? firstOption.value : firstOption || ''
    return state
  }, {})
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN')
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
  await Promise.allSettled([loadFilterData(), loadSummary()])
  await loadBooks(1)
})
</script>

<style scoped>
.book-detail {
  min-height: 320px;
}

.detail-header {
  align-items: center;
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  min-width: 0;
}

.detail-cover {
  background-position: center;
  background-size: cover;
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(20, 39, 84, 0.16);
  flex: 0 0 auto;
  height: 96px;
  width: 72px;
}

.detail-header h2 {
  color: #071f56;
  font-size: 20px;
  line-height: 1.3;
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}

.detail-header p {
  color: #526796;
  margin: 0 0 10px;
}

.detail-status {
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #16a34a;
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  padding: 5px 8px;
}

.detail-value {
  color: #263b72;
  overflow-wrap: anywhere;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.manage-tabs {
  margin-top: 22px;
  min-width: 0;
}

.manage-table {
  max-width: 100%;
}

.book-form,
.upload-form {
  max-width: 100%;
  min-width: 0;
}

.form-grid,
.file-bind-row {
  display: grid;
  gap: 0 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-control,
.book-form :deep(.el-select),
.upload-form :deep(.el-select) {
  width: 100%;
}

.uploaded-file {
  background: #f8fbff;
  border: 1px solid #dfe8f6;
  border-radius: 8px;
  color: #334a80;
  display: grid;
  gap: 4px;
  margin-top: 14px;
  min-width: 0;
  padding: 12px;
}

.uploaded-file--imported {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.uploaded-file__header {
  align-items: flex-start;
  display: grid;
  gap: 6px;
  min-width: 0;
}

.uploaded-file__state {
  align-self: flex-start;
  background: #eaf2ff;
  border: 1px solid #cfe0ff;
  border-radius: 6px;
  color: #1d67ff;
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  padding: 5px 8px;
}

.uploaded-file--imported .uploaded-file__state {
  background: #dcfce7;
  border-color: #86efac;
  color: #16a34a;
}

.uploaded-file strong {
  color: #102557;
  font-size: 14px;
}

.uploaded-file__meta {
  display: grid;
  gap: 6px;
  margin: 4px 0 0;
}

.uploaded-file__meta div {
  align-items: baseline;
  display: grid;
  gap: 10px;
  grid-template-columns: 72px minmax(0, 1fr);
  min-width: 0;
}

.uploaded-file__meta dt,
.uploaded-file__meta dd,
.uploaded-file strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.uploaded-file__meta dt {
  color: #6f82ad;
  font-size: 12px;
}

.uploaded-file__meta dd {
  color: #263b72;
  font-size: 13px;
  margin: 0;
}

.upload-icon {
  color: #2563eb;
  font-size: 30px;
}

.local-import-form,
.local-import-table,
.local-import-result {
  max-width: 100%;
  min-width: 0;
}

.directory-input {
  display: none;
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
  padding: 14px;
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
  .file-bind-row,
  .local-import-summary {
    grid-template-columns: 1fr;
  }

  .local-import-picker {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

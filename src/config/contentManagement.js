import {
  Collection,
  Delete,
  EditPen,
  Headset,
  MoreFilled,
  Opportunity,
  Plus,
  RefreshRight,
  Upload,
} from '@element-plus/icons-vue'

export function createFilterState(filters = []) {
  return filters.reduce((state, filter) => {
    const firstOption = filter.options?.[0]
    state[filter.key] = typeof firstOption === 'object' ? firstOption.value : firstOption || ''
    return state
  }, {})
}

export const commonRowActions = [
  { label: '查看', icon: Collection },
  { label: '编辑', icon: EditPen },
  { label: '删除', icon: Delete, danger: true },
  { label: '更多', icon: MoreFilled },
]

export const comicPageConfig = {
  activeMenu: '漫画',
  title: '漫画管理',
  subtitle: '管理和浏览所有漫画资源，支持章节管理、更新追踪和元数据编辑',
  searchPlaceholder: '搜索漫画名称、作者、标签',
  pageSizeOptions: [10, 20, 50],
  tabs: [
    { key: 'all', label: '全部漫画' },
    { key: 'serializing', label: '连载中' },
    { key: 'completed', label: '已完结' },
    { key: 'paused', label: '已暂停' },
  ],
  actions: [
    { label: '刷新扫描', icon: RefreshRight },
    { label: '导入漫画', icon: Upload },
    { label: '添加漫画', icon: Plus, tone: 'primary' },
  ],
  filters: [
    { key: 'categoryId', label: '分类', options: [{ label: '全部分类', value: '' }] },
    { key: 'tagName', label: '标签', options: [{ label: '全部标签', value: '' }] },
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
  ],
  columns: [
    { key: 'cover', label: '封面', type: 'cover' },
    { key: 'title', label: '漫画名称 / 作者', type: 'title', subKey: 'author' },
    { key: 'category', label: '分类', type: 'chip' },
    { key: 'status', label: '连载状态', type: 'status' },
    { key: 'latest', label: '最新章节', type: 'dual', subKey: 'latestDate' },
    { key: 'chapters', label: '章节数' },
    { key: 'tags', label: '标签', type: 'tags' },
    { key: 'publishStatusText', label: '上架状态', type: 'status' },
    { key: 'updatedAt', label: '更新时间' },
    { key: 'actions', label: '操作', type: 'actions' },
  ],
  rowActions: commonRowActions,
}

export const audioPageConfig = {
  activeMenu: '有声',
  title: '有声管理',
  subtitle: '管理所有有声内容，支持专辑、单集管理和播放统计',
  searchPlaceholder: '搜索专辑名 / 主播 / 标签',
  pageSizeOptions: [10, 20, 50],
  tabs: [
    { key: 'all', label: '全部有声' },
    { key: 'serializing', label: '更新中' },
    { key: 'completed', label: '已完成' },
    { key: 'paused', label: '已暂停' },
  ],
  actions: [
    { label: '导入有声', icon: Upload },
    { label: '扫描更新', icon: RefreshRight },
    { label: '添加有声', icon: Plus, tone: 'primary' },
  ],
  filters: [
    { key: 'categoryId', label: '分类', options: [{ label: '全部分类', value: '' }] },
    { key: 'tagName', label: '标签', options: [{ label: '全部标签', value: '' }] },
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
  ],
  columns: [
    { key: 'title', label: '专辑信息', type: 'coverTitle' },
    { key: 'category', label: '分类' },
    { key: 'anchor', label: '主播' },
    { key: 'episodes', label: '单集数' },
    { key: 'duration', label: '时长' },
    { key: 'status', label: '状态', type: 'status' },
    { key: 'publishStatusText', label: '上架状态', type: 'status' },
    { key: 'updatedAt', label: '最近更新' },
    { key: 'actions', label: '操作', type: 'actions' },
  ],
  rowActions: commonRowActions,
  icon: Headset,
}

export const contentTypeIcons = {
  comic: Opportunity,
  audio: Headset,
}

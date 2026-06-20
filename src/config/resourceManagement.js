import {
  Delete,
  Plus,
} from '@element-plus/icons-vue'

export const storagePageConfig = {
  title: '存储管理',
  subtitle: '管理和配置所有存储位置，支持本地目录、网络共享、WebDAV 和网盘挂载',
  activeMenu: '存储管理',
  tabs: ['全部', '本地目录', 'MinIO', '已禁用'],
  actions: [
    { key: 'cleanupOrphans', label: '清理孤儿/临时文件', icon: Delete, type: 'warning' },
    { key: 'addStorage', label: '添加存储', icon: Plus, type: 'primary' },
  ],
}

export const tagPageConfig = {
  title: '标签管理',
  subtitle: '管理所有内容标签，按业务类型、状态和真实使用次数维护',
  activeMenu: '标签管理',
  actions: [{ label: '添加标签', icon: Plus, type: 'primary' }],
}

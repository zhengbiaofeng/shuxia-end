<template>
  <ResourceShell
    :actions="pageActions"
    :active-menu="storagePageConfig.activeMenu"
    :tabs="storagePageConfig.tabs"
    :title="storagePageConfig.title"
    :subtitle="storagePageConfig.subtitle"
    @action="handleAction"
  >
    <ResourceMetricGrid :items="metrics" />
    <StorageTable
      v-loading="loading"
      :rows="rows"
      :scanning-id="scanningStorageId"
      :total="total"
      @delete="handleDeleteStorage"
      @edit="openStorageForm"
      @scan="handleScanStorage"
    />
    <StorageSourceDialog
      v-model="formVisible"
      :initial-values="formInitialValues"
      :submitting="submitting"
      :title="editingStorage ? '编辑存储源' : '添加存储源'"
      @submit="handleSubmitStorage"
    />
  </ResourceShell>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, shallowRef } from 'vue'
import ResourceMetricGrid from '../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../components/resource/ResourceShell.vue'
import StorageSourceDialog from '../components/resource/StorageSourceDialog.vue'
import StorageTable from '../components/resource/StorageTable.vue'
import {
  cleanupOrphanStorageFiles,
  createStorageSource,
  deleteStorageSource,
  fetchStoragePageData,
  updateStorageSource,
} from '../api/resourceManagement'
import { commitLocalBookImport, scanLocalBookImport } from '../api/books'
import { storagePageConfig } from '../config/resourceManagement'

const loading = ref(false)
const submitting = ref(false)
const cleanupLoading = ref(false)
const scanningStorageId = ref('')
const formVisible = ref(false)
const editingStorage = ref(null)
const metrics = shallowRef([])
const rows = shallowRef([])
const total = ref(0)
const pageActions = computed(() =>
  storagePageConfig.actions.map((action) => ({
    ...action,
    loading: action.key === 'cleanupOrphans' ? cleanupLoading.value : action.loading,
    disabled: action.key === 'cleanupOrphans' ? loading.value || cleanupLoading.value : action.disabled,
  })),
)

const formInitialValues = computed(() => {
  const raw = editingStorage.value?.raw || {}

  return {
    id: raw.id,
    sourceType: raw.sourceType || 'local',
    sourceKey: raw.sourceKey || '',
    sourceName: raw.sourceName || '',
    endpoint: raw.endpoint || '',
    bucketName: raw.bucketName || '',
    localBasePath: raw.localBasePath || '',
    bizScope: raw.bizScope || 'both',
    objectPrefix: raw.objectPrefix || '',
    writable: Number(raw.writable ?? 1),
    defaultEbook: Number(raw.defaultEbook ?? 0),
    defaultNovel: Number(raw.defaultNovel ?? 0),
    status: Number(raw.status ?? 1),
    sortNo: Number(raw.sortNo || 0),
    remark: raw.remark || '',
    pathStatus: raw.pathStatus,
    pathMessage: raw.pathMessage,
    pathReadable: raw.pathReadable,
    pathWritable: raw.pathWritable,
    capacityKnown: raw.capacityKnown,
    totalBytes: raw.totalBytes,
    usedBytes: raw.usedBytes,
    availableBytes: raw.availableBytes,
    volumeName: raw.volumeName,
    fileSystemType: raw.fileSystemType,
    containerized: raw.containerized,
  }
})

function handleAction(action) {
  if (action.key === 'cleanupOrphans') {
    handleCleanupOrphans()
    return
  }
  if (action.key === 'addStorage' || action.label === '添加存储') {
    openStorageForm()
  }
}

function openStorageForm(row = null) {
  editingStorage.value = row
  formVisible.value = true
}

async function handleSubmitStorage(values) {
  submitting.value = true
  try {
    const payload = normalizeStoragePayload(values)
    if (editingStorage.value?.id) {
      await updateStorageSource({ ...payload, id: editingStorage.value.id })
      ElMessage.success('存储源已更新')
    } else {
      await createStorageSource(payload)
      ElMessage.success('存储源已新增')
    }
    formVisible.value = false
    await loadStoragePage()
  } catch (error) {
    ElMessage.error(error?.message || '保存存储源失败')
  } finally {
    submitting.value = false
  }
}

async function handleDeleteStorage(row) {
  if (!row?.id) {
    ElMessage.warning('缺少存储源 ID，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除存储源', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteStorageSource(row.id)
    ElMessage.success('存储源已删除')
    await loadStoragePage()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除存储源失败')
    }
  }
}

async function handleScanStorage(row) {
  const rootPath = row?.scanPath || row?.raw?.localBasePath || row?.path
  if (!row?.scannable || !rootPath) {
    ElMessage.warning('当前存储源不是可扫描的本地目录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `将扫描「${row.name}」目录下的书籍和小说，并自动导入、分类和打标签。确认继续吗？`,
      '扫描存储目录',
      {
        confirmButtonText: '开始扫描',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    scanningStorageId.value = row.id || row.name || rootPath
    const scanResult = await scanLocalBookImport({
      rootPath,
      recursive: true,
      maxDepth: 5,
      maxFiles: 2000,
    })
    const importItems = buildStorageScanImportItems(scanResult.items)

    if (!importItems.length) {
      ElMessage.warning(`扫描完成，未发现可导入的书籍或小说。已扫描 ${scanResult.scannedFileCount} 个文件`)
      return
    }

    const result = await commitLocalBookImport({
      authorName: 'NAS导入',
      autoParse: true,
      items: importItems,
    })
    const message = result.summary || `扫描导入完成，成功 ${result.createdCount} 项，跳过 ${result.skippedCount} 项，失败 ${result.failedCount} 项`
    if (result.failedCount > 0) {
      ElMessage.warning(message)
    } else {
      ElMessage.success(message)
    }
    await loadStoragePage()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '扫描存储目录失败')
    }
  } finally {
    scanningStorageId.value = ''
  }
}

async function handleCleanupOrphans() {
  try {
    await ElMessageBox.confirm(
      '将删除未绑定到有效书籍的孤儿文件、临时残留及其存储对象，单次最多清理 100 个。该操作不可恢复，确定继续吗？',
      '清理孤儿/临时文件',
      {
        confirmButtonText: '确认清理',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    cleanupLoading.value = true
    const result = await cleanupOrphanStorageFiles({ limit: 100 })
    const cleanedCount = Number(result?.cleanedCount || 0)
    const objectCount = Array.isArray(result?.objectNames) ? result.objectNames.length : 0
    const extraText = objectCount ? `，其中 MinIO 裸对象 ${objectCount} 个` : ''
    ElMessage.success(`孤儿/临时文件清理完成，已清理 ${cleanedCount} 个${extraText}`)
    await loadStoragePage()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '清理孤儿/临时文件失败')
    }
  } finally {
    cleanupLoading.value = false
  }
}

async function loadStoragePage() {
  loading.value = true
  try {
    const data = await fetchStoragePageData()
    metrics.value = data.metrics
    rows.value = data.rows
    total.value = data.total || rows.value.length
  } catch (error) {
    metrics.value = []
    rows.value = []
    total.value = 0
    ElMessage.error(error?.message || '存储管理接口加载失败')
  } finally {
    loading.value = false
  }
}

function normalizeStoragePayload(values) {
  return {
    sourceType: values.sourceType,
    sourceKey: values.sourceKey || undefined,
    sourceName: values.sourceName,
    endpoint: values.endpoint || undefined,
    bucketName: values.bucketName || undefined,
    localBasePath: values.localBasePath || undefined,
    bizScope: values.bizScope || 'both',
    objectPrefix: values.objectPrefix || undefined,
    writable: Number(values.writable ?? 1),
    defaultEbook: Number(values.defaultEbook ?? 0),
    defaultNovel: Number(values.defaultNovel ?? 0),
    status: Number(values.status ?? 1),
    sortNo: Number(values.sortNo || 0),
    remark: values.remark || undefined,
  }
}

function buildStorageScanImportItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item?.absolutePath)
    .filter((item) => item.contentType === 'book' || item.contentType === 'novel')
    .map((item) => ({
      absolutePath: item.absolutePath,
      bookName: item.title || item.fileName || undefined,
      bookType: item.contentType === 'novel' ? 'novel' : item.suggestedBookType || item.extension || undefined,
    }))
}

onMounted(() => {
  loadStoragePage()
})
</script>

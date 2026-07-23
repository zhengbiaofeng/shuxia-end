<template>
  <SimpleSettingsPage
    :page="page"
    :actions="pageActions"
    :loading="loading"
    :readonly="!canSave"
    @action="handleAction"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchReaderSettingsPage, saveReaderSettings } from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'
import SimpleSettingsPage from './components/SimpleSettingsPage.vue'

const page = reactive({
  ...settingPages.reader,
  raw: {},
  sections: [],
})
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const canSave = computed(() => authStore.hasPermission('sxbook:readerSetting:save'))
const pageActions = computed(() => page.actions.map((action) => ({
  ...action,
  loading: saving.value,
  disabled: saving.value,
})))

async function loadReaderSettings() {
  try {
    loading.value = true
    const data = await fetchReaderSettingsPage()
    page.raw = data.raw
    page.sections = data.sections
  } catch (error) {
    page.sections = []
    ElMessage.error(error.message || '获取阅读设置失败')
  } finally {
    loading.value = false
  }
}

async function handleAction(action) {
  if (action?.label !== '保存设置' || !canSave.value || saving.value) return
  try {
    saving.value = true
    const data = await saveReaderSettings(collectPayload(page.sections))
    page.raw = data.raw
    page.sections = data.sections
    ElMessage.success('全局阅读默认设置已保存')
  } catch (error) {
    ElMessage.error(error.message || '保存阅读设置失败')
  } finally {
    saving.value = false
  }
}

function collectPayload(sections = []) {
  return sections.flatMap((section) => section.items || []).reduce((payload, item) => {
    if (!item.key || item.readonly) return payload
    payload[item.key] = item.type === 'switch' ? (item.value ? 1 : 0) : item.value
    return payload
  }, {})
}

onMounted(loadReaderSettings)
</script>

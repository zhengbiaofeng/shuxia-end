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
import { fetchSecuritySettingsPage, saveSecuritySettings } from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'
import SimpleSettingsPage from './components/SimpleSettingsPage.vue'

const page = reactive({
  ...settingPages.security,
  raw: {},
  sections: [],
})
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const canSave = computed(() => authStore.hasPermission('sxbook:securitySetting:save'))
const pageActions = computed(() => page.actions.map((action) => ({
  ...action,
  loading: saving.value,
  disabled: saving.value,
})))

async function loadSecuritySettings() {
  try {
    loading.value = true
    const data = await fetchSecuritySettingsPage()
    page.raw = data.raw
    page.sections = data.sections
  } catch (error) {
    page.sections = []
    ElMessage.error(error.message || '获取安全设置失败')
  } finally {
    loading.value = false
  }
}

async function handleAction(action) {
  if (action?.label !== '保存设置' || !canSave.value || saving.value) return
  try {
    const payload = collectPayload(page.sections)
    if (Number(payload.passwordMinLength) > Number(payload.passwordMaxLength)) {
      throw new Error('密码最小长度不能大于最大长度')
    }
    saving.value = true
    const data = await saveSecuritySettings(payload)
    page.raw = data.raw
    page.sections = data.sections
    ElMessage.success('安全设置已保存并已由登录安全服务读取')
  } catch (error) {
    ElMessage.error(error.message || '保存安全设置失败')
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

onMounted(loadSecuritySettings)
</script>

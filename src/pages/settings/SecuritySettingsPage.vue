<template>
  <SimpleSettingsPage :page="page" />
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchSecuritySettingsPage } from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'
import SimpleSettingsPage from './components/SimpleSettingsPage.vue'

const page = reactive({
  ...settingPages.security,
  sections: [],
})

async function loadSecuritySettings() {
  try {
    const data = await fetchSecuritySettingsPage()
    page.sections = data.sections
  } catch (error) {
    page.sections = []
    ElMessage.error(error.message || '获取安全设置失败')
  }
}

onMounted(loadSecuritySettings)
</script>

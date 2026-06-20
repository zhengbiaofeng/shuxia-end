<template>
  <SimpleSettingsPage :page="page" />
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchReaderSettingsPage } from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'
import SimpleSettingsPage from './components/SimpleSettingsPage.vue'

const page = reactive({
  ...settingPages.reader,
  sections: [],
})

async function loadReaderSettings() {
  try {
    const data = await fetchReaderSettingsPage()
    page.sections = data.sections
  } catch (error) {
    page.sections = []
    ElMessage.error(error.message || '获取阅读设置失败')
  }
}

onMounted(loadReaderSettings)
</script>

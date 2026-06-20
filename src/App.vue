<template>
  <RouterView />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useSiteSettingsStore } from './stores/siteSettings'

const siteSettingsStore = useSiteSettingsStore()

onMounted(() => {
  siteSettingsStore.loadPublicSettings().catch((error) => {
    console.warn('站点信息加载失败：', error)
  })
})

watch(
  () => siteSettingsStore.siteName,
  (siteName) => {
    document.title = siteName || '书匣'
  },
  { immediate: true },
)
</script>

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_SITE_SETTINGS,
  fetchPublicSiteSetting,
  fetchSiteSettingDetail,
  normalizeSiteSetting,
  saveSiteSetting,
} from '../api/siteSettings'

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const settings = ref(normalizeSiteSetting(DEFAULT_SITE_SETTINGS))
  const loaded = ref(false)
  const loading = ref(false)

  const siteName = computed(() => settings.value.siteName)
  const subtitle = computed(() => settings.value.subtitle || '私有数字内容库')
  const logoUrl = computed(() => settings.value.logoUrl)
  const footerText = computed(() => settings.value.copyrightText)
  const version = computed(() => settings.value.version)

  async function loadPublicSettings() {
    if (loading.value) return settings.value

    loading.value = true
    try {
      settings.value = await fetchPublicSiteSetting()
      loaded.value = true
    } catch (error) {
      settings.value = normalizeSiteSetting(settings.value)
      throw error
    } finally {
      loading.value = false
    }

    return settings.value
  }

  async function loadAdminSettings() {
    const nextSettings = await fetchSiteSettingDetail()
    settings.value = nextSettings
    loaded.value = true
    return nextSettings
  }

  async function saveAdminSettings(payload) {
    await saveSiteSetting(payload)
    return loadAdminSettings()
  }

  function applySettings(payload) {
    settings.value = normalizeSiteSetting(payload)
    loaded.value = true
  }

  return {
    settings,
    loaded,
    loading,
    siteName,
    subtitle,
    logoUrl,
    footerText,
    version,
    loadPublicSettings,
    loadAdminSettings,
    saveAdminSettings,
    applySettings,
  }
})

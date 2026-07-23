<template>
  <ResourceShell
    :actions="pageActions"
    :active-menu="page.activeMenu"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handleAction"
  >
    <section class="channel-grid">
      <p v-if="!page.channels.length" class="channel-empty">暂无通知渠道</p>
      <article v-for="channel in page.channels" :key="channel.name" class="channel-card">
        <div>
          <h2>{{ channel.name }}</h2>
          <p>{{ channel.desc }}</p>
        </div>
        <AdminStatusBadge :label="channel.status" :tone="channel.tone" dot />
        <el-switch
          v-model="channel.enabled"
          :disabled="!canSave || saving"
          @change="markDirty(channel)"
        />
      </article>
    </section>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { AdminStatusBadge } from '../../components/admin'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchNotifySettingsPage, saveNotifyChannel } from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'
import { useAuthStore } from '../../stores/auth'

const page = reactive({
  ...settingPages.notify,
  channels: [],
})
const authStore = useAuthStore()
const saving = ref(false)
const dirtyIds = ref(new Set())
const canSave = computed(() => authStore.hasPermission('sxbook:notifySetting:channel:save'))
const pageActions = computed(() => page.actions.map((action) => ({
  ...action,
  loading: saving.value,
  disabled: saving.value || dirtyIds.value.size === 0,
})))

async function loadNotifySettings() {
  try {
    const data = await fetchNotifySettingsPage()
    page.channels = data.channels
    dirtyIds.value = new Set()
  } catch (error) {
    page.channels = []
    ElMessage.error(error.message || '获取通知设置失败')
  }
}

function markDirty(channel) {
  dirtyIds.value = new Set([...dirtyIds.value, channel.id])
}

async function handleAction(action) {
  if (action?.label !== '保存设置' || !canSave.value || !dirtyIds.value.size || saving.value) return
  try {
    saving.value = true
    const changedChannels = page.channels.filter((channel) => dirtyIds.value.has(channel.id))
    await Promise.all(changedChannels.map((channel) => saveNotifyChannel(channel, channel.enabled)))
    await loadNotifySettings()
    ElMessage.success(`已保存 ${changedChannels.length} 个通知渠道`)
  } catch (error) {
    ElMessage.error(error.message || '保存通知设置失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadNotifySettings)
</script>

<style scoped>
.channel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.channel-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.channel-card h2 {
  margin: 0;
  color: #102557;
  font-size: 16px;
}

.channel-card p {
  margin: 8px 0 0;
  color: var(--admin-text-muted);
  font-size: 13px;
}

.channel-empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 34px;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  color: #7a89ad;
  text-align: center;
  box-shadow: var(--admin-shadow-card);
}

@media (max-width: 900px) {
  .channel-grid {
    grid-template-columns: 1fr;
  }
}
</style>

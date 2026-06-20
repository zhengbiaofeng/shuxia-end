<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
  >
    <section class="license-grid">
      <article v-for="card in page.cards" :key="card[0]">
        <span>{{ card[0] }}</span>
        <strong>{{ card[1] }}</strong>
        <p>{{ card[2] }}</p>
      </article>
    </section>
  </ResourceShell>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchLicenseInfoPage } from '../../api/adminModules'
import { settingPages } from '../../config/adminModules'

const page = reactive({
  ...settingPages.license,
  cards: [],
})

async function loadLicenseInfo() {
  try {
    const data = await fetchLicenseInfoPage()
    page.cards = data.cards
  } catch (error) {
    page.cards = []
    ElMessage.error(error.message || '获取授权信息失败')
  }
}

onMounted(loadLicenseInfo)
</script>

<style scoped>
.license-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.license-grid article {
  min-height: 150px;
  padding: 24px;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.license-grid span {
  color: var(--admin-text-muted);
  font-size: 13px;
}

.license-grid strong {
  display: block;
  margin-top: 14px;
  color: #102557;
  font-size: 24px;
  font-weight: 800;
}

.license-grid p {
  margin: 12px 0 0;
  color: #50679b;
  font-size: 13px;
}

@media (max-width: 1180px) {
  .license-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

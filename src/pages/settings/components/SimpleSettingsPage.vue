<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
  >
    <section class="simple-settings">
      <AdminSettingSection
        v-for="section in page.sections"
        :key="section.title"
        :title="section.title"
        :items="section.items"
      />
    </section>
  </ResourceShell>
</template>

<script setup>
import { AdminSettingSection } from '../../../components/admin'
import ResourceShell from '../../../components/resource/ResourceShell.vue'

defineProps({
  page: { type: Object, required: true },
})
</script>

<style scoped>
.simple-settings {
  max-width: 980px;
  margin-top: 22px;
  padding: 26px 28px 10px;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}
</style>

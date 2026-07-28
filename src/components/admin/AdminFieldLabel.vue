<template>
  <span class="admin-field-label">
    <span>{{ label }}</span>
    <AdminTooltip :content="help">
      <button
        type="button"
        class="admin-field-label__help"
        :aria-label="`${label}说明`"
        @click.stop
      >
        <el-icon><QuestionFilled /></el-icon>
      </button>
    </AdminTooltip>
  </span>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue'
import AdminTooltip from './AdminTooltip.vue'

defineProps({
  help: { type: String, required: true },
  label: { type: String, required: true },
})
</script>

<style scoped>
.admin-field-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.admin-field-label__help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--admin-placeholder);
  cursor: help;
  font-size: 14px;
  transition: color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}

.admin-field-label__help:hover,
.admin-field-label__help:focus-visible {
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
}

.admin-field-label__help:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--admin-primary) 45%, transparent);
  outline-offset: 2px;
}
</style>

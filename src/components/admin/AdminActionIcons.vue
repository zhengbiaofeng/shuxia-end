<template>
  <div class="admin-action-icons" aria-label="操作">
    <button
      v-for="action in actions"
      :key="action.label"
      type="button"
      :title="action.label"
      :class="{ 'is-danger': action.danger, 'is-boxed': action.boxed }"
      :disabled="action.disabled || action.loading"
      @click.stop="$emit('action', action)"
    >
      <el-icon v-if="!action.loading"><component :is="action.icon" /></el-icon>
      <el-icon v-else class="is-loading"><Loading /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  actions: { type: Array, default: () => [] },
})

defineEmits(['action'])
</script>

<style scoped>
.admin-action-icons {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.admin-action-icons button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: var(--admin-radius-control);
  background: transparent;
  color: #334a80;
  cursor: pointer;
  font-size: 16px;
  transition:
    background var(--duration-base) var(--ease-out),
    color var(--duration-base) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.admin-action-icons button:hover {
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
}

.admin-action-icons button:active {
  transform: translateY(1px);
}

.admin-action-icons button:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 2px;
}

.admin-action-icons button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.admin-action-icons button.is-boxed {
  border: 1px solid #dfe7f5;
  background: #fff;
}

.admin-action-icons button.is-danger {
  color: var(--admin-danger);
}
</style>

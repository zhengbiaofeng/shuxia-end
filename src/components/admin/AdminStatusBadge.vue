<template>
  <span class="admin-status-badge" :class="`is-${tone}`">
    <i v-if="dot" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  tone: { type: String, default: 'blue' },
  dot: { type: Boolean, default: false },
})
</script>

<style scoped>
.admin-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 24px;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 5px;
  font-size: var(--admin-text-xs);
  font-weight: var(--admin-weight-semibold);
  line-height: 1.2;
  white-space: nowrap;
}

.admin-status-badge i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.is-blue { border-color: #bfdbfe; background: #eff6ff; color: var(--admin-primary); }
.is-green { border-color: #bbf7d0; background: #ecfdf5; color: var(--admin-success); }
.is-orange { border-color: #fed7aa; background: #fff7ed; color: var(--admin-warning); }
.is-red { border-color: #fecaca; background: #fff1f2; color: var(--admin-danger); }
.is-purple { border-color: #ddd6fe; background: #f5f3ff; color: #7c3aed; }
.is-cyan { border-color: #a5f3fc; background: #ecfeff; color: #0891b2; }
.is-slate { border-color: #d8e0ed; background: #f8fafc; color: #64748b; }
</style>

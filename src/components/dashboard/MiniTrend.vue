<template>
  <svg class="mini-trend" viewBox="0 0 104 40" fill="none" aria-hidden="true">
    <path :d="path" :stroke="color" stroke-width="3.2" stroke-linecap="round" />
  </svg>
</template>

<script setup>
defineProps({
  path: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'var(--color-accent-soft)',
  },
});
</script>

<style scoped>
.mini-trend {
  width: 100%;
  height: 34px;
}
</style>

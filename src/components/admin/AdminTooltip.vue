<template>
  <el-tooltip
    :content="content"
    :disabled="disabled || !content"
    :effect="effect"
    :hide-after="hideAfter"
    :placement="placement"
    popper-class="admin-tooltip"
    :show-after="showAfter"
  >
    <slot />
  </el-tooltip>
</template>

<script setup>
defineProps({
  content: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  effect: { type: String, default: 'dark' },
  hideAfter: { type: Number, default: 60 },
  placement: { type: String, default: 'top' },
  showAfter: { type: Number, default: 220 },
})
</script>

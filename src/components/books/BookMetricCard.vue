<template>
  <MetricCard
    :color="item.color"
    :foot-label="item.footLabel"
    :foot-tone="item.footTone || 'blue'"
    :foot-value="item.footValue"
    :icon="item.icon"
    :placeholder="item.placeholder"
    :title="item.title"
    :unit="item.unit"
    :value="item.value"
  />
</template>

<script setup>
import MetricCard from '../common/MetricCard.vue'

defineProps({
  item: {
    type: Object,
    required: true,
  },
})
</script>

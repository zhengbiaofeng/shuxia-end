<template>
  <section v-if="items.length" class="resource-metrics" :style="{ '--metric-count': items.length }" aria-label="资源指标">
    <MetricCard
      v-for="item in items"
      :key="item.label"
      :color="item.color"
      :foot-label="item.sub"
      :icon="item.icon"
      :title="item.label"
      :unit="item.unit"
      :value="item.value"
    />
  </section>
</template>

<script setup>
import MetricCard from '../common/MetricCard.vue'

defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<style scoped>
.resource-metrics {
  display: grid;
  grid-template-columns: repeat(var(--metric-count), minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

@media (max-width: 1320px) {
  .resource-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .resource-metrics {
    grid-template-columns: 1fr;
  }
}
</style>

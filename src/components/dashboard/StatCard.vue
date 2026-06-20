<template>
  <MetricCard
    :clickable="clickable"
    :color="item.color"
    :extra-value="item.extraValue"
    :foot-label="item.deltaValue ? item.deltaLabel : item.extraLabel"
    :foot-tone="item.statusTone || 'green'"
    :foot-value="item.deltaValue"
    :icon="item.icon"
    :show-trend="Boolean(item.deltaValue)"
    :title="item.title"
    :unit="item.unit"
    :value="item.value"
    @click="handleClick"
  />
</template>

<script setup>
import MetricCard from '../common/MetricCard.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  clickable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

function handleClick() {
  if (!props.clickable) return
  emit('click', props.item)
}
</script>

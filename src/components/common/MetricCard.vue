<template>
  <article
    class="metric-card"
    :class="{
      'is-clickable': clickable,
      'is-placeholder': placeholder,
      'has-extra': extraValue,
    }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="metric-card__head">
      <span v-if="icon" class="metric-card__icon" :class="`is-${color}`">
        <el-icon><component :is="icon" /></el-icon>
      </span>
      <div class="metric-card__title">{{ title }}</div>
    </div>

    <div class="metric-card__value-row">
      <strong class="metric-card__value">{{ value }}</strong>
      <span v-if="unit" class="metric-card__unit">{{ unit }}</span>
      <span v-if="extraValue" class="metric-card__ring">{{ extraValue }}</span>
    </div>

    <div v-if="footLabel || footValue" class="metric-card__foot">
      <span v-if="footLabel" class="metric-card__label">{{ footLabel }}</span>
      <span v-if="footValue" class="metric-card__foot-value" :class="`is-${footTone}`">
        {{ footValue }}
      </span>
      <el-icon v-if="showTrend" class="metric-card__trend"><TopRight /></el-icon>
    </div>
  </article>
</template>

<script setup>
import { TopRight } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: '' },
  footLabel: { type: String, default: '' },
  footValue: { type: String, default: '' },
  footTone: { type: String, default: 'blue' },
  color: { type: String, default: 'blue' },
  icon: { type: [Object, Function], default: null },
  extraValue: { type: String, default: '' },
  placeholder: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  showTrend: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

function handleClick() {
  if (!props.clickable) return
  emit('click')
}
</script>

<style scoped>
.metric-card {
  position: relative;
  min-height: 112px;
  padding: 20px 22px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out);
}

.metric-card.is-placeholder {
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg-soft) 100%);
}

.metric-card.is-clickable {
  cursor: pointer;
}

.metric-card.is-clickable:hover {
  border-color: var(--color-accent-shadow-deep);
  box-shadow: 0 16px 30px var(--color-accent-shadow-soft);
  transform: translateY(-1px);
}

.metric-card.is-clickable:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.metric-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: var(--radius-md);
  color: var(--color-text-on-accent);
  font-size: var(--text-sm);
}

.metric-card__title {
  color: var(--color-text-2);
  font-size: var(--text-sm);
}

.metric-card__value-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.metric-card__value {
  color: var(--color-text-1);
  font-size: 28px;
  font-weight: var(--weight-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.metric-card__unit {
  margin-bottom: var(--space-1);
  color: var(--color-text-3);
  font-size: var(--text-xs);
}

.metric-card__ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  margin-left: auto;
  border: 5px solid var(--color-accent);
  border-right-color: var(--color-accent-ring-soft);
  border-bottom-color: var(--color-accent-ring-soft);
  border-radius: 50%;
  color: var(--color-accent);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.metric-card__foot {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 18px;
  margin-top: var(--space-3);
}

.metric-card__label {
  color: var(--color-text-4);
  font-size: var(--text-xs);
}

.metric-card__foot-value {
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

.metric-card__trend {
  color: var(--color-success);
  font-size: var(--text-xs);
}

.is-blue { background: var(--gradient-blue); }
.is-green { background: var(--gradient-green); }
.is-orange { background: var(--gradient-orange); }
.is-indigo { background: var(--gradient-indigo); }
.is-cyan { background: var(--gradient-cyan); }
.is-purple,
.is-violet { background: var(--gradient-purple); }

.metric-card__foot-value.is-blue {
  background: none;
  color: var(--color-accent);
}

.metric-card__foot-value.is-green {
  background: none;
  color: var(--color-success);
}

.metric-card__foot-value.is-orange {
  background: none;
  color: var(--color-warning);
}

.metric-card__foot-value.is-red {
  background: none;
  color: var(--color-danger);
}
</style>

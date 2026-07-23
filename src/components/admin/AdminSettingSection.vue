<template>
  <section class="admin-setting-section">
    <h2>{{ title }}</h2>
    <div class="admin-setting-section__body">
      <div v-for="item in items" :key="item.label" class="setting-row">
        <label :for="item.label">{{ item.label }}</label>
        <component
          :is="componentFor(item)"
          v-bind="propsFor(item)"
          :id="item.label"
          class="setting-row__control"
          @update:model-value="updateValue(item, $event)"
        >
          <template v-if="item.type === 'select'">
            <el-option
              v-for="option in item.options"
              :key="option"
              :label="option"
              :value="option"
            />
          </template>
        </component>
        <p>{{ item.help }}</p>
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])

function componentFor(item) {
  if (item.type === 'select') return 'el-select'
  if (item.type === 'switch') return 'el-switch'
  if (item.type === 'number') return 'el-input-number'
  return 'el-input'
}

function propsFor(item) {
  const disabled = props.readonly || item.readonly
  if (item.type === 'switch') return { modelValue: item.value, disabled }
  if (item.type === 'number') {
    return {
      modelValue: item.value,
      min: item.min,
      max: item.max,
      step: item.step || 1,
      disabled,
      controlsPosition: 'right',
    }
  }
  return { modelValue: item.value, placeholder: item.placeholder || item.label, disabled }
}

function updateValue(item, value) {
  if (props.readonly || item.readonly) return
  item.value = value
  emit('change', item, value)
}
</script>

<style scoped>
.admin-setting-section {
  padding: 0 0 24px;
}

.admin-setting-section + .admin-setting-section {
  padding-top: 22px;
  border-top: 1px solid var(--admin-row-border);
}

.admin-setting-section h2 {
  margin: 0 0 18px;
  color: #102557;
  font-size: var(--admin-text-section);
  font-weight: var(--admin-weight-strong);
}

.admin-setting-section__body {
  display: grid;
  gap: 14px;
}

.setting-row {
  display: grid;
  grid-template-columns: 132px minmax(240px, 430px) minmax(180px, 1fr);
  align-items: center;
  gap: 20px;
}

.setting-row label {
  color: #223a73;
  font-size: var(--admin-text-md);
  font-weight: var(--admin-weight-semibold);
}

.setting-row p {
  margin: 0;
  color: var(--admin-text-muted);
  font-size: var(--admin-text-sm);
  line-height: 1.45;
}

.setting-row__control :deep(.el-input__wrapper),
.setting-row__control :deep(.el-select__wrapper),
.setting-row__control :deep(.el-input-number) {
  min-height: var(--admin-input-height);
  border-radius: var(--admin-radius-control);
  box-shadow: 0 0 0 1px var(--admin-border) inset;
}

.setting-row__control.el-input-number {
  width: 100%;
}

@media (max-width: 900px) {
  .setting-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>

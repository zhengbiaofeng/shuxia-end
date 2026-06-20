<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    destroy-on-close
    @close="$emit('update:modelValue', false)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="resource-form">
      <el-form-item
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
        :prop="field.key"
      >
        <el-select v-if="field.type === 'select'" v-model="form[field.key]" class="resource-form__control">
          <el-option
            v-for="option in field.options || []"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="form[field.key]"
          :min="field.min ?? 0"
          :max="field.max"
          class="resource-form__control"
        />
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="form[field.key]"
          :placeholder="field.placeholder"
          :rows="3"
          type="textarea"
        />
        <el-input
          v-else
          v-model="form[field.key]"
          :placeholder="field.placeholder"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  initialValues: { type: Object, default: () => ({}) },
  modelValue: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  title: { type: String, default: '编辑' },
})

const emit = defineEmits(['submit', 'update:modelValue'])
const formRef = ref()
const form = reactive({})

const rules = reactive({})

watch(
  () => [props.modelValue, props.fields, props.initialValues],
  () => {
    if (!props.modelValue) return
    Object.keys(form).forEach((key) => delete form[key])
    Object.keys(rules).forEach((key) => delete rules[key])
    props.fields.forEach((field) => {
      form[field.key] = props.initialValues[field.key] ?? field.defaultValue ?? ''
      if (field.required) {
        rules[field.key] = [{ required: true, message: `请输入${field.label}`, trigger: 'blur' }]
      }
    })
  },
  { immediate: true },
)

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate()
  emit('submit', { ...form })
}
</script>

<style scoped>
.resource-form {
  display: grid;
  gap: 2px;
}

.resource-form__control {
  width: 100%;
}
</style>

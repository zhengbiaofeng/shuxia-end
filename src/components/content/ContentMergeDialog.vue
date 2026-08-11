<template>
  <el-dialog v-model="visibleModel" :title="`合并${domainLabel}`" width="560px" destroy-on-close @closed="handleClosed">
    <el-alert title="这是人工合并操作，不会根据书名或作者自动判断。" type="warning" :closable="false" show-icon />
    <p class="merge-help">请选择保留的目标内容。来源内容会被移除，所有不同格式会归入目标；同格式版本冲突时，服务端会拒绝本次操作。为避免影响阅读端，参与合并的内容必须先下架。</p>
    <el-radio-group v-model="targetId" class="merge-options">
      <el-radio v-for="row in rows" :key="row.id" :value="row.id" border class="merge-option">
        <span class="merge-option__title">{{ row.title || '未命名内容' }}</span>
        <span class="merge-option__author">{{ row.author || row.subtitle || '作者未知' }}</span>
      </el-radio>
    </el-radio-group>
    <template #footer>
      <el-button @click="visibleModel = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!targetId" @click="confirmMerge">确认合并</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  rows: { type: Array, default: () => [] },
  domainLabel: { type: String, default: '内容' },
  submitting: { type: Boolean, default: false },
})
const emit = defineEmits(['update:visible', 'confirm', 'closed'])
const visibleModel = computed({ get: () => props.visible, set: (value) => emit('update:visible', value) })
const targetId = defineModel('targetId', { type: String, default: '' })

function confirmMerge() { if (targetId.value) emit('confirm', targetId.value) }
function handleClosed() { targetId.value = ''; emit('closed') }
</script>

<style scoped>
.merge-help { color: #64748b; line-height: 1.7; margin: 14px 0; }
.merge-options { display: grid; gap: 10px; max-height: 300px; overflow: auto; }
.merge-option { align-items: flex-start; display: flex; margin: 0; width: 100%; }
.merge-option__title, .merge-option__author { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.merge-option__title { color: #172554; font-weight: 700; }
.merge-option__author { color: #64748b; font-size: 12px; margin-top: 4px; }
</style>

<template>
  <el-dialog
    :model-value="modelValue"
    class="content-visibility-dialog"
    width="min(920px, 94vw)"
    destroy-on-close
    :close-on-click-modal="false"
    @close="closeDialog"
    @open="loadVisibility"
  >
    <template #header>
      <div class="dialog-heading">
        <span class="heading-icon"><Hide /></span>
        <div class="heading-copy">
          <strong>阅读内容权限</strong>
          <span>{{ user?.username || '--' }}</span>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="visibility-body">
      <div class="scope-summary">
        <div>
          <span>书籍不可见</span>
          <strong>{{ visibility.ebookEffectiveDeniedCategoryCount }} 个分类</strong>
          <small>{{ visibility.ebookAffectedContentCount }} 项内容</small>
        </div>
        <div>
          <span>小说不可见</span>
          <strong>{{ visibility.novelEffectiveDeniedCategoryCount }} 个分类</strong>
          <small>{{ visibility.novelAffectedContentCount }} 项内容</small>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="visibility-tabs">
        <el-tab-pane label="书籍分类" name="ebook">
          <CategoryScopeTree
            ref="ebookScopeRef"
            v-model:keyword="ebookKeyword"
            :categories="visibility.ebookCategories"
            :disabled="!canEdit"
            empty-text="暂无书籍分类"
            @clear="clearScope('ebook')"
          />
        </el-tab-pane>
        <el-tab-pane label="小说分类" name="novel">
          <CategoryScopeTree
            ref="novelScopeRef"
            v-model:keyword="novelKeyword"
            :categories="visibility.novelCategories"
            :disabled="!canEdit"
            empty-text="暂无小说分类"
            @clear="clearScope('novel')"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button v-if="canEdit" type="primary" :loading="saving" @click="saveVisibility">
        保存权限
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Hide } from '@element-plus/icons-vue'
import { fetchUserContentVisibility, saveUserContentVisibility } from '../../api/adminModules'
import CategoryScopeTree from './UserContentVisibilityTree.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'saved'])
const activeTab = ref('ebook')
const loading = ref(false)
const saving = ref(false)
const ebookKeyword = ref('')
const novelKeyword = ref('')
const ebookScopeRef = ref(null)
const novelScopeRef = ref(null)
const visibility = reactive(emptyVisibility())

function emptyVisibility() {
  return {
    userId: '',
    username: '',
    ebookCategories: [],
    novelCategories: [],
    ebookDeniedCategoryIds: [],
    novelDeniedCategoryIds: [],
    ebookEffectiveDeniedCategoryCount: 0,
    novelEffectiveDeniedCategoryCount: 0,
    ebookAffectedContentCount: 0,
    novelAffectedContentCount: 0,
  }
}

function applyVisibility(data = {}) {
  Object.assign(visibility, emptyVisibility(), data)
  visibility.ebookCategories = Array.isArray(data.ebookCategories) ? data.ebookCategories : []
  visibility.novelCategories = Array.isArray(data.novelCategories) ? data.novelCategories : []
  visibility.ebookDeniedCategoryIds = Array.isArray(data.ebookDeniedCategoryIds) ? data.ebookDeniedCategoryIds : []
  visibility.novelDeniedCategoryIds = Array.isArray(data.novelDeniedCategoryIds) ? data.novelDeniedCategoryIds : []
}

async function syncTreeChecks() {
  await nextTick()
  ebookScopeRef.value?.setCheckedKeys(visibility.ebookDeniedCategoryIds)
  novelScopeRef.value?.setCheckedKeys(visibility.novelDeniedCategoryIds)
}

async function loadVisibility() {
  if (!props.user?.id) return
  loading.value = true
  activeTab.value = 'ebook'
  ebookKeyword.value = ''
  novelKeyword.value = ''
  try {
    applyVisibility(await fetchUserContentVisibility(props.user.id))
    await syncTreeChecks()
  } catch (error) {
    applyVisibility()
    ElMessage.error(error.message || '获取阅读内容权限失败')
  } finally {
    loading.value = false
  }
}

function clearScope(scope) {
  if (!props.canEdit) return
  if (scope === 'ebook') ebookScopeRef.value?.setCheckedKeys([])
  if (scope === 'novel') novelScopeRef.value?.setCheckedKeys([])
}

async function saveVisibility() {
  if (!props.canEdit || !props.user?.id) return
  saving.value = true
  try {
    const data = await saveUserContentVisibility({
      userId: props.user.id,
      ebookDeniedCategoryIds: ebookScopeRef.value?.getCheckedKeys() || [],
      novelDeniedCategoryIds: novelScopeRef.value?.getCheckedKeys() || [],
    })
    applyVisibility(data)
    await syncTreeChecks()
    ElMessage.success('阅读内容权限已保存')
    emit('saved', data)
    closeDialog()
  } catch (error) {
    ElMessage.error(error.message || '保存阅读内容权限失败')
  } finally {
    saving.value = false
  }
}

function closeDialog() {
  if (!saving.value) emit('update:modelValue', false)
}
</script>

<style scoped>
.dialog-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }
.heading-icon { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex: 0 0 auto; border-radius: 8px; background: #eaf2ff; color: #1d67ff; }
.heading-icon :deep(svg) { width: 19px; height: 19px; }
.heading-copy { display: grid; min-width: 0; gap: 3px; }
.heading-copy strong { color: #102557; font-size: 17px; line-height: 1.35; }
.heading-copy span { overflow: hidden; color: #64748b; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.visibility-body { min-height: 0; }
.scope-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid #e1e9f5; border-radius: 8px; background: #f7faff; }
.scope-summary > div { display: grid; grid-template-columns: minmax(88px, auto) minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 64px; padding: 12px 18px; }
.scope-summary > div + div { border-left: 1px solid #e1e9f5; }
.scope-summary span { color: #64748b; font-size: 13px; }
.scope-summary strong { color: #102557; font-size: 15px; }
.scope-summary small { color: #3d5f94; font-size: 12px; white-space: nowrap; }
.visibility-tabs { margin-top: 16px; }
:global(.content-visibility-dialog) { display: flex; flex-direction: column; max-height: 90vh; margin-top: 5vh; overflow: hidden; }
:global(.content-visibility-dialog .el-dialog__header),
:global(.content-visibility-dialog .el-dialog__footer) { flex: 0 0 auto; }
:global(.content-visibility-dialog .el-dialog__body) { flex: 1 1 auto; min-height: 0; overflow: auto; }
@media (max-width: 640px) {
  .scope-summary { grid-template-columns: 1fr; }
  .scope-summary > div { grid-template-columns: 1fr auto; }
  .scope-summary > div + div { border-top: 1px solid #e1e9f5; border-left: 0; }
  .scope-summary small { grid-column: 1 / -1; }
}
</style>

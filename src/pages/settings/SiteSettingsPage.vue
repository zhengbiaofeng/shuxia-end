<template>
  <ResourceShell
    :actions="pageActions"
    :active-menu="page.activeMenu"
    :active-tab="activeTab"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handleAction"
    @tab-change="handleTabChange"
  >
    <div class="settings-layout">
      <section class="settings-main" v-loading="loading">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="left"
          hide-required-asterisk
          class="site-form"
        >
          <section :ref="(element) => setSectionRef(0, element)" class="site-section">
            <h2>站点信息</h2>
            <div class="site-section__body">
              <el-form-item label="站点名称" prop="siteName">
                <div class="field-control">
                  <el-input v-model="form.siteName" placeholder="请输入站点名称" />
                  <p>显示在浏览器标题、后台侧边栏和前台页面。</p>
                </div>
              </el-form-item>
              <el-form-item label="站点 Logo" prop="siteLogo">
                <div class="field-control">
                  <el-input v-model="form.siteLogo" placeholder="Logo 地址或文件 ID" />
                  <p>支持 http(s)、data URL、站内相对地址或文件 ID。</p>
                </div>
              </el-form-item>
              <el-form-item label="默认搜索文案" prop="defaultSearchPlaceholder">
                <div class="field-control">
                  <el-input v-model="form.defaultSearchPlaceholder" placeholder="搜索书名/作者/分类" />
                  <p>搜索框默认提示文案。</p>
                </div>
              </el-form-item>
              <el-form-item label="版权主体" prop="copyrightCompany">
                <div class="field-control">
                  <el-input v-model="form.copyrightCompany" placeholder="请输入版权主体" />
                  <p>用于系统信息和版权默认补全。</p>
                </div>
              </el-form-item>
            </div>
          </section>

          <section :ref="(element) => setSectionRef(1, element)" class="site-section">
            <h2>默认策略</h2>
            <div class="site-section__body">
              <el-form-item label="默认客户端" prop="defaultClientType">
                <div class="field-control">
                  <el-select v-model="form.defaultClientType" placeholder="请选择默认客户端">
                    <el-option label="PC" value="pc" />
                    <el-option label="移动端" value="mobile" />
                    <el-option label="全部" value="all" />
                  </el-select>
                  <p>默认客户端类型。</p>
                </div>
              </el-form-item>
              <el-form-item label="默认业务类型" prop="defaultBizType">
                <div class="field-control">
                  <el-select v-model="form.defaultBizType" placeholder="请选择默认业务类型">
                    <el-option label="书籍" value="ebook" />
                    <el-option label="小说" value="novel" />
                    <el-option label="漫画" value="comic" />
                    <el-option label="有声" value="audio" />
                  </el-select>
                  <p>默认展示的内容类型。</p>
                </div>
              </el-form-item>
              <el-form-item label="默认排序" prop="defaultBookSortType">
                <div class="field-control">
                  <el-select v-model="form.defaultBookSortType" placeholder="请选择默认排序">
                    <el-option label="最新" value="latest" />
                    <el-option label="热门" value="hot" />
                    <el-option label="推荐" value="recommend" />
                    <el-option label="名称" value="name" />
                  </el-select>
                  <p>默认列表排序规则。</p>
                </div>
              </el-form-item>
            </div>
          </section>

          <section :ref="(element) => setSectionRef(2, element)" class="site-section">
            <h2>备案信息</h2>
            <div class="site-section__body">
              <el-form-item label="ICP备案号" prop="icpNo">
                <div class="field-control">
                  <el-input v-model="form.icpNo" placeholder="ICP备案号" />
                  <p>站点 ICP 备案信息。</p>
                </div>
              </el-form-item>
              <el-form-item label="公安备案号" prop="policeNo">
                <div class="field-control">
                  <el-input v-model="form.policeNo" placeholder="公安备案号" />
                  <p>公安联网备案信息。</p>
                </div>
              </el-form-item>
              <el-form-item label="版权文案" prop="copyrightText">
                <div class="field-control">
                  <el-input v-model="form.copyrightText" placeholder="页脚完整版权文案" />
                  <p>保存后会更新后台页面页脚展示。</p>
                </div>
              </el-form-item>
            </div>
          </section>
        </el-form>
      </section>

      <aside class="settings-side">
        <article class="preview-card">
          <div class="preview-card__title">
            <h2>站点预览</h2>
            <span>{{ form.defaultClientType || 'pc' }}</span>
          </div>
          <div class="login-preview">
            <div class="login-preview__chrome" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div class="login-preview__stage">
              <div class="login-preview__brand">
                <span class="login-preview__logo">
                  <img v-if="previewLogo" :src="previewLogo" alt="" />
                  <span v-else>{{ logoInitial }}</span>
                </span>
                <div>
                  <strong>{{ form.siteName || '书匣' }}</strong>
                  <small>{{ previewSubtitle }}</small>
                </div>
              </div>
              <div class="login-preview__panel">
                <i />
                <i />
                <button type="button">登录</button>
              </div>
            </div>
          </div>
        </article>

        <InfoListCard title="站点链接" :items="links" link />
        <InfoListCard title="系统信息" :items="systemInfo" />
      </aside>
    </div>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { settingPages } from '../../config/adminModules'
import { normalizeLogoUrl } from '../../api/siteSettings'
import { useSiteSettingsStore } from '../../stores/siteSettings'
import InfoListCard from './components/InfoListCard.vue'

const page = {
  ...settingPages.site,
}
const siteSettingsStore = useSiteSettingsStore()
const formRef = ref()
const sectionRefs = ref([])
const activeTab = ref(0)
const loading = ref(false)
const saving = ref(false)
const form = reactive({
  siteKey: 'default',
  siteName: '',
  siteLogo: '',
  siteLogoFileId: '',
  defaultSearchPlaceholder: '',
  copyrightCompany: '',
  defaultClientType: 'pc',
  defaultBizType: 'ebook',
  defaultBookSortType: 'latest',
  icpNo: '',
  policeNo: '',
  copyrightText: '',
})
const rules = {
  siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
}
const pageActions = computed(() =>
  page.actions.map((action) =>
    action.label === '保存设置'
      ? {
          ...action,
          loading: saving.value,
          disabled: saving.value,
        }
      : action
  )
)

const previewLogo = computed(() => normalizeLogoUrl(form.siteLogo || form.siteLogoFileId))
const logoInitial = computed(() => String(form.siteName || '书').slice(0, 1))
const previewSubtitle = computed(() => form.copyrightCompany || siteSettingsStore.subtitle)
const links = computed(() => [
  ['站点 Logo', form.siteLogo || form.siteLogoFileId || '--'],
  ['默认客户端', form.defaultClientType || '--'],
  ['默认业务类型', form.defaultBizType || '--'],
  ['默认排序', form.defaultBookSortType || '--'],
])
const systemInfo = computed(() => [
  ['站点编码', form.siteKey || 'default'],
  ['版权主体', form.copyrightCompany || '--'],
  ['ICP备案号', form.icpNo || '--'],
  ['公安备案号', form.policeNo || '--'],
])

async function loadSiteSettings() {
  loading.value = true
  try {
    const data = await siteSettingsStore.loadAdminSettings()
    applyForm(data)
  } catch (error) {
    ElMessage.error(error.message || '获取站点设置失败')
  } finally {
    loading.value = false
  }
}

async function handleAction(action) {
  if (action?.label !== '保存设置') return
  await saveSettings()
}

function setSectionRef(index, element) {
  if (element) {
    sectionRefs.value[index] = element
  }
}

function handleTabChange(index) {
  activeTab.value = index
  sectionRefs.value[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function saveSettings() {
  if (!formRef.value || saving.value) return

  try {
    await formRef.value.validate()
    saving.value = true
    const data = await siteSettingsStore.saveAdminSettings({
      ...form,
      siteLogoFileId: '',
    })
    applyForm(data)
    ElMessage.success('站点设置已保存')
  } catch (error) {
    ElMessage.error(error.message || '保存站点设置失败')
  } finally {
    saving.value = false
  }
}

function applyForm(data = {}) {
  Object.assign(form, {
    siteKey: data.siteKey || 'default',
    siteName: data.siteName || '',
    siteLogo: data.siteLogo || data.siteLogoFileId || '',
    siteLogoFileId: data.siteLogoFileId || '',
    defaultSearchPlaceholder: data.defaultSearchPlaceholder || '',
    copyrightCompany: data.copyrightCompany || '',
    defaultClientType: data.defaultClientType || 'pc',
    defaultBizType: data.defaultBizType || 'ebook',
    defaultBookSortType: data.defaultBookSortType || 'latest',
    icpNo: data.icpNo || '',
    policeNo: data.policeNo || '',
    copyrightText: data.copyrightText || '',
  })
}

onMounted(loadSiteSettings)
</script>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 400px);
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}

.settings-main,
.preview-card {
  border: 1px solid rgba(219, 229, 244, 0.86);
  border-radius: var(--admin-radius-card);
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: var(--admin-shadow-card);
}

.settings-main {
  min-width: 0;
  padding: 0 28px 4px;
  overflow: hidden;
}

.settings-side {
  display: grid;
  align-content: start;
  gap: 14px;
  position: sticky;
  top: 18px;
  min-width: 0;
}

.site-section {
  scroll-margin-top: 22px;
  padding: 24px 0 26px;
}

.site-section + .site-section {
  border-top: 1px solid rgba(231, 236, 247, 0.9);
}

.site-section h2,
.preview-card h2 {
  margin: 0;
  color: #102557;
  font-size: var(--admin-text-card-title);
  font-weight: var(--admin-weight-strong);
  letter-spacing: 0;
  line-height: 1.25;
}

.site-section h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.site-section h2::before {
  width: 4px;
  height: 18px;
  border-radius: var(--admin-radius-pill);
  background: linear-gradient(180deg, #1d75ff 0%, #8bbcff 100%);
  content: '';
}

.site-section__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.site-form :deep(.el-form-item) {
  display: grid;
  gap: 8px;
  align-content: start;
  margin-bottom: 0;
}

.site-form :deep(.el-form-item__label) {
  justify-content: flex-start;
  height: auto;
  padding: 0;
  color: #1b3268;
  font-size: var(--admin-text-md);
  font-weight: var(--admin-weight-semibold);
  line-height: 1.4;
}

.site-form :deep(.el-form-item__content) {
  min-width: 0;
}

.site-form :deep(.el-input),
.site-form :deep(.el-select) {
  width: 100%;
}

.site-form :deep(.el-input__wrapper),
.site-form :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: var(--admin-radius-control);
  background: #fbfdff;
  box-shadow: 0 0 0 1px #dbe5f4 inset;
  transition:
    background-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
}

.site-form :deep(.el-input__wrapper:hover),
.site-form :deep(.el-select__wrapper:hover) {
  background: #ffffff;
  box-shadow: 0 0 0 1px #b9cdf0 inset;
}

.site-form :deep(.el-input__wrapper.is-focus),
.site-form :deep(.el-select__wrapper.is-focused) {
  background: #ffffff;
  box-shadow:
    0 0 0 1px var(--admin-primary) inset,
    0 0 0 3px rgba(20, 118, 255, 0.1);
}

.field-control {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.site-form p {
  margin: 0;
  color: var(--admin-text-muted);
  font-size: var(--admin-text-sm);
  line-height: 1.45;
}

.preview-card {
  padding: 20px;
}

.preview-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.preview-card__title span {
  min-width: 44px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid #d7e4f7;
  border-radius: var(--admin-radius-control);
  background: #f6f9ff;
  color: #496099;
  font-size: var(--admin-text-xs);
  font-weight: var(--admin-weight-semibold);
  line-height: 24px;
  text-align: center;
  text-transform: uppercase;
}

.login-preview {
  position: relative;
  min-height: 286px;
  overflow: hidden;
  border-radius: 7px;
  background:
    radial-gradient(circle at 18% 22%, rgba(116, 166, 255, 0.52), transparent 34%),
    radial-gradient(circle at 82% 16%, rgba(22, 163, 74, 0.18), transparent 30%),
    linear-gradient(135deg, #071a3f 0%, #102d60 54%, #071f4d 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.login-preview::after {
  position: absolute;
  inset: auto 0 0;
  height: 52%;
  background: linear-gradient(180deg, rgba(8, 23, 55, 0) 0%, rgba(8, 23, 55, 0.48) 100%);
  content: '';
}

.login-preview__chrome {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 6px;
  padding: 14px 16px 0;
}

.login-preview__chrome span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.42);
}

.login-preview__stage {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 260px;
  padding: 24px;
}

.login-preview__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  align-self: start;
  min-width: 0;
}

.login-preview__panel {
  display: grid;
  justify-self: end;
  width: min(100%, 198px);
  padding: 18px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  background: rgba(8, 20, 45, 0.62);
  box-shadow: 0 18px 36px rgba(2, 8, 23, 0.24);
  color: #fff;
  backdrop-filter: blur(14px);
}

.login-preview__logo {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  overflow: hidden;
  border-radius: 9px;
  background: var(--admin-primary);
  box-shadow: 0 10px 20px rgba(20, 118, 255, 0.32);
  font-weight: 800;
}

.login-preview__logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-preview strong {
  display: block;
  max-width: 210px;
  overflow: hidden;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-preview small {
  display: block;
  max-width: 210px;
  margin-top: 3px;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--admin-text-xs);
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-preview i {
  width: 100%;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.035);
}

.login-preview i + i {
  margin-top: 10px;
}

.login-preview button {
  width: 100%;
  height: 34px;
  margin-top: 12px;
  border: 0;
  border-radius: 5px;
  background: var(--admin-primary);
  color: #fff;
  cursor: default;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-side {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preview-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .settings-main {
    padding: 0 20px 2px;
  }

  .site-section__body,
  .settings-side {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .settings-layout {
    gap: 14px;
  }

  .settings-main,
  .preview-card {
    border-radius: 7px;
  }

  .settings-main,
  .preview-card {
    padding-right: 16px;
    padding-left: 16px;
  }

  .login-preview__stage {
    padding: 18px;
  }

  .login-preview__panel {
    justify-self: stretch;
  }

  .login-preview strong,
  .login-preview small {
    max-width: 170px;
  }
}
</style>

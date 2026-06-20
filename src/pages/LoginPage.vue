<template>
  <div class="login-page">
    <main class="login-shell">
      <section class="login-visual">
        <div class="login-visual__bg" aria-hidden="true">
          <span class="login-cloud login-cloud--1" />
          <span class="login-cloud login-cloud--2" />
          <span class="login-cloud login-cloud--3" />
        </div>

        <div class="login-visual__content">
          <BrandLogo
            :title="siteSettingsStore.siteName"
            :subtitle="siteSettingsStore.subtitle"
            :logo="siteSettingsStore.logoUrl"
            size="md"
            class="login-visual__brand"
          />

          <div class="login-copy">
            <h2 class="login-copy__title">我的私人书库 · 听书 · 漫画 · 小说</h2>
            <p class="login-copy__desc">
              专为 NAS 用户打造的私人数字内容库，<br />
              所有内容，随时随地，尽在掌握
            </p>
          </div>

          <div class="login-visual__hero">
            <img src="../assets/login-hero.png" alt="书匣私人书库内容管理场景" class="login-visual__hero-img" />
          </div>
        </div>
      </section>

      <section class="login-form-section">
        <div class="login-form-wrapper">
          <div class="login-card">
            <div class="login-card__header">
              <h3 class="login-card__title">账号登录</h3>
              <p class="login-card__subtitle">登录后，继续您的阅读之旅</p>
            </div>

            <el-form
              ref="formRef"
              :model="formState"
              :rules="formRules"
              label-position="top"
              hide-required-asterisk
              class="login-card__form"
              @submit.prevent="handleLogin"
            >
              <el-form-item label="账号" prop="username">
                <el-input
                  v-model="formState.username"
                  placeholder="请输入账号"
                  autocomplete="username"
                >
                  <template #prefix>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="formState.password"
                  placeholder="请输入密码"
                  show-password
                  autocomplete="current-password"
                >
                  <template #prefix>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <circle cx="12" cy="16" r="1.5" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </template>
                </el-input>
              </el-form-item>

              <div class="login-card__options">
                <label class="login-card__remember">
                  <el-checkbox v-model="rememberMe" size="small" />
                  <span>记住我</span>
                </label>
                <a class="login-card__forgot" href="#">忘记密码？</a>
              </div>

              <p v-if="errorMessage" class="login-card__error" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {{ errorMessage }}
              </p>

              <el-button
                class="login-card__submit"
                type="primary"
                native-type="submit"
                :loading="submitting"
              >
                <span v-if="!submitting">登 录</span>
                <span v-else>登录中…</span>
              </el-button>
            </el-form>
          </div>
        </div>
      </section>
    </main>

    <footer class="login-footer">
      <span>{{ siteSettingsStore.footerText }}</span>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSiteSettingsStore } from '../stores/siteSettings'
import { BrandLogo } from '../components/visuals'

const router = useRouter()
const authStore = useAuthStore()
const siteSettingsStore = useSiteSettingsStore()
const formRef = ref()
const submitting = ref(false)
const errorMessage = ref('')
const rememberMe = ref(true)
const formState = reactive({
  username: '',
  password: '',
})

const formRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  errorMessage.value = ''
  try {
    await formRef.value.validate()
    submitting.value = true
    await authStore.login({
      username: formState.username.trim(),
      password: formState.password,
    })
    router.push('/dashboard')
  } catch (error) {
    if (error?.message) {
      errorMessage.value = error.message
    } else if (error) {
      errorMessage.value = '请完整填写登录信息'
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  siteSettingsStore.loadPublicSettings().catch((error) => {
    console.warn('站点信息加载失败：', error)
  })
})
</script>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background:
    radial-gradient(circle at 18% 18%, rgba(37, 99, 235, 0.06), transparent 30%),
    linear-gradient(180deg, #f7faff 0%, #eef4fb 100%);
  overflow: hidden;
  padding: 38px 38px 0;
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  flex: 1;
  min-height: calc(100dvh - 96px);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.04),
    0 22px 58px rgba(45, 69, 101, 0.13);
  overflow: hidden;
  animation: loginShellIn 0.6s var(--ease-out) both;
}

@keyframes loginShellIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 76px 86px 52px;
  overflow: hidden;
  border-right: 1px solid #e9eef6;
  container-type: inline-size;
  container-name: login-visual;
}

.login-visual__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 78%, rgba(60, 130, 255, 0.10), transparent 36%),
    linear-gradient(180deg, #fbfdff 0%, #f3f8ff 100%);
  pointer-events: none;
}

.login-cloud {
  position: absolute;
  width: 76px;
  height: 26px;
  border-radius: 999px;
  background: rgba(227, 238, 255, 0.58);
  filter: blur(0.2px);
}

.login-cloud::before,
.login-cloud::after {
  content: '';
  position: absolute;
  bottom: 6px;
  border-radius: 50%;
  background: inherit;
}

.login-cloud::before {
  left: 16px;
  width: 28px;
  height: 28px;
}

.login-cloud::after {
  right: 15px;
  width: 38px;
  height: 38px;
}

.login-cloud--1 {
  left: 78px;
  top: 44%;
}

.login-cloud--2 {
  right: 108px;
  top: 45%;
  transform: scale(0.75);
  opacity: 0.6;
}

.login-cloud--3 {
  right: 208px;
  top: 52%;
  transform: scale(0.52);
  opacity: 0.48;
}

.login-visual__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.login-visual__brand {
  animation: brandReveal 0.7s 0.1s var(--ease-out) both;
}

.login-visual__brand :deep(.brand-logo__title) {
  font-size: 24px;
  line-height: 1.08;
}

.login-visual__brand :deep(.brand-logo__subtitle) {
  margin-top: 5px;
  font-size: 16px;
  color: #111827;
}

@keyframes brandReveal {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 文案区 ===== */
.login-copy {
  margin-top: 72px;
  max-width: 690px;
  animation: fadeUp 0.5s 0.25s var(--ease-out) both;
}

.login-copy__title {
  margin: 0;
  font-size: 32px;
  font-weight: var(--weight-bold);
  line-height: 1.25;
  letter-spacing: 0;
  color: #071d49;
  white-space: nowrap;
}

.login-copy__desc {
  margin: 23px 0 0;
  font-size: 20px;
  font-weight: var(--weight-medium);
  line-height: 1.6;
  color: #6d7b91;
}

.login-visual__hero {
  flex: 0 0 auto;
  margin-top: 41px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 388px;
  animation: fadeUp 0.5s 0.35s var(--ease-out) both;
  position: relative;
}

.login-visual__hero-img {
  width: min(672px, 100%);
  height: auto;
  display: block;
  transform: translate(-18px, 0);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0, #000 5%, #000 94%, transparent 100%),
    linear-gradient(180deg, transparent 0, #000 8%, #000 92%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0, #000 5%, #000 94%, transparent 100%),
    linear-gradient(180deg, transparent 0, #000 8%, #000 92%, transparent 100%);
  mask-composite: intersect;
  user-select: none;
}

.login-form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: rgba(255, 255, 255, 0.84);
  position: relative;
}

.login-form-wrapper {
  width: 100%;
  max-width: 518px;
  animation: fadeUp 0.5s 0.3s var(--ease-out) both;
}

.login-card {
  width: 100%;
  padding: 53px 45px 47px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 1px 1px rgba(15, 23, 42, 0.03),
    0 10px 30px rgba(39, 63, 97, 0.09);
}

.login-card__header {
  width: 100%;
  margin-bottom: 37px;
  text-align: center;
}

.login-card__title {
  margin: 0;
  font-size: 26px;
  font-weight: var(--weight-bold);
  line-height: 1.2;
  color: #0b1220;
  letter-spacing: 0;
}

.login-card__subtitle {
  margin: 18px 0 0;
  font-size: 16px;
  line-height: 1.4;
  color: #718098;
}

.login-card__form {
  width: 100%;
}

.login-card__form :deep(.el-form-item) {
  margin-bottom: 28px;
}

.login-card__form :deep(.el-form-item__label) {
  padding-bottom: 11px;
  color: #101828;
  font-size: 16px;
  font-weight: var(--weight-semibold);
  line-height: 1;
  letter-spacing: 0;
}

.login-card__form :deep(.el-input__wrapper) {
  height: 48px;
  padding: 0 15px;
  border-radius: 7px;
  background: #fff;
  box-shadow:
    0 0 0 1px #d7dee9 inset,
    0 1px 2px rgba(15, 23, 42, 0.02) inset;
  transition: all 0.2s var(--ease-out);
}

.login-card__form :deep(.el-input__wrapper:hover) {
  box-shadow:
    0 0 0 1px #c4d0df inset,
    0 1px 3px rgba(15, 23, 42, 0.05) inset;
  background: #fff;
}

.login-card__form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #2d7dff inset,
    0 0 0 3px rgba(38, 119, 255, 0.14),
    0 1px 4px rgba(38, 119, 255, 0.08) inset;
  background: #fff;
}

.login-card__form :deep(.el-input__inner) {
  font-size: 15px;
  color: var(--color-text-1);
  height: 48px;
}

.login-card__form :deep(.el-input__inner::placeholder) {
  color: #9aa6b8;
  font-size: 15px;
}

.login-card__form :deep(.el-input__prefix) {
  color: #8d99ad;
  margin-right: 10px;
  font-size: 16px;
}

.login-card__form :deep(.el-input__wrapper.is-focus) .el-input__prefix {
  color: var(--color-accent);
  transition: color 0.2s;
}

.login-card__form :deep(.el-input__suffix) {
  color: var(--color-text-4);
}

.login-card__form :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--color-danger) inset;
  background: var(--color-danger-soft);
}

.login-card__form :deep(.el-form-item__error) {
  font-size: 11px;
  color: var(--color-danger);
  margin-top: 4px;
  line-height: 1.3;
}

.login-card__options {
  display: none;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.login-card__remember {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--color-text-3);
  user-select: none;
}

.login-card__remember:hover {
  color: var(--color-text-2);
}

.login-card__forgot {
  font-size: var(--text-xs);
  color: var(--color-accent);
  text-decoration: none;
  font-weight: var(--weight-medium);
  transition: color 0.2s;
}

.login-card__forgot:hover {
  color: var(--color-accent-deep);
  text-decoration: underline;
}

.login-card__error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 var(--space-4);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-danger-soft);
  font-size: var(--text-xs);
  color: var(--color-danger);
  line-height: var(--leading-snug);
  animation: shakeIn 0.35s var(--ease-out);
}

@keyframes shakeIn {
  0% { transform: translateX(-4px); opacity: 0; }
  25% { transform: translateX(3px); }
  50% { transform: translateX(-2px); }
  75% { transform: translateX(1px); }
  100% { transform: translateX(0); opacity: 1; }
}

.login-card__submit {
  width: 100%;
  height: 48px;
  margin-top: 19px;
  border-radius: 7px;
  border: 0;
  --el-button-text-color: #fff;
  --el-button-hover-text-color: #fff;
  --el-button-active-text-color: #fff;
  --el-button-disabled-text-color: rgba(255, 255, 255, 0.76);
  background: #2478ff;
  font-size: 16px;
  font-weight: var(--weight-semibold);
  letter-spacing: 0;
  color: #fff;
  transition: all 0.25s var(--ease-out);
  box-shadow: none;
  position: relative;
  overflow: hidden;
}

.login-card__submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #1d6fff;
  opacity: 0;
  transition: opacity 0.25s var(--ease-out);
  border-radius: inherit;
}

.login-card__submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(36, 120, 255, 0.18);
  color: #fff;
}

.login-card__submit:hover::before {
  opacity: 1;
}

.login-card__submit:active {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 2px 8px rgba(38, 119, 255, 0.25);
  color: #fff;
}

.login-card__submit:active::before {
  opacity: 0.5;
}

.login-card__submit > span {
  position: relative;
  z-index: 1;
  color: inherit;
}

.login-card__submit :deep(span),
.login-card__submit :deep(.el-icon) {
  color: inherit;
}

.login-card__submit.is-loading {
  background: #2478ff;
  opacity: 0.85;
  color: #fff;
}

.login-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 58px;
  color: #758399;
  font-size: 14px;
}

.login-footer__dot {
  opacity: 0.4;
}

@media (max-width: 1023px) {
  .login-page {
    padding: var(--space-4) var(--space-4) 0;
  }

  .login-shell {
    grid-template-columns: 1fr;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    animation: none;
  }

  .login-visual {
    padding: var(--space-8) var(--space-8) var(--space-5);
    border-right: 0;
  }

  .login-copy {
    margin-top: var(--space-6);
  }
  .login-copy__title {
    font-size: var(--text-2xl);
    white-space: normal;
  }

  .login-visual__hero {
    min-height: 240px;
  }

  .login-visual__hero-img {
    width: min(520px, 100%);
    transform: none;
  }

  .login-form-section {
    padding: var(--space-8);
    border-top: 1px solid var(--color-border);
  }

  .login-form-wrapper {
    max-width: 100%;
  }

  .login-footer {
    padding: var(--space-3) var(--space-4) var(--space-4);
  }
}

@media (max-width: 639px) {
  .login-page {
    background: var(--color-surface);
    padding: 0;
  }

  .login-shell {
    border-radius: 0;
    box-shadow: none;
    max-width: 100%;
    animation: none;
  }

  .login-visual {
    padding: var(--space-6) var(--space-5) var(--space-4);
  }

  .login-visual__bg {
    opacity: 0.75;
  }

  .login-copy {
    margin-top: var(--space-5);
  }
  .login-copy__title {
    font-size: var(--text-xl);
  }
  .login-copy__desc {
    font-size: var(--text-sm);
  }

  .login-visual__hero {
    min-height: 200px;
  }

  .login-form-section {
    padding: var(--space-6) var(--space-5) var(--space-8);
    background: var(--color-surface);
  }

  .login-card {
    padding: 32px 24px 30px;
    box-shadow: 0 1px 8px rgba(39, 63, 97, 0.08);
  }

  .login-card__title {
    font-size: var(--text-xl);
  }

  .login-card__form :deep(.el-input__wrapper) {
    height: 44px;
  }

  .login-card__form :deep(.el-input__inner) {
    height: 44px;
  }

  .login-card__submit {
    height: 46px;
  }

  .login-footer {
    flex-direction: column;
    gap: 2px;
    height: auto;
    padding: var(--space-2) var(--space-4) var(--space-5);
  }

  .login-footer__dot {
    display: none;
  }
}

@container login-visual (max-width: 600px) {
  .login-visual__hero {
    min-height: 220px;
  }
}

@container login-visual (max-width: 400px) {
  .login-visual__hero {
    min-height: 180px;
  }
  .login-copy {
    margin-top: var(--space-4);
  }
}
</style>

<template>
  <div class="sidebar-nav">
    <div class="sidebar-nav__brand">
      <BrandLogo
        :title="siteSettingsStore.siteName"
        :subtitle="siteSettingsStore.subtitle"
        :logo="siteSettingsStore.logoUrl"
        size="lg"
      />
    </div>

    <nav ref="menuRef" class="sidebar-nav__menu" aria-label="主导航" @scroll="saveMenuScroll">
      <section v-for="group in menus" :key="group.title" class="sidebar-nav__group">
        <a
          class="sidebar-nav__group-link"
          :class="{ 'is-active': isGroupActive(group) }"
          :href="group.items[0]?.path || '#'"
          @click.prevent="navigate(group.items[0])"
        >
          <el-icon class="sidebar-nav__group-icon">
            <component :is="group.items[0]?.icon" />
          </el-icon>
          <span>{{ group.title }}</span>
          <el-icon v-if="group.items.length > 1" class="sidebar-nav__chevron">
            <ArrowDown />
          </el-icon>
        </a>

        <ul v-if="group.items.length > 1" class="sidebar-nav__children">
          <li v-for="item in group.items" :key="item.label">
            <a
              class="sidebar-nav__child"
              :class="{ 'is-active': isActive(item) }"
              :href="item.path || '#'"
              @click.prevent="navigate(item)"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </section>
    </nav>

    <div v-if="profile" class="sidebar-nav__footer">
      <div class="sidebar-nav__profile">
        <div class="sidebar-nav__avatar" :style="{ background: profile.color || 'var(--color-accent)' }">
          {{ profile.initial || profile.name?.[0] || 'U' }}
        </div>
        <div class="sidebar-nav__profile-text">
          <div class="sidebar-nav__profile-name">{{ profile.name }}</div>
          <div class="sidebar-nav__profile-role">{{ profile.role }}</div>
        </div>
      </div>
      <button class="sidebar-nav__logout" type="button" aria-label="退出登录" title="退出登录" @click="emit('logout')">
        <el-icon><SwitchButton /></el-icon>
        <span>退出登录</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { BrandLogo } from '../visuals'
import { useSiteSettingsStore } from '../../stores/siteSettings'

const MENU_SCROLL_KEY = 'shuxia-sidebar-menu-scroll-top'

defineProps({
  menus: { type: Array, required: true },
  profile: { type: Object, default: null },
})

const emit = defineEmits(['logout'])

const route = useRoute()
const router = useRouter()
const menuRef = ref(null)
const siteSettingsStore = useSiteSettingsStore()

function isActive(item) {
  return Boolean(item.active || (item.path && route.path === item.path))
}

function isGroupActive(group) {
  return group.items.some((item) => isActive(item))
}

function navigate(item) {
  saveMenuScroll()
  if (item?.path) router.push(item.path)
}

function saveMenuScroll() {
  sessionStorage.setItem(MENU_SCROLL_KEY, String(menuRef.value?.scrollTop || 0))
}

onMounted(() => {
  restoreMenuScroll()
})

onBeforeUnmount(saveMenuScroll)
onBeforeRouteUpdate(() => {
  saveMenuScroll()
  restoreMenuScroll()
})

function restoreMenuScroll() {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (menuRef.value) {
        menuRef.value.scrollTop = Number(sessionStorage.getItem(MENU_SCROLL_KEY) || 0)
      }
    })
  })
}
</script>

<style scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 16px 20px;
}

.sidebar-nav__brand {
  padding: 0 2px 18px;
}

.sidebar-nav__brand :deep(.brand-logo__icon) {
  width: 40px;
  height: 40px;
  border-radius: 9px;
}

.sidebar-nav__brand :deep(.brand-logo__title) {
  font-size: var(--admin-text-brand-title);
  font-weight: 800;
  line-height: 1.05;
}

.sidebar-nav__brand :deep(.brand-logo__subtitle) {
  margin-top: 5px;
  font-size: var(--admin-text-brand-subtitle);
  color: #596a86;
}

.sidebar-nav__menu {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0;
}

.sidebar-nav__group + .sidebar-nav__group {
  margin-top: 12px;
}

.sidebar-nav__group-link {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  color: #12214a;
  font-size: 14px;
  font-weight: 700;
  transition: background var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out);
}

.sidebar-nav__group-link:hover,
.sidebar-nav__group-link.is-active {
  background: #eaf2ff;
  color: #176bff;
}

.sidebar-nav__group-icon {
  font-size: 17px;
  color: currentColor;
}

.sidebar-nav__chevron {
  margin-left: auto;
  font-size: 12px;
  color: currentColor;
}

.sidebar-nav__children {
  position: relative;
  margin: 8px 0 0 20px;
  padding-left: 20px;
}

.sidebar-nav__children::before {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #d9e2f1;
  content: '';
}

.sidebar-nav__child {
  display: block;
  padding: 5px 8px;
  border-radius: 5px;
  color: #51617f;
  font-size: 13px;
  line-height: 1.35;
  transition: background var(--duration-base) var(--ease-out), color var(--duration-base) var(--ease-out);
}

.sidebar-nav__child:hover,
.sidebar-nav__child.is-active {
  background: #edf4ff;
  color: #176bff;
  font-weight: 700;
}

.sidebar-nav__footer {
  display: grid;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dfe7f3;
  border-radius: 7px;
  background: #fff;
}

.sidebar-nav__profile {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sidebar-nav__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #fff;
  font-size: 0;
  flex-shrink: 0;
  background-image:
    linear-gradient(135deg, rgba(15, 23, 42, 0.15), rgba(15, 23, 42, 0.05)),
    radial-gradient(circle at 52% 32%, #f4c7a1 0 18%, transparent 19%),
    linear-gradient(180deg, #17233f 0 100%);
}

.sidebar-nav__profile-name {
  font-size: 13px;
  font-weight: 700;
  color: #1b2a4f;
  white-space: nowrap;
}

.sidebar-nav__profile-role {
  display: inline-block;
  margin-top: 3px;
  padding: 1px 5px;
  border-radius: 3px;
  background: #eaf2ff;
  color: #176bff;
  font-size: 11px;
  font-weight: 600;
}

.sidebar-nav__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 34px;
  border: 1px solid #d9e4f4;
  border-radius: 5px;
  background: #f7faff;
  color: #2f4270;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition:
    background var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out),
    color var(--duration-base) var(--ease-out);
}

.sidebar-nav__logout:hover {
  border-color: #fecaca;
  background: #fff5f5;
  color: #dc2626;
}

.sidebar-nav__logout:active {
  background: #fee2e2;
}

.sidebar-nav__logout:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.32);
  outline-offset: 2px;
}
</style>

<template>
  <div
    class="app-shell"
    :class="{
      'app-shell--sidebar-open': sidebarOpen && isMobile,
      'app-shell--with-sidebar': hasSidebar,
    }"
  >
    <aside v-if="hasSidebar && $slots.sidebar" class="app-shell__sidebar">
      <div ref="sidebarInnerRef" class="app-shell__sidebar-inner" @scroll="saveSidebarScroll">
        <slot name="sidebar" />
      </div>
    </aside>

    <div
      v-if="hasSidebar && isMobile && sidebarOpen"
      class="app-shell__scrim"
      @click="closeSidebar"
    />

    <button
      v-if="hasSidebar && isMobile && !$slots.topbar"
      class="app-shell__floating-menu-btn"
      type="button"
      aria-label="打开菜单"
      @click="toggleSidebar"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <main class="app-shell__main">
      <header v-if="$slots.topbar" class="app-shell__topbar">
        <button
          v-if="hasSidebar && isMobile"
          class="app-shell__menu-btn"
          type="button"
          aria-label="打开菜单"
          @click="toggleSidebar"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <slot name="topbar" />
      </header>

      <div class="app-shell__content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
/**
 * AppShell - 主框架布局
 *
 * 提供 sidebar + main 整体结构：
 * - 桌面端：sidebar 固定，main 自适应
 * - 移动端：sidebar 抽屉式（带遮罩），需配合 useBreakpoint 触发
 *
 * 用法:
 *   <AppShell>
 *     <template #sidebar><SidebarNav /></template>
 *     <template #topbar><PageHeader ... /></template>
 *     <DashboardContent />
 *   </AppShell>
 *
 * 不需要 sidebar 的页面：
 *   <AppShell :with-sidebar="false">
 *     <PageHeader ... />
 *     <Content />
 *   </AppShell>
 */
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useBreakpoint } from '../../composables/useBreakpoint.js'

const SIDEBAR_SCROLL_KEY = 'shuxia-sidebar-shell-scroll-top'

const props = defineProps({
  /** 移动端断点阈值 */
  mobileBreakpoint: { type: Number, default: 1024 },
  /** 是否启用 sidebar */
  withSidebar: { type: Boolean, default: true },
  /** 初始 sidebar 状态（移动端默认关闭） */
  defaultOpen: { type: Boolean, default: true },
})

const { width } = useBreakpoint()
const sidebarOpen = ref(props.defaultOpen)
const sidebarInnerRef = ref(null)

const isMobile = computed(() => width.value < props.mobileBreakpoint)
const hasSidebar = computed(() => props.withSidebar)

watch(
  isMobile,
  (nextIsMobile) => {
    sidebarOpen.value = nextIsMobile ? false : props.defaultOpen
  },
  { immediate: true }
)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function saveSidebarScroll() {
  sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebarInnerRef.value?.scrollTop || 0))
}

function restoreSidebarScroll() {
  nextTick(() => {
    if (sidebarInnerRef.value) {
      sidebarInnerRef.value.scrollTop = Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || 0)
    }
  })
}

defineExpose({ toggleSidebar, closeSidebar })

onMounted(restoreSidebarScroll)
onBeforeUnmount(saveSidebarScroll)
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: var(--admin-sidebar-width, 218px) minmax(0, 1fr);
  min-height: 100vh;
  background: #f6f9ff;
}

.app-shell__sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid #e8eef7;
  background: rgba(255, 255, 255, 0.96);
  overflow: hidden;
}

.app-shell__sidebar-inner {
  height: 100%;
  overflow-y: auto;
}

.app-shell__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-shell__topbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-shell__content {
  flex: 1;
  padding: 0;
  min-width: 0;
}

.app-shell__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-2);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
}

.app-shell__menu-btn:hover {
  border-color: var(--color-border-2);
  color: var(--color-text-1);
}

.app-shell__floating-menu-btn {
  display: none;
}

.app-shell__scrim {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 50;
  animation: scrim-in var(--duration-base) var(--ease-out);
}

@keyframes scrim-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============ 移动端 ============ */
@media (max-width: 1023px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-shell__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 60;
    transform: translateX(-100%);
    transition: transform var(--duration-base) var(--ease-out);
    box-shadow: var(--shadow-lg);
  }

  .app-shell--sidebar-open .app-shell__sidebar {
    transform: translateX(0);
  }

  .app-shell__content {
    padding: 0;
  }

  .app-shell__floating-menu-btn {
    position: fixed;
    top: 14px;
    right: 14px;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid #dbe5f4;
    border-radius: var(--admin-radius-control);
    background: rgba(255, 255, 255, 0.92);
    color: #17366f;
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(35, 56, 118, 0.12);
    backdrop-filter: blur(10px);
  }

  .app-shell--sidebar-open .app-shell__floating-menu-btn {
    display: none;
  }
}
</style>

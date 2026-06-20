<template>
  <AppShell>
    <template #sidebar>
      <SidebarNav :menus="menus" :profile="profile" @logout="handleLogout" />
    </template>

    <div class="resource-shell">
      <header class="resource-shell__top">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>

        <div v-if="status" class="resource-shell__status">
          <span>NAS名称:</span>
          <strong>{{ status.nasName }}</strong>
          <span class="resource-status-pill"><i />{{ status.status }}</span>
          <span>{{ status.time }}</span>
          <el-button class="resource-icon-button" :icon="RefreshRight" aria-label="刷新" />
        </div>
      </header>

      <div class="resource-shell__command">
        <nav v-if="tabs.length" class="resource-tabs" aria-label="资源管理标签">
          <button
            v-for="(tab, index) in tabs"
            :key="tab"
            :class="{ active: index === activeTab }"
            type="button"
            @click="$emit('tab-change', index)"
          >
            {{ tab }}
          </button>
        </nav>

        <div class="resource-actions">
          <el-button
            v-for="action in actions"
            :key="action.label"
            :type="action.type || 'default'"
            :icon="action.icon"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="$emit('action', action)"
          >
            {{ action.label }}
          </el-button>
        </div>
      </div>

      <slot />

      <footer class="resource-shell__footer">
        <span>{{ siteSettingsStore.footerText }}</span>
        <span>{{ siteSettingsStore.version }}</span>
      </footer>
    </div>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshRight } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { useSiteSettingsStore } from '../../stores/siteSettings'
import { AppShell } from '../layout'
import SidebarNav from '../nav/SidebarNav.vue'
import { createSideMenus } from '../../config/navigation'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  activeMenu: { type: String, default: '' },
  tabs: { type: Array, default: () => [] },
  actions: { type: Array, default: () => [] },
  activeTab: { type: Number, default: 0 },
  status: { type: Object, default: null },
})

defineEmits(['action', 'tab-change'])

const router = useRouter()
const authStore = useAuthStore()
const siteSettingsStore = useSiteSettingsStore()
const menus = computed(() => createSideMenus(props.activeMenu))
const profile = computed(() => {
  const user = authStore.userInfo

  if (!user) return null

  const name = user.realname || user.username || '用户'

  return {
    name,
    role: user.username === 'admin' ? '超级管理员' : '管理员',
    initial: name.slice(0, 1),
    color: 'var(--color-accent)',
  }
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.resource-shell {
  min-height: 100vh;
  padding: var(--admin-page-padding-y) var(--admin-page-padding-x) var(--admin-page-padding-bottom);
  color: var(--admin-text);
}

.resource-shell__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.resource-shell__top h1 {
  margin: 0 0 10px;
  color: var(--admin-title);
  font-size: var(--admin-text-page-title);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0;
}

.resource-shell__top p {
  margin: 0;
  color: var(--admin-text-muted);
  font-size: var(--admin-text-md);
}

.resource-shell__status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  color: #42578c;
  font-size: var(--admin-text-sm);
  white-space: nowrap;
}

.resource-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #bbf7d0;
  border-radius: var(--admin-radius-control);
  background: #ecfdf5;
  color: #16a34a;
  font-weight: 700;
}

.resource-status-pill i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.resource-icon-button {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: var(--admin-radius-control);
}

.resource-shell__command {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-top: var(--admin-gap-page-command);
}

.resource-tabs {
  display: flex;
  align-items: flex-end;
  gap: 34px;
  min-height: 42px;
  border-bottom: 1px solid transparent;
}

.resource-tabs button {
  position: relative;
  height: 42px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #334a80;
  cursor: pointer;
  font-size: var(--admin-text-md);
  font-weight: 700;
}

.resource-tabs button.active {
  color: #0b7cff;
}

.resource-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--admin-primary);
  content: '';
}

.resource-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.resource-actions :deep(.el-button) {
  height: 40px;
  padding: 0 18px;
  border-radius: var(--admin-radius-control);
  font-weight: 700;
}

.resource-actions :deep(.el-button--primary) {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  box-shadow: var(--admin-shadow-primary);
}

.resource-shell__footer {
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: 18px;
  color: #496099;
  font-size: var(--admin-text-sm);
}

.resource-shell__footer span:last-child {
  position: absolute;
  right: 0;
}

@media (max-width: 980px) {
  .resource-shell {
    padding: var(--admin-page-padding-mobile-y) var(--admin-page-padding-mobile-x);
  }

  .resource-shell__top,
  .resource-shell__command,
  .resource-shell__status {
    align-items: flex-start;
    flex-direction: column;
  }

  .resource-tabs,
  .resource-actions {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
  }
}
</style>

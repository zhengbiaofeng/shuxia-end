<template>
  <aside class="sidebar">
    <AppLogo size="small" subtitle="私有数字内容库" />

    <div class="sidebar__groups">
      <section v-for="group in menus" :key="group.title" class="sidebar__group">
        <h3 class="sidebar__title">{{ group.title }}</h3>
        <button
          v-for="item in group.items"
          :key="item.label"
          class="sidebar__item"
          :class="{ 'is-active': item.active }"
          type="button"
          :aria-current="item.active ? 'page' : undefined"
          @click="handleMenuClick(item)"
        >
          <span class="sidebar__icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="sidebar__label">{{ item.label }}</span>
        </button>
      </section>
    </div>

    <footer class="sidebar__footer">
      <div class="sidebar__footer-main">
        <div class="sidebar__avatar">{{ avatarText }}</div>
        <div>
          <div class="sidebar__name">{{ profile.name }}</div>
          <div class="sidebar__role">{{ profile.role }}</div>
        </div>
      </div>
      <button class="sidebar__logout" type="button" @click="emit('logout')">
        <el-icon><SwitchButton /></el-icon>
        <span>退出</span>
      </button>
    </footer>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { SwitchButton } from '@element-plus/icons-vue';
import AppLogo from '../AppLogo.vue';

const props = defineProps({
  menus: {
    type: Array,
    required: true,
  },
  profile: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['logout']);
const router = useRouter();
const avatarText = computed(() => props.profile.name?.slice(0, 1) || '管');

function handleMenuClick(item) {
  if (!item?.path) {
    return;
  }

  router.push(item.path);
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  min-height: calc(100vh - 48px);
  padding: var(--space-5) var(--space-4);
  border-right: 1px solid var(--color-border);
  background: var(--gradient-sidebar);
}

.sidebar__groups {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-7);
}

.sidebar__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__title {
  margin: 0 0 2px;
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: var(--color-text-2);
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar__item:hover {
  background: var(--color-accent-bg-hover);
  color: var(--color-accent);
}

.sidebar__item.is-active {
  background: var(--color-accent-bg-strong);
  color: var(--color-accent);
  font-weight: var(--weight-semibold);
}

.sidebar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  font-size: var(--text-md);
}

.sidebar__label {
  font-size: var(--text-sm);
  text-align: left;
}

.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.sidebar__footer-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sidebar__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--gradient-slate);
  color: var(--color-text-on-accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
}

.sidebar__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-1);
}

.sidebar__role {
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--color-accent-soft);
}

.sidebar__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  color: var(--color-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar__logout:hover {
  border-color: var(--color-border-2);
  background: var(--color-surface-3);
  color: var(--color-text-1);
}

@media (max-width: 1280px) {
  .sidebar {
    width: 100%;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
}
</style>

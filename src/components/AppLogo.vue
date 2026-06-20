<template>
  <div class="app-logo" :class="sizeClass">
    <div class="app-logo__icon">
      <div class="app-logo__book"></div>
    </div>
    <div class="app-logo__text">
      <strong>{{ title }}</strong>
      <span>{{ subtitle }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: '书匣',
  },
  subtitle: {
    type: String,
    default: '私有数字内容库',
  },
  size: {
    type: String,
    default: 'default',
  },
});

const sizeClass = computed(() => `app-logo--${props.size}`);
</script>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.app-logo__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--gradient-brand);
  box-shadow: 0 12px 24px var(--color-brand-glow);
}

.app-logo__book {
  position: relative;
  width: 20px;
  height: 16px;
  border-radius: 2px 5px 5px 2px;
  background: linear-gradient(180deg, var(--color-brand-soft), var(--color-brand-soft-2));
}

.app-logo__book::before,
.app-logo__book::after {
  position: absolute;
  content: '';
}

.app-logo__book::before {
  left: 9px;
  top: 0;
  width: 2px;
  height: 16px;
  background: var(--color-brand-ridge);
}

.app-logo__book::after {
  left: 2px;
  right: 2px;
  bottom: 3px;
  height: 2px;
  background: var(--color-brand-edge);
}

.app-logo__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--color-text-1);
}

.app-logo__text strong {
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  line-height: 1.2;
}

.app-logo__text span {
  font-size: var(--text-xs);
  color: var(--color-text-3);
  line-height: 1.2;
}

.app-logo--small {
  gap: var(--space-2);
}

.app-logo--small .app-logo__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
}

.app-logo--small .app-logo__text strong {
  font-size: var(--text-sm);
}

.app-logo--small .app-logo__text span {
  font-size: 11px;
}
</style>

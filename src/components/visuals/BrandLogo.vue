<template>
  <div class="brand-logo" :class="`brand-logo--${size}`">
    <div class="brand-logo__icon" aria-hidden="true">
      <img v-if="logo" :src="logo" alt="" class="brand-logo__image" />
      <svg v-else viewBox="0 0 32 32" :width="iconSize" :height="iconSize">
        <path
          d="M6 6h7.5a4.5 4.5 0 0 1 4.5 4.5V26a3 3 0 0 0-3-3H6V6z"
          fill="var(--color-text-on-accent)"
          opacity="0.95"
        />
        <path
          d="M26 6h-7.5a4.5 4.5 0 0 0-4.5 4.5V26a3 3 0 0 1 3-3h9V6z"
          fill="var(--color-text-on-accent)"
          opacity="0.75"
        />
      </svg>
    </div>
    <div class="brand-logo__text">
      <h1 class="brand-logo__title">{{ title }}</h1>
      <p v-if="subtitle" class="brand-logo__subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * BrandLogo - 品牌标识
 *
 * 用法:
 *   <BrandLogo title="书匣" subtitle="Shuxia" />
 *   <BrandLogo title="书匣" size="sm" />
 */
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '书匣' },
  subtitle: { type: String, default: 'Shuxia' },
  logo: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})

const iconSize = computed(() => {
  if (props.size === 'sm') return 20
  if (props.size === 'lg') return 36
  return 28
})
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-logo__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-accent) 100%);
  box-shadow: 0 4px 12px var(--shadow-color-accent);
  flex-shrink: 0;
  overflow: hidden;
}

.brand-logo__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-logo--sm .brand-logo__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
}

.brand-logo--md .brand-logo__icon {
  width: 48px;
  height: 48px;
}

.brand-logo--lg .brand-logo__icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
}

.brand-logo__text {
  display: flex;
  flex-direction: column;
  line-height: var(--leading-tight);
  min-width: 0;
}

.brand-logo__title {
  margin: 0;
  color: var(--color-text-1);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
}

.brand-logo--sm .brand-logo__title { font-size: var(--text-md); }
.brand-logo--md .brand-logo__title { font-size: var(--text-lg); }
.brand-logo--lg .brand-logo__title { font-size: var(--text-2xl); }

.brand-logo__subtitle {
  margin: 2px 0 0;
  color: var(--color-text-3);
  font-weight: var(--weight-regular);
  letter-spacing: 0;
}

.brand-logo--sm .brand-logo__subtitle { font-size: 11px; }
.brand-logo--md .brand-logo__subtitle { font-size: var(--text-xs); }
.brand-logo--lg .brand-logo__subtitle { font-size: var(--text-sm); }
</style>

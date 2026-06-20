<template>
  <header class="page-header" :class="`page-header--${size}`">
    <div class="page-header__text">
      <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      <slot name="meta" />
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
/**
 * PageHeader - 页面统一头部
 *
 * 用法:
 *   <PageHeader title="首页概览" subtitle="今日数据" :eyebrow="'控制台'">
 *     <template #actions>
 *       <el-button>导出</el-button>
 *     </template>
 *   </PageHeader>
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.page-header__text {
  flex: 1;
  min-width: 0;
}

.page-header__eyebrow {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-accent);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.page-header__title {
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-1);
}

.page-header__subtitle {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-3);
  line-height: var(--leading-snug);
  max-width: 64ch;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

/* ============ 尺寸变体 ============ */
.page-header--sm .page-header__title {
  font-size: var(--text-2xl);
}
.page-header--sm {
  margin-bottom: var(--space-4);
}

.page-header--lg .page-header__title {
  font-size: var(--text-4xl);
}
.page-header--lg {
  margin-bottom: var(--space-8);
}

/* ============ 响应式 ============ */
@media (max-width: 639px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .page-header__actions {
    margin-top: var(--space-3);
  }
  .page-header__title {
    font-size: var(--text-2xl);
  }
}
</style>

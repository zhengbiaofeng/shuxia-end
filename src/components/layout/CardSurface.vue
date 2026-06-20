<template>
  <section
    class="card-surface"
    :class="[
      `card-surface--${variant}`,
      { 'card-surface--interactive': interactive },
    ]"
  >
    <header v-if="title || $slots.header" class="card-surface__header">
      <div class="card-surface__header-text">
        <slot name="header">
          <h3 class="card-surface__title">{{ title }}</h3>
          <p v-if="subtitle" class="card-surface__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.extra" class="card-surface__extra">
        <slot name="extra" />
      </div>
    </header>

    <div class="card-surface__body" :class="{ 'card-surface__body--flush': flush }">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="card-surface__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
/**
 * CardSurface - 统一卡片容器
 *
 * 用法:
 *   <CardSurface title="今日新增" subtitle="2024-01-01">
 *     <div>内容</div>
 *     <template #extra>
 *       <el-button text>查看</el-button>
 *     </template>
 *     <template #footer>
 *       <small>更新时间：刚刚</small>
 *     </template>
 *   </CardSurface>
 */
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'flat', 'outline', 'elevated'].includes(v),
  },
  interactive: { type: Boolean, default: false },
  /** body 区域无内边距（用于表格等内容贴近边缘） */
  flush: { type: Boolean, default: false },
})
</script>

<style scoped>
.card-surface {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-out);
}

.card-surface--default {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.card-surface--flat {
  border: 1px solid var(--color-border);
  box-shadow: none;
}

.card-surface--outline {
  border: 1px solid var(--color-border-2);
  box-shadow: none;
  background: transparent;
}

.card-surface--elevated {
  border: 0;
  box-shadow: var(--shadow-md);
}

.card-surface--interactive {
  cursor: pointer;
}

.card-surface--interactive:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--color-border-2);
}

.card-surface__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.card-surface__header-text {
  flex: 1;
  min-width: 0;
}

.card-surface__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text-1);
}

.card-surface__subtitle {
  margin: var(--space-1) 0 0;
  font-size: var(--text-xs);
  color: var(--color-text-3);
}

.card-surface__extra {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.card-surface__body {
  padding: var(--space-5) var(--space-6);
}

.card-surface__body--flush {
  padding: 0;
}

.card-surface__footer {
  padding: var(--space-3) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
  font-size: var(--text-xs);
  color: var(--color-text-3);
}
</style>

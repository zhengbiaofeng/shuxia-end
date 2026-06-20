<template>
  <div
    class="responsive-stage"
    :class="`responsive-stage--${name}`"
    :style="stageStyle"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * ResponsiveStage - 容器查询包装器
 *
 * 任何"视觉场景"（hero 插图、插画、复杂绝对定位布局）
 * 都应该用 ResponsiveStage 包裹，子元素使用 cqw/cqh 单位自适应。
 *
 * 用法:
 *   <ResponsiveStage name="hero" :base-width="900" aspect="9/5">
 *     <div class="book" :style="{ left: '8cqw', width: '12cqw' }" />
 *   </ResponsiveStage>
 *
 * 父级约束:
 *   - 提供最大宽度（默认 1440px）
 *   - 容器随父元素宽度变化
 * 子元素使用:
 *   - cqw / cqh 单位
 *   - @container name (...) {} 媒体查询
 */
import { computed } from 'vue'

const props = defineProps({
  /** 容器名（用于 @container 查询时定位） */
  name: { type: String, default: 'stage' },
  /** 设计稿基准宽度（用于子元素 cqw 换算的参考值） */
  baseWidth: { type: Number, default: 1440 },
  /** 宽高比，例如 '16/9'、'9/5'，不传则高度自适应内容 */
  aspect: { type: String, default: null },
  /** 最大宽度，数值或 CSS 长度 */
  maxWidth: { type: [Number, String], default: 1440 },
  /** 最小高度 */
  minHeight: { type: [Number, String], default: null },
  /** 水平对齐方式 */
  align: {
    type: String,
    default: 'center',
    validator: (v) => ['left', 'center', 'right'].includes(v),
  },
})

const stageStyle = computed(() => ({
  '--stage-base-w': `${props.baseWidth}`,
  maxWidth: typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth,
  aspectRatio: props.aspect,
  minHeight:
    typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight,
  marginInline: props.align === 'center' ? 'auto' : '0',
  marginLeft: props.align === 'right' ? 'auto' : undefined,
  marginRight: props.align === 'left' ? 'auto' : undefined,
}))
</script>

<style scoped>
.responsive-stage {
  position: relative;
  width: 100%;
  container-type: inline-size;
  /* 子元素需要时可通过 cqw/cqh 引用 */
}

.responsive-stage--hero {
  container-name: hero;
}
.responsive-stage--login {
  container-name: login;
}
.responsive-stage--dashboard {
  container-name: dashboard;
}
.responsive-stage--books {
  container-name: books;
}
</style>

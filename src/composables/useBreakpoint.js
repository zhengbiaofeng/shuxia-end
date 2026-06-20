/**
 * useBreakpoint - 响应式断点检测
 *
 * 用于需要 JS 联动的场景（侧边栏折叠、模态框、canvas 尺寸等）。
 * 80% 的响应式应通过 CSS 容器查询解决，仅在需要 JS 时使用此 composable。
 *
 * 用法：
 *   const { isMobile, isDesktop, width } = useBreakpoint()
 *   watch(isMobile, v => v ? closeSidebar() : openSidebar())
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { breakpoints } from './breakpoints.config'

export function useBreakpoint() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 900)

  let rafId = null
  function update() {
    rafId = null
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  function onResize() {
    if (rafId !== null) return
    rafId = requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', onResize, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  const isMobile  = computed(() => width.value < breakpoints.sm)
  const isTablet  = computed(() => width.value >= breakpoints.sm && width.value < breakpoints.md)
  const isDesktop = computed(() => width.value >= breakpoints.md)
  const isWide    = computed(() => width.value >= breakpoints.lg)
  const isXl      = computed(() => width.value >= breakpoints.xl)
  const is2xl     = computed(() => width.value >= breakpoints['2xl'])

  // 当前断点名称
  const current = computed(() => {
    if (is2xl.value) return '2xl'
    if (isXl.value) return 'xl'
    if (isWide.value) return 'lg'
    if (isDesktop.value) return 'md'
    if (isTablet.value) return 'sm'
    return 'xs'
  })

  return {
    width,
    height,
    current,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isXl,
    is2xl,
  }
}

/**
 * useMatchMedia - 监听单个媒体查询
 *
 * const isMobile = useMatchMedia('(max-width: 639px)')
 */
export function useMatchMedia(query) {
  const matches = ref(false)

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    matches.value = mql.matches
    const handler = (e) => { matches.value = e.matches }
    mql.addEventListener('change', handler)
    onBeforeUnmount(() => mql.removeEventListener('change', handler))
  })

  return matches
}

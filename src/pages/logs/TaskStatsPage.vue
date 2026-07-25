<template>
  <ResourceShell
    :actions="page.actions"
    :active-menu="page.activeMenu"
    :active-tab="1"
    :tabs="page.tabs"
    :title="page.title"
    :subtitle="page.subtitle"
    @action="handleAction"
    @tab-change="handleTabChange"
  >
    <div v-loading="loading" class="stats-page">
      <ResourceMetricGrid :items="page.metrics" />

      <section class="stats-grid">
        <article class="stats-card stats-card--wide">
          <header class="stats-card__header">
            <span>近 7 天完成趋势</span>
            <span class="chart-legend">
              <i v-for="series in chartSeries" :key="series.key"><b :style="{ background: series.color }" />{{ series.label }}</i>
            </span>
          </header>
          <div v-if="hasTrendData" class="line-chart">
            <svg viewBox="0 0 560 230" role="img" aria-label="近七天任务完成趋势">
              <g class="grid-lines">
                <template v-for="tick in chartTicks" :key="tick.y">
                  <line x1="42" :y1="tick.y" x2="542" :y2="tick.y" />
                  <text x="34" :y="tick.y + 4" text-anchor="end">{{ tick.label }}</text>
                </template>
              </g>
              <g v-for="series in plottedSeries" :key="series.key">
                <polyline :points="series.points" :style="{ stroke: series.color }" />
                <circle
                  v-for="point in series.circles"
                  :key="`${series.key}-${point.label}`"
                  :cx="point.x"
                  :cy="point.y"
                  r="3"
                  :style="{ fill: series.color }"
                >
                  <title>{{ point.label }} {{ series.label }} {{ point.value }}</title>
                </circle>
              </g>
              <g class="x-labels">
                <text v-for="label in chartLabels" :key="label.text" :x="label.x" y="222" text-anchor="middle">{{ label.text }}</text>
              </g>
            </svg>
          </div>
          <p v-else class="stats-empty">近 7 天暂无完成任务</p>
        </article>

        <article class="stats-card">
          <header>任务类型分布</header>
          <div v-if="typeTotal" class="donut">
            <div class="donut__ring">
              <svg viewBox="0 0 140 140" role="img" aria-label="任务类型分布">
                <circle class="donut__track" cx="70" cy="70" r="54" />
                <circle
                  v-for="segment in donutSegments"
                  :key="segment.key"
                  class="donut__segment"
                  cx="70"
                  cy="70"
                  r="54"
                  :style="segment.style"
                />
                <text class="donut__value" x="70" y="67" text-anchor="middle">{{ typeTotal }}</text>
                <text class="donut__label" x="70" y="86" text-anchor="middle">总任务数</text>
              </svg>
            </div>
            <ul>
              <li v-for="item in typeLegend" :key="item.key">
                <i :style="{ background: item.color }" />{{ item.label }}
              </li>
            </ul>
          </div>
          <p v-else class="stats-empty">暂无任务类型统计</p>
        </article>

        <article class="stats-card">
          <header>每日完成量</header>
          <div
            v-if="bars.length"
            class="bar-chart"
            :style="{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }"
          >
            <span v-for="bar in bars" :key="bar.label" :style="{ '--h': bar.height, '--c': bar.color }">
              <i />{{ bar.label }}
            </span>
          </div>
          <p v-else class="stats-empty">暂无趋势数据</p>
        </article>
      </section>

      <section class="stats-tables">
        <AdminTableCard :columns="typeColumns" :rows="page.typeRows" min-width="720px" :pagination="false" />
        <AdminTableCard :columns="trendColumns" :rows="page.durationRows" min-width="620px" :pagination="false" />
      </section>
    </div>
  </ResourceShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { AdminTableCard } from '../../components/admin'
import ResourceMetricGrid from '../../components/resource/ResourceMetricGrid.vue'
import ResourceShell from '../../components/resource/ResourceShell.vue'
import { fetchTaskStatsPage } from '../../api/adminModules'
import { logPages } from '../../config/adminModules'

const page = reactive({
  ...logPages.stats,
  actions: [{ label: '刷新', icon: Refresh, permission: 'sxbook:taskStats:summary' }],
  metrics: [],
  typeRows: [],
  durationRows: [],
  trend: null,
})
const router = useRouter()
const loading = ref(false)
const colors = ['#1476ff', '#f59e0b', '#14b8a6', '#8b5cf6', '#f43f5e', '#94a3b8']
const chartSeries = [
  { key: 'completedCount', label: '完成', color: '#1476ff' },
  { key: 'successCount', label: '成功', color: '#16a34a' },
  { key: 'failCount', label: '失败', color: '#ef4444' },
]
const typeTotal = computed(() => page.typeRows.reduce((total, row) => total + Number(row.totalValue || 0), 0))
const typeLegend = computed(() => page.typeRows.map((row, index) => ({
  key: row.key || row.type,
  label: `${row.type} ${row.total}`,
  color: colors[index % colors.length],
})))
const donutSegments = computed(() => {
  const circumference = 2 * Math.PI * 54
  let offset = 0
  return page.typeRows.flatMap((row, index) => {
    const value = Number(row.totalValue || 0)
    if (!value || !typeTotal.value) return []
    const length = (value / typeTotal.value) * circumference
    const segment = {
      key: row.key || row.type,
      style: {
        stroke: colors[index % colors.length],
        strokeDasharray: `${length} ${circumference - length}`,
        strokeDashoffset: -offset,
      },
    }
    offset += length
    return [segment]
  })
})
const rawTrendPoints = computed(() => (Array.isArray(page.trend?.points) ? page.trend.points : []))
const trendMax = computed(() => Math.max(1, ...rawTrendPoints.value.flatMap((point) => (
  chartSeries.map((series) => Number(point[series.key] || 0))
))))
const hasTrendData = computed(() => rawTrendPoints.value.some((point) => chartSeries.some((series) => Number(point[series.key] || 0) > 0)))
const chartTicks = computed(() => Array.from({ length: 5 }, (_, index) => {
  const value = Math.round((trendMax.value * (4 - index)) / 4)
  return { y: 20 + index * 42.5, label: value }
}))
const chartLabels = computed(() => rawTrendPoints.value.map((point, index, list) => ({
  text: point.dateLabel || '--',
  x: chartX(index, list.length),
})))
const plottedSeries = computed(() => chartSeries.map((series) => {
  const circles = rawTrendPoints.value.map((point, index, list) => {
    const value = Number(point[series.key] || 0)
    return {
      x: chartX(index, list.length),
      y: 190 - (value / trendMax.value) * 170,
      value,
      label: point.dateLabel || '--',
    }
  })
  return { ...series, circles, points: circles.map((point) => `${point.x},${point.y}`).join(' ') }
}))
const bars = computed(() => {
  const rows = page.durationRows
  const max = Math.max(...rows.map((row) => Number(String(row.count).replace(/,/g, ''))), 0)

  return rows.map((row, index) => ({
    label: row.range,
    height: max ? `${Math.max((Number(String(row.count).replace(/,/g, '')) / max) * 100, 8)}%` : '8%',
    color: colors[index % colors.length],
  }))
})
const typeColumns = [
  { key: 'type', label: '任务类型' },
  { key: 'total', label: '总任务数' },
  { key: 'success', label: '成功数' },
  { key: 'failed', label: '失败数' },
  { key: 'rate', label: '成功率' },
  { key: 'avg', label: '近期完成' },
]
const trendColumns = [
  { key: 'range', label: '日期' },
  { key: 'count', label: '完成数' },
  { key: 'success', label: '成功数' },
  { key: 'failed', label: '失败数' },
  { key: 'ratio', label: '成功率' },
]

async function loadTaskStats() {
  loading.value = true
  try {
    const data = await fetchTaskStatsPage()
    page.metrics = data.metrics
    page.typeRows = data.typeRows
    page.durationRows = data.durationRows
    page.trend = data.trend
  } catch (error) {
    page.metrics = []
    page.typeRows = []
    page.durationRows = []
    page.trend = null
    ElMessage.error(error.message || '获取任务统计失败')
  } finally {
    loading.value = false
  }
}

function chartX(index, count) {
  if (count <= 1) return 292
  return 42 + (index / (count - 1)) * 500
}

function handleAction() {
  loadTaskStats()
}

function handleTabChange(index) {
  router.push(index === 0 ? '/logs/tasks' : '/logs/tasks/stats')
}

onMounted(loadTaskStats)
</script>

<style scoped>
.stats-page {
  display: grid;
  gap: 22px;
}

.stats-grid,
.stats-tables {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 0.9fr;
  gap: 16px;
}

.stats-tables {
  grid-template-columns: 1.15fr 0.85fr;
}

.stats-card {
  min-height: 250px;
  padding: 20px;
  border: 1px solid var(--admin-panel-border);
  border-radius: var(--admin-radius-card);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-card);
}

.stats-card header {
  margin-bottom: 14px;
  color: #102557;
  font-size: var(--admin-text-section);
  font-weight: var(--admin-weight-strong);
}

.stats-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  color: #52668f;
  font-size: 12px;
  font-weight: 500;
}

.chart-legend i {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-style: normal;
}

.chart-legend b {
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.line-chart svg {
  width: 100%;
  height: 210px;
}

.grid-lines line {
  stroke: #edf2fa;
}

.grid-lines text,
.x-labels text {
  fill: #7a89ad;
  font-size: 10px;
}

.line-chart polyline {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.donut {
  display: flex;
  align-items: center;
  gap: 18px;
}

.donut__ring {
  width: 148px;
  height: 148px;
  flex: 0 0 auto;
}

.donut__ring svg {
  width: 100%;
  height: 100%;
}

.donut__track,
.donut__segment {
  fill: none;
  stroke-width: 16;
}

.donut__track {
  stroke: #edf2fa;
}

.donut__segment {
  transform: rotate(-90deg);
  transform-origin: 70px 70px;
}

.donut__value {
  fill: #102557;
  font-size: 22px;
  font-weight: 800;
}

.donut__label {
  fill: #50679b;
  font-size: 11px;
}

.donut ul {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #40558f;
  font-size: 13px;
}

.donut li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.donut i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bar-chart {
  display: grid;
  align-items: end;
  gap: 14px;
  height: 190px;
  padding-top: 14px;
}

.bar-chart span {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 8px;
  color: #50679b;
  font-size: 12px;
}

.bar-chart i {
  flex: 0 0 auto;
  width: 28px;
  height: var(--h);
  border-radius: 6px 6px 0 0;
  background: var(--c);
}

.stats-empty {
  display: grid;
  place-items: center;
  min-height: 180px;
  margin: 0;
  color: #7a89ad;
  font-size: 13px;
}

@media (max-width: 1180px) {
  .stats-grid,
  .stats-tables {
    grid-template-columns: 1fr;
  }
}
</style>

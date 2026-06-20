<template>
  <article class="info-list-card">
    <h2>{{ title }}</h2>
    <dl>
      <div v-for="item in items" :key="item[0]">
        <dt>{{ item[0] }}</dt>
        <dd>
          <span :class="{ 'is-link-value': link }">{{ item[1] }}</span>
          <el-icon v-if="link"><Link /></el-icon>
        </dd>
      </div>
    </dl>
  </article>
</template>

<script setup>
import { Link } from '@element-plus/icons-vue'

defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] },
  link: { type: Boolean, default: false },
})
</script>

<style scoped>
.info-list-card {
  padding: 20px;
  border: 1px solid rgba(219, 229, 244, 0.86);
  border-radius: var(--admin-radius-card);
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: var(--admin-shadow-card);
}

.info-list-card h2 {
  margin: 0 0 16px;
  color: #102557;
  font-size: var(--admin-text-card-title);
  font-weight: var(--admin-weight-strong);
  line-height: 1.25;
}

.info-list-card dl {
  display: grid;
  gap: 2px;
  margin: 0;
}

.info-list-card div {
  display: grid;
  grid-template-columns: minmax(86px, 0.5fr) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  min-height: 36px;
  padding: 7px 0;
}

.info-list-card div + div {
  border-top: 1px solid rgba(231, 236, 247, 0.82);
}

.info-list-card dt,
.info-list-card dd {
  margin: 0;
  font-size: var(--admin-text-sm);
}

.info-list-card dt {
  color: var(--admin-text-muted);
  line-height: 1.35;
}

.info-list-card dd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  color: #243b73;
  font-weight: var(--admin-weight-semibold);
  line-height: 1.35;
}

.info-list-card span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-list-card span.is-link-value {
  color: var(--admin-primary);
}

.info-list-card :deep(.el-icon) {
  flex: 0 0 auto;
  color: #5f75a8;
}

@media (max-width: 560px) {
  .info-list-card {
    padding: 16px;
  }

  .info-list-card div {
    grid-template-columns: 1fr;
    gap: 5px;
    align-items: start;
  }
}
</style>

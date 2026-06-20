<template>
  <section class="admin-info-box">
    <h2 v-if="title">
      <el-icon v-if="icon"><component :is="icon" /></el-icon>
      {{ title }}
    </h2>
    <div class="admin-info-box__grid">
      <p v-for="item in items" :key="item">{{ item }}</p>
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  items: { type: Array, default: () => [] },
})
</script>

<style scoped>
.admin-info-box {
  padding: 16px 22px;
  border: 1px solid #bdd8ff;
  border-radius: var(--admin-radius-card);
  background: linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(255, 255, 255, 0.98));
  color: #50669c;
}

.admin-info-box h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  color: #153673;
  font-size: var(--admin-text-md);
  font-weight: var(--admin-weight-strong);
}

.admin-info-box h2 .el-icon {
  color: var(--admin-primary);
}

.admin-info-box__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 44px;
}

.admin-info-box p {
  position: relative;
  margin: 0;
  padding-left: 12px;
  font-size: var(--admin-text-sm);
  line-height: 1.45;
}

.admin-info-box p::before {
  position: absolute;
  top: 8px;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6b83ba;
  content: '';
}

@media (max-width: 760px) {
  .admin-info-box__grid {
    grid-template-columns: 1fr;
  }
}
</style>

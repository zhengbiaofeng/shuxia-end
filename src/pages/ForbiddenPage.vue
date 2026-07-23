<template>
  <main class="forbidden-page">
    <section>
      <span>403</span>
      <h1>没有访问权限</h1>
      <p>当前账号未获得该模块权限，请联系系统管理员调整角色授权。</p>
      <el-button type="primary" @click="goHome">返回可访问首页</el-button>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}
</script>

<style scoped>
.forbidden-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: #f4f7fc;
  color: #102557;
}

.forbidden-page section {
  width: min(100%, 480px);
  text-align: center;
}

.forbidden-page span {
  display: block;
  color: var(--admin-primary);
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
}

.forbidden-page h1 {
  margin: 18px 0 10px;
  font-size: 26px;
}

.forbidden-page p {
  margin: 0 0 24px;
  color: #65759a;
  line-height: 1.7;
}
</style>

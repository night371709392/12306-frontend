<template>
  <nav class="navbar glass">
    <div class="navbar__inner">
      <!-- Logo -->
      <router-link to="/ticketSearch" class="navbar__logo">
        <span class="navbar__logo-mark">≡</span>
        <span class="navbar__logo-text">12306</span>
      </router-link>

      <!-- Links -->
      <div class="navbar__links">
        <router-link to="/ticketSearch" class="navbar__link" active-class="navbar__link--active">
          车票查询
        </router-link>
        <template v-if="auth.isLoggedIn">
          <router-link to="/passenger" class="navbar__link" active-class="navbar__link--active">
            乘车人
          </router-link>
          <router-link to="/orderList" class="navbar__link" active-class="navbar__link--active">
            订单
          </router-link>
          <router-link to="/userInfo" class="navbar__link" active-class="navbar__link--active">
            账户
          </router-link>
        </template>
      </div>

      <!-- Right side -->
      <div class="navbar__aside">
        <ClockDisplay />
        <template v-if="auth.isLoggedIn">
          <span class="navbar__user">{{ auth.realName || auth.username }}</span>
          <button class="navbar__btn" @click="handleLogout">退出</button>
        </template>
        <router-link v-else to="/login" class="navbar__btn navbar__btn--login">
          登录
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ClockDisplay from './ClockDisplay.vue'

const router = useRouter()
const auth = useAuthStore()

async function handleLogout() {
  await auth.doLogout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: var(--s-md);
  z-index: 100;
  margin: var(--s-md) auto;
  max-width: 1200px;
  border-radius: var(--r-xl);
  padding: 0 var(--s-lg);
}

.navbar__inner {
  display: flex;
  align-items: center;
  height: 52px;
  gap: var(--s-lg);
}

/* Logo */
.navbar__logo {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  text-decoration: none;
  flex-shrink: 0;
}
.navbar__logo-mark {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-white);
  letter-spacing: -0.02em;
}
.navbar__logo-text {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--c-text);
  letter-spacing: 0.04em;
}

/* Links */
.navbar__links {
  display: flex;
  gap: var(--s-xs);
  flex: 1;
}
.navbar__link {
  padding: 6px 14px;
  border-radius: var(--r-md);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--c-text-dim);
  text-decoration: none;
  transition: all var(--dur-fast) var(--ease-out);
  letter-spacing: 0.02em;
}
.navbar__link:hover {
  color: var(--c-text);
  background: rgba(255,255,255,0.04);
}
.navbar__link--active {
  color: var(--c-slate);
  background: var(--c-slate-bg);
}

/* Aside */
.navbar__aside {
  display: flex;
  align-items: center;
  gap: var(--s-md);
  flex-shrink: 0;
}
.navbar__user {
  font-size: 0.78rem;
  color: var(--c-text-dim);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.navbar__btn {
  padding: 5px 14px;
  border-radius: var(--r-md);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--c-text-dim);
  background: transparent;
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  letter-spacing: 0.02em;
}
.navbar__btn:hover {
  color: var(--c-white);
  border-color: var(--c-border-lt);
  background: rgba(255,255,255,0.04);
}
.navbar__btn--login {
  color: var(--c-text);
  border-color: var(--c-accent-dim);
}

@media (max-width: 768px) {
  .navbar__links { display: none; }
  .navbar__user { display: none; }
}
</style>

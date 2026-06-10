<template>
  <div class="login-page">
    <!-- Decorative grid -->
    <div class="login-page__grid"></div>

    <div class="login-card glass">
      <!-- Tab toggle -->
      <div class="login-card__tabs">
        <button
          :class="['login-card__tab', { 'login-card__tab--active': mode === 'login' }]"
          @click="mode = 'login'"
        >登录</button>
        <button
          :class="['login-card__tab', { 'login-card__tab--active': mode === 'register' }]"
          @click="mode = 'register'"
        >注册</button>
      </div>

      <!-- Login form -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="login-card__form">
        <div class="field">
          <label class="field__label">用户名 / 手机 / 邮箱</label>
          <input v-model="loginForm.usernameOrMailOrPhone" type="text" placeholder="admin" />
        </div>
        <div class="field">
          <label class="field__label">密码</label>
          <input v-model="loginForm.password" type="password" placeholder="••••••" />
        </div>
        <p v-if="loginError" class="login-card__error">{{ loginError }}</p>
        <button type="submit" class="btn-primary" :disabled="logging">
          {{ logging ? '登录中…' : '登录' }}
        </button>
      </form>

      <!-- Register form -->
      <form v-else @submit.prevent="handleRegister" class="login-card__form">
        <div class="field">
          <label class="field__label">用户名</label>
          <input v-model="regForm.username" type="text" placeholder="设置用户名" />
        </div>
        <div class="field">
          <label class="field__label">密码</label>
          <input v-model="regForm.password" type="password" placeholder="设置密码" />
        </div>
        <div class="field">
          <label class="field__label">真实姓名</label>
          <input v-model="regForm.realName" type="text" placeholder="请输入姓名" />
        </div>
        <div class="field">
          <label class="field__label">身份证号</label>
          <input v-model="regForm.idCard" type="text" placeholder="18位身份证号" />
        </div>
        <div class="field">
          <label class="field__label">手机号</label>
          <input v-model="regForm.phone" type="text" placeholder="11位手机号" />
        </div>
        <div class="field">
          <label class="field__label">邮箱</label>
          <input v-model="regForm.mail" type="email" placeholder="example@mail.com" />
        </div>
        <p v-if="regError" class="login-card__error">{{ regError }}</p>
        <button type="submit" class="btn-primary" :disabled="registering">
          {{ registering ? '注册中…' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { register as registerApi } from '@/api'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const mode = ref('login')
const logging = ref(false)
const registering = ref(false)
const loginError = ref('')
const regError = ref('')

const loginForm = reactive({
  usernameOrMailOrPhone: '',
  password: ''
})

const regForm = reactive({
  username: '',
  password: '',
  realName: '',
  idCard: '',
  phone: '',
  mail: ''
})

async function handleLogin() {
  loginError.value = ''
  if (!loginForm.usernameOrMailOrPhone || !loginForm.password) {
    loginError.value = '请填写完整信息'
    return
  }
  logging.value = true
  try {
    const res = await auth.login(loginForm)
    if (res.success) {
      const redirect = route.query.redirect || '/ticketSearch'
      router.push(redirect)
    } else {
      loginError.value = res.message || '登录失败'
    }
  } catch {
    loginError.value = '网络错误，请稍后重试'
  } finally {
    logging.value = false
  }
}

async function handleRegister() {
  regError.value = ''
  const { username, password, realName, idCard, phone, mail } = regForm
  if (!username || !password || !realName || !idCard || !phone) {
    regError.value = '请填写必填字段'
    return
  }
  registering.value = true
  try {
    const res = await registerApi({ ...regForm, idType: 0, userType: 0, verifyState: 0, postCode: '', address: '', region: '0' })
    if (res.success) {
      mode.value = 'login'
      loginForm.usernameOrMailOrPhone = username
      loginError.value = ''
    } else {
      regError.value = res.message || '注册失败'
    }
  } catch {
    regError.value = '网络错误，请稍后重试'
  } finally {
    registering.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--c-bg);
}

.login-page__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%);
}

.login-card {
  position: relative;
  width: 420px;
  max-width: 90vw;
  padding: var(--s-xl) var(--s-lg);
  animation: cardIn 0.6s var(--ease-out);
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.login-card__tabs {
  display: flex;
  gap: 2px;
  background: var(--c-bg-card);
  border-radius: var(--r-md);
  padding: 3px;
  margin-bottom: var(--s-lg);
}
.login-card__tab {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--c-text-dim);
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  letter-spacing: 0.03em;
}
.login-card__tab--active {
  background: var(--c-bg-raised);
  color: var(--c-white);
}

.login-card__form {
  display: flex;
  flex-direction: column;
  gap: var(--s-md);
}

.field__label {
  display: block;
  font-size: 0.72rem;
  color: var(--c-text-muted);
  margin-bottom: var(--s-xs);
  letter-spacing: 0.03em;
  font-weight: 500;
}
.field input {
  width: 100%;
}

.login-card__error {
  font-size: 0.78rem;
  color: var(--c-err);
  text-align: center;
  padding: var(--s-sm);
  background: var(--c-red-bg);
  border-radius: var(--r-sm);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--c-white);
  color: var(--c-bg);
  border: none;
  border-radius: var(--r-md);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
</style>

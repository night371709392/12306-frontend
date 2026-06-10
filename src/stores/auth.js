import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem('token') || '')
  const username = ref(sessionStorage.getItem('username') || '')
  const userId = ref(sessionStorage.getItem('userId') || '')
  const realName = ref(sessionStorage.getItem('realName') || '')

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t, u, id, rn) {
    token.value = t
    username.value = u
    userId.value = id
    realName.value = rn || u
    sessionStorage.setItem('token', t)
    sessionStorage.setItem('username', u)
    sessionStorage.setItem('userId', id)
    sessionStorage.setItem('realName', realName.value)
  }

  async function login(credentials) {
    const res = await loginApi(credentials)
    if (res.success && res.data) {
      setAuth(
        res.data.accessToken,
        res.data.username,
        res.data.userId,
        res.data.realName
      )
    }
    return res
  }

  async function doLogout() {
    try { await logoutApi() } catch {}
    token.value = ''
    username.value = ''
    userId.value = ''
    realName.value = ''
    sessionStorage.clear()
  }

  return { token, username, userId, realName, isLoggedIn, setAuth, login, doLogout }
})

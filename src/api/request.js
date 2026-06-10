import axios from 'axios'
import router from '@/router'

const http = axios.create({
  // 开发环境用相对路径 /api（走 Vite proxy）
  // 生产环境通过环境变量 VITE_API_BASE 指定后端地址
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = token
  return config
})

http.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      sessionStorage.clear()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default http

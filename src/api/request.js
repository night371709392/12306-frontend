import axios from 'axios'
import router from '@/router'

const http = axios.create({
  baseURL: '/api',
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

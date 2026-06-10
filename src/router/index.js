import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/ticketSearch'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/ticketSearch',
    name: 'ticketSearch',
    component: () => import('@/views/TicketSearch.vue'),
    meta: { title: '车票查询' }
  },
  {
    path: '/buyTicket',
    name: 'buyTicket',
    component: () => import('@/views/BuyTicket.vue'),
    meta: { auth: true, title: '购买车票' }
  },
  {
    path: '/order',
    name: 'order',
    component: () => import('@/views/OrderDetail.vue'),
    meta: { auth: true, title: '订单详情' }
  },
  {
    path: '/orderList',
    name: 'orderList',
    component: () => import('@/views/OrderList.vue'),
    meta: { auth: true, title: '订单列表' }
  },
  {
    path: '/myTicket',
    name: 'myTicket',
    component: () => import('@/views/MyTicket.vue'),
    meta: { auth: true, title: '我的车票' }
  },
  {
    path: '/passenger',
    name: 'passenger',
    component: () => import('@/views/PassengerList.vue'),
    meta: { auth: true, title: '乘车人' }
  },
  {
    path: '/addPassenger',
    name: 'addPassenger',
    component: () => import('@/views/AddPassenger.vue'),
    meta: { auth: true, title: '添加乘车人' }
  },
  {
    path: '/userInfo',
    name: 'userInfo',
    component: () => import('@/views/UserInfo.vue'),
    meta: { auth: true, title: '用户信息' }
  },
  {
    path: '/paySuccess',
    name: 'paySuccess',
    component: () => import('@/views/PaySuccess.vue'),
    meta: { auth: true, title: '支付成功' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('token')

  if (to.meta.auth && !token) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  if (to.meta.guest && token) {
    return next({ name: 'ticketSearch' })
  }

  document.title = (to.meta.title ? to.meta.title + ' · ' : '') + '12306 铁路购票'
  next()
})

export default router

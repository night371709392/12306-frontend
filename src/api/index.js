import http from './request'

// ── Auth ──
export const login = data => http.post('/user-service/v1/login', data)
export const register = data => http.post('/user-service/register', data)
export const checkLogin = token => http.get('/user-service/check-login', { params: { accessToken: token } })
export const logout = () => http.get('/user-service/logout')

// ── User ──
export const getUserInfo = params => http.get('/user-service/query', { params })
export const hasUsername = username => http.get('/user-service/has-username', { params: { username } })
export const updateUser = data => http.post('/user-service/update', data)

// ── Passenger ──
export const getPassengerList = () => http.get('/user-service/passenger/query')
export const addPassenger = data => http.post('/user-service/passenger/save', data)
export const updatePassenger = data => http.post('/user-service/passenger/update', data)
export const removePassenger = data => http.post('/user-service/passenger/remove', data)

// ── Station & Region ──
export const getAllStations = () => http.get('/ticket-service/station/all')
export const getRegionStation = params => http.get('/ticket-service/region-station/query', { params })
export const getTrainStation = params => http.get('/ticket-service/train-station/query', { params })

// ── Ticket ──
export const searchTickets = params => http.get('/ticket-service/ticket/query', { params })
export const buyTicket = data => http.post('/ticket-service/ticket/purchase/v2', data)
export const cancelTicket = data => http.post('/ticket-service/ticket/cancel', data)
export const refundTicket = data => http.post('/ticket-service/ticket/refund', data)

// ── Order ──
export const getOrderBySn = params => http.get('/order-service/order/ticket/query', { params })
export const getOrderPage = params => http.get('/order-service/order/ticket/page', { params })
export const getMyTickets = params => http.get('/order-service/order/ticket/self/page', { params })

// ── Pay ──
export const createPay = data => http.post('/pay-service/pay/create', data)
export const getPayStatus = params => http.get('/pay-service/pay/query/order-sn', { params })
export const wechatPaySuccess = params => http.post('/pay-service/pay/wechat/success', null, { params })

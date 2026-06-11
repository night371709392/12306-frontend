<template>
  <AppLayout>
    <div class="page">
      <div class="success-box">
        <div class="success-icon">&#10003;</div>
        <h2>支付成功</h2>
        <p class="dim">您的订单已支付，请按时乘车</p>

        <div class="info-panel glass" v-if="orderSn">
          <div class="info-panel__row">
            <span class="dim" style="font-size:0.7rem">订单编号</span>
            <span class="mono">{{ orderSn }}</span>
          </div>
          <div class="info-panel__row" v-if="trainNumber">
            <span class="dim" style="font-size:0.7rem">车次</span>
            <span class="mono">{{ trainNumber }}</span>
          </div>
          <div class="info-panel__row" v-if="departure && arrival">
            <span class="dim" style="font-size:0.7rem">行程</span>
            <span>{{ departure }} → {{ arrival }}</span>
          </div>
          <div class="info-panel__row" v-if="amount">
            <span class="dim" style="font-size:0.7rem">金额</span>
            <span class="mono">¥{{ amount }}</span>
          </div>
        </div>

        <div class="actions">
          <router-link to="/orderList" class="primary-btn">查看订单</router-link>
          <router-link to="/ticketSearch" class="sec-btn">继续购票</router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { getOrderBySn } from '@/api'

const route = useRoute()
const orderSn = ref(route.query.orderSn || '')
const trainNumber = ref(route.query.trainNumber || '')
const departure = ref(route.query.departure || '')
const arrival = ref(route.query.arrival || '')
const amount = ref(route.query.amount || '')

const yuan = (fen) => ((Number(fen) || 0) / 100).toFixed(2)

onMounted(async () => {
  if (orderSn.value && !trainNumber.value) {
    try {
      const res = await getOrderBySn({ orderSn: orderSn.value })
      if (res.success && res.data) {
        trainNumber.value = res.data.trainNumber || ''
        departure.value = res.data.departure || ''
        arrival.value = res.data.arrival || ''
        const totalFen = (res.data.passengerDetails || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
        amount.value = totalFen ? yuan(totalFen) : ''
      }
    } catch {}
  }
})
</script>

<style scoped>
.success-box { max-width: 480px; margin: 0 auto; text-align: center; padding-top: var(--s-3xl); }

.success-icon { width: 72px; height: 72px; margin: 0 auto var(--s-lg); display: flex; align-items: center; justify-content: center; border: 2px solid var(--c-green); border-radius: 50%; color: var(--c-green); font-size: 2rem; background: var(--c-green-bg); }

h2 { margin-bottom: var(--s-sm); }

.info-panel { margin-top: var(--s-xl); padding: var(--s-lg); text-align: left; }
.info-panel__row { display: flex; justify-content: space-between; align-items: center; padding: var(--s-sm) 0; border-bottom: 1px solid var(--c-border); }
.info-panel__row:last-child { border-bottom: none; }

.actions { display: flex; gap: var(--s-md); margin-top: var(--s-xl); justify-content: center; }
.primary-btn { padding: var(--s-md) var(--s-xl); background: var(--c-white); color: var(--c-bg); border-radius: var(--r-md); font-size: 0.85rem; font-weight: 600; text-decoration: none; letter-spacing: 0.03em; transition: all var(--dur-fast); }
.primary-btn:hover { opacity: 0.85; }
.sec-btn { padding: var(--s-md) var(--s-xl); border: 1px solid var(--c-border); color: var(--c-text-dim); border-radius: var(--r-md); font-size: 0.85rem; text-decoration: none; transition: all var(--dur-fast); }
.sec-btn:hover { color: var(--c-white); border-color: var(--c-border-lt); }
</style>

<template>
  <AppLayout>
    <div class="page">
      <div class="order-header">
        <router-link to="/orderList" class="back-link">← 订单列表</router-link>
        <h2>订单详情</h2>
      </div>

      <div v-if="loading" class="loading">加载中…</div>

      <template v-if="order && !loading">
        <!-- Status -->
        <div class="status-bar glass">
          <span class="status-bar__sn mono">{{ order.orderSn }}</span>
          <span :class="['status-badge', statusClass]">{{ statusMap[order.status] || order.status }}</span>
        </div>

        <!-- Countdown for unpaid -->
        <div v-if="order.status === 0" class="countdown glass">
          <span class="countdown__icon">⏱</span>
          <span>请在 <strong class="mono">{{ countdownStr }}</strong> 内完成支付</span>
        </div>

        <!-- Train info -->
        <div class="info-card card">
          <h3 class="info-card__title">行程信息</h3>
          <div class="info-card__route">
            <div class="info-card__station">
              <div class="mono" style="font-size:1.3rem;font-weight:600">{{ order.departureTime || '--' }}</div>
              <div>{{ order.departure }}</div>
            </div>
            <div class="info-card__line">
              <span class="mono dim">{{ order.trainNumber }}</span>
            </div>
            <div class="info-card__station info-card__station--end">
              <div class="mono" style="font-size:1.3rem;font-weight:600">{{ order.arrivalTime || '--' }}</div>
              <div>{{ order.arrival }}</div>
            </div>
          </div>
        </div>

        <!-- Passengers -->
        <div class="info-card card" v-if="passengers.length">
          <h3 class="info-card__title">乘车人</h3>
          <div v-for="p in passengers" :key="p.id" class="pax-row">
            <span>{{ p.realName }}</span>
            <span class="dim mono" style="font-size:0.72rem">{{ p.idCard }}</span>
            <span class="mono dim" style="margin-left:auto">¥{{ yuan(p.amount) }}</span>
          </div>
        </div>

        <!-- Total -->
        <div class="total-bar glass" v-if="totalAmountFen">
          <span>合计</span>
          <span class="mono" style="font-size:1.3rem;font-weight:600">¥{{ yuan(totalAmountFen) }}</span>
        </div>

        <!-- Actions -->
        <div class="actions" v-if="order.status === 0">
          <button class="pay-btn" @click="showPayModal = true" :disabled="paying">
            {{ paying ? '支付中…' : '去支付' }}
          </button>
          <button class="cancel-btn" @click="handleCancel" :disabled="canceling">
            {{ canceling ? '取消中…' : '取消订单' }}
          </button>
        </div>

        <!-- Payment modal -->
        <div v-if="showPayModal" class="modal-overlay" @click.self="showPayModal = false">
          <div class="modal glass">
            <h3 class="modal__title">选择支付方式</h3>
            <div class="pay-options">
              <div
                v-for="ch in payChannels"
                :key="ch.value"
                :class="['pay-option', { 'pay-option--selected': payChannel === ch.value }]"
                @click="payChannel = ch.value"
              >
                <span class="pay-option__icon">{{ ch.icon }}</span>
                <span>{{ ch.label }}</span>
              </div>
            </div>
            <button class="pay-btn" @click="doPay" :disabled="paying" style="width:100%;margin-top:var(--s-lg)">
              ¥{{ yuan(totalAmountFen) }} 确认支付
            </button>
            <button class="cancel-btn" @click="showPayModal = false" style="width:100%;margin-top:var(--s-sm)">关闭</button>
          </div>
        </div>
      </template>

      <p v-if="!loading && !order" class="empty">订单未找到</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { getOrderBySn, cancelTicket, createPay, getPayStatus, wechatPaySuccess } from '@/api'

const route = useRoute()

const order = ref(null)
const passengers = ref([])
const loading = ref(true)
const paying = ref(false)
const canceling = ref(false)
const showPayModal = ref(false)
const payChannel = ref(0)

const payChannels = [
  { value: 0, label: '支付宝', icon: '支' },
  { value: 1, label: '微信支付', icon: '微' },
  { value: 2, label: '银行卡', icon: '银' },
]

const statusMap = { 0:'待支付', 10:'已支付', 20:'已进站', 30:'已取消', 40:'已退票', 50:'已改签' }

// Backend amounts are in cents (分). Convert to yuan for display.
const yuan = (fen) => ((Number(fen) || 0) / 100).toFixed(2)
// Order detail has no top-level total; sum the per-passenger amounts (in cents).
const totalAmountFen = computed(() =>
  passengers.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
)
const statusClass = computed(() => {
  const s = order.value?.status
  if (s === 0) return 'status-badge--amber'
  if (s === 10) return 'status-badge--green'
  if (s === 20 || s === 50) return 'status-badge--blue'
  if (s === 30 || s === 40) return 'status-badge--red'
  return 'status-badge--slate'
})

// Countdown
const countdownSec = ref(600)
const countdownStr = ref('10:00')
let countdownTimer
function startCountdown(sec) {
  countdownSec.value = sec
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdownSec.value <= 0) { clearInterval(countdownTimer); return }
    countdownSec.value--
    const m = Math.floor(countdownSec.value / 60)
    const s = String(countdownSec.value % 60).padStart(2, '0')
    countdownStr.value = `${m}:${s}`
  }, 1000)
}

onMounted(async () => {
  const sn = route.query.orderSn
  if (!sn) { loading.value = false; return }
  try {
    const res = await getOrderBySn({ orderSn: sn })
    if (res.success && res.data) {
      order.value = res.data
      if (res.data.passengerDetails) passengers.value = res.data.passengerDetails
      // Status lives inside passengerDetails, not at the top level. Surface it.
      if (order.value.status == null && passengers.value.length) {
        order.value.status = passengers.value[0].status
      }
      if (order.value.status === 0) startCountdown(600)
    }
  } catch {} finally { loading.value = false }
})

onUnmounted(() => clearInterval(countdownTimer))

async function handleCancel() {
  if (!confirm('确认取消此订单？')) return
  canceling.value = true
  try {
    await cancelTicket({ orderSn: order.value.orderSn })
    order.value.status = 30
  } catch {} finally { canceling.value = false }
}

async function doPay() {
  paying.value = true
  try {
    // 微信支付：项目未对接真实微信渠道，调用后端模拟支付成功接口完成真实状态流转
    if (payChannel.value === 1) {
      const payload = {
        channel: 0,
        tradeType: 0,
        orderSn: order.value.orderSn,
        totalAmount: totalAmountFen.value,
        outOrderSn: order.value.orderSn,
        subject: '12306火车票'
      }
      await createPay(payload)
      const wxRes = await wechatPaySuccess({ orderSn: order.value.orderSn })
      if (wxRes.success) {
        order.value.status = 10
        showPayModal.value = false
      }
      return
    }
    const res = await createPay({
      channel: payChannel.value,
      tradeType: 0,
      orderSn: order.value.orderSn,
      totalAmount: totalAmountFen.value,
      outOrderSn: order.value.orderSn,
      subject: '12306火车票'
    })
    if (res.success && res.data?.body) {
      // Alipay form redirect
      document.body.innerHTML = res.data.body
      const form = document.querySelector('form')
      if (form) setTimeout(() => form.submit(), 100)
    } else {
      // Assume success
      order.value.status = 10
      showPayModal.value = false
    }
  } catch {} finally { paying.value = false }
}
</script>

<style scoped>
.order-header { display: flex; align-items: center; gap: var(--s-md); margin-bottom: var(--s-lg); }
.order-header h2 { font-size: 1.2rem; }
.back-link { font-size: 0.8rem; color: var(--c-text-dim); }
.back-link:hover { color: var(--c-white); }

.loading { text-align: center; padding: var(--s-3xl); color: var(--c-text-muted); }

.status-bar { display: flex; justify-content: space-between; align-items: center; padding: var(--s-md) var(--s-lg); margin-bottom: var(--s-md); }
.status-bar__sn { font-size: 0.78rem; color: var(--c-text-dim); letter-spacing: 0.03em; }
.status-badge { padding: 4px 14px; border-radius: var(--r-sm); font-size: 0.75rem; font-weight: 500; letter-spacing: 0.03em; }
.status-badge--amber { background: var(--c-amber-bg); color: var(--c-amber); }
.status-badge--green { background: var(--c-green-bg); color: var(--c-green); }
.status-badge--blue  { background: var(--c-blue-bg);  color: var(--c-blue); }
.status-badge--red   { background: var(--c-red-bg);   color: var(--c-red); }
.status-badge--slate { background: var(--c-slate-bg); color: var(--c-slate); }

.countdown { padding: var(--s-md) var(--s-lg); margin-bottom: var(--s-md); text-align: center; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: var(--s-sm); color: var(--c-amber); }
.countdown__icon { font-size: 1.1rem; }

.info-card { margin-bottom: var(--s-md); }
.info-card__title { font-size: 0.75rem; color: var(--c-text-muted); margin-bottom: var(--s-md); letter-spacing: 0.04em; text-transform: uppercase; }
.info-card__route { display: flex; align-items: center; gap: var(--s-md); }
.info-card__station--end { text-align: right; }
.info-card__line { flex: 1; text-align: center; }

.pax-row { display: flex; align-items: center; gap: var(--s-md); padding: var(--s-sm) 0; border-bottom: 1px solid var(--c-border); }
.pax-row:last-child { border-bottom: none; }

.total-bar { display: flex; justify-content: space-between; align-items: center; padding: var(--s-md) var(--s-lg); margin-bottom: var(--s-lg); }

.actions { display: flex; gap: var(--s-md); }
.pay-btn { flex: 1; padding: var(--s-md); background: var(--c-white); color: var(--c-bg); border: none; border-radius: var(--r-md); font-size: 0.9rem; font-weight: 600; letter-spacing: 0.04em; cursor: pointer; transition: all var(--dur-fast); }
.pay-btn:hover { opacity: 0.85; }
.pay-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.cancel-btn { padding: var(--s-md) var(--s-xl); background: transparent; border: 1px solid var(--c-border); color: var(--c-text-dim); border-radius: var(--r-md); font-size: 0.85rem; cursor: pointer; transition: all var(--dur-fast); }
.cancel-btn:hover { color: var(--c-err); border-color: var(--c-err); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 300; }
.modal { width: 420px; max-width: 90vw; padding: var(--s-xl); }
.modal__title { margin-bottom: var(--s-lg); font-size: 1rem; }
.pay-options { display: flex; flex-direction: column; gap: var(--s-sm); }
.pay-option { display: flex; align-items: center; gap: var(--s-md); padding: var(--s-md); border: 1px solid var(--c-border); border-radius: var(--r-md); cursor: pointer; transition: all var(--dur-fast); }
.pay-option:hover { border-color: var(--c-border-lt); }
.pay-option--selected { border-color: var(--c-accent-dim); background: rgba(255,255,255,0.02); }
.pay-option__icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--c-bg-raised); border-radius: var(--r-sm); font-size: 0.8rem; font-weight: 600; }

.empty { text-align: center; padding: var(--s-3xl); color: var(--c-text-dim); }
</style>

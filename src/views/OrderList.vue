<template>
  <AppLayout>
    <div class="page">
      <h2>订单列表</h2>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab', { 'tab--active': activeTab === tab.value }]"
          @click="activeTab = tab.value; page = 1; fetchOrders()"
        >{{ tab.label }}</button>
      </div>

      <div v-if="loading" class="loading">加载中…</div>

      <!-- Orders -->
      <template v-if="!loading && orders.length">
        <div v-for="o in orders" :key="o.orderSn" class="order-card card">
          <div class="order-card__header">
            <span class="mono dim" style="font-size:0.72rem">{{ o.orderSn }}</span>
            <span :class="['status-tag', statusClass(o.status)]">{{ statusMap[o.status] || o.status }}</span>
          </div>
          <div class="order-card__body">
            <div class="order-card__train">
              <span class="mono" style="font-weight:600">{{ o.trainNumber }}</span>
              <span class="dim" style="font-size:0.72rem">{{ o.departure }} → {{ o.arrival }}</span>
            </div>
            <div class="order-card__info">
              <span class="dim" style="font-size:0.72rem">{{ o.departureTime }} / {{ o.ridingDate || '--' }}</span>
              <span class="mono" style="margin-left:auto">¥{{ yuan(o.amountFen) }}</span>
            </div>
          </div>
          <div class="order-card__actions">
            <router-link :to="`/order?orderSn=${o.orderSn}`" class="action-link">查看详情</router-link>
            <button
              v-if="o.status === 0"
              class="action-btn action-btn--warn"
              @click="cancelOrder(o)"
            >取消</button>
            <button
              v-if="o.status === 10"
              class="action-btn action-btn--ok"
              @click="refundOrder(o)"
            >退票</button>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="total > pageSize">
          <button :disabled="page <= 1" @click="page--; fetchOrders()">上一页</button>
          <span class="dim mono" style="font-size:0.78rem">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
          <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchOrders()">下一页</button>
        </div>
      </template>

      <div v-if="!loading && !orders.length" class="empty">
        <p class="dim">暂无订单</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { getOrderPage, cancelTicket, refundTicket } from '@/api'

const yuan = (fen) => ((Number(fen) || 0) / 100).toFixed(2)

const tabs = [
  { value: 0, label: '未支付' },
  { value: 1, label: '未出行' },
  { value: 2, label: '历史订单' },
]
const activeTab = ref(0)
const orders = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

const statusMap = { 0:'待支付', 10:'已支付', 11:'部分退款', 12:'已退款', 20:'已进站', 30:'已取消', 40:'已退票', 50:'已改签' }
function statusClass(s) {
  if (s === 0) return 'status-tag--amber'
  if (s === 10) return 'status-tag--green'
  if (s === 20 || s === 50) return 'status-tag--blue'
  if (s === 30 || s === 40) return 'status-tag--red'
  return 'status-tag--slate'
}

async function fetchOrders() {
  loading.value = true
  const userId = sessionStorage.getItem('userId')
  try {
    const res = await getOrderPage({ userId, current: page.value, size: pageSize, statusType: activeTab.value })
    if (res.success && res.data) {
      // Status and amount live inside passengerDetails, not at the top level. Flatten them.
      orders.value = (res.data.records || []).map(o => {
        const pax = o.passengerDetails || []
        const amountFen = pax.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        const status = pax.length ? pax[0].status : o.status
        return { ...o, status, amountFen, ridingDate: o.ridingDate || o.departureDate }
      })
      total.value = res.data.total || 0
    }
  } catch {} finally { loading.value = false }
}

async function cancelOrder(o) {
  if (!confirm('确认取消订单？')) return
  try {
    await cancelTicket({ orderSn: o.orderSn })
    o.status = 30
  } catch {}
}

async function refundOrder(o) {
  if (!confirm('确认退票？')) return
  try {
    // 整单退票：type=1 表示全部退款，后端退款成功后通过 MQ 将订单状态流转为 12(已退款)
    const res = await refundTicket({ orderSn: o.orderSn, type: 1, subOrderRecordIdReqList: [] })
    if (res.success) {
      o.status = 12
    }
  } catch {}
}

onMounted(fetchOrders)
</script>

<style scoped>
h2 { margin-bottom: var(--s-md); }

.tabs { display: flex; gap: var(--s-xs); margin-bottom: var(--s-lg); }
.tab { padding: 8px 20px; border: 1px solid var(--c-border); border-radius: var(--r-md); background: transparent; color: var(--c-text-dim); font-size: 0.8rem; cursor: pointer; transition: all var(--dur-fast); letter-spacing: 0.03em; }
.tab:hover { color: var(--c-text); border-color: var(--c-border-lt); }
.tab--active { color: var(--c-white); border-color: var(--c-accent-dim); background: rgba(255,255,255,0.03); }

.loading { text-align: center; padding: var(--s-3xl); color: var(--c-text-muted); }

.order-card { margin-bottom: var(--s-md); }
.order-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-md); }
.order-card__body { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-md); }
.order-card__train { display: flex; flex-direction: column; gap: 2px; }
.order-card__actions { display: flex; gap: var(--s-sm); justify-content: flex-end; padding-top: var(--s-sm); border-top: 1px solid var(--c-border); }
.action-link { font-size: 0.78rem; color: var(--c-text-dim); text-decoration: none; padding: 4px 12px; border-radius: var(--r-sm); }
.action-link:hover { color: var(--c-white); }
.action-btn { padding: 4px 14px; border-radius: var(--r-sm); font-size: 0.75rem; border: none; cursor: pointer; }
.action-btn--warn { background: rgba(212,167,106,0.1); color: var(--c-warn); }
.action-btn--ok { background: rgba(192,106,106,0.1); color: var(--c-err); }
.action-btn--warn:hover { background: rgba(212,167,106,0.2); }
.action-btn--ok:hover { background: rgba(192,106,106,0.2); }

.status-tag { padding: 2px 10px; border-radius: var(--r-sm); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.03em; }
.status-tag--amber { background: var(--c-amber-bg); color: var(--c-amber); }
.status-tag--green { background: var(--c-green-bg); color: var(--c-green); }
.status-tag--blue  { background: var(--c-blue-bg);  color: var(--c-blue); }
.status-tag--red   { background: var(--c-red-bg);   color: var(--c-red); }
.status-tag--slate { background: var(--c-slate-bg); color: var(--c-slate); }

.pagination { display: flex; align-items: center; justify-content: center; gap: var(--s-md); margin-top: var(--s-lg); }
.pagination button { padding: 6px 16px; border: 1px solid var(--c-border); border-radius: var(--r-md); background: transparent; color: var(--c-text-dim); cursor: pointer; font-size: 0.78rem; }
.pagination button:hover:not(:disabled) { color: var(--c-white); border-color: var(--c-border-lt); }
.pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

.empty { text-align: center; padding: var(--s-3xl); }
</style>

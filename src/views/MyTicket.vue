<template>
  <AppLayout>
    <div class="page">
      <h2>我的车票</h2>

      <div v-if="loading" class="loading">加载中…</div>

      <template v-if="!loading && tickets.length">
        <div v-for="t in tickets" :key="t.orderSn" class="ticket-card card">
          <div class="ticket-card__header">
            <span class="mono dim" style="font-size:0.72rem">{{ t.orderSn }}</span>
            <span :class="['status-tag', statusClass(t.status)]">{{ statusMap[t.status] || t.status }}</span>
          </div>
          <div class="ticket-card__route">
            <div class="ticket-card__station">
              <div class="mono" style="font-size:1.2rem;font-weight:600">{{ t.departureTime || '--' }}</div>
              <div>{{ t.departure }}</div>
            </div>
            <div class="ticket-card__line">
              <span class="mono dim" style="font-size:0.85rem">{{ t.trainNumber }}</span>
            </div>
            <div class="ticket-card__station ticket-card__station--end">
              <div class="mono" style="font-size:1.2rem;font-weight:600">{{ t.arrivalTime || '--' }}</div>
              <div>{{ t.arrival }}</div>
            </div>
          </div>
          <div class="ticket-card__meta">
            <span class="dim" style="font-size:0.7rem">{{ t.ridingDate || '--' }}</span>
            <span class="mono" style="margin-left:auto">¥{{ yuan(t.amountFen) }}</span>
          </div>
          <div class="ticket-card__actions">
            <router-link :to="`/order?orderSn=${t.orderSn}`" class="action-link">查看详情</router-link>
          </div>
        </div>

        <div class="pagination" v-if="total > pageSize">
          <button :disabled="page <= 1" @click="page--; fetchTickets()">上一页</button>
          <span class="dim mono" style="font-size:0.78rem">{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
          <button :disabled="page >= Math.ceil(total / pageSize)" @click="page++; fetchTickets()">下一页</button>
        </div>
      </template>

      <div v-if="!loading && !tickets.length" class="empty">
        <p class="dim">暂无车票</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { getMyTickets } from '@/api'

const yuan = (fen) => ((Number(fen) || 0) / 100).toFixed(2)

const tickets = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 10
const total = ref(0)

const statusMap = { 0:'待支付', 10:'已支付', 20:'已进站', 30:'已取消', 40:'已退票', 50:'已改签' }
function statusClass(s) {
  if (s === 0) return 'status-tag--amber'
  if (s === 10) return 'status-tag--green'
  if (s === 20 || s === 50) return 'status-tag--blue'
  if (s === 30 || s === 40) return 'status-tag--red'
  return 'status-tag--slate'
}

async function fetchTickets() {
  loading.value = true
  try {
    const res = await getMyTickets({ current: page.value, size: pageSize })
    if (res.success && res.data) {
      // Status and amount live inside passengerDetails, not at the top level. Flatten them.
      tickets.value = (res.data.records || []).map(t => {
        const pax = t.passengerDetails || []
        const amountFen = pax.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        const status = pax.length ? pax[0].status : t.status
        return { ...t, status, amountFen, ridingDate: t.ridingDate || t.departureDate }
      })
      total.value = res.data.total || 0
    }
  } catch {} finally { loading.value = false }
}

onMounted(fetchTickets)
</script>

<style scoped>
h2 { margin-bottom: var(--s-lg); }

.loading { text-align: center; padding: var(--s-3xl); color: var(--c-text-muted); }

.ticket-card { margin-bottom: var(--s-md); }
.ticket-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-md); }
.ticket-card__route { display: flex; align-items: center; gap: var(--s-md); margin-bottom: var(--s-sm); }
.ticket-card__station--end { text-align: right; }
.ticket-card__line { flex: 1; text-align: center; }
.ticket-card__meta { display: flex; align-items: center; margin-bottom: var(--s-sm); }
.ticket-card__actions { display: flex; justify-content: flex-end; padding-top: var(--s-sm); border-top: 1px solid var(--c-border); }

.action-link { font-size: 0.78rem; color: var(--c-text-dim); text-decoration: none; padding: 4px 12px; border-radius: var(--r-sm); }
.action-link:hover { color: var(--c-white); }

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

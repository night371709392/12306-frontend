<template>
  <AppLayout>
    <div class="page">
      <div class="buy-header">
        <button class="back-btn" @click="window.close()">← 返回</button>
        <h2>确认订单</h2>
      </div>

      <!-- Train info -->
      <div class="info-row glass">
        <div class="info-block">
          <span class="dim" style="font-size:0.68rem">车次</span>
          <span class="mono" style="font-size:1.2rem;font-weight:600">{{ route.query.trainNumber }}</span>
        </div>
        <div class="info-block">
          <span class="dim" style="font-size:0.68rem">日期</span>
          <span>{{ route.query.departureDate }}</span>
        </div>
        <div class="info-block">
          <span class="dim" style="font-size:0.68rem">出发</span>
          <span>{{ route.query.departureTime }} {{ route.query.departure }}</span>
        </div>
        <div class="info-block">
          <span class="dim" style="font-size:0.68rem">到达</span>
          <span>{{ route.query.arrivalTime }} {{ route.query.arrival }}</span>
        </div>
      </div>

      <!-- Passenger selection -->
      <section class="section">
        <h3 class="section-title">选择乘车人</h3>
        <div v-if="!passengers.length" class="empty-state">
          <p class="dim">暂未添加乘车人</p>
          <router-link to="/addPassenger" class="link-btn">+ 添加乘车人</router-link>
        </div>
        <div v-else class="passenger-list">
          <div
            v-for="p in passengers"
            :key="p.id"
            :class="['passenger-item', { 'passenger-item--selected': selectedIds.includes(p.id) }]"
            @click="togglePassenger(p.id)"
          >
            <div class="passenger-item__check">{{ selectedIds.includes(p.id) ? '●' : '○' }}</div>
            <div class="passenger-item__info">
              <span class="passenger-item__name">{{ p.realName }}</span>
              <span class="passenger-item__card dim mono">{{ p.idCard }}</span>
            </div>
            <div class="passenger-item__opts" v-if="selectedIds.includes(p.id)" @click.stop>
              <select v-model="ticketTypes[p.id]" class="mini-select">
                <option :value="0">成人票</option>
                <option :value="1">学生票</option>
              </select>
              <select v-model="seatTypes[p.id]" class="mini-select">
                <option v-for="s in availSeats" :key="s.type" :value="s.type">{{ seatMap[s.type] }} ¥{{ s.price }}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- Seat selection -->
      <section class="section" v-if="selectedIds.length && showSeatGrid">
        <h3 class="section-title">选择座位</h3>
        <p class="dim" style="font-size:0.72rem;margin-bottom:var(--s-md)">
          最多可选 {{ selectedIds.length }} 个座位（已选 {{ chooseSeats.length }}），也可跳过由系统分配
        </p>

        <div class="carriage">
          <!-- Column headers: A B C [aisle] D F -->
          <div class="carriage__head">
            <span class="carriage__rownum"></span>
            <span class="carriage__col">A</span>
            <span class="carriage__col">B</span>
            <span class="carriage__col">C</span>
            <span class="carriage__aisle">过道</span>
            <span class="carriage__col">D</span>
            <span class="carriage__col">F</span>
          </div>

          <!-- Seat rows -->
          <div v-for="r in seatRows" :key="r" class="carriage__row">
            <span class="carriage__rownum">{{ r }}</span>
            <template v-for="letter in seatCols" :key="letter">
              <span v-if="letter === '|'" class="carriage__aisle-gap"></span>
              <button
                v-else
                type="button"
                :class="['seat', {
                  'seat--selected': chooseSeats.includes(letter + r),
                  'seat--disabled': !chooseSeats.includes(letter + r) && chooseSeats.length >= selectedIds.length
                }]"
                @click="toggleSeat(letter + r)"
              >{{ letter }}</button>
            </template>
          </div>
        </div>

        <!-- Legend -->
        <div class="seat-legend">
          <span class="seat-legend__item"><i class="seat-legend__box seat-legend__box--free"></i>可选</span>
          <span class="seat-legend__item"><i class="seat-legend__box seat-legend__box--sel"></i>已选</span>
        </div>
      </section>

      <button class="submit-btn" @click="handleBuy" :disabled="!selectedIds.length || buying">
        {{ buying ? '购票中…' : `确认购买 (${selectedIds.length}人)` }}
      </button>
      <p v-if="buyError" class="error-msg">{{ buyError }}</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { getPassengerList, searchTickets, buyTicket } from '@/api'

const route = useRoute()
const router = useRouter()

const passengers = ref([])
const selectedIds = ref([])
const ticketTypes = reactive({})
const seatTypes = reactive({})
const chooseSeats = ref([])
const showSeatGrid = ref(false)
const buying = ref(false)
const buyError = ref('')

const availSeats = ref([])

const seatMap = { 0:'商务座',1:'一等座',2:'二等座',3:'动卧',4:'高级软卧',5:'一等卧',6:'二等卧',7:'软座',8:'硬座',9:'无座',10:'其他',13:'软卧' }

// 12306 二等座车厢布局：每排 A B C [过道] D F（无 E 列，与飞机一致）
const seatRows = Array.from({ length: 10 }, (_, i) => i + 1)
const seatCols = ['A', 'B', 'C', '|', 'D', 'F']

onMounted(async () => {
  try {
    const [pRes, tRes] = await Promise.all([
      getPassengerList(),
      searchTickets({
        fromStation: route.query.fromStation,
        toStation: route.query.toStation,
        departureDate: route.query.departureDate
      })
    ])
    if (pRes.success) passengers.value = pRes.data || []
    if (tRes.success) {
      const train = (tRes.data?.trainList || []).find(t => t.trainId === route.query.trainId)
      if (train) availSeats.value = train.seatClassList.filter(s => s.quantity > 0)
    }
  } catch {}
})

function togglePassenger(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
    if (selectedIds.value.length === 0) showSeatGrid.value = false
  } else {
    selectedIds.value.push(id)
    if (!ticketTypes[id]) ticketTypes[id] = 0
    if (!seatTypes[id] && availSeats.value.length) seatTypes[id] = availSeats.value[0].type
    showSeatGrid.value = true
  }
}

function toggleSeat(s) {
  const idx = chooseSeats.value.indexOf(s)
  if (idx >= 0) {
    chooseSeats.value.splice(idx, 1)
  } else {
    // 最多只能选与乘车人数量相同的座位
    if (chooseSeats.value.length >= selectedIds.value.length) return
    chooseSeats.value.push(s)
  }
}

async function handleBuy() {
  buyError.value = ''
  if (!selectedIds.value.length) return
  buying.value = true
  try {
    const passengersList = selectedIds.value.map(pid => ({
      passengerId: pid,
      seatType: seatTypes[pid] || availSeats.value[0]?.type || 2
    }))
    const res = await buyTicket({
      trainId: route.query.trainId,
      passengers: passengersList,
      chooseSeats: chooseSeats.value,
      departure: route.query.departure,
      arrival: route.query.arrival
    })
    if (res.success) {
      const orderSn = res.data?.orderSn || res.data
      router.push({ name: 'order', query: { orderSn } })
    } else {
      buyError.value = res.message || '购票失败'
    }
  } catch {
    buyError.value = '网络错误，请稍后重试'
  } finally {
    buying.value = false
  }
}
</script>

<style scoped>
.buy-header { display: flex; align-items: center; gap: var(--s-md); margin-bottom: var(--s-lg); }
.buy-header h2 { font-size: 1.2rem; }
.back-btn { background: none; border: 1px solid var(--c-border); color: var(--c-text-dim); padding: 6px 14px; border-radius: var(--r-md); font-size: 0.78rem; cursor: pointer; }
.back-btn:hover { color: var(--c-white); border-color: var(--c-border-lt); }

.info-row { display: flex; gap: var(--s-xl); padding: var(--s-md) var(--s-lg); margin-bottom: var(--s-lg); flex-wrap: wrap; }
.info-block { display: flex; flex-direction: column; gap: 2px; }

.section { margin-bottom: var(--s-lg); }
.section-title { font-size: 0.9rem; font-weight: 500; margin-bottom: var(--s-md); letter-spacing: 0.03em; }

.empty-state { text-align: center; padding: var(--s-xl); }
.link-btn { color: var(--c-accent); font-size: 0.85rem; font-weight: 500; }
.link-btn:hover { color: var(--c-white); }

/* Passenger */
.passenger-list { display: flex; flex-direction: column; gap: var(--s-sm); }
.passenger-item { display: flex; align-items: center; gap: var(--s-md); padding: var(--s-md); border: 1px solid var(--c-border); border-radius: var(--r-md); cursor: pointer; transition: all var(--dur-fast); }
.passenger-item:hover { border-color: var(--c-border-lt); }
.passenger-item--selected { border-color: var(--c-slate); background: var(--c-slate-bg); }
.passenger-item__check { font-size: 1rem; color: var(--c-slate); width: 20px; text-align: center; }
.passenger-item__info { flex: 1; }
.passenger-item__name { font-weight: 500; display: block; }
.passenger-item__card { font-size: 0.7rem; display: block; }
.passenger-item__opts { display: flex; gap: var(--s-sm); }
.mini-select { padding: 4px 8px; font-size: 0.75rem; border-radius: var(--r-sm); background: var(--c-bg); border: 1px solid var(--c-border); color: var(--c-text); }

/* Seat selection — 12306 二等座车厢样式 */
.carriage {
  max-width: 320px;
  padding: var(--s-md);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  background: var(--c-bg-raised, rgba(255,255,255,0.02));
  margin-bottom: var(--s-md);
}
.carriage__head,
.carriage__row {
  display: grid;
  grid-template-columns: 28px repeat(3, 1fr) 22px repeat(2, 1fr);
  align-items: center;
  gap: 6px;
}
.carriage__head { margin-bottom: var(--s-sm); }
.carriage__row { margin-bottom: 6px; }
.carriage__col,
.carriage__aisle {
  text-align: center;
  font-size: 0.7rem;
  color: var(--c-text-muted);
}
.carriage__rownum {
  text-align: center;
  font-size: 0.7rem;
  color: var(--c-text-muted);
}
.carriage__aisle-gap { width: 22px; }

/* 单个座位：模拟座椅外形 */
.seat {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  color: var(--c-text);
  background: var(--c-bg);
  border: 1px solid var(--c-border-lt, var(--c-border));
  border-radius: 4px 4px 7px 7px;
  border-bottom-width: 3px;
  cursor: pointer;
  transition: all var(--dur-fast);
  padding: 0;
}
.seat:hover { border-color: var(--c-slate); color: var(--c-white); }
.seat--selected {
  background: var(--c-slate);
  color: var(--c-bg);
  border-color: var(--c-slate);
}
.seat--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.seat-legend {
  display: flex;
  gap: var(--s-lg);
  font-size: 0.7rem;
  color: var(--c-text-muted);
  align-items: center;
}
.seat-legend__item { display: flex; align-items: center; gap: 6px; }
.seat-legend__box {
  width: 16px;
  height: 16px;
  border-radius: 3px 3px 5px 5px;
  border: 1px solid var(--c-border-lt, var(--c-border));
  border-bottom-width: 2px;
  display: inline-block;
}
.seat-legend__box--free { background: var(--c-bg); }
.seat-legend__box--sel { background: var(--c-slate); border-color: var(--c-slate); }

.submit-btn { width: 100%; padding: var(--s-md); background: var(--c-white); color: var(--c-bg); border: none; border-radius: var(--r-md); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.04em; cursor: pointer; transition: all var(--dur-fast); margin-top: var(--s-lg); }
.submit-btn:hover { opacity: 0.85; }
.submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.error-msg { text-align: center; color: var(--c-err); font-size: 0.8rem; margin-top: var(--s-sm); }
</style>

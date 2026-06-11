<template>
  <AppLayout>
    <div class="page">
      <!-- Hero -->
      <section class="hero">
        <h1 class="hero__title">铁路购票</h1>
        <p class="hero__sub dim">查询车次，预定行程</p>
      </section>

      <!-- Search bar -->
      <section class="search-section glass">
        <div class="search-row">
          <!-- From -->
          <div class="search-field">
            <label class="search-field__label">出发地</label>
            <div class="station-picker" ref="fromPickerRef">
              <input
                v-model="fromInput"
                @focus="fromOpen = true"
                @input="filterFrom"
                placeholder="城市 / 车站"
                class="search-field__input"
              />
              <div v-if="fromOpen && filteredFrom.length" class="station-dropdown">
                <div
                  v-for="s in filteredFrom"
                  :key="s.code"
                  class="station-dropdown__item"
                  @mousedown.prevent="selectFrom(s)"
                >
                  <span class="station-dropdown__code mono">{{ s.code }}</span>
                  <span>{{ s.name }}</span>
                  <span class="station-dropdown__region dim">{{ s.regionName }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Swap -->
          <button class="swap-btn" @click="swapStations" title="交换出发地和目的地">
            <span class="swap-btn__icon">⇄</span>
          </button>

          <!-- To -->
          <div class="search-field">
            <label class="search-field__label">目的地</label>
            <div class="station-picker">
              <input
                v-model="toInput"
                @focus="toOpen = true"
                @input="filterTo"
                placeholder="城市 / 车站"
                class="search-field__input"
              />
              <div v-if="toOpen && filteredTo.length" class="station-dropdown">
                <div
                  v-for="s in filteredTo"
                  :key="s.code"
                  class="station-dropdown__item"
                  @mousedown.prevent="selectTo(s)"
                >
                  <span class="station-dropdown__code mono">{{ s.code }}</span>
                  <span>{{ s.name }}</span>
                  <span class="station-dropdown__region dim">{{ s.regionName }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Date -->
          <div class="search-field search-field--date">
            <label class="search-field__label">出发日期</label>
            <input
              v-model="departureDate"
              type="date"
              class="search-field__input"
              :min="today"
              :max="maxDate"
            />
          </div>

          <!-- Search btn -->
          <button class="search-btn" @click="doSearch" :disabled="searching">
            {{ searching ? '查询中' : '查询' }}
          </button>
        </div>

        <!-- Error -->
        <p v-if="searchError" class="search-error">{{ searchError }}</p>
      </section>

      <!-- Date quick picks -->
      <section class="date-tabs" v-if="trains.length || hasSearched">
        <button
          v-for="d in dateOptions"
          :key="d.value"
          :class="['date-tab', { 'date-tab--active': departureDate === d.value }]"
          @click="departureDate = d.value; doSearch()"
        >
          <span class="date-tab__day">{{ d.label }}</span>
          <span class="date-tab__date dim">{{ d.sub }}</span>
        </button>
      </section>

      <!-- Results -->
      <section v-if="trains.length" class="results">
        <div class="results__header">
          <h2 class="results__title">
            <span class="mono accent">{{ fromCode }}</span>
            <span class="dim"> → </span>
            <span class="mono accent">{{ toCode }}</span>
          </h2>
          <span class="dim" style="font-size:0.8rem">{{ trains.length }} 趟车次</span>
        </div>

        <div v-for="train in trains" :key="train.trainId" class="train-card card">
          <div class="train-card__main">
            <div class="train-card__info">
              <div class="train-card__number mono">{{ train.trainNumber }}</div>
              <div class="train-card__tags">
                <span v-for="tag in train.trainTags" :key="tag" class="tag">{{ tagMap[tag] || tag }}</span>
              </div>
            </div>
            <div class="train-card__route">
              <div class="train-card__station">
                <div class="train-card__time mono">{{ train.departureTime }}</div>
                <div class="train-card__name">{{ train.departure }}</div>
              </div>
              <div class="train-card__duration">
                <div class="train-card__line"></div>
                <span class="train-card__dur mono dim">{{ train.duration }}</span>
              </div>
              <div class="train-card__station train-card__station--end">
                <div class="train-card__time mono">{{ train.arrivalTime }}</div>
                <div class="train-card__name">{{ train.arrival }}</div>
              </div>
            </div>
          </div>

          <div class="train-card__seats">
            <div
              v-for="seat in train.seatClassList"
              :key="seat.type"
              class="seat-cell"
              :class="{ 'seat-cell--soldout': seat.quantity === 0 }"
            >
              <span class="seat-cell__name">{{ seatMap[seat.type] || seat.type }}</span>
              <span v-if="seat.quantity > 0" class="seat-cell__qty mono">{{ seat.quantity }}张</span>
              <span v-else class="seat-cell__qty dim">售罄</span>
              <span class="seat-cell__price mono">¥{{ seat.price }}</span>
            </div>
          </div>

          <button class="buy-btn" @click="goBuy(train)">
            预定
          </button>
        </div>
      </section>

      <!-- Empty -->
      <section v-if="hasSearched && !trains.length && !searching" class="empty">
        <p class="empty__text">暂未找到符合条件的车次</p>
        <p class="dim" style="font-size:0.8rem">请调整出发地、目的地或日期后重新查询</p>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { getAllStations, searchTickets } from '@/api'

const router = useRouter()

// Station data
const allStations = ref([])
const fromInput = ref('')
const toInput = ref('')
const fromCode = ref('BJP')
const toCode = ref('HZH')
const fromOpen = ref(false)
const toOpen = ref(false)
const filteredFrom = computed(() => filterStations(fromInput.value))
const filteredTo = computed(() => filterStations(toInput.value))

function filterStations(q) {
  if (!q) return allStations.value.slice(0, 8)
  const kw = q.toUpperCase()
  return allStations.value
    .filter(s => s.code.toUpperCase().includes(kw) || s.name.includes(q) || s.spell.includes(q.toLowerCase()))
    .slice(0, 8)
}

function selectFrom(s) { fromCode.value = s.code; fromInput.value = s.code + ' ' + s.name; fromOpen.value = false }
function selectTo(s) { toCode.value = s.code; toInput.value = s.code + ' ' + s.name; toOpen.value = false }
function swapStations() {
  const tmpCode = fromCode.value; const tmpInput = fromInput.value
  fromCode.value = toCode.value; fromInput.value = toInput.value
  toCode.value = tmpCode; toInput.value = tmpInput
  if (hasSearched.value) doSearch()
}

// Date
// 使用本地时区格式化为 YYYY-MM-DD，避免 toISOString() 按 UTC 导致日期偏差（如北京凌晨显示前一天）
const fmtLocalDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const today = computed(() => fmtLocalDate(new Date()))
const maxDate = computed(() => {
  const d = new Date(); d.setDate(d.getDate() + 14)
  return fmtLocalDate(d)
})
const departureDate = ref(today.value)
const dateOptions = computed(() => {
  const opts = []
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  for (let i = 0; i < 15; i++) {
    const d = new Date(); d.setDate(d.getDate() + i)
    const v = fmtLocalDate(d)
    const label = i === 0 ? '今天' : i === 1 ? '明天' : weekdays[d.getDay()]
    const sub = `${d.getMonth() + 1}/${d.getDate()}`
    opts.push({ value: v, label, sub })
  }
  return opts
})

// Search
const trains = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const searchError = ref('')

async function doSearch() {
  if (!fromCode.value || !toCode.value) return
  searchError.value = ''
  searching.value = true
  try {
    const res = await searchTickets({
      fromStation: fromCode.value,
      toStation: toCode.value,
      departureDate: departureDate.value
    })
    if (res.success) {
      trains.value = res.data?.trainList || []
      hasSearched.value = true
    } else {
      searchError.value = res.message
      trains.value = []
    }
  } catch {
    searchError.value = '查询失败，请重试'
    trains.value = []
  } finally {
    searching.value = false
  }
}

// Buy
function goBuy(train) {
  const q = new URLSearchParams({
    trainId: train.trainId,
    trainNumber: train.trainNumber,
    fromStation: fromCode.value,
    toStation: toCode.value,
    departure: train.departure,
    arrival: train.arrival,
    departureDate: departureDate.value,
    departureTime: train.departureTime,
    arrivalTime: train.arrivalTime
  })
  const url = router.resolve({ name: 'buyTicket', query: Object.fromEntries(q) })
  window.open(url.href, '_blank')
}

// Mappings
const seatMap = { 0:'商务座',1:'一等座',2:'二等座',3:'动卧',4:'高级软卧',5:'一等卧',6:'二等卧',7:'软座',8:'硬座',9:'无座',10:'其他',13:'软卧' }
const tagMap = { '0':'复','1':'智','2':'静','3':'铺' }

// Init
onMounted(async () => {
  try {
    const res = await getAllStations()
    if (res.success) {
      allStations.value = res.data || []
      // Set defaults
      const bjp = res.data?.find(s => s.code === 'BJP')
      const hzh = res.data?.find(s => s.code === 'HZH')
      if (bjp) fromInput.value = bjp.code + ' ' + bjp.name
      if (hzh) toInput.value = hzh.code + ' ' + hzh.name
      doSearch()
    }
  } catch {}
})

// Close dropdowns on outside click
function clickOutside(e) {
  const fromEl = document.querySelector('.station-picker')
  const toEl = document.querySelectorAll('.station-picker')[1]
  if (fromEl && !fromEl.contains(e.target)) fromOpen.value = false
  if (toEl && !toEl.contains(e.target)) toOpen.value = false
}
onMounted(() => document.addEventListener('click', clickOutside))
onUnmounted(() => document.removeEventListener('click', clickOutside))
</script>

<style scoped>
/* Hero */
.hero { text-align: center; padding: var(--s-2xl) 0 var(--s-lg); }
.hero__title { font-size: 1.8rem; font-weight: 600; letter-spacing: 0.02em; }
.hero__sub { margin-top: var(--s-sm); font-size: 0.9rem; }

/* Search */
.search-section { padding: var(--s-lg); margin-bottom: var(--s-lg); }
.search-row {
  display: flex;
  align-items: flex-end;
  gap: var(--s-md);
  flex-wrap: wrap;
}
.search-field { flex: 1; min-width: 140px; position: relative; }
.search-field__label { display: block; font-size: 0.68rem; color: var(--c-text-muted); margin-bottom: var(--s-xs); letter-spacing: 0.04em; text-transform: uppercase; }
.search-field__input { width: 100%; padding: 10px 12px; font-size: 0.85rem; }
.search-field--date { flex: 0 0 auto; min-width: 150px; }

/* Station dropdown */
.station-dropdown {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: var(--r-md);
  max-height: 260px; overflow-y: auto; z-index: 200;
  box-shadow: var(--shadow-lg);
}
.station-dropdown__item {
  padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: var(--s-md);
  transition: background var(--dur-fast);
}
.station-dropdown__item:hover { background: var(--c-bg-hover); }
.station-dropdown__code { font-size: 0.75rem; color: var(--c-blue); min-width: 36px; }
.station-dropdown__region { font-size: 0.72rem; margin-left: auto; }

/* Swap */
.swap-btn {
  width: 36px; height: 38px; padding: 0;
  background: var(--c-bg-raised); border: 1px solid var(--c-border); border-radius: var(--r-md);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all var(--dur-fast);
  flex-shrink: 0;
}
.swap-btn:hover { border-color: var(--c-border-lt); }
.swap-btn__icon { font-size: 1.1rem; color: var(--c-text-dim); }

/* Search button */
.search-btn {
  height: 38px; padding: 0 var(--s-xl); background: var(--c-white); color: var(--c-bg);
  border: none; border-radius: var(--r-md); font-size: 0.85rem; font-weight: 600;
  letter-spacing: 0.04em; cursor: pointer; transition: all var(--dur-fast);
  flex-shrink: 0;
}
.search-btn:hover { opacity: 0.85; }
.search-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.search-error { margin-top: var(--s-md); font-size: 0.78rem; color: var(--c-warn); text-align: center; }

/* Date tabs */
.date-tabs {
  display: flex; gap: var(--s-xs); margin-bottom: var(--s-lg);
  overflow-x: auto; padding: var(--s-xs) 0;
}
.date-tab {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 14px; border: 1px solid var(--c-border); border-radius: var(--r-md);
  background: transparent; cursor: pointer; transition: all var(--dur-fast);
  white-space: nowrap;
}
.date-tab:hover { border-color: var(--c-border-lt); }
.date-tab--active { border-color: var(--c-slate); background: var(--c-slate-bg); }
.date-tab__day { font-size: 0.75rem; font-weight: 500; }
.date-tab__date { font-size: 0.65rem; }

/* Results */
.results__header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--s-md); }
.results__title { font-size: 1.1rem; }

/* Train card */
.train-card { margin-bottom: var(--s-md); padding: var(--s-lg); display: flex; gap: var(--s-lg); flex-wrap: wrap; }
.train-card__main { flex: 1; min-width: 280px; }
.train-card__info { display: flex; align-items: center; gap: var(--s-md); margin-bottom: var(--s-md); }
.train-card__number { font-size: 1.3rem; font-weight: 600; color: var(--c-blue); letter-spacing: 0.04em; }
.tag { padding: 2px 8px; border-radius: var(--r-sm); font-size: 0.65rem; background: var(--c-blue-bg); color: var(--c-blue); letter-spacing: 0.03em; }
.train-card__route { display: flex; align-items: center; gap: var(--s-sm); }
.train-card__station--end { text-align: right; }
.train-card__time { font-size: 1.15rem; font-weight: 500; color: var(--c-white); letter-spacing: 0.02em; }
.train-card__name { font-size: 0.72rem; color: var(--c-text-dim); margin-top: 2px; }
.train-card__duration { flex: 1; text-align: center; min-width: 80px; display: flex; flex-direction: column; align-items: center; }
.train-card__line { width: 100%; height: 1px; background: var(--c-border); position: relative; }
.train-card__line::before, .train-card__line::after { content: ''; position: absolute; top: -3px; width: 7px; height: 7px; border-radius: 50%; background: var(--c-border-lt); }
.train-card__line::before { left: 0; }
.train-card__line::after { right: 0; }
.train-card__dur { font-size: 0.7rem; margin-top: var(--s-xs); }

/* Seats */
.train-card__seats { display: flex; flex-wrap: wrap; gap: var(--s-sm); align-items: flex-start; }
.seat-cell {
  padding: 8px 14px; border: 1px solid var(--c-border); border-radius: var(--r-md);
  text-align: center; min-width: 90px; cursor: default;
  transition: all var(--dur-fast);
}
.seat-cell:hover { border-color: var(--c-border-lt); }
.seat-cell--soldout { opacity: 0.35; }
.seat-cell__name { display: block; font-size: 0.7rem; color: var(--c-text-dim); margin-bottom: 2px; letter-spacing: 0.03em; }
.seat-cell__qty { display: block; font-size: 0.72rem; margin-bottom: 2px; }
.seat-cell__price { display: block; font-size: 0.78rem; color: var(--c-amber); letter-spacing: 0.02em; }

/* Buy button */
.buy-btn {
  padding: 10px 28px; background: var(--c-white); color: var(--c-bg);
  border: none; border-radius: var(--r-md); font-size: 0.8rem; font-weight: 600;
  letter-spacing: 0.04em; cursor: pointer; transition: all var(--dur-fast); align-self: center;
}
.buy-btn:hover { opacity: 0.85; }

/* Empty */
.empty { text-align: center; padding: var(--s-3xl) 0; }

@media (max-width: 768px) {
  .train-card { flex-direction: column; }
  .search-row { flex-direction: column; }
  .search-field { min-width: 100%; }
}
</style>

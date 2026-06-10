<template>
  <AppLayout>
    <div class="page">
      <div class="page-header">
        <h2>乘车人</h2>
        <router-link to="/addPassenger" class="add-btn">+ 添加</router-link>
      </div>

      <div v-if="loading" class="loading">加载中…</div>

      <div v-if="!loading && !passengers.length" class="empty-state">
        <p class="dim">暂未添加乘车人</p>
        <router-link to="/addPassenger" class="link-btn">添加第一位乘车人</router-link>
      </div>

      <div v-if="passengers.length" class="pax-list">
        <div v-for="p in passengers" :key="p.id" class="pax-card card">
          <div class="pax-card__info">
            <div class="pax-card__name">{{ p.realName }}</div>
            <div class="pax-card__details">
              <span class="dim" style="font-size:0.7rem">{{ idTypeMap[p.idType] || '身份证' }}</span>
              <span class="mono dim" style="font-size:0.72rem">{{ p.idCard }}</span>
              <span :class="['discount-badge', discountClass(p.discountType)]">{{ discountMap[p.discountType] || '成人' }}</span>
              <span class="mono dim" style="font-size:0.72rem">{{ p.phone }}</span>
            </div>
          </div>
          <div class="pax-card__actions">
            <router-link :to="`/addPassenger?type=edit&id=${p.id}`" class="pax-btn">编辑</router-link>
            <button class="pax-btn pax-btn--del" @click="handleDelete(p)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { getPassengerList, removePassenger } from '@/api'

const passengers = ref([])
const loading = ref(true)
const idTypeMap = { 0:'身份证' }
const discountMap = { 0:'成人', 1:'儿童', 2:'学生', 3:'残疾军人' }
function discountClass(t) {
  if (t === 1) return 'discount-badge--blue'
  if (t === 2) return 'discount-badge--green'
  if (t === 3) return 'discount-badge--amber'
  return 'discount-badge--slate'
}

onMounted(async () => {
  try {
    const res = await getPassengerList()
    if (res.success) passengers.value = res.data || []
  } catch {} finally { loading.value = false }
})

async function handleDelete(p) {
  if (!confirm(`确认删除乘车人"${p.realName}"？`)) return
  try {
    await removePassenger({ id: p.id })
    passengers.value = passengers.value.filter(x => x.id !== p.id)
  } catch {}
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-lg); }
.add-btn { padding: 8px 20px; background: var(--c-white); color: var(--c-bg); border-radius: var(--r-md); font-size: 0.8rem; font-weight: 600; text-decoration: none; letter-spacing: 0.03em; }
.add-btn:hover { opacity: 0.85; }
.loading { text-align: center; padding: var(--s-3xl); color: var(--c-text-muted); }
.empty-state { text-align: center; padding: var(--s-3xl); }
.link-btn { color: var(--c-accent); font-size: 0.85rem; }

.pax-list { display: flex; flex-direction: column; gap: var(--s-sm); }
.pax-card { display: flex; justify-content: space-between; align-items: center; gap: var(--s-md); }
.pax-card__info { flex: 1; }
.pax-card__name { font-weight: 500; margin-bottom: var(--s-xs); }
.pax-card__details { display: flex; gap: var(--s-md); flex-wrap: wrap; align-items: center; }
.pax-card__actions { display: flex; gap: var(--s-sm); flex-shrink: 0; }
.pax-btn { padding: 4px 14px; border-radius: var(--r-sm); font-size: 0.72rem; color: var(--c-text-dim); text-decoration: none; border: 1px solid var(--c-border); background: transparent; cursor: pointer; transition: all var(--dur-fast); }
.pax-btn:hover { color: var(--c-white); border-color: var(--c-border-lt); }
.pax-btn--del:hover { color: var(--c-err); border-color: var(--c-err); }

.discount-badge { padding: 1px 8px; border-radius: var(--r-sm); font-size: 0.68rem; font-weight: 500; }
.discount-badge--slate { background: var(--c-slate-bg); color: var(--c-slate); }
.discount-badge--blue  { background: var(--c-blue-bg);  color: var(--c-blue); }
.discount-badge--green { background: var(--c-green-bg); color: var(--c-green); }
.discount-badge--amber { background: var(--c-amber-bg); color: var(--c-amber); }
</style>

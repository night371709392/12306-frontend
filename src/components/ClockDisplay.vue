<template>
  <div class="clock">
    <span class="clock__time">{{ time }}</span>
    <span class="clock__date">{{ date }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const time = ref('')
const date = ref('')

let timer
function update() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  time.value = `${h}:${m}:${s}`

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const y = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const w = weekdays[now.getDay()]
  date.value = `${y}/${mo}/${d} ${w}`
}

onMounted(() => { update(); timer = setInterval(update, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  user-select: none;
}
.clock__time {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--c-text);
  letter-spacing: 0.04em;
  transition: color var(--dur-normal);
}
.clock__date {
  font-family: var(--font-ui);
  font-size: 0.65rem;
  color: var(--c-text-dim);
  letter-spacing: 0.03em;
}
</style>

<template>
  <button
    class="theme-toggle glass"
    :title="isDark ? '切换到明亮模式' : '切换到暗黑模式'"
    @click="toggle"
    :aria-label="isDark ? '切换到明亮模式' : '切换到暗黑模式'"
  >
    <!-- 太阳 = 明亮模式，月亮 = 暗黑模式 -->
    <svg
      v-if="isDark"
      class="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
    <svg
      v-else
      class="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<script setup>
import { ref, watchEffect } from 'vue'

const isDark = ref(true)

// Read initial theme from localStorage; default to dark
const stored = localStorage.getItem('theme')
if (stored === 'light') {
  isDark.value = false
  document.documentElement.setAttribute('data-theme', 'light')
} else {
  // Ensure data-theme is set (default dark)
  document.documentElement.setAttribute('data-theme', 'dark')
}

function toggle() {
  isDark.value = !isDark.value
}

// Reactively update DOM + localStorage
watchEffect(() => {
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
})
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: var(--r-md);
  border: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-dim);
  cursor: pointer;
  transition: all var(--dur-normal) var(--ease-out);
}

.theme-toggle:hover {
  color: var(--c-amber);
  border-color: var(--c-amber);
  background: var(--c-bg-hover);
  box-shadow: var(--shadow-md);
}

.theme-toggle__icon {
  width: 20px;
  height: 20px;
}
</style>

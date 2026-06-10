<template>
  <div class="layout">
    <NavBar />
    <main class="layout__content">
      <slot />
    </main>
    <footer class="layout__footer">
      <span class="dim">12306 Railway · Modernist Edition</span>
    </footer>
  </div>
</template>

<script setup>
import NavBar from './NavBar.vue'
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.layout__content {
  flex: 1;
}
.layout__footer {
  text-align: center;
  padding: var(--s-xl) 0 var(--s-lg);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  opacity: 0.5;
}
</style>

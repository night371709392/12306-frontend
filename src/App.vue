<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
  <ThemeToggle />
</template>

<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

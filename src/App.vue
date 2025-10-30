<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader /> <!-- Header global -->
  <router-view />
</template>

<style>
body {
  font-family: "Inter", sans-serif;
  margin: 0;
  padding: 0;
  background: #f8fafc;
}
</style>

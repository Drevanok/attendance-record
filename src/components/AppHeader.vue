<!-- src/components/AppHeader.vue -->
<template>
  <header class="app-header" v-if="user">
    <div class="logo">
      <h1>Panel de Administración</h1>
    </div>
    <nav class="nav-links">
      <router-link to="/employees" class="nav-btn">Empleados</router-link>
      <button class="nav-btn logout" @click="logoutUser">Cerrar sesión</button>
    </nav>
  </header>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, logout } = useAuth()
const router = useRouter()

const logoutUser = async () => {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #42b883;
  color: white;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-btn {
  background: transparent;
  border: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.nav-btn:hover {
  background-color: #2c8a65;
}

.logout {
  background-color: #c0392b;
}

.logout:hover {
  background-color: #922b21;
}
</style>

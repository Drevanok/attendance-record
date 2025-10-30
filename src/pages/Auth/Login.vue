<template>
  <div class="auth-page">
    <h2>Iniciar Sesión (Admin)</h2>

    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Correo electrónico" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit">Entrar</button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>

    <p class="register-text">
      ¿No tienes cuenta?
      <router-link to="/register-admin">Regístrate</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
.error {
  color: red;
  margin-top: 1rem;
}
.register-text {
  margin-top: 1rem;
}
</style>

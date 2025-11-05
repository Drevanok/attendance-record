<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Restablecer Contraseña</h2>
      <form @submit.prevent="resetPassword">
        <input v-model="password" type="password" placeholder="Nueva contraseña" required />
        <input v-model="confirmPassword" type="password" placeholder="Confirmar contraseña" required />
        <button type="submit">Actualizar contraseña</button>
      </form>
      <p v-if="message" :class="messageType">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const messageType = ref('')

const token = ref('')

onMounted(() => {
  token.value = route.query.token || ''
})

const resetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    message.value = 'Las contraseñas no coinciden'
    messageType.value = 'error'
    return
  }

  const { data, error } = await supabase.auth.updateUser({
    accessToken: token.value,
    password: password.value
  })

  if (error) {
    message.value = error.message
    messageType.value = 'error'
  } else {
    message.value = 'Contraseña actualizada correctamente'
    messageType.value = 'success'
    setTimeout(() => router.push('/login'), 2000)
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(120deg, #00b09b, #96c93d);
  font-family: 'Poppins', sans-serif;
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
  transition: transform 0.3s;
}

.auth-card:hover {
  transform: translateY(-5px);
}

h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: 0.3s;
}

input:focus {
  border-color: #00b09b;
  box-shadow: 0 4px 10px rgba(0, 176, 155, 0.3);
}

button {
  background: #00b09b;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

button:hover {
  background: #029e8b;
}

.error {
  color: red;
  margin-top: 10px;
  font-weight: 500;
}

.success {
  color: green;
  margin-top: 10px;
  font-weight: 500;
}
</style>

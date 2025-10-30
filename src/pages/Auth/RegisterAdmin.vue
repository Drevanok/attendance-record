<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Registrar Administrador</h2>

      <form @submit.prevent="registerAdmin">
        <input v-model="fullName" type="text" placeholder="Nombre completo" required />
        <input v-model="email" type="email" placeholder="Correo electrónico" required />
        <input v-model="password" type="password" placeholder="Contraseña" required />
        <button type="submit">Registrar</button>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <p class="toggle">
        ¿Ya tienes cuenta?
        <span @click="goToLogin">Inicia sesión</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const fullName = ref('')
const email = ref('')
const password = ref('')
const error = ref(null)
const success = ref(null)
const router = useRouter()

const registerAdmin = async () => {
  error.value = null
  success.value = null

  // 1️⃣ Crear usuario en Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: window.location.origin + '/login'
    }
  })

  if (signUpError) {
    error.value = signUpError.message
    return
  }

  const { error: insertError } = await supabase
    .from('admins')
    .insert([{
      user_id: signUpData.user.id,
      email: email.value,
      full_name: fullName.value
    }])

  if (insertError) {
    error.value = insertError.message
    return
  }

  success.value = '¡Registro exitoso! Revisa tu correo y confirma tu cuenta.'
}

const goToLogin = () => router.push('/login')
</script>

<style scoped>
.auth-container { display:flex; justify-content:center; align-items:center; height:100vh; background:linear-gradient(120deg,#00b09b,#96c93d); font-family:'Poppins',sans-serif; }
.auth-card { background:white; padding:2rem; border-radius:16px; width:100%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2); text-align:center; }
h2 { color:#333; margin-bottom:1.5rem; }
form { display:flex; flex-direction:column; gap:.8rem; }
input { padding:10px; border:1px solid #ccc; border-radius:8px; font-size:1rem; outline:none; transition:.3s; }
input:focus { border-color:#00b09b; }
button { background:#00b09b; color:white; padding:10px; border:none; border-radius:8px; cursor:pointer; font-weight:600; transition:.3s; }
button:hover { background:#029e8b; }
.error { color:red; margin-top:10px; }
.success { color:green; margin-top:10px; }
.toggle { margin-top:1.5rem; color:#555; }
.toggle span { color:#00b09b; cursor:pointer; font-weight:600; }
</style>

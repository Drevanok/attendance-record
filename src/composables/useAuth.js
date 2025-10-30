// src/composables/useAuth.js
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

const user = ref(null)
const loading = ref(true)
let initialized = false

export function useAuth() {
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) console.error('Error al obtener sesión:', error)
    user.value = data.session?.user || null
    loading.value = false
    initialized = true
  }

  // Escucha cambios en la sesión
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null
  })

  if (!initialized) onMounted(getSession)

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
  }

  const register = async (email, password, full_name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    getSession
  }
}


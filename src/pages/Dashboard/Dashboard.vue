<template>
  <div class="dashboard" v-if="!loading">
    <h1>Panel de Administración</h1>

    <div v-if="!user">
      <p>No has iniciado sesión.</p>
      <router-link to="/login" class="btn">Iniciar Sesión</router-link>
    </div>

    <div v-else>
      <p>Bienvenido, {{ user.user_metadata.full_name || user.email }}</p>

     
      <div class="cards">
        <div class="card">
          <h2>Empleados</h2>
          <p>{{ totalEmployees }}</p>
        </div>
        <div class="card">
          <h2>Asistencias hoy</h2>
          <p>{{ todayAttendance }}</p>
        </div>
        <div class="card">
          <h2>Reportes</h2>
          <p>{{ totalReports }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/composables/useAuth'


const { user, loading } = useAuth()

const totalEmployees = ref(0)
const todayAttendance = ref(0)
const totalReports = ref(0)

onMounted(async () => {
  const { data: employees } = await supabase.from('employees').select('id')
  totalEmployees.value = employees?.length || 0

  const today = new Date().toISOString().slice(0, 10)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('date', today)
  todayAttendance.value = attendance?.length || 0

  const { data: reports } = await supabase.from('reports').select('id')
  totalReports.value = reports?.length || 0
})
</script>

<style scoped>
.dashboard {
  text-align: center;
  padding: 50px;
}

.cards {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.card {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  width: 180px;
}

.card h2 {
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #333;
}

.card p {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42b883;
}
</style>

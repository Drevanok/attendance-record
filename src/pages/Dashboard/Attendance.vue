<template>
  <div class="attendance-page">
    <h2 class="title">
      Asistencias de esta semana – {{ employee?.first_name }} {{ employee?.last_name }}
    </h2>

    <div v-if="loading" class="text-gray-500">Cargando asistencias...</div>

    <table v-else class="attendance-table">
      <thead>
        <tr>
          <th>Día</th>
          <th>Fecha</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in filteredDays" :key="day.fecha">
          <td>{{ day.nombre }}</td>
          <td>{{ day.fecha }}</td>
          <td>{{ day.entrada || '--:--' }}</td>
          <td>{{ day.salida || '--:--' }}</td>
          <td>
            <span
              :class="{
                correct: day.estado === 'Asistió',
                late: day.estado.includes('Tarde'),
                early: day.estado.includes('Temprano'),
                pending: day.estado === 'Pendiente',
                absent: day.estado === 'No se presentó'
              }"
            >
              {{ day.estado }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <router-link to="/employees" class="btn">Volver</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const employeeId = route.params.id

const employee = ref(null)
const scheduleDays = ref([])
const attendanceRecords = ref([])
const loading = ref(true)
const tolerance = 5

// 🔹 Obtener inicio y fin de la semana actual (lunes a domingo)
function getCurrentWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // Domingo=7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

function formatTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

async function loadAttendance() {
  loading.value = true

  // 🔹 Cargar empleado y horarios
  const { data: empData, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, schedules(day_of_week, start_time, end_time)')
    .eq('id', employeeId)
    .single()

  if (empError) {
    alert(empError.message)
    loading.value = false
    return
  }

  employee.value = empData
  scheduleDays.value = empData.schedules || []

  // 🔹 Calcular rango de la semana actual
  const { start, end } = getCurrentWeekRange()

  // 🔹 Cargar asistencias de esta semana
  const { data: attData, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', start.toISOString())
    .lte('date', end.toISOString())

  if (attError) {
    alert(attError.message)
    loading.value = false
    return
  }

  attendanceRecords.value = attData
  loading.value = false
}

const filteredDays = computed(() => {
  if (!employee.value || !scheduleDays.value.length) return []

  const { start } = getCurrentWeekRange()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const now = new Date()

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return scheduleDays.value.map(sch => {
    const fecha = new Date(start)
    fecha.setDate(start.getDate() + (sch.day_of_week - 1))
    const fechaStr = fecha.toISOString().split('T')[0]

    const asistencia = attendanceRecords.value.find(a => a.date.startsWith(fechaStr))

    let estado = ''
    let entrada = asistencia ? formatTime(asistencia.check_in) : null
    let salida = asistencia ? formatTime(asistencia.check_out) : null

    if (!asistencia) {
      if (fecha < today) estado = 'No se presentó'
      else if (fecha.getTime() === today.getTime()) {
        const [hSalida, mSalida] = sch.end_time.split(':').map(Number)
        const salidaHorario = new Date(today)
        salidaHorario.setHours(hSalida, mSalida, 0, 0)
        estado = now > salidaHorario ? 'No se presentó' : 'Pendiente'
      } else estado = 'Pendiente'
    } else if (!asistencia.check_in || !asistencia.check_out) {
      estado = 'No se presentó'
    } else {
      const schedStart = timeToMinutes(sch.start_time)
      const schedEnd = timeToMinutes(sch.end_time)
      const checkIn = timeToMinutes(entrada)
      const checkOut = timeToMinutes(salida)

      const entryLate = checkIn > schedStart + tolerance
      const exitEarly = checkOut < schedEnd - tolerance

      if (entryLate && exitEarly) estado = 'Tarde y Temprano'
      else if (entryLate) estado = 'Tarde'
      else if (exitEarly) estado = 'Temprano'
      else estado = 'Asistió'
    }

    return {
      nombre: dias[sch.day_of_week - 1],
      fecha: fechaStr,
      entrada: entrada || '--:--',
      salida: salida || '--:--',
      estado
    }
  })
})

onMounted(loadAttendance)
</script>

<style scoped>
.attendance-page { padding: 2rem; }
.title { font-size: 1.3rem; font-weight: bold; margin-bottom: 1rem; }
.attendance-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.attendance-table th, .attendance-table td {
  border: 1px solid #ccc; padding: 0.5rem; text-align: center;
}
.correct { color: #10b981; font-weight: bold; }
.late { color: #ef4444; font-weight: bold; }
.early { color: #f59e0b; font-weight: bold; }
.pending { color: #3b82f6; font-weight: bold; }
.absent { color: #6b7280; font-weight: bold; }
.btn {
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  margin-top: 1rem;
  display: inline-block;
}
</style>

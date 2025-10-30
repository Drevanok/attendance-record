<template>
  <div class="attendance-page">
    <h2 class="title">Histórico de Asistencias de {{ employee?.first_name }} {{ employee?.last_name }}</h2>

    <div class="controls">
      <label>Seleccionar semana:</label>
      <input type="week" v-model="selectedWeek" @change="loadAttendance" />
    </div>

    <table v-if="!loading" class="attendance-table">
      <thead>
        <tr>
          <th>Día</th>
          <th>Hora Entrada</th>
          <th>Hora Salida</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in days" :key="day.value">
          <td>{{ day.name }}</td>
          <td>{{ attendance[day.value]?.check_in || '--:--' }}</td>
          <td>{{ attendance[day.value]?.check_out || '--:--' }}</td>
          <td>
            <span
              :class="{
                correct: attendance[day.value]?.status === 'on_time',
                late: attendance[day.value]?.status === 'late',
                early: attendance[day.value]?.status === 'early',
                unassigned: attendance[day.value]?.status === 'unassigned'
              }"
            >
              {{
                attendance[day.value]
                  ? attendance[day.value].status === 'on_time'
                    ? '✓'
                    : attendance[day.value].status === 'late'
                    ? 'Tarde'
                    : attendance[day.value].status === 'early'
                    ? 'Temprano'
                    : 'No se Presento'
                  : 'No Asignado'
              }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="loading">Cargando asistencias...</div>
    <router-link to="/employees" class="btn">Volver</router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const employeeId = route.params.id

const employee = ref(null)
const attendance = ref({})
const loading = ref(true)
const selectedWeek = ref(getCurrentWeek())

const days = [
  { name: 'Lunes', value: 1 },
  { name: 'Martes', value: 2 },
  { name: 'Miércoles', value: 3 },
  { name: 'Jueves', value: 4 },
  { name: 'Viernes', value: 5 },
  { name: 'Sábado', value: 6 },
  { name: 'Domingo', value: 7 },
]

function getCurrentWeek() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const week = getWeekNumber(now).toString().padStart(2, '0')
  return `${year}-W${week}`
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
}

const formatTime = (iso) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}


const loadAttendance = async () => {
  loading.value = true

  const { data: empData, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, schedules: schedules(day_of_week, start_time, end_time)')
    .eq('id', employeeId)
    .single()
  if (empError) return alert(empError.message)
  employee.value = empData


  const [year, week] = selectedWeek.value.split('-W').map(Number)
  const weekStart = new Date(year, 0, 1 + (week - 1) * 7)
  const dayOffset = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1
  weekStart.setDate(weekStart.getDate() - dayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const { data: attData, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', weekStart.toISOString())
    .lte('date', weekEnd.toISOString())

  if (attError) return alert(attError.message)

  
  const attendanceMap = {}
  days.forEach(day => {
    const scheduleDay = empData.schedules?.find(s => s.day_of_week === day.value)
    const att = attData.find(a => {
      const d = new Date(a.date)
      const dayIndex = d.getDay() === 0 ? 7 : d.getDay()
      return dayIndex === day.value
    })

    if (!scheduleDay) {
      attendanceMap[day.value] = { status: 'unassigned' }
    } else if (!att) {
      attendanceMap[day.value] = { check_in: '--:--', check_out: '--:--', status: 'unassigned' }
    } else {
      const checkIn = formatTime(att.check_in)
      const checkOut = formatTime(att.check_out)
      let status = 'on_time'
      if (checkIn > scheduleDay.start_time) status = 'late'
      if (checkOut < scheduleDay.end_time) status = 'early'

      attendanceMap[day.value] = { check_in: checkIn, check_out: checkOut, status }
    }
  })

  attendance.value = attendanceMap
  loading.value = false
}

onMounted(loadAttendance)
</script>

<style scoped>
.attendance-page { padding: 2rem; }
.controls { margin-bottom: 1rem; }
.attendance-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
.attendance-table th, .attendance-table td { border: 1px solid #ccc; padding: 0.5rem; text-align: center; }
.correct { color: #10b981; font-weight: bold; }
.late { color: #ef4444; font-weight: bold; }
.early { color: #f59e0b; font-weight: bold; }
.unassigned { color: #6b7280; font-weight: bold; }
.btn { padding: 6px 10px; border-radius: 8px; cursor: pointer; border: none; background-color: #007bff; color: white; }
</style>

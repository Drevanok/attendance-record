<template>
  <div class="report-page">
    <h2 class="title">
      Reporte Semanal de {{ employee?.first_name }} {{ employee?.last_name }}
    </h2>

    <div class="week-selector">
      <label for="week">Selecciona semana: </label>
      <input type="week" id="week" v-model="selectedWeek" @change="loadReport" />
    </div>

    <table class="report-table" v-if="filteredDays.length">
      <thead>
        <tr>
          <th>Día</th>
          <th>Horario Inicio</th>
          <th>Hora Entrada</th>
          <th>Entrada Correcta</th>
          <th>Horario Fin</th>
          <th>Hora Salida</th>
          <th>Salida Correcta</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in filteredDays" :key="day.value">
          <td>{{ day.name }}</td>
          <td>{{ schedule[day.name]?.start || '--:--' }}</td>
          <td>{{ attendance[day.value]?.check_in || '--:--' }}</td>
          <td>
            <span 
              v-if="attendance[day.value]?.status === 'no_show'" 
              class="late"
            >No se presentó</span>
            <span 
              v-else-if="attendance[day.value]?.status === 'late_both'" 
              class="late"
            >Tarde</span>
            <span v-else-if="attendance[day.value]?.status === 'pending'" class="pending">
              Pendiente
            </span>
            <span v-else-if="!schedule[day.name]">No asignado</span>
            <span 
              v-else 
              :class="{
                'correct': ['on_time','early'].includes(attendance[day.value]?.status),
                'late': attendance[day.value]?.status === 'late'
              }"
            >
              {{ attendance[day.value]?.status === 'on_time' ? '✓' : (attendance[day.value]?.status === 'late' ? 'Tarde' : '✓') }}
            </span>
          </td>
          <td>{{ schedule[day.name]?.end || '--:--' }}</td>
          <td>{{ attendance[day.value]?.check_out || '--:--' }}</td>
          <td>
            <span 
              v-if="attendance[day.value]?.status === 'no_show'" 
              class="late"
            >No se presentó</span>
            <span 
              v-else-if="attendance[day.value]?.status === 'late_both'" 
              class="late"
            >Tarde</span>
            <span v-else-if="attendance[day.value]?.status === 'pending'" class="pending">
              Pendiente
            </span>
            <span v-else-if="!schedule[day.name]">No asignado</span>
            <span 
              v-else 
              :class="{
                'correct': ['on_time','late'].includes(attendance[day.value]?.status),
                'early': attendance[day.value]?.status === 'early'
              }"
            >
              {{ attendance[day.value]?.status === 'on_time' ? '✓' : (attendance[day.value]?.status === 'early' ? 'Temprano' : 'Tarde') }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else>No hay días asignados para esta semana.</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const employee = ref(null)
const schedule = ref({})
const attendance = ref({})

const days = [
  { name: 'Lunes', value: 1 },
  { name: 'Martes', value: 2 },
  { name: 'Miércoles', value: 3 },
  { name: 'Jueves', value: 4 },
  { name: 'Viernes', value: 5 },
  { name: 'Sábado', value: 6 },
  { name: 'Domingo', value: 7 }
]

const selectedWeek = ref(getCurrentWeek())
const tolerance = 5 // minutos de tolerancia

function getCurrentWeek() {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-W${week.toString().padStart(2,'0')}`
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1))
  return Math.ceil(((date - yearStart) / 86400000 + 1)/7)
}

function formatTime(iso) {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function getWeekStartDate(year, week) {
  const simple = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = simple.getUTCDay() || 7
  const ISOweekStart = new Date(simple)
  ISOweekStart.setUTCDate(simple.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)
  return ISOweekStart
}

const filteredDays = computed(() => days.filter(d => schedule.value[d.name]))

const loadReport = async () => {
  if (!selectedWeek.value) return

  const { data: empData, error: empError } = await supabase
    .from('employees')
    .select(`
      id,
      first_name,
      last_name,
      schedules: schedules(day_of_week, start_time, end_time),
      attendance: attendance(date, check_in, check_out)
    `)
    .eq('id', route.params.id)
    .single()

  if (empError) return alert(empError.message)
  employee.value = empData

  // llenar schedule
  days.forEach(day => {
    const s = empData.schedules?.find(x => x.day_of_week === day.value)
    schedule.value[day.name] = s ? { start: s.start_time?.slice(0,5), end: s.end_time?.slice(0,5) } : null
  })

  const [year, week] = selectedWeek.value.split('-W').map(Number)
  const weekStart = getWeekStartDate(year, week)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

  const today = new Date()
  today.setHours(0,0,0,0)

  attendance.value = {}
  empData.attendance.forEach(a => {
    const d = new Date(a.date)
    const dayIndex = d.getUTCDay() === 0 ? 7 : d.getUTCDay()
    if(d >= weekStart && d <= weekEnd) {
      attendance.value[dayIndex] = {
        check_in: a.check_in ? formatTime(a.check_in) : null,
        check_out: a.check_out ? formatTime(a.check_out) : null
      }
    }
  })

  filteredDays.value.forEach(d => {
    const sched = schedule.value[d.name]
    let att = attendance.value[d.value]

    if(!att) {
      const dayDate = new Date(weekStart)
      dayDate.setUTCDate(weekStart.getUTCDate() + d.value - 1)
      attendance.value[d.value] = dayDate > today ? { status: 'pending' } : { status: 'no_show' }
    } else {
      const hasEntry = !!att.check_in
      const hasExit = !!att.check_out

      if(!hasEntry && !hasExit) {
        attendance.value[d.value].status = 'no_show'
      } else {
        const schedStart = timeToMinutes(sched.start)
        const schedEnd = timeToMinutes(sched.end)
        const checkIn = timeToMinutes(att.check_in)
        const checkOut = timeToMinutes(att.check_out)

        const entryLate = checkIn > schedStart + tolerance
        const exitEarly = checkOut < schedEnd - tolerance

        if(entryLate && exitEarly) {
          attendance.value[d.value].status = 'late_both'
        } else if(entryLate) {
          attendance.value[d.value].status = 'late'
        } else if(exitEarly) {
          attendance.value[d.value].status = 'early'
        } else {
          attendance.value[d.value].status = 'on_time'
        }
      }
    }
  })
}

onMounted(loadReport)
</script>

<style scoped>
.report-page {
  padding: 2rem;
  background: #f3f4f6;
  min-height: 100vh;
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #1f2937;
}

.week-selector {
  margin-bottom: 1rem;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.report-table th,
.report-table td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: center;
}

.report-table th {
  background: #3b82f6;
  color: white;
  font-weight: bold;
}

.correct {
  color: #10b981;
  font-weight: bold;
}

.late,
.early {
  color: #ef4444;
  font-weight: bold;
}

.pending {
  color: #f59e0b;
  font-weight: bold;
}
</style>

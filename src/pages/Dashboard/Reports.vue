<template>
  <div class="report-page">
    <h2 class="title">Reporte Semanal de {{ employee?.first_name }} {{ employee?.last_name }}</h2>

    <div class="week-selector">
      <label for="week">Selecciona semana: </label>
      <input type="week" id="week" v-model="selectedWeek" @change="loadReport" />
    </div>

    <table class="report-table" v-if="employee">
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
        <tr v-for="day in days" :key="day.value">
          <td>{{ day.name }}</td>
          <td>{{ schedule[day.name]?.start || '--:--' }}</td>
          <td>{{ attendance[day.value]?.check_in || '--:--' }}</td>
          <td>
            <span v-if="!schedule[day.name]">No asignado</span>
            <span v-else :class="{'correct': isEntryOnTime(day.value), 'late': !isEntryOnTime(day.value)}">
              {{ isEntryOnTime(day.value) ? '✓' : 'Tarde' }}
            </span>
          </td>
          <td>{{ schedule[day.name]?.end || '--:--' }}</td>
          <td>{{ attendance[day.value]?.check_out || '--:--' }}</td>
          <td>
            <span v-if="!schedule[day.name]">No asignado</span>
            <span v-else :class="{'correct': isExitOnTime(day.value), 'early': !isExitOnTime(day.value)}">
              {{ isExitOnTime(day.value) ? '✓' : 'Temprano' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const employee = ref(null)
const schedule = ref({})
const attendance = ref({})

const days = [
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 },
  { name: 'Sunday', value: 7 }
]


const selectedWeek = ref('')


const formatTime = (iso) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}


const getWeekRange = (weekString) => {
 
  const [year, week] = weekString.split('-W').map(Number)
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dayOfWeek = simple.getDay() || 7 
  const weekStart = new Date(simple)
  weekStart.setDate(simple.getDate() - dayOfWeek + 1)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return { weekStart, weekEnd }
}


const loadReport = async () => {
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

  
  days.forEach(day => {
    const s = empData.schedules?.find(x => x.day_of_week === day.value)
    schedule.value[day.name] = s ? { start: s.start_time, end: s.end_time } : null
  })

 
  attendance.value = {}
  if (!selectedWeek.value) return

  const { weekStart, weekEnd } = getWeekRange(selectedWeek.value)

  empData.attendance.forEach(a => {
    const date = new Date(a.date)
    const dayIndex = date.getDay() === 0 ? 7 : date.getDay()
    if (date >= weekStart && date <= weekEnd) {
      attendance.value[dayIndex] = {
        check_in: formatTime(a.check_in),
        check_out: formatTime(a.check_out)
      }
    }
  })
}


const isEntryOnTime = (dayValue) => {
  const scheduled = schedule.value[days.find(d=>d.value===dayValue).name]
  const attended = attendance.value[dayValue]
  if (!scheduled || !attended?.check_in) return false
  return attended.check_in <= scheduled.start
}


const isExitOnTime = (dayValue) => {
  const scheduled = schedule.value[days.find(d=>d.value===dayValue).name]
  const attended = attendance.value[dayValue]
  if (!scheduled || !attended?.check_out) return false
  return attended.check_out >= scheduled.end
}

onMounted(loadReport)
</script>

<style scoped>
.report-page {
  padding: 2rem;
  min-height: 100vh;
  background: #f3f4f6;
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
.late, .early {
  color: #ef4444;
  font-weight: bold;
}
</style>

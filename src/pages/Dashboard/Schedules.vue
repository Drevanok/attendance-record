<template>
  <div class="schedules-page" v-if="employee">
    <h2 class="title">Horario de {{ employee.first_name }} {{ employee.last_name }}</h2>

    <table class="schedule-table">
      <thead>
        <tr>
          <th>Día</th>
          <th>Activo</th>
          <th>Inicio</th>
          <th>Fin</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in days" :key="day.value">
          <td>{{ day.name }}</td>
          <td>
            <input type="checkbox" v-model="schedule[day.name].active" />
          </td>
          <td>
            <input
              type="time"
              v-model="schedule[day.name].start"
              :disabled="!schedule[day.name].active"
            />
          </td>
          <td>
            <input
              type="time"
              v-model="schedule[day.name].end"
              :disabled="!schedule[day.name].active"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="actions">
      <button class="btn" @click="autoFillAll">Rellenar automáticamente</button>
      <button class="btn save-btn" @click="saveSchedules">Guardar Horarios</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const employee = ref(null)
const schedule = ref({})

const days = [
  { name: 'Lunes', value: 1 },
  { name: 'Martes', value: 2 },
  { name: 'Miércoles', value: 3 },
  { name: 'Jueves', value: 4 },
  { name: 'Viernes', value: 5 },
  { name: 'Sábado', value: 6 },
  { name: 'Domingo', value: 7 }
]

const loadSchedules = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      first_name,
      last_name,
      schedules: schedules(day_of_week, start_time, end_time)
    `)
    .eq('id', route.params.id)
    .single()

  if (error) return alert(error.message)
  employee.value = data

  const orderedSchedules = data.schedules?.sort((a, b) => a.day_of_week - b.day_of_week)

  days.forEach(day => {
    const s = orderedSchedules?.find(x => x.day_of_week === day.value)
    schedule.value[day.name] = {
      start: s?.start_time || '',
      end: s?.end_time || '',
      active: !!s
    }
  })
}

onMounted(loadSchedules)

const saveSchedules = async () => {
  const inserts = []

  for (const day of days) {
    const { active, start, end } = schedule.value[day.name]

    if (!active) continue
    if (!start || !end) {
      alert(`Falta asignar hora de inicio o fin para ${day.name}`)
      return
    }

    const existing = employee.value.schedules.find(x => x.day_of_week === day.value)

    if (existing) {
      const { error } = await supabase
        .from('schedules')
        .update({
          start_time: start,
          end_time: end
        })
        .eq('employee_id', employee.value.id)
        .eq('day_of_week', day.value)
      if (error) return alert(error.message)
    } else {
      inserts.push({
        employee_id: employee.value.id,
        day_of_week: day.value,
        start_time: start,
        end_time: end
      })
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from('schedules').insert(inserts)
    if (error) return alert(error.message)
  }

  alert('Horarios guardados correctamente')
  await loadSchedules()
}

const autoFillAll = () => {
  const firstActive = days.find(d => schedule.value[d.name].active)
  if (!firstActive) return
  const start = schedule.value[firstActive.name].start
  const end = schedule.value[firstActive.name].end
  days.forEach(d => {
    if (schedule.value[d.name].active) {
      schedule.value[d.name].start = start
      schedule.value[d.name].end = end
    }
  })
}
</script>

<style scoped>
.schedules-page {
  padding: 2rem;
  background: #f3f4f6;
  min-height: 100vh;
}
.title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1f2937;
}
.schedule-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}
.schedule-table th,
.schedule-table td {
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  text-align: center;
}
.schedule-table th {
  background: #3b82f6;
  color: white;
  font-weight: bold;
}
.schedule-table td input[type="time"] {
  width: 100px;
  padding: 0.2rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}
.schedule-table td input[type="checkbox"] {
  transform: scale(1.2);
}
.actions {
  display: flex;
  gap: 10px;
}
.btn {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}
.save-btn {
  background: #10b981;
}
</style>

<template>
  <div class="modal">
    <div class="modal-content">
      <h2>Agregar Empleado</h2>

      <label>Nombre:</label>
      <input v-model="first_name" type="text" placeholder="Nombre" />

      <label>Apellido:</label>
      <input v-model="last_name" type="text" placeholder="Apellido" />

      <label>Correo:</label>
      <input v-model="email" type="email" placeholder="Correo" />

      <label>Puesto:</label>
      <input v-model="position" type="text" placeholder="Puesto" />

      <h3>Asignar Horario</h3>
      <div v-for="day in days" :key="day.value" class="day-row">
        <input type="checkbox" v-model="schedule[day.value].active" @change="autoFillSchedule(day.value)" />
        <label>{{ day.name }}</label>
        <input type="time" v-model="schedule[day.value].start" step="1800" />
        <input type="time" v-model="schedule[day.value].end" step="1800" />
      </div>

      <div class="modal-actions">
        <button @click="handleAddEmployee" class="btn primary">Guardar</button>
        <button @click="$emit('close')" class="btn">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { v4 as uuidv4 } from 'uuid'

const days = [
  { name: 'Lunes', value: 1 },
  { name: 'Martes', value: 2 },
  { name: 'Miércoles', value: 3 },
  { name: 'Jueves', value: 4 },
  { name: 'Viernes', value: 5 },
  { name: 'Sábado', value: 6 },
  { name: 'Domingo', value: 7 }
]

const first_name = ref('')
const last_name = ref('')
const email = ref('')
const position = ref('')

const schedule = ref({
  1: { active: false, start: '08:00', end: '16:00' },
  2: { active: false, start: '08:00', end: '16:00' },
  3: { active: false, start: '08:00', end: '16:00' },
  4: { active: false, start: '08:00', end: '16:00' },
  5: { active: false, start: '08:00', end: '16:00' },
  6: { active: false, start: '08:00', end: '16:00' },
  7: { active: false, start: '08:00', end: '16:00' }
})

// Rellenar automáticamente horarios
const autoFillSchedule = (dayValue) => {
  const base = schedule.value[dayValue]
  if (!base.active) return
  for (const key in schedule.value) {
    if (key != dayValue) {
      schedule.value[key].start = base.start
      schedule.value[key].end = base.end
    }
  }
}

// Agregar empleado
const handleAddEmployee = async () => {
  const qrCode = uuidv4()
  const createdAt = new Date().toISOString()

  const { data: employeeData, error: employeeError } = await supabase
    .from('employees')
    .insert([{
      first_name: first_name.value,
      last_name: last_name.value,
      email: email.value,
      position: position.value,
      qr_code: qrCode,
      created_at: createdAt
    }])
    .select()

  if (employeeError) return alert(employeeError.message)
  const employee = employeeData[0]

  const inserts = days
    .filter(day => schedule.value[day.value].active)
    .map(day => ({
      employee_id: employee.id,
      day_of_week: day.value,
      start_time: schedule.value[day.value].start,
      end_time: schedule.value[day.value].end
    }))

  if (inserts.length > 0) {
    const { error: scheduleError } = await supabase.from('schedules').insert(inserts)
    if (scheduleError) return alert(scheduleError.message)
  }

  alert('Empleado y horario registrados correctamente')

  
  first_name.value = ''
  last_name.value = ''
  email.value = ''
  position.value = ''
  Object.keys(schedule.value).forEach(day => (schedule.value[day].active = false))

  $emit('added')
}
</script>

<style scoped>
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; }
.modal-content { background: white; padding: 2rem; border-radius: 10px; width: 400px; max-height: 90vh; overflow-y: auto; }
.day-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1rem; }
</style>

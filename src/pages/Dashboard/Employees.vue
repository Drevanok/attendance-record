<template>
  <div class="container">
    <h1>Gestión de Empleados</h1>

    <div class="actions">
      <button @click="showAddModal = true" class="btn primary">Agregar Empleado</button>
    </div>

    <div class="filters">
      <input type="text" v-model="searchQuery" placeholder="Buscar por nombre o apellido" />
  
    </div>

    <table class="employees-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Puesto</th>
          <th>QR</th>
          <th>Fecha Alta</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in filteredEmployees" :key="e.id">
          <td>{{ e.first_name }} {{ e.last_name }}</td>
          <td>{{ e.email }}</td>
          <td>{{ e.position }}</td>
          <td>
            <img :src="`https://api.qrserver.com/v1/create-qr-code/?data=${e.qr_code}&size=80x80`" />
          </td>
          <td>{{ new Date(e.created_at).toLocaleDateString() }}</td>
          <td>
            <router-link :to="`/schedules/${e.id}`" class="btn small-btn">Ver Horario</router-link>
            <router-link :to="`/reports/${e.id}`" class="btn small-btn">Ver Reportes</router-link>
            <router-link :to="`/attendance/${e.id}`" class="btn small-btn">Ver Asistencias</router-link>
            <button @click="deleteEmployee(e.id)" class="btn danger small-btn">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <RegisterEmployee v-if="showAddModal" @close="showAddModal = false" @added="onEmployeeAdded" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import RegisterEmployee from '../../components/RegisterEmployees.vue'

const employees = ref([])
const showAddModal = ref(false)

const searchQuery = ref('')
const filterPosition = ref('')

const loadEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) console.error(error)
  else employees.value = data
}

const deleteEmployee = async (id) => {
  if (!confirm('¿Eliminar este empleado?')) return
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) alert(error.message)
  else loadEmployees()
}

const filteredEmployees = computed(() => {
  return employees.value.filter(e => {
    const matchesQuery =
      e.first_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      e.last_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesPosition = !filterPosition.value || e.position === filterPosition.value
    return matchesQuery && matchesPosition
  })
})


const onEmployeeAdded = () => {
  showAddModal.value = false
  loadEmployees()
}

onMounted(() => loadEmployees())
</script>

<style scoped>
.container {
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  background: #f9fafb;
  min-height: 100vh;
}

/* Título */
h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

/* Acciones */
.actions {
  margin-bottom: 1.5rem;
}
.actions .btn {
  transition: all 0.2s;
}
.actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Buscador y filtro */
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.filters input, .filters select {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  flex: 1;
  font-size: 0.95rem;
  outline: none;
  transition: border 0.2s;
}
.filters input:focus, .filters select:focus {
  border-color: #3b82f6;
}

/* Tabla de empleados */
.employees-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.employees-table th, .employees-table td {
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.95rem;
}

.employees-table th {
  background: #3b82f6;
  color: #ffffff;
  font-weight: 600;
}

.employees-table tr:nth-child(even) {
  background: #f3f4f6;
}

.employees-table img {
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  object-fit: cover;
}

/* Botones */
.btn {
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  cursor: pointer;
  border: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}
.btn.primary {
  background-color: #3b82f6;
  color: #fff;
}
.btn.primary:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}
.btn.danger {
  background-color: #ef4444;
  color: #fff;
}
.btn.danger:hover {
  background-color: #dc2626;
  transform: translateY(-1px);
}
.small-btn {
  margin: 2px 1px;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(17,24,39,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}
.modal-content {
  background: #ffffff;
  padding: 2rem;
  border-radius: 1rem;
  width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: fadeIn 0.3s ease;
}

/* Animación modal */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Campos de formulario */
.modal-content input[type="text"],
.modal-content input[type="email"],
.modal-content input[type="time"] {
  width: 100%;
  padding: 0.45rem 0.65rem;
  margin: 0.25rem 0 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
  outline: none;
  transition: border 0.2s;
}
.modal-content input:focus {
  border-color: #3b82f6;
}

/* Horarios */
.day-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.5rem;
}

/* Acciones modal */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1rem;
}
</style>

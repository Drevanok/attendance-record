import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import Login from '@/pages/Auth/Login.vue'
import RegisterAdmin from '@/pages/Auth/RegisterAdmin.vue'
import Dashboard from '@/pages/Dashboard/Dashboard.vue'
import Attendance from '@/pages/Dashboard/Attendance.vue'
import Employees from '@/pages/Dashboard/Employees.vue'
import Reports from '@/pages/Dashboard/Reports.vue'
import Schedules from '@/pages/Dashboard/Schedules.vue'
import NotFound from '@/pages/NotFound.vue'
import RecoverPassword from '@/pages/Auth/RecoverPassword.vue'           // Nueva
import SendEmailRecoverPassword from '@/pages/Auth/SendEmailRecoverPassword.vue' // Nueva


const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/register-admin', component: RegisterAdmin },
    { path: '/recover-password', component: RecoverPassword },               // Nueva
  { path: '/send-email-recover', component: SendEmailRecoverPassword },
  { path: '/dashboard', component: Dashboard },
  { path: '/attendance/:id', component: Attendance },
  { path: '/employees', component: Employees },
  { path: '/reports/:id', component: Reports },
  { path: '/schedules/:id', component: Schedules },
  { path: '/:pathMatch(.*)*', component: NotFound },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de rutas
router.beforeEach(async (to, from, next) => {
  // Rutas públicas
  const publicPages = ['/login', '/register-admin', '/recover-password', '/send-email-recover']
  const authRequired = !publicPages.includes(to.path)

  const { user, loading, getSession } = useAuth()

  // Esperar a cargar la sesión si está en proceso
  if (loading.value) {
    await getSession()
  }

  // Si la ruta requiere autenticación y no hay usuario, redirige al login
  if (authRequired && !user.value) {
    return next('/login')
  }

  // Si intenta ir a login o registro y ya está logueado, ir al dashboard
  if ((to.path === '/login' || to.path === '/register-admin') && user.value) {
    return next('/dashboard')
  }

  next()
})
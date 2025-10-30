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

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/register-admin', component: RegisterAdmin },
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


router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login', '/register-admin']
  const authRequired = !publicPages.includes(to.path)

  const { user, loading, getSession } = useAuth()

  if (loading.value) {
    await getSession()
  }

  if (authRequired && !user.value) {
    return next('/login')
  }

  if ((to.path === '/login' || to.path === '/register-admin') && user.value) {
    return next('/dashboard')
  }

  next()
})

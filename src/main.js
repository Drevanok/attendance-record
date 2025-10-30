import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/index.js'
import { createPinia } from 'pinia' // si vas a usar stores (recomendado)

const app = createApp(App)

// Crea la instancia de Pinia (opcional)
const pinia = createPinia()
app.use(pinia)

// Registra el router globalmente
app.use(router)

// Monta la app
app.mount('#app')

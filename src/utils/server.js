import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY


const getLocalISO = () => {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - tzOffset).toISOString()
}

app.post('/attendance', async (req, res) => {
  const { qr_code } = req.body
  if (!qr_code) return res.status(400).json({ error: 'No QR code provided' })

  try {
  
    const employeeRes = await fetch(
      `${SUPABASE_URL}/rest/v1/employees?qr_code=eq.${encodeURIComponent(qr_code)}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const employees = await employeeRes.json()
    if (!employees.length) return res.status(404).json({ error: 'Empleado no encontrado' })
    const employee = employees[0]

    const nowISO = getLocalISO()
    const today = nowISO.slice(0, 10)
    const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay()


    const attendanceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${employee.id}&day_of_week=eq.${dayOfWeek}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const attendanceData = await attendanceRes.json()

    let responseStatus = ''
    let message = ''

    if (attendanceData.length === 0) {
     
      await fetch(`${SUPABASE_URL}/rest/v1/attendance`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          check_in: nowISO,
          present: true,
          day_of_week: dayOfWeek
        }),
      })
      responseStatus = 'entrada'
      message = 'Hora de entrada registrada correctamente.'
    } else {
      const record = attendanceData[0]
      if (!record.check_in) {
        
        await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${record.id}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ check_in: nowISO }),
        })
        responseStatus = 'entrada'
        message = 'Hora de entrada registrada correctamente.'
      } else if (!record.check_out) {
        
        await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${record.id}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ check_out: nowISO }),
        })
        responseStatus = 'salida'
        message = 'Hora de salida registrada correctamente.'
      } else {
    
        responseStatus = 'completo'
        message = 'Asistencia de hoy ya completa.'
      }
    }

    res.json({ status: responseStatus, message })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno' })
  }
})

app.listen(3000, '0.0.0.0', () => {
  console.log('Backend escuchando en http://localhost:3000')
})


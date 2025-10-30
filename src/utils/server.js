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
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      }
    )
    const employees = await employeeRes.json()
    if (!employees.length) return res.status(404).json({ error: 'Empleado no encontrado' })

    const employee = employees[0]
    const nowISO = getLocalISO()
    const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay()

    
    const todayStart = nowISO.slice(0, 10) + 'T00:00:00'
    const todayEnd = nowISO.slice(0, 10) + 'T23:59:59'

    const attendanceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/attendance?employee_id=eq.${employee.id}&check_in=gte.${todayStart}&check_in=lte.${todayEnd}`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      }
    )
    const attendanceData = await attendanceRes.json()

    let attendance

    if (attendanceData.length === 0) {

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          check_in: nowISO,
          present: true,
          day_of_week: dayOfWeek
        }),
      })
      attendance = await insertRes.json().catch(() => null)
    } else {
    
      const recordId = attendanceData[0].id
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${recordId}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_out: nowISO }),
      })
      attendance = await updateRes.json().catch(() => null)
    }

    res.json({ success: true, attendance })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno' })
  }
})

app.listen(3000, () => 
  console.log('Backend escuchando en http://localhost:3000')
)

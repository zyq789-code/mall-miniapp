import express from 'express'
import cors from 'cors'
import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() })
})

app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)

app.listen(PORT, () => {
  console.log(`Mall server listening on http://localhost:${PORT}`)
})

import express from 'express'
import cors from 'cors'
import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'
import authRouter from './routes/auth.js'
import userRouter from './routes/user.js'
import cartRouter from './routes/cart.js'
import addressRouter from './routes/address.js'
import userAssetsRouter from './routes/userAssets.js'
import userExtrasRouter from './routes/userExtras.js'
import uploadRouter from './routes/upload.js'

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    service: 'mall-api',
    status: 'running',
    endpoints: ['/api/health', '/api/products', '/api/orders', '/api/auth/login', '/api/user'],
    note: '这是一个纯 API 服务，前端（小程序 H5/管理后台）通过 /api 调用',
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() })
})

app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/cart', cartRouter)
app.use('/api/addresses', addressRouter)
// 注意挂载顺序：userAssets 内部对全部请求做了 requireUser（含公共接口），
// userExtras 含公开的 GET /reviews，必须先于 userAssets 挂载才能被公开访问。
app.use('/api', userExtrasRouter) // /api/reviews /api/aftersales /api/user/points /api/user/spend
app.use('/api', userAssetsRouter) // /api/favorites /api/footprints /api/coupons
app.use('/api/upload', uploadRouter)

app.listen(PORT, () => {
  console.log(`Mall server listening on http://localhost:${PORT}`)
})

import { Router, type Response } from 'express'
import db from '../db.js'
import { requireUser, type UserPayload } from '../middleware/userAuth.js'

/**
 * 评价 / 售后 / 积分联动（用户隔离）。
 * 注意：评价的 GET 列表是公开接口（商品详情页展示），所以本路由不使用全局 requireUser，
 * 而是逐接口挂载。
 */
const router = Router()

const userIdOf = (res: Response): string => (res.locals.user as UserPayload).userId

// ---------- 用户 DTO ----------

interface UserRow {
  id: string
  username: string
  password: string
  nickname: string | null
  avatar: string | null
  points: number
  total_spent: number
  last_sign_in: string | null
}

interface UserDto {
  id: string
  username: string
  nickname: string | null
  avatar: string | null
  points: number
  totalSpent: number
  lastSignIn: string | null
}

function toUserDTO(row: UserRow): UserDto {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    avatar: row.avatar,
    points: row.points,
    totalSpent: row.total_spent,
    lastSignIn: row.last_sign_in,
  }
}

function getUserById(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

interface OrderRef {
  id: string
  user_id: string | null
}

function getOrderById(id: string): OrderRef | undefined {
  return db.prepare('SELECT id, user_id FROM orders WHERE id = ?').get(id) as OrderRef | undefined
}

// ---------- 评价 ----------

interface ReviewRow {
  id: string
  user_id: string
  order_id: string
  goods_id: string
  stars: number
  content: string
  anonymous: number
  time: number
}

interface ReviewDto {
  id: string
  orderId: string
  goodsId: string
  stars: number
  content: string
  anonymous: boolean
  time: number
}

function toReviewDTO(row: ReviewRow): ReviewDto {
  return {
    id: row.id,
    orderId: row.order_id,
    goodsId: row.goods_id,
    stars: row.stars,
    content: row.content,
    anonymous: row.anonymous === 1,
    time: row.time,
  }
}

/** POST /api/reviews → 写评价（需登录；同一 order+goods 只能评一次 → 400）。 */
router.post('/reviews', requireUser, (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
    const goodsId = typeof body.goodsId === 'string' ? body.goodsId.trim() : ''
    const stars = body.stars
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const anonymous = body.anonymous === true

    if (!orderId || !goodsId) {
      res.status(400).json({ success: false, message: 'orderId/goodsId 必填' })
      return
    }
    if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 1 || stars > 5) {
      res.status(400).json({ success: false, message: '评分需在 1-5 星' })
      return
    }
    if (!content) {
      res.status(400).json({ success: false, message: '请填写评价内容' })
      return
    }
    if (content.length > 500) {
      res.status(400).json({ success: false, message: '评价内容不能超过 500 字' })
      return
    }

    const order = getOrderById(orderId)
    if (!order) {
      res.status(404).json({ success: false, message: '订单不存在' })
      return
    }
    // 用户隔离：订单属于他人时拒绝（订单可能来自未登录历史数据 user_id 为空，放行）。
    if (order.user_id && order.user_id !== userIdOf(res)) {
      res.status(403).json({ success: false, message: '无权评价该订单' })
      return
    }

    const userId = userIdOf(res)
    const duplicated = db
      .prepare('SELECT 1 FROM reviews WHERE order_id = ? AND goods_id = ?')
      .get(orderId, goodsId)
    if (duplicated) {
      res.status(400).json({ success: false, message: '该商品已评价，不能重复评价' })
      return
    }

    const id = `r${Date.now()}`
    db.prepare(
      'INSERT INTO reviews (id, user_id, order_id, goods_id, stars, content, anonymous, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, userId, orderId, goodsId, stars, content, anonymous ? 1 : 0, Date.now())

    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as unknown as ReviewRow
    res.status(201).json({ success: true, data: toReviewDTO(row) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** GET /api/reviews?goodsId= → 该商品评价列表（公开，商品详情页展示）。 */
router.get('/reviews', (req, res) => {
  try {
    const goodsId = typeof req.query.goodsId === 'string' ? req.query.goodsId.trim() : ''
    if (!goodsId) {
      res.status(400).json({ success: false, message: 'goodsId 必填' })
      return
    }
    const rows = db
      .prepare('SELECT * FROM reviews WHERE goods_id = ? ORDER BY time DESC')
      .all(goodsId) as unknown as ReviewRow[]
    res.json({ success: true, data: { list: rows.map(toReviewDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

// ---------- 售后 ----------

const VALID_AFTERSALE_TYPES = new Set(['refund', 'return'])

interface AfterSaleRow {
  id: string
  user_id: string
  order_id: string
  type: string
  status: string
  reason: string
  apply_time: number
}

interface AfterSaleDto {
  id: string
  orderId: string
  type: 'refund' | 'return'
  status: string
  reason: string
  applyTime: number
}

function toAfterSaleDTO(row: AfterSaleRow): AfterSaleDto {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type as 'refund' | 'return',
    status: row.status,
    reason: row.reason,
    applyTime: row.apply_time,
  }
}

/** POST /api/aftersales → 申请售后（需登录；同订单已有 pending/approved → 400）。 */
router.post('/aftersales', requireUser, (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
    const type = typeof body.type === 'string' ? body.type : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!orderId || !VALID_AFTERSALE_TYPES.has(type)) {
      res.status(400).json({ success: false, message: 'orderId/type 不合法' })
      return
    }
    if (!reason) {
      res.status(400).json({ success: false, message: '请填写申请原因' })
      return
    }
    if (reason.length > 200) {
      res.status(400).json({ success: false, message: '申请原因不能超过 200 字' })
      return
    }

    const order = getOrderById(orderId)
    if (!order) {
      res.status(404).json({ success: false, message: '订单不存在' })
      return
    }
    // 用户隔离：只能为属于自己的订单申请售后。
    if (order.user_id && order.user_id !== userIdOf(res)) {
      res.status(403).json({ success: false, message: '无权操作该订单' })
      return
    }

    const userId = userIdOf(res)
    const existing = db
      .prepare("SELECT 1 FROM aftersales WHERE order_id = ? AND status IN ('pending', 'approved')")
      .get(orderId)
    if (existing) {
      res.status(400).json({ success: false, message: '该订单已有进行中的售后申请' })
      return
    }

    const id = `as${Date.now()}`
    db.prepare(
      'INSERT INTO aftersales (id, user_id, order_id, type, status, reason, apply_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, userId, orderId, type, 'pending', reason, Date.now())

    const row = db.prepare('SELECT * FROM aftersales WHERE id = ?').get(id) as unknown as AfterSaleRow
    res.status(201).json({ success: true, data: toAfterSaleDTO(row) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** GET /api/aftersales → 当前用户的售后列表。 */
router.get('/aftersales', requireUser, (req, res) => {
  try {
    const rows = db
      .prepare('SELECT * FROM aftersales WHERE user_id = ? ORDER BY apply_time DESC')
      .all(userIdOf(res)) as unknown as AfterSaleRow[]
    res.json({ success: true, data: { list: rows.map(toAfterSaleDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

// ---------- 积分联动 ----------

/** POST /api/user/points → points += delta（可正可负，结果不能 <0）。返回新 profile。 */
router.post('/user/points', requireUser, (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const delta = body.delta
    if (typeof delta !== 'number' || !Number.isInteger(delta)) {
      res.status(400).json({ success: false, message: 'delta 必须是整数' })
      return
    }
    const userId = userIdOf(res)
    const user = getUserById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' })
      return
    }
    const newPoints = (user.points ?? 0) + delta
    if (newPoints < 0) {
      res.status(400).json({ success: false, message: '积分不足' })
      return
    }
    db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, userId)
    res.json({ success: true, data: toUserDTO(getUserById(userId) as UserRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** POST /api/user/spend → totalSpent += amount（分）。返回新 profile。 */
router.post('/user/spend', requireUser, (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const amount = body.amount
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      res.status(400).json({ success: false, message: 'amount 必须是非负数字' })
      return
    }
    const userId = userIdOf(res)
    const user = getUserById(userId)
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' })
      return
    }
    const newTotal = (user.total_spent ?? 0) + Math.round(amount)
    db.prepare('UPDATE users SET total_spent = ? WHERE id = ?').run(newTotal, userId)
    res.json({ success: true, data: toUserDTO(getUserById(userId) as UserRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

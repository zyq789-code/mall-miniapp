import { Router } from 'express'
import type { Request } from 'express'
import db from '../db.js'
import { requireAuth, verifyToken } from '../middleware/auth.js'
import { requireUser, type UserPayload } from '../middleware/userAuth.js'

const router = Router()

/** Allowed order lifecycle states. */
const VALID_STATUSES = new Set([
  'pending_pay',
  'pending_ship',
  'pending_receive',
  'completed',
  'canceled',
])

/** Allowed transitions: from status -> target statuses. Anything else is a 409. */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  pending_pay: ['pending_ship', 'canceled'],
  pending_ship: ['pending_receive'],
  pending_receive: ['completed'],
  completed: [],
  canceled: [],
}

interface OrderRow {
  id: string
  order_no: string
  status: string
  total_amount: number
  freight: number
  pay_amount: number
  address: string
  items: string
  coupon_deduction: number
  points_deduction: number
  create_time: number
  pay_time: number | null
  ship_time: number | null
  receive_time: number | null
  user_id: string | null
}

interface OrderDto {
  id: string
  orderNo: string
  status: string
  totalAmount: number
  freight: number
  payAmount: number
  address: unknown
  items: unknown[]
  couponDeduction: number
  pointsDeduction: number
  createTime: number
  payTime: number | null
  shipTime: number | null
  receiveTime: number | null
  userId: string | null
}

function toDTO(row: OrderRow): OrderDto {
  let address: unknown = null
  try {
    address = JSON.parse(row.address)
  } catch {
    address = null
  }
  let items: unknown[] = []
  try {
    const parsed = JSON.parse(row.items)
    items = Array.isArray(parsed) ? parsed : []
  } catch {
    items = []
  }
  return {
    id: row.id,
    orderNo: row.order_no,
    status: row.status,
    totalAmount: row.total_amount,
    freight: row.freight,
    payAmount: row.pay_amount,
    address,
    items,
    couponDeduction: row.coupon_deduction,
    pointsDeduction: row.points_deduction,
    createTime: row.create_time,
    payTime: row.pay_time,
    shipTime: row.ship_time,
    receiveTime: row.receive_time,
    userId: row.user_id ?? null,
  }
}

function getOrderById(id: string): OrderRow | undefined {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined
}

/** 从 Authorization 头解析用户 userId；无 token / 非用户 token 时返回 null（下单允许未登录）。 */
function optionalUserId(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'user') return null
  return (payload as { userId: string }).userId ?? null
}

router.get('/', (req, res) => {
  try {
    const { status } = req.query
    const where: string[] = []
    const params: string[] = []
    if (typeof status === 'string' && status) {
      where.push('status = ?')
      params.push(status)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = db
      .prepare(`SELECT * FROM orders ${whereSql} ORDER BY create_time DESC, id DESC`)
      .all(...params) as unknown as OrderRow[]

    res.json({ success: true, data: { list: rows.map(toDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** GET /api/orders/mine → 当前登录用户自己的订单（小程序"我的订单"）。 */
router.get('/mine', requireUser, (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const rows = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY create_time DESC, id DESC')
      .all(userId) as unknown as OrderRow[]
    res.json({ success: true, data: { list: rows.map(toDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const row = getOrderById(req.params.id)
    if (!row) {
      res.status(404).json({ success: false, message: 'order not found' })
      return
    }
    res.json({ success: true, data: toDTO(row) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** Miniapp order create (public, no token). items/address are stored as JSON strings. */
router.post('/', (req, res) => {
  try {
    const body = ((req.body ?? {}) as Record<string, unknown>) ?? {}

    if (typeof body.orderNo !== 'string' || !body.orderNo.trim()) {
      res.status(400).json({ success: false, message: 'orderNo is required' })
      return
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ success: false, message: 'items must be a non-empty array' })
      return
    }
    if (typeof body.address !== 'object' || body.address === null || Array.isArray(body.address)) {
      res.status(400).json({ success: false, message: 'address is required' })
      return
    }
    if (typeof body.payAmount !== 'number' || !Number.isFinite(body.payAmount) || body.payAmount < 0) {
      res.status(400).json({ success: false, message: 'payAmount must be a non-negative number' })
      return
    }
    const status = typeof body.status === 'string' ? body.status : 'pending_pay'
    if (!VALID_STATUSES.has(status)) {
      res.status(400).json({ success: false, message: 'status 不合法' })
      return
    }

    let id: string
    if (typeof body.id === 'string' && body.id) {
      id = body.id
      if (getOrderById(id)) {
        res.status(409).json({ success: false, message: '订单已存在' })
        return
      }
    } else {
      id = `o${Date.now()}`
    }

    const num = (v: unknown, def: number) => (typeof v === 'number' && Number.isFinite(v) ? v : def)

    // 兼容旧客户端：允许未登录下单，但若带了用户 token 则把订单挂到该用户。
    const userId = optionalUserId(req)

    db.prepare(`
      INSERT INTO orders (id, order_no, status, total_amount, freight, pay_amount, address, items, coupon_deduction, points_deduction, create_time, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.orderNo.trim(),
      status,
      num(body.totalAmount, 0),
      num(body.freight, 0),
      body.payAmount,
      JSON.stringify(body.address),
      JSON.stringify(body.items),
      num(body.couponDeduction, 0),
      num(body.pointsDeduction, 0),
      num(body.createTime, Date.now()),
      userId,
    )

    res.status(201).json({ success: true, data: toDTO(getOrderById(id) as OrderRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** Admin-only: mark a pending-ship order as shipped. */
router.put('/:id/ship', requireAuth, (req, res) => {
  try {
    const existing = getOrderById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'order not found' })
      return
    }
    if (existing.status !== 'pending_ship') {
      res.status(409).json({ success: false, message: '当前状态不可发货' })
      return
    }
    db.prepare("UPDATE orders SET status = 'pending_receive', ship_time = ? WHERE id = ?").run(
      Date.now(),
      req.params.id,
    )
    res.json({ success: true, data: toDTO(getOrderById(req.params.id) as OrderRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** Generic lifecycle update (used by the miniapp). */
router.put('/:id/status', (req, res) => {
  try {
    const target = (req.body as Record<string, unknown>).status
    if (typeof target !== 'string' || !VALID_STATUSES.has(target)) {
      res.status(400).json({ success: false, message: 'status 不合法' })
      return
    }
    const existing = getOrderById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'order not found' })
      return
    }
    if (!ALLOWED_TRANSITIONS[existing.status].includes(target)) {
      res.status(409).json({ success: false, message: '当前状态不允许该流转' })
      return
    }

    const now = Date.now()
    const setMap: Record<string, string | number> = { status: target }
    if (existing.status === 'pending_pay' && target === 'pending_ship') setMap.pay_time = now
    if (existing.status === 'pending_receive' && target === 'completed') setMap.receive_time = now

    const assignments = Object.entries(setMap)
      .map(([col]) => `${col} = ?`)
      .join(', ')
    db.prepare(`UPDATE orders SET ${assignments} WHERE id = ?`).run(
      ...Object.values(setMap),
      req.params.id,
    )

    res.json({ success: true, data: toDTO(getOrderById(req.params.id) as OrderRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

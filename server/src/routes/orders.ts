import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

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
  }
}

function getOrderById(id: string): OrderRow | undefined {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined
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

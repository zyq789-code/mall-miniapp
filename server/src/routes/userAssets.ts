import { Router, type Response } from 'express'
import db from '../db.js'
import { couponSeeds } from '../seed.js'
import { requireUser, type UserPayload } from '../middleware/userAuth.js'

const router = Router()

// ---------- DTO 类型 ----------
interface UserCouponRow {
  id: string
  coupon_id: string
  user_id: string
  name: string
  type: string
  threshold: number
  discount: number
  scope: string
  start_at: number
  end_at: number
  status: string
  received_at: number
}

type CouponType = 'reduce' | 'discount'
type CouponStatus = 'unused' | 'used' | 'expired'

interface UserCouponDto {
  id: string
  couponId: string
  userId: string
  name: string
  type: CouponType
  threshold: number
  discount: number
  scope: 'all' | string[]
  startAt: number
  endAt: number
  status: CouponStatus
  receivedAt: number
}

/** scope 列存 'all' 或 JSON 数组字符串，读回时还原。 */
function parseScope(raw: string): 'all' | string[] {
  if (raw === 'all') return 'all'
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : 'all'
  } catch {
    return 'all'
  }
}

function toCouponDTO(row: UserCouponRow): UserCouponDto {
  let status: CouponStatus = row.status as CouponStatus
  // 未使用的过期券 → 展示为 expired（不改库，避免已领过期券再次计算）。
  if (status === 'unused' && row.end_at < Date.now()) status = 'expired'
  return {
    id: row.id,
    couponId: row.coupon_id,
    userId: row.user_id,
    name: row.name,
    type: row.type as CouponType,
    threshold: row.threshold,
    discount: row.discount,
    scope: parseScope(row.scope),
    startAt: row.start_at,
    endAt: row.end_at,
    status,
    receivedAt: row.received_at,
  }
}

/** 所有收藏/足迹/优惠券接口都只操作当前登录用户的数据（用户隔离）。 */
router.use(requireUser)

const userIdOf = (res: Response): string => (res.locals.user as UserPayload).userId

// ---------- 收藏 ----------

/** GET /api/favorites → 当前用户收藏的商品 id 列表。 */
router.get('/favorites', (req, res) => {
  try {
    const rows = db
      .prepare('SELECT goods_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC')
      .all(userIdOf(res)) as unknown as Array<{ goods_id: string }>
    res.json({ success: true, data: { list: rows.map((r) => r.goods_id), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** POST /api/favorites → 收藏（幂等）。body { goodsId }。 */
router.post('/favorites', (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const goodsId = typeof body.goodsId === 'string' ? body.goodsId.trim() : ''
    if (!goodsId) {
      res.status(400).json({ success: false, message: 'goodsId 必填' })
      return
    }
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, goods_id, created_at) VALUES (?, ?, ?)').run(
      userIdOf(res),
      goodsId,
      Date.now(),
    )
    res.status(201).json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** DELETE /api/favorites/:goodsId → 取消收藏。 */
router.delete('/favorites/:goodsId', (req, res) => {
  try {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND goods_id = ?').run(userIdOf(res), req.params.goodsId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

// ---------- 足迹 ----------

interface FootprintRow {
  goods_id: string
  time: number
}

/** GET /api/footprints → 当前用户足迹（倒序、同 goodsId 保留最新、最多 50）。 */
router.get('/footprints', (req, res) => {
  try {
    const rows = db
      .prepare(
        'SELECT goods_id, MAX(time) AS time FROM footprints WHERE user_id = ? GROUP BY goods_id ORDER BY time DESC LIMIT 50',
      )
      .all(userIdOf(res)) as unknown as FootprintRow[]
    res.json({ success: true, data: { list: rows.map((r) => ({ goodsId: r.goods_id, time: r.time })), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** POST /api/footprints → 记录足迹（幂等：同 goodsId 覆盖 time）。body { goodsId }。 */
router.post('/footprints', (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const goodsId = typeof body.goodsId === 'string' ? body.goodsId.trim() : ''
    if (!goodsId) {
      res.status(400).json({ success: false, message: 'goodsId 必填' })
      return
    }
    const now = Date.now()
    db.prepare('DELETE FROM footprints WHERE user_id = ? AND goods_id = ?').run(userIdOf(res), goodsId)
    db.prepare('INSERT INTO footprints (user_id, goods_id, time) VALUES (?, ?, ?)').run(userIdOf(res), goodsId, now)
    res.status(201).json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** DELETE /api/footprints → 清空当前用户足迹。 */
router.delete('/footprints', (req, res) => {
  try {
    db.prepare('DELETE FROM footprints WHERE user_id = ?').run(userIdOf(res))
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

// ---------- 优惠券 ----------

/** GET /api/coupons → 当前用户已领券（expired 由后端按 end_at 计算）。 */
router.get('/coupons', (req, res) => {
  try {
    const rows = db
      .prepare('SELECT * FROM user_coupons WHERE user_id = ? ORDER BY received_at DESC')
      .all(userIdOf(res)) as unknown as UserCouponRow[]
    res.json({ success: true, data: { list: rows.map(toCouponDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** POST /api/coupons/claim → 从领券中心种子领取。body { couponId }。重复领取同 couponId → 400。 */
router.post('/coupons/claim', (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const couponId = typeof body.couponId === 'string' ? body.couponId.trim() : ''
    if (!couponId) {
      res.status(400).json({ success: false, message: 'couponId 必填' })
      return
    }
    const seed = couponSeeds.find((c) => c.id === couponId)
    if (!seed) {
      res.status(404).json({ success: false, message: '优惠券不存在' })
      return
    }
    const userId = userIdOf(res)
    const existing = db
      .prepare('SELECT 1 FROM user_coupons WHERE user_id = ? AND coupon_id = ?')
      .get(userId, couponId)
    if (existing) {
      res.status(400).json({ success: false, message: '已领取' })
      return
    }
    const id = `uc${Date.now()}`
    db.prepare(
      'INSERT INTO user_coupons (id, coupon_id, user_id, name, type, threshold, discount, scope, start_at, end_at, status, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      id,
      seed.id,
      userId,
      seed.name,
      seed.type,
      seed.threshold,
      seed.discount,
      JSON.stringify(seed.scope),
      seed.startAt,
      seed.endAt,
      'unused',
      Date.now(),
    )
    const row = db
      .prepare('SELECT * FROM user_coupons WHERE id = ?')
      .get(id) as unknown as UserCouponRow | undefined
    res.status(201).json({ success: true, data: row ? toCouponDTO(row) : undefined })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** PUT /api/coupons/:id/status → 标记 used（下单用券时）。body { status }。 */
router.put('/coupons/:id/status', (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const status = body.status
    if (status !== 'used') {
      res.status(400).json({ success: false, message: 'status 仅支持 used' })
      return
    }
    const userId = userIdOf(res)
    const row = db
      .prepare('SELECT * FROM user_coupons WHERE id = ? AND user_id = ?')
      .get(req.params.id, userId) as unknown as UserCouponRow | undefined
    if (!row) {
      res.status(404).json({ success: false, message: '优惠券不存在' })
      return
    }
    db.prepare("UPDATE user_coupons SET status = 'used' WHERE id = ? AND user_id = ?").run(req.params.id, userId)
    const updated = db
      .prepare('SELECT * FROM user_coupons WHERE id = ?')
      .get(req.params.id) as unknown as UserCouponRow
    res.json({ success: true, data: toCouponDTO(updated) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

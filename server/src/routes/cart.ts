import { Router } from 'express'
import db from '../db.js'
import { requireUser, type UserPayload } from '../middleware/userAuth.js'

const router = Router()

interface CartRow {
  id: number
  user_id: string
  goods_id: string
  sku_id: string
  quantity: number
  checked: number
  added_at: number
}

interface CartItemDto {
  goodsId: string
  skuId: string
  quantity: number
  checked: boolean
  addedAt: number
}

function toDTO(row: CartRow): CartItemDto {
  return {
    goodsId: row.goods_id,
    skuId: row.sku_id,
    quantity: row.quantity,
    checked: !!row.checked,
    addedAt: row.added_at,
  }
}

const getCartRow = (userId: string, goodsId: string, skuId: string): CartRow | undefined =>
  db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND goods_id = ? AND sku_id = ?').get(
    userId,
    goodsId,
    skuId,
  ) as CartRow | undefined

/** 所有购物车接口都只操作当前登录用户的购物车（用户隔离）。 */
router.use(requireUser)

/** GET /api/cart → 当前用户购物车项列表（前端用 goodsRepo 拉商品详情）。 */
router.get('/', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const rows = db
      .prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY id ASC')
      .all(userId) as unknown as CartRow[]
    res.json({ success: true, data: { list: rows.map(toDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** POST /api/cart → upsert：同用户同 goods+sku 则数量累加，否则新增。body { goodsId, skuId, quantity }。 */
router.post('/', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const body = (req.body ?? {}) as Record<string, unknown>
    const goodsId = typeof body.goodsId === 'string' ? body.goodsId.trim() : ''
    const skuId = typeof body.skuId === 'string' ? body.skuId.trim() : ''
    const quantity =
      typeof body.quantity === 'number' && Number.isInteger(body.quantity) && body.quantity > 0
        ? body.quantity
        : null
    if (!goodsId || !skuId || quantity === null) {
      res.status(400).json({ success: false, message: 'goodsId/skuId/quantity 参数不合法' })
      return
    }

    const existing = getCartRow(userId, goodsId, skuId)
    if (existing) {
      db.prepare(
        'UPDATE cart_items SET quantity = quantity + ?, checked = 1 WHERE user_id = ? AND goods_id = ? AND sku_id = ?',
      ).run(quantity, userId, goodsId, skuId)
    } else {
      db.prepare(
        'INSERT INTO cart_items (user_id, goods_id, sku_id, quantity, checked, added_at) VALUES (?, ?, ?, ?, 1, ?)',
      ).run(userId, goodsId, skuId, quantity, Date.now())
    }

    const row = getCartRow(userId, goodsId, skuId)
    res.status(201).json({ success: true, data: toDTO(row as CartRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** PUT /api/cart/:goodsId/:skuId → 更新数量/勾选。body 至少提供 { quantity? } 或 { checked? } 之一。 */
router.put('/:goodsId/:skuId', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const { goodsId, skuId } = req.params
    const existing = getCartRow(userId, goodsId, skuId)
    if (!existing) {
      res.status(404).json({ success: false, message: '购物车项不存在' })
      return
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const quantity =
      typeof body.quantity === 'number' && Number.isInteger(body.quantity) && body.quantity > 0
        ? body.quantity
        : undefined
    const checked = typeof body.checked === 'boolean' ? (body.checked ? 1 : 0) : undefined
    if (quantity === undefined && checked === undefined) {
      res.status(400).json({ success: false, message: 'quantity/checked 至少提供一个' })
      return
    }

    const sets: string[] = []
    const params: (string | number)[] = []
    if (quantity !== undefined) {
      sets.push('quantity = ?')
      params.push(quantity)
    }
    if (checked !== undefined) {
      sets.push('checked = ?')
      params.push(checked)
    }
    db.prepare(`UPDATE cart_items SET ${sets.join(', ')} WHERE user_id = ? AND goods_id = ? AND sku_id = ?`).run(
      ...params,
      userId,
      goodsId,
      skuId,
    )

    res.json({ success: true, data: toDTO(getCartRow(userId, goodsId, skuId) as CartRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** DELETE /api/cart/clear → 清空当前用户购物车（下单后清结算项用）。 */
router.delete('/clear', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** DELETE /api/cart/:goodsId/:skuId → 删除单个购物车项。 */
router.delete('/:goodsId/:skuId', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND goods_id = ? AND sku_id = ?').run(
      userId,
      req.params.goodsId,
      req.params.skuId,
    )
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

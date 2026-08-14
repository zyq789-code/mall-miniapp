import { Router } from 'express'
import db from '../db.js'
import { requireUser, type UserPayload } from '../middleware/userAuth.js'

const router = Router()

interface AddressRow {
  id: string
  user_id: string
  name: string
  phone: string
  region: string
  detail: string
  is_default: number
}

interface AddressDto {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

function toDTO(row: AddressRow): AddressDto {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    region: row.region,
    detail: row.detail,
    isDefault: !!row.is_default,
  }
}

const getAddressRow = (userId: string, id: string): AddressRow | undefined =>
  db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, userId) as AddressRow | undefined

/** 所有地址接口都只操作当前登录用户的地址（用户隔离）。 */
router.use(requireUser)

/** GET /api/addresses → 当前用户地址列表（默认地址排前）。 */
router.get('/', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const rows = db
      .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC')
      .all(userId) as unknown as AddressRow[]
    res.json({ success: true, data: { list: rows.map(toDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** POST /api/addresses → 新增。body { name, phone, region, detail, isDefault? }。第一条或 isDefault 设默认并清其他。 */
router.post('/', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const body = (req.body ?? {}) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const region = typeof body.region === 'string' ? body.region.trim() : ''
    const detail = typeof body.detail === 'string' ? body.detail.trim() : ''
    if (!name || !/^\d{11}$/.test(phone) || !region || !detail) {
      res.status(400).json({ success: false, message: 'name/phone(11位手机号)/region/detail 必填' })
      return
    }

    const countRow = db.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').get(userId) as { n: number }
    const isDefault = body.isDefault === true || countRow.n === 0
    const id = `a${Date.now()}`

    if (isDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId)
    db.prepare(
      'INSERT INTO addresses (id, user_id, name, phone, region, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(id, userId, name, phone, region, detail, isDefault ? 1 : 0)

    res.status(201).json({ success: true, data: toDTO(getAddressRow(userId, id) as AddressRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** PUT /api/addresses/:id → 更新（改默认时清其他默认）。 */
router.put('/:id', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    const existing = getAddressRow(userId, req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: '地址不存在' })
      return
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : existing.name
    const phone = typeof body.phone === 'string' ? body.phone.trim() : existing.phone
    const region = typeof body.region === 'string' ? body.region.trim() : existing.region
    const detail = typeof body.detail === 'string' ? body.detail.trim() : existing.detail
    if (!name || !/^\d{11}$/.test(phone) || !region || !detail) {
      res.status(400).json({ success: false, message: 'name/phone(11位手机号)/region/detail 必填' })
      return
    }
    const isDefault = typeof body.isDefault === 'boolean' ? body.isDefault : !!existing.is_default

    if (isDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(userId)
    db.prepare(
      'UPDATE addresses SET name = ?, phone = ?, region = ?, detail = ?, is_default = ? WHERE id = ? AND user_id = ?',
    ).run(name, phone, region, detail, isDefault ? 1 : 0, req.params.id, userId)

    res.json({ success: true, data: toDTO(getAddressRow(userId, req.params.id) as AddressRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

/** DELETE /api/addresses/:id → 删除。 */
router.delete('/:id', (req, res) => {
  try {
    const userId = (res.locals.user as UserPayload).userId
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, userId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

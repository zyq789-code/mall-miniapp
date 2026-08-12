import { Router } from 'express'
import db from '../db.js'

const router = Router()

interface ProductRow {
  id: string
  name: string
  subtitle: string
  category_id: string
  price: number
  original_price: number
  stock: number
  sales: number
  tags: string
  status: string
  cover: string
  created_at: number
}

interface ProductDto {
  id: string
  name: string
  subtitle: string
  categoryId: string
  price: number
  originalPrice: number
  stock: number
  sales: number
  tags: string[]
  status: string
  cover: string
  createdAt: number
}

/** Fields a client may write (snake_case only in SQL, camelCase over the wire). */
interface ProductInput {
  name?: string
  subtitle?: string
  categoryId?: string
  price?: number
  originalPrice?: number
  stock?: number
  sales?: number
  tags?: string[]
  cover?: string
  status?: string
}

type ValidationResult = { ok: true; value: ProductInput } | { ok: false; message: string }

/** Expand a category id to include its leaf children (first-level → leaves). */
function collectCategoryIds(categoryId: string): string[] {
  const ids = [categoryId]
  const rows = db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(categoryId)
  for (const row of rows as Array<{ id: string }>) ids.push(row.id)
  return ids
}

function toDTO(row: ProductRow): ProductDto {
  let tags: string[] = []
  try {
    tags = JSON.parse(row.tags)
  } catch {
    tags = []
  }
  return {
    id: row.id,
    name: row.name,
    subtitle: row.subtitle,
    categoryId: row.category_id,
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    sales: row.sales,
    tags,
    status: row.status,
    cover: row.cover,
    createdAt: row.created_at,
  }
}

function getProductById(id: string): ProductRow | undefined {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined
}

/** Validate a write body. `partial` allows updating a subset of fields (PUT). */
function validateProductInput(body: Record<string, unknown>, partial: boolean): ValidationResult {
  const value: ProductInput = {}

  if (!partial) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return { ok: false, message: 'name is required' }
    }
    if (typeof body.categoryId !== 'string' || !body.categoryId.trim()) {
      return { ok: false, message: 'categoryId is required' }
    }
    if (typeof body.price !== 'number' || !Number.isInteger(body.price) || body.price <= 0) {
      return { ok: false, message: 'price must be a positive integer' }
    }
    value.name = body.name.trim()
    value.categoryId = body.categoryId.trim()
    value.price = body.price
  } else {
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) return { ok: false, message: 'name must be a non-empty string' }
      value.name = body.name.trim()
    }
    if (body.categoryId !== undefined) {
      if (typeof body.categoryId !== 'string' || !body.categoryId.trim()) return { ok: false, message: 'categoryId must be a non-empty string' }
      value.categoryId = body.categoryId.trim()
    }
    if (body.price !== undefined) {
      if (typeof body.price !== 'number' || !Number.isInteger(body.price) || body.price <= 0) return { ok: false, message: 'price must be a positive integer' }
      value.price = body.price
    }
  }

  if (body.originalPrice !== undefined) {
    if (typeof body.originalPrice !== 'number' || !Number.isInteger(body.originalPrice) || body.originalPrice < 0) {
      return { ok: false, message: 'originalPrice must be a non-negative integer' }
    }
    value.originalPrice = body.originalPrice
  }
  if (body.stock !== undefined) {
    if (typeof body.stock !== 'number' || !Number.isInteger(body.stock) || body.stock < 0) {
      return { ok: false, message: 'stock must be a non-negative integer' }
    }
    value.stock = body.stock
  }
  if (body.sales !== undefined) {
    if (typeof body.sales !== 'number' || !Number.isInteger(body.sales) || body.sales < 0) {
      return { ok: false, message: 'sales must be a non-negative integer' }
    }
    value.sales = body.sales
  }

  if (body.subtitle !== undefined) {
    if (typeof body.subtitle !== 'string') return { ok: false, message: 'subtitle must be a string' }
    value.subtitle = body.subtitle
  }
  if (body.cover !== undefined) {
    if (typeof body.cover !== 'string') return { ok: false, message: 'cover must be a string' }
    value.cover = body.cover
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== 'string')) {
      return { ok: false, message: 'tags must be an array of strings' }
    }
    value.tags = body.tags as string[]
  }

  if (body.status !== undefined) {
    if (body.status !== 'on' && body.status !== 'off') return { ok: false, message: "status must be 'on' or 'off'" }
    value.status = body.status
  }

  return { ok: true, value }
}

router.get('/', (req, res) => {
  try {
    const { categoryId, status, keyword } = req.query
    const where: string[] = []
    const params: (string | number)[] = []

    if (typeof categoryId === 'string' && categoryId) {
      const ids = collectCategoryIds(categoryId)
      where.push(`category_id IN (${ids.map(() => '?').join(',')})`)
      params.push(...ids)
    }
    if (typeof status === 'string' && status) {
      where.push('status = ?')
      params.push(status)
    }
    if (typeof keyword === 'string' && keyword.trim()) {
      where.push('(name LIKE ? OR subtitle LIKE ?)')
      params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = db.prepare(`SELECT * FROM products ${whereSql}`).all(...params) as unknown as ProductRow[]

    res.json({ success: true, data: { list: rows.map(toDTO), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.post('/', (req, res) => {
  try {
    const result = validateProductInput(req.body as Record<string, unknown>, false)
    if (!result.ok) {
      res.status(400).json({ success: false, message: result.message })
      return
    }
    const { value } = result
    const now = Date.now()
    const id = `g${now}`
    const price = value.price as number
    const originalPrice = value.originalPrice ?? Math.round(price * 1.3)
    const stock = value.stock ?? 0
    const sales = value.sales ?? 0
    const tags = JSON.stringify(value.tags ?? [])

    db.prepare(`
      INSERT INTO products (id, name, subtitle, category_id, price, original_price, stock, sales, tags, status, cover, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      value.name as string,
      value.subtitle ?? '',
      value.categoryId as string,
      price,
      originalPrice,
      stock,
      sales,
      tags,
      value.status ?? 'on',
      value.cover ?? '',
      now,
    )

    const row = getProductById(id)
    res.status(201).json({ success: true, data: toDTO(row as ProductRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.put('/:id/status', (req, res) => {
  try {
    const status = (req.body as Record<string, unknown>).status
    if (status !== 'on' && status !== 'off') {
      res.status(400).json({ success: false, message: "status must be 'on' or 'off'" })
      return
    }
    const existing = getProductById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'product not found' })
      return
    }
    db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, req.params.id)
    const row = getProductById(req.params.id)
    res.json({ success: true, data: toDTO(row as ProductRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = getProductById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'product not found' })
      return
    }
    const result = validateProductInput(req.body as Record<string, unknown>, true)
    if (!result.ok) {
      res.status(400).json({ success: false, message: result.message })
      return
    }
    const { value } = result

    db.prepare(`
      UPDATE products
      SET name = ?, subtitle = ?, category_id = ?, price = ?, original_price = ?, stock = ?, tags = ?, cover = ?
      WHERE id = ?
    `).run(
      value.name ?? existing.name,
      value.subtitle ?? existing.subtitle,
      value.categoryId ?? existing.category_id,
      value.price ?? existing.price,
      value.originalPrice ?? existing.original_price,
      value.stock ?? existing.stock,
      value.tags !== undefined ? JSON.stringify(value.tags) : existing.tags,
      value.cover ?? existing.cover,
      req.params.id,
    )

    const row = getProductById(req.params.id)
    res.json({ success: true, data: toDTO(row as ProductRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const existing = getProductById(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'product not found' })
      return
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

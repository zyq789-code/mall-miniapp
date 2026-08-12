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

/** Expand a category id to include its leaf children (first-level → leaves). */
function collectCategoryIds(categoryId: string): string[] {
  const ids = [categoryId]
  const rows = db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(categoryId)
  for (const row of rows as Array<{ id: string }>) ids.push(row.id)
  return ids
}

function toDto(row: ProductRow): ProductDto {
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

    res.json({ success: true, data: { list: rows.map(toDto), total: rows.length } })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

export default router

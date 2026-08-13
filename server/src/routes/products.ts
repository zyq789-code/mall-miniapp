import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

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
  specs: string
  skus: string
  created_at: number
}

/** 规格维度：如 { name: '颜色', values: ['黑', '白'] }（对齐小程序 models/goods.ts）。 */
interface SpecGroupDto {
  name: string
  values: string[]
}

/** 单个 SKU：attrs 如 { 颜色: '黑', 内存: '128G' }（对齐小程序 models/goods.ts）。 */
interface SkuDto {
  id: string
  attrs: Record<string, string>
  price: number
  stock: number
  image?: string
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
  /** 小程序 Goods 模型所需字段（由基础字段派生，后端作为商品数据源）。 */
  images: string[]
  desc: string
  specs: SpecGroupDto[]
  skus: SkuDto[]
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
  specs?: SpecGroupDto[]
  skus?: SkuDto[]
}

type ValidationResult = { ok: true; value: ProductInput } | { ok: false; message: string }

/** Expand a category id to include its leaf children (first-level → leaves). */
function collectCategoryIds(categoryId: string): string[] {
  const ids = [categoryId]
  const rows = db.prepare('SELECT id FROM categories WHERE parent_id = ?').all(categoryId)
  for (const row of rows as Array<{ id: string }>) ids.push(row.id)
  return ids
}

/** 解析 JSON 数组列（specs/skus/tags），空或非法一律回退 []。 */
function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSpecGroup(value: unknown): value is SpecGroupDto {
  if (!isRecord(value)) return false
  const { name, values } = value
  if (typeof name !== 'string' || !name.trim()) return false
  if (!Array.isArray(values) || values.length === 0) return false
  return values.every((v) => typeof v === 'string' && v.trim().length > 0)
}

function isSku(value: unknown): value is SkuDto {
  if (!isRecord(value)) return false
  const { attrs, price, stock } = value
  if (!isRecord(attrs)) return false
  if (Object.values(attrs).some((v) => typeof v !== 'string')) return false
  if (typeof price !== 'number' || !Number.isInteger(price) || price <= 0) return false
  if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) return false
  return true
}

/** 补全 SKU id（缺省按商品前缀编号），保证全局唯一。 */
function normalizeSkuIds(skus: SkuDto[], productId: string): SkuDto[] {
  return skus.map((sku, i) => (sku.id && sku.id.trim() ? sku : { ...sku, id: `${productId}-s${i + 1}` }))
}

/** 计算展示价/库存：传了 skus 时 price = 最低 SKU 价、stock = SKU 库存之和。 */
function derivePriceAndStock(price: number, stock: number, skus: SkuDto[]): { price: number; stock: number } {
  if (skus.length === 0) return { price, stock }
  return {
    price: Math.min(...skus.map((s) => s.price)),
    stock: skus.reduce((sum, s) => sum + s.stock, 0),
  }
}

function toDTO(row: ProductRow): ProductDto {
  const tags = parseJsonArray<string>(row.tags)
  const specs = parseJsonArray<SpecGroupDto>(row.specs)
  const skus = parseJsonArray<SkuDto>(row.skus)
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
    images: row.cover ? [row.cover] : [],
    desc: `${row.name}，${row.subtitle}。甄选品质，7天无理由退换，正品保障，全国包邮。`,
    specs,
    skus,
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

  if (body.specs !== undefined) {
    if (!Array.isArray(body.specs) || !body.specs.every(isSpecGroup)) {
      return { ok: false, message: 'specs must be an array of { name, values: string[] }' }
    }
    value.specs = body.specs as SpecGroupDto[]
  }

  if (body.skus !== undefined) {
    if (!Array.isArray(body.skus) || !body.skus.every(isSku)) {
      return { ok: false, message: 'skus must be an array of { attrs, price, stock }' }
    }
    value.skus = body.skus as SkuDto[]
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

router.get('/:id', (req, res) => {
  try {
    const row = getProductById(req.params.id)
    if (!row) {
      res.status(404).json({ success: false, message: 'product not found' })
      return
    }
    res.json({ success: true, data: toDTO(row) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.post('/', requireAuth, (req, res) => {
  try {
    const result = validateProductInput(req.body as Record<string, unknown>, false)
    if (!result.ok) {
      res.status(400).json({ success: false, message: result.message })
      return
    }
    const { value } = result
    const now = Date.now()
    const id = `g${now}`
    const specs = value.specs ?? []
    const skus = normalizeSkuIds(value.skus ?? [], id)
    // 传了 skus 时展示价/库存由 SKU 推导（覆盖裸字段）。
    const { price, stock } = derivePriceAndStock(value.price as number, value.stock ?? 0, skus)
    const originalPrice = value.originalPrice ?? Math.round(price * 1.3)
    const sales = value.sales ?? 0
    const tags = JSON.stringify(value.tags ?? [])

    db.prepare(`
      INSERT INTO products (id, name, subtitle, category_id, price, original_price, stock, sales, tags, status, cover, specs, skus, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(specs),
      JSON.stringify(skus),
      now,
    )

    const row = getProductById(id)
    res.status(201).json({ success: true, data: toDTO(row as ProductRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.put('/:id/status', requireAuth, (req, res) => {
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

router.put('/:id', requireAuth, (req, res) => {
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
    const id = req.params.id
    const specs = value.specs
    const skus = value.skus !== undefined ? normalizeSkuIds(value.skus, id) : undefined
    // 传了 skus 时展示价/库存由 SKU 推导（覆盖裸字段）。
    const { price, stock } = derivePriceAndStock(value.price ?? existing.price, value.stock ?? existing.stock, skus ?? [])

    db.prepare(`
      UPDATE products
      SET name = ?, subtitle = ?, category_id = ?, price = ?, original_price = ?, stock = ?, tags = ?, cover = ?, specs = ?, skus = ?
      WHERE id = ?
    `).run(
      value.name ?? existing.name,
      value.subtitle ?? existing.subtitle,
      value.categoryId ?? existing.category_id,
      price,
      value.originalPrice ?? existing.original_price,
      stock,
      value.tags !== undefined ? JSON.stringify(value.tags) : existing.tags,
      value.cover ?? existing.cover,
      specs !== undefined ? JSON.stringify(specs) : existing.specs,
      skus !== undefined ? JSON.stringify(skus) : existing.skus,
      id,
    )

    const row = getProductById(req.params.id)
    res.json({ success: true, data: toDTO(row as ProductRow) })
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Internal error' })
  }
})

router.delete('/:id', requireAuth, (req, res) => {
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

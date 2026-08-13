import { request } from './client'

/** 规格维度：如 { name: '颜色', values: ['黑', '白'] }（对齐后端/小程序 models）。 */
export interface SpecGroup {
  name: string
  values: string[]
}

/** 单个 SKU：attrs 如 { 颜色: '黑', 内存: '128G' }；price 以分为单位。 */
export interface Sku {
  id: string
  attrs: Record<string, string>
  price: number // 分
  stock: number
  image?: string
}

export interface Product {
  id: string
  name: string
  subtitle: string
  categoryId: string
  price: number // 分
  originalPrice: number // 分
  stock: number
  sales: number
  tags: string[]
  status: 'on' | 'off'
  cover: string
  specs: SpecGroup[]
  skus: Sku[]
  createdAt: number
}

export interface ProductList {
  list: Product[]
  total: number
}

export interface ProductQuery {
  keyword?: string
  status?: 'on' | 'off'
  categoryId?: string
}

export interface ProductInput {
  name: string
  subtitle?: string
  categoryId: string
  price: number // 分
  originalPrice?: number // 分
  stock?: number
  tags?: string[]
  cover?: string
  specs?: SpecGroup[]
  skus?: Sku[]
}

export interface Category {
  id: string
  name: string
  parentId: string | null
}

/** 与 server/src/seed.ts 的 CATEGORIES 一致的静态分类表（后端暂无 /categories 端点时回退用）。 */
const STATIC_CATEGORIES: Category[] = [
  { id: 'c1', name: '手机数码', parentId: null },
  { id: 'c11', name: '手机', parentId: 'c1' },
  { id: 'c12', name: '耳机数码', parentId: 'c1' },
  { id: 'c2', name: '服饰鞋包', parentId: null },
  { id: 'c21', name: '男装', parentId: 'c2' },
  { id: 'c22', name: '女装', parentId: 'c2' },
  { id: 'c3', name: '食品生鲜', parentId: null },
  { id: 'c31', name: '休闲零食', parentId: 'c3' },
  { id: 'c4', name: '美妆个护', parentId: null },
  { id: 'c41', name: '面部护肤', parentId: 'c4' },
  { id: 'c5', name: '家居生活', parentId: null },
  { id: 'c51', name: '厨房用品', parentId: 'c5' },
  { id: 'c52', name: '家纺', parentId: 'c5' },
  { id: 'c6', name: '运动户外', parentId: null },
  { id: 'c61', name: '健身器材', parentId: 'c6' },
]

let categoriesCache: Category[] | null = null

/** 读取分类列表。后端暂无 /categories 端点（已确认 404），尝试后用静态分类表兜底。 */
export async function getCategories(): Promise<Category[]> {
  if (categoriesCache) return categoriesCache
  try {
    const data = await request<Category[]>('/categories')
    categoriesCache = Array.isArray(data) ? data : []
  } catch {
    categoriesCache = STATIC_CATEGORIES
  }
  return categoriesCache
}

/** GET /products，支持 keyword / status / categoryId 过滤。 */
export function getProducts(params: ProductQuery = {}): Promise<ProductList> {
  const query = new URLSearchParams()
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.status) query.set('status', params.status)
  if (params.categoryId) query.set('categoryId', params.categoryId)
  const qs = query.toString()
  return request<ProductList>(`/products${qs ? `?${qs}` : ''}`)
}

/** POST /products，price 以分为单位。 */
export function createProduct(data: ProductInput): Promise<Product> {
  return request<Product>('/products', { method: 'POST', body: data })
}

/** PUT /products/:id，price 以分为单位，部分字段更新。 */
export function updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
  return request<Product>(`/products/${id}`, { method: 'PUT', body: data })
}

/** PUT /products/:id/status，上架/下架。 */
export function setProductStatus(id: string, status: 'on' | 'off'): Promise<Product> {
  return request<Product>(`/products/${id}/status`, { method: 'PUT', body: { status } })
}

/** DELETE /products/:id */
export function deleteProduct(id: string): Promise<void> {
  return request<void>(`/products/${id}`, { method: 'DELETE' })
}

/** POST /api/upload —— 上传 base64 图片，返回 { url: "/uploads/mall/xxx.png" }（管理员鉴权由 client 带 token）。 */
export function uploadImage(data: string): Promise<{ url: string }> {
  return request<{ url: string }>('/upload', { method: 'POST', body: { data } })
}

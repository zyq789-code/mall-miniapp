import type { DatabaseSync } from 'node:sqlite'

/** Two-level category tree (parent_id NULL for first level). */
const CATEGORIES: Array<{ id: string; name: string; parentId: string | null }> = [
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

/** 规格维度：如 { name: '颜色', values: ['黑', '白'] }（与小程序 models/goods.ts 一致）。 */
interface SpecGroup {
  name: string
  values: string[]
}

/** 单个 SKU：attrs 如 { 颜色: '黑', 内存: '128G' }。 */
interface Sku {
  id: string
  attrs: Record<string, string>
  price: number
  stock: number
}

interface GoodsSeed {
  id: string
  name: string
  subtitle: string
  categoryId: string
  price: number // 展示价 = 最低 SKU 价
  originalPrice: number
  stock: number // SKU 库存之和
  sales: number
  specs: SpecGroup[]
  skus: Sku[]
}

/** 逐 SKU 调价/调库存：返回修改后的 SKU（对齐小程序 mock/goods.ts 的 SkuTuner）。 */
type SkuTuner = (sku: Sku, index: number) => Sku

/** 由 specs 笛卡尔积生成全部 SKU；id 加商品前缀保持全局唯一。 */
function generateSkus(id: string, specs: SpecGroup[], basePrice: number, stock: number): Sku[] {
  let combos: Array<Record<string, string>> = [{}]
  for (const group of specs) {
    combos = combos.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name]: value })))
  }
  return combos.map((attrs, i) => ({ id: `${id}-s${i + 1}`, attrs, price: basePrice, stock }))
}

/** 由 specs 生成商品：price = 最低 SKU 价，stock = SKU 库存之和。 */
function makeGoods(
  id: string,
  name: string,
  subtitle: string,
  categoryId: string,
  basePrice: number,
  sales: number,
  specs: SpecGroup[],
  tune?: SkuTuner,
  stock = 100,
): GoodsSeed {
  const skus = generateSkus(id, specs, basePrice, stock).map((s, i) => (tune ? tune(s, i) : s))
  const price = Math.min(...skus.map((s) => s.price))
  return {
    id,
    name,
    subtitle,
    categoryId,
    price,
    originalPrice: Math.round(price * 1.3),
    stock: skus.reduce((sum, s) => sum + s.stock, 0),
    sales,
    specs,
    skus,
  }
}

/** Migrated from src/mock/goods.ts (prices in cents/分). */
const GOODS: GoodsSeed[] = [
  makeGoods('g1', '旗舰智能手机 5G', '骁龙旗舰芯片 120Hz高刷屏', 'c11', 499900, 4520,
    [{ name: '颜色', values: ['黑', '白'] }, { name: '内存', values: ['128G', '256G'] }],
    (s) => (s.attrs['内存'] === '256G' ? { ...s, price: s.price + 50000 } : s)),
  makeGoods('g2', '轻薄笔记本电脑', '2.8K屏 全金属机身', 'c11', 699900, 1890,
    [{ name: '颜色', values: ['深空灰', '银色'] }]),
  makeGoods('g3', '真无线降噪耳机', '主动降噪 30小时续航', 'c12', 69900, 3260,
    [{ name: '颜色', values: ['黑', '白'] }]),
  makeGoods('g4', '便携蓝牙音箱', 'IPX7防水 户外必备', 'c12', 19900, 2130,
    [{ name: '颜色', values: ['曜石黑', '湖蓝'] }]),
  makeGoods('g5', '男士休闲夹克', '春秋百搭 立领防风', 'c21', 39900, 1560,
    [{ name: '尺码', values: ['M', 'L', 'XL'] }]),
  makeGoods('g6', '纯棉白T恤', '新疆长绒棉 不起球', 'c21', 8900, 2840,
    [{ name: '颜色', values: ['白', '黑', '蓝'] }, { name: '尺码', values: ['M', 'L', 'XL'] }]),
  makeGoods('g7', '法式碎花连衣裙', '收腰显瘦 温柔气质', 'c22', 25900, 1420,
    [{ name: '尺码', values: ['S', 'M', 'L'] }]),
  makeGoods('g8', '坚果零食大礼包', '每日坚果 混合装', 'c31', 12900, 3680,
    [{ name: '规格', values: ['30袋装'] }]),
  makeGoods('g9', '进口蓝山咖啡豆', '中度烘焙 醇香回甘', 'c31', 8900, 2380,
    [{ name: '规格', values: ['250g', '500g'] }]),
  makeGoods('g10', '烟酰胺美白精华', '提亮肤色 淡化痘印', 'c41', 32900, 2950,
    [{ name: '规格', values: ['30ml', '50ml'] }]),
  makeGoods('g11', '氨基酸温和洁面', '氨基酸配方 温和不紧绷', 'c41', 7900, 3420,
    [{ name: '规格', values: ['100g'] }]),
  makeGoods('g12', '麦饭石不粘炒锅', '少油不粘 电磁炉通用', 'c51', 19900, 1970,
    [{ name: '规格', values: ['28cm', '32cm'] }]),
  makeGoods('g13', '北欧陶瓷餐具套装', '12件套 简约ins风', 'c51', 16900, 1240,
    [{ name: '规格', values: ['12件套'] }]),
  makeGoods('g14', '全棉四件套', '60支长绒棉 亲肤透气', 'c52', 39900, 2680,
    [{ name: '规格', values: ['1.5m', '1.8m'] }]),
  makeGoods('g15', '智能运动手环', '心率血氧监测 50米防水', 'c61', 24900, 3150,
    [{ name: '颜色', values: ['黑', '粉'] }]),
  makeGoods('g16', '加厚防滑瑜伽垫', '10mm加厚 防滑回弹', 'c61', 9900, 2080,
    [{ name: '规格', values: ['10mm'] }]),
]

const DEFAULT_TAGS = ['包邮', '正品']

function insertCategories(db: DatabaseSync): void {
  const stmt = db.prepare('INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)')
  for (const c of CATEGORIES) stmt.run(c.id, c.name, c.parentId)
}

function insertProducts(db: DatabaseSync): void {
  const stmt = db.prepare(`
    INSERT INTO products (id, name, subtitle, category_id, price, original_price, stock, sales, tags, status, cover, specs, skus, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const g of GOODS) {
    stmt.run(
      g.id,
      g.name,
      g.subtitle,
      g.categoryId,
      g.price,
      g.originalPrice,
      g.stock,
      g.sales,
      JSON.stringify(DEFAULT_TAGS),
      'on',
      `/static/img/${g.id}.png`,
      JSON.stringify(g.specs),
      JSON.stringify(g.skus),
      Date.now(),
    )
  }
}

function insertAdmin(db: DatabaseSync): void {
  db.prepare('INSERT INTO users (id, username, password, nickname) VALUES (?, ?, ?, ?)')
    .run('u1', 'admin', 'admin123', '管理员')
}

/** Seed the database only when it has no products yet (kept idempotent). */
export function seedIfEmpty(db: DatabaseSync): void {
  const row = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }
  if (row.n > 0) return
  insertCategories(db)
  insertProducts(db)
  insertAdmin(db)
}

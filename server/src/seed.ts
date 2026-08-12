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

interface GoodsSeed {
  id: string
  name: string
  subtitle: string
  categoryId: string
  price: number
  stock: number
  sales: number
}

/** Migrated from src/mock/goods.ts (prices are in cents/分). */
const GOODS: GoodsSeed[] = [
  { id: 'g1', name: '旗舰智能手机 5G', subtitle: '骁龙旗舰芯片 120Hz高刷屏', categoryId: 'c11', price: 499900, stock: 100, sales: 4520 },
  { id: 'g2', name: '轻薄笔记本电脑', subtitle: '2.8K屏 全金属机身', categoryId: 'c11', price: 699900, stock: 100, sales: 1890 },
  { id: 'g3', name: '真无线降噪耳机', subtitle: '主动降噪 30小时续航', categoryId: 'c12', price: 69900, stock: 100, sales: 3260 },
  { id: 'g4', name: '便携蓝牙音箱', subtitle: 'IPX7防水 户外必备', categoryId: 'c12', price: 19900, stock: 100, sales: 2130 },
  { id: 'g5', name: '男士休闲夹克', subtitle: '春秋百搭 立领防风', categoryId: 'c21', price: 39900, stock: 100, sales: 1560 },
  { id: 'g6', name: '纯棉白T恤', subtitle: '新疆长绒棉 不起球', categoryId: 'c21', price: 8900, stock: 100, sales: 2840 },
  { id: 'g7', name: '法式碎花连衣裙', subtitle: '收腰显瘦 温柔气质', categoryId: 'c22', price: 25900, stock: 100, sales: 1420 },
  { id: 'g8', name: '坚果零食大礼包', subtitle: '每日坚果 混合装', categoryId: 'c31', price: 12900, stock: 100, sales: 3680 },
  { id: 'g9', name: '进口蓝山咖啡豆', subtitle: '中度烘焙 醇香回甘', categoryId: 'c31', price: 8900, stock: 100, sales: 2380 },
  { id: 'g10', name: '烟酰胺美白精华', subtitle: '提亮肤色 淡化痘印', categoryId: 'c41', price: 32900, stock: 100, sales: 2950 },
  { id: 'g11', name: '氨基酸温和洁面', subtitle: '氨基酸配方 温和不紧绷', categoryId: 'c41', price: 7900, stock: 100, sales: 3420 },
  { id: 'g12', name: '麦饭石不粘炒锅', subtitle: '少油不粘 电磁炉通用', categoryId: 'c51', price: 19900, stock: 100, sales: 1970 },
  { id: 'g13', name: '北欧陶瓷餐具套装', subtitle: '12件套 简约ins风', categoryId: 'c51', price: 16900, stock: 100, sales: 1240 },
  { id: 'g14', name: '全棉四件套', subtitle: '60支长绒棉 亲肤透气', categoryId: 'c52', price: 39900, stock: 100, sales: 2680 },
  { id: 'g15', name: '智能运动手环', subtitle: '心率血氧监测 50米防水', categoryId: 'c61', price: 24900, stock: 100, sales: 3150 },
  { id: 'g16', name: '加厚防滑瑜伽垫', subtitle: '10mm加厚 防滑回弹', categoryId: 'c61', price: 9900, stock: 100, sales: 2080 },
]

const DEFAULT_TAGS = ['包邮', '正品']

function insertCategories(db: DatabaseSync): void {
  const stmt = db.prepare('INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)')
  for (const c of CATEGORIES) stmt.run(c.id, c.name, c.parentId)
}

function insertProducts(db: DatabaseSync): void {
  const stmt = db.prepare(`
    INSERT INTO products (id, name, subtitle, category_id, price, original_price, stock, sales, tags, status, cover, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const g of GOODS) {
    stmt.run(
      g.id,
      g.name,
      g.subtitle,
      g.categoryId,
      g.price,
      Math.round(g.price * 1.3),
      g.stock,
      g.sales,
      JSON.stringify(DEFAULT_TAGS),
      'on',
      `/static/img/${g.id}.png`,
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

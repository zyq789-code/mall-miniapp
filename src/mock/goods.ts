import type { Goods, Category, Banner } from '../models/goods'

export const categories: Category[] = [
  { id: 'c1', name: '手机数码', children: [{ id: 'c11', name: '手机' }, { id: 'c12', name: '耳机数码' }].map(c => ({ ...c, children: [] })) },
  { id: 'c2', name: '服饰鞋包', children: [{ id: 'c21', name: '男装' }, { id: 'c22', name: '女装' }].map(c => ({ ...c, children: [] })) },
  { id: 'c3', name: '食品生鲜', children: [{ id: 'c31', name: '休闲零食' }].map(c => ({ ...c, children: [] })) },
  { id: 'c4', name: '美妆个护', children: [{ id: 'c41', name: '面部护肤' }].map(c => ({ ...c, children: [] })) },
  { id: 'c5', name: '家居生活', children: [{ id: 'c51', name: '厨房用品' }, { id: 'c52', name: '家纺' }].map(c => ({ ...c, children: [] })) },
  { id: 'c6', name: '运动户外', children: [{ id: 'c61', name: '健身器材' }].map(c => ({ ...c, children: [] })) },
]

export const banners: Banner[] = [
  { id: 'b1', image: '/static/img/banner1.png', goodsId: 'g1' },
  { id: 'b2', image: '/static/img/banner2.png', goodsId: 'g9' },
]

export function makeGoods(id: string, name: string, categoryId: string, price: number, subtitle: string, stock = 100, sales = 0, tags = ['包邮', '正品']): Goods {
  return {
    id, name, subtitle, cover: `/static/img/${id}.png`, images: [`/static/img/${id}.png`],
    price, originalPrice: Math.round(price * 1.3), categoryId, tags, sales, stock,
    desc: `${name}，${subtitle}。甄选品质，7天无理由退换，正品保障，全国包邮。`,
    skus: [
      { id: `${id}-s1`, spec: '标准款', price, stock },
      { id: `${id}-s2`, spec: '尊享款', price: price + Math.round(price * 0.2), stock },
    ],
    status: 'on',
  }
}

export const goods: Goods[] = [
  makeGoods('g1', '旗舰智能手机 5G', 'c11', 499900, '骁龙旗舰芯片 120Hz高刷屏', 100, 4520),
  makeGoods('g2', '轻薄笔记本电脑', 'c11', 699900, '2.8K屏 全金属机身', 100, 1890),
  makeGoods('g3', '真无线降噪耳机', 'c12', 69900, '主动降噪 30小时续航', 100, 3260),
  makeGoods('g4', '便携蓝牙音箱', 'c12', 19900, 'IPX7防水 户外必备', 100, 2130),
  makeGoods('g5', '男士休闲夹克', 'c21', 39900, '春秋百搭 立领防风', 100, 1560),
  makeGoods('g6', '纯棉白T恤', 'c21', 8900, '新疆长绒棉 不起球', 100, 2840),
  makeGoods('g7', '法式碎花连衣裙', 'c22', 25900, '收腰显瘦 温柔气质', 100, 1420),
  makeGoods('g8', '坚果零食大礼包', 'c31', 12900, '每日坚果 混合装', 100, 3680),
  makeGoods('g9', '进口蓝山咖啡豆', 'c31', 8900, '中度烘焙 醇香回甘', 100, 2380),
  makeGoods('g10', '烟酰胺美白精华', 'c41', 32900, '提亮肤色 淡化痘印', 100, 2950),
  makeGoods('g11', '氨基酸温和洁面', 'c41', 7900, '氨基酸配方 温和不紧绷', 100, 3420),
  makeGoods('g12', '麦饭石不粘炒锅', 'c51', 19900, '少油不粘 电磁炉通用', 100, 1970),
  makeGoods('g13', '北欧陶瓷餐具套装', 'c51', 16900, '12件套 简约ins风', 100, 1240),
  makeGoods('g14', '全棉四件套', 'c52', 39900, '60支长绒棉 亲肤透气', 100, 2680),
  makeGoods('g15', '智能运动手环', 'c61', 24900, '心率血氧监测 50米防水', 100, 3150),
  makeGoods('g16', '加厚防滑瑜伽垫', 'c61', 9900, '10mm加厚 防滑回弹', 100, 2080),
]

export function getGoods(id: string): Goods | undefined { return goods.find(g => g.id === id) }
export function searchGoods(keyword: string): Goods[] {
  const k = keyword.trim().toLowerCase()
  return goods.filter(g => g.name.toLowerCase().includes(k) || g.subtitle.toLowerCase().includes(k))
}
export function collectCategoryIds(categoryId: string): string[] {
  const ids: string[] = []
  const walk = (node: Category) => {
    ids.push(node.id)
    node.children.forEach(walk)
  }
  const root = categories.find(c => c.id === categoryId)
  if (root) walk(root)
  else ids.push(categoryId)
  return ids
}
export function listGoods(categoryId?: string, sort?: 'sales' | 'priceAsc' | 'priceDesc'): Goods[] {
  const ids = categoryId ? collectCategoryIds(categoryId) : undefined
  let r = ids ? goods.filter(g => ids.includes(g.categoryId)) : [...goods]
  if (sort === 'sales') r.sort((a, b) => b.sales - a.sales)
  if (sort === 'priceAsc') r.sort((a, b) => a.price - b.price)
  if (sort === 'priceDesc') r.sort((a, b) => b.price - a.price)
  return r
}

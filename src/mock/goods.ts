import type { Goods, Category, Banner } from '../models/goods'
const img = (seed: number) => `https://picsum.photos/seed/mall${seed}/400/400`
export const categories: Category[] = [
  { id: 'c1', name: '手机数码', children: [{ id: 'c11', name: '手机', children: [] }] },
  { id: 'c2', name: '服饰鞋包', children: [{ id: 'c21', name: '男装', children: [] }] },
  { id: 'c3', name: '食品生鲜', children: [{ id: 'c31', name: '零食', children: [] }] },
]
export const banners: Banner[] = [
  { id: 'b1', image: img(1), goodsId: 'g1' },
  { id: 'b2', image: img(2), goodsId: 'g2' },
]
export function makeGoods(id: string, name: string, categoryId: string, price: number, stock = 100, sales = 10): Goods {
  return {
    id, name, subtitle: `${name} 专业优选`, cover: img(id.charCodeAt(1) || 1), images: [img(1), img(2)],
    price, originalPrice: Math.round(price * 1.3), categoryId, tags: ['包邮', '新品'], sales, stock,
    desc: `这是 ${name} 的商品详情……`,
    skus: [
      { id: `${id}-s1`, spec: '标准版', price, stock },
      { id: `${id}-s2`, spec: '尊享版', price: price + 2000, stock },
    ],
    status: 'on',
  }
}
export const goods: Goods[] = [
  makeGoods('g1', '旗舰手机', 'c11', 399900),
  makeGoods('g2', '轻薄笔记本', 'c11', 699900),
  makeGoods('g3', '纯棉T恤', 'c21', 9900),
  makeGoods('g4', '运动鞋', 'c21', 39900),
  makeGoods('g5', '坚果礼盒', 'c31', 12900),
  makeGoods('g6', '进口咖啡豆', 'c31', 8900),
]
export function getGoods(id: string): Goods | undefined { return goods.find(g => g.id === id) }
export function searchGoods(keyword: string): Goods[] {
  const k = keyword.trim().toLowerCase()
  return goods.filter(g => g.name.toLowerCase().includes(k) || g.subtitle.toLowerCase().includes(k))
}
export function listGoods(categoryId?: string, sort?: 'sales' | 'priceAsc' | 'priceDesc'): Goods[] {
  let r = categoryId ? goods.filter(g => g.categoryId === categoryId) : [...goods]
  if (sort === 'sales') r.sort((a, b) => b.sales - a.sales)
  if (sort === 'priceAsc') r.sort((a, b) => a.price - b.price)
  if (sort === 'priceDesc') r.sort((a, b) => b.price - a.price)
  return r
}

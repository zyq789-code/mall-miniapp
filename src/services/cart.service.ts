import type { CartItem } from '../models/goods'

export function addToCart(list: CartItem[], item: CartItem): CartItem[] {
  const idx = list.findIndex(x => x.goodsId === item.goodsId && x.skuId === item.skuId)
  if (idx >= 0) return list.map((x, i) => (i === idx ? { ...x, quantity: x.quantity + item.quantity } : x))
  return [...list, item]
}
export function updateQuantity(list: CartItem[], goodsId: string, skuId: string, quantity: number): CartItem[] {
  return list.map(x => (x.goodsId === goodsId && x.skuId === skuId ? { ...x, quantity: Math.max(1, quantity) } : x))
}
export function toggleChecked(list: CartItem[], goodsId: string, skuId: string): CartItem[] {
  return list.map(x => (x.goodsId === goodsId && x.skuId === skuId ? { ...x, checked: !x.checked } : x))
}
export function toggleAllChecked(list: CartItem[], checked: boolean): CartItem[] {
  return list.map(x => ({ ...x, checked }))
}
export function removeItem(list: CartItem[], goodsId: string, skuId: string): CartItem[] {
  return list.filter(x => !(x.goodsId === goodsId && x.skuId === skuId))
}
export function countChecked(list: CartItem[]): number {
  return list.filter(x => x.checked).length
}
export function calcCheckedAmount(list: CartItem[], price: (goodsId: string, skuId: string) => number): number {
  return list.filter(x => x.checked).reduce((s, x) => s + price(x.goodsId, x.skuId) * x.quantity, 0)
}

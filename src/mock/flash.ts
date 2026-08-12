import type { FlashSale } from '../models/flash'
import { isFlashActive } from '../services/flash.service'
const now = Date.now()
export const flashSales: FlashSale[] = [
  { id: 'f1', goodsId: 'g1', price: 349900, originalPrice: 399900, startTime: now - 3600 * 1000, endTime: now + 2 * 3600 * 1000, limitPerUser: 1 },
  { id: 'f2', goodsId: 'g3', price: 7900, originalPrice: 9900, startTime: now - 3600 * 1000, endTime: now + 5 * 3600 * 1000, limitPerUser: 2 },
]

export function getFlashPrice(goodsId: string): number | null {
  const f = flashSales.find(x => x.goodsId === goodsId)
  return f && isFlashActive(f, Date.now()) ? f.price : null
}

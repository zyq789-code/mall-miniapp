import type { FlashSale } from '../models/flash'
const now = Date.now()
export const flashSales: FlashSale[] = [
  { id: 'f1', goodsId: 'g1', price: 349900, originalPrice: 399900, startTime: now - 3600 * 1000, endTime: now + 2 * 3600 * 1000, limitPerUser: 1 },
  { id: 'f2', goodsId: 'g3', price: 7900, originalPrice: 9900, startTime: now - 3600 * 1000, endTime: now + 5 * 3600 * 1000, limitPerUser: 2 },
]

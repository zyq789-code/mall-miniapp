import type { FlashSale } from '../models/flash'
import { BusinessError, ERR } from '../utils/errors'
export function isFlashActive(f: FlashSale, now: number): boolean { return now >= f.startTime && now <= f.endTime }
export function canPurchase(f: FlashSale, alreadyBought: number): boolean { return alreadyBought < f.limitPerUser }
export function deductStock(stock: number, qty: number): number {
  if (stock < qty) throw new BusinessError(ERR.OUT_OF_STOCK, '库存不足')
  return stock - qty
}
export function calcSalePrice(price: number, discountPercent: number): number {
  return Math.round((price * discountPercent) / 100)
}

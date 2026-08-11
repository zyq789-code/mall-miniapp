import type { Coupon } from '../models/coupon'

export function isCouponUsable(coupon: Coupon, orderAmount: number, goodsCategoryIds: string[], now: number): boolean {
  if (coupon.status !== 'unused') return false
  if (now < coupon.startAt || now > coupon.endAt) return false
  if (orderAmount < coupon.threshold) return false
  if (coupon.scope !== 'all') {
    const scopes = coupon.scope as string[]
    if (!goodsCategoryIds.some(id => scopes.includes(id))) return false
  }
  return true
}
export function calcCouponDiscount(coupon: Coupon, orderAmount: number): number {
  if (coupon.type === 'reduce') return Math.min(coupon.discount, orderAmount)
  return Math.max(0, orderAmount - Math.round((orderAmount * coupon.discount) / 100))
}
export function getUsableCoupons(coupons: Coupon[], orderAmount: number, goodsCategoryIds: string[], now: number): Coupon[] {
  return coupons.filter(c => isCouponUsable(c, orderAmount, goodsCategoryIds, now))
}
export function bestCoupon(coupons: Coupon[], orderAmount: number, goodsCategoryIds: string[], now: number): Coupon | null {
  const usable = getUsableCoupons(coupons, orderAmount, goodsCategoryIds, now)
  if (!usable.length) return null
  return usable.reduce((a, b) => (calcCouponDiscount(b, orderAmount) > calcCouponDiscount(a, orderAmount) ? b : a))
}

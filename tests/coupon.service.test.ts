import { describe, expect, it } from 'vitest'
import type { Coupon } from '../src/models/coupon'
import { isCouponUsable, calcCouponDiscount, getUsableCoupons, bestCoupon } from '../src/services/coupon.service'

const coupon = (p: Partial<Coupon>): Coupon => ({
  id: 'c1', name: '满100减20', type: 'reduce', threshold: 10000, discount: 2000,
  scope: 'all', startAt: 0, endAt: 1000, status: 'unused', ...p,
})
const now = 500

describe('coupon', () => {
  it('门槛/有效期/状态都满足才可用', () => {
    expect(isCouponUsable(coupon({}), 10000, [], now)).toBe(true)
    expect(isCouponUsable(coupon({}), 9999, [], now)).toBe(false)
    expect(isCouponUsable(coupon({ endAt: 499 }), 10000, [], now)).toBe(false)
    expect(isCouponUsable(coupon({ status: 'used' }), 10000, [], now)).toBe(false)
  })
  it('指定分类券需命中', () => {
    expect(isCouponUsable(coupon({ scope: ['catA'] }), 10000, ['catA'], now)).toBe(true)
    expect(isCouponUsable(coupon({ scope: ['catA'] }), 10000, ['catB'], now)).toBe(false)
  })
  it('满减抵扣不超金额', () => {
    expect(calcCouponDiscount(coupon({ discount: 2000 }), 10000)).toBe(2000)
    expect(calcCouponDiscount(coupon({ discount: 2000 }), 1000)).toBe(1000)
  })
  it('折扣券 8.5 折', () => {
    expect(calcCouponDiscount(coupon({ type: 'discount', discount: 85 }), 10000)).toBe(1500)
  })
  it('getUsableCoupons 过滤；bestCoupon 返回优惠最大', () => {
    const cs = [coupon({ id: 'a', discount: 1000 }), coupon({ id: 'b', discount: 3000 }), coupon({ endAt: 100 }) ]
    expect(getUsableCoupons(cs, 10000, [], now)).toHaveLength(2)
    expect(bestCoupon(cs, 10000, [], now)?.id).toBe('b')
  })
  it('bestCoupon 无可用券返回 null', () => {
    expect(bestCoupon([coupon({ endAt: 100 })], 10000, [], now)).toBeNull()
    expect(bestCoupon([], 10000, [], now)).toBeNull()
  })
  it('折扣券折扣为 100 时抵扣为 0（下限钳位）', () => {
    expect(calcCouponDiscount(coupon({ type: 'discount', discount: 100 }), 10000)).toBe(0)
  })
  it('门槛为 0 的折扣券小额订单可用', () => {
    expect(isCouponUsable(coupon({ type: 'discount', discount: 90, threshold: 0 }), 100, [], now)).toBe(true)
  })
})

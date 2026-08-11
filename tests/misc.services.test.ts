import { describe, expect, it } from 'vitest'
import { isFlashActive, canPurchase, deductStock, calcSalePrice } from '../src/services/flash.service'
import { applyAfterSale, approve, refund, reject } from '../src/services/aftersale.service'
import { canReview, validateReview } from '../src/services/review.service'
import { BusinessError } from '../src/utils/errors'
import type { AfterSale } from '../src/models/aftersale'
import type { Order } from '../src/models/order'

describe('flash', () => {
  it('活动时间内有效且限购', () => {
    expect(isFlashActive({ id: 'f', goodsId: 'g', price: 1, originalPrice: 2, startTime: 0, endTime: 100, limitPerUser: 1 }, 50)).toBe(true)
    expect(isFlashActive({ id: 'f', goodsId: 'g', price: 1, originalPrice: 2, startTime: 0, endTime: 100, limitPerUser: 1 }, 101)).toBe(false)
    expect(canPurchase({ id: 'f', goodsId: 'g', price: 1, originalPrice: 2, startTime: 0, endTime: 100, limitPerUser: 1 }, 1)).toBe(false)
  })
  it('原子扣减库存', () => {
    expect(deductStock(5, 3)).toBe(2)
    expect(() => deductStock(2, 3)).toThrow(BusinessError)
  })
  it('限时折扣价', () => {
    expect(calcSalePrice(10000, 50)).toBe(5000)   // 打5折
    expect(calcSalePrice(10000, 85)).toBe(8500)   // 打85折
  })
})
describe('aftersale', () => {
  const base: AfterSale = { id: 'a', orderId: 'o', type: 'refund', status: 'pending', reason: 'r', applyTime: 0 }
  it('状态机：pending→approved→refunded', () => {
    expect(approve(base).status).toBe('approved')
    expect(refund({ ...base, status: 'approved' }).status).toBe('refunded')
    expect(() => refund(base)).toThrow(BusinessError)
    expect(reject(base).status).toBe('rejected')
  })
})
describe('review', () => {
  const order = { status: 'completed' } as Order
  it('仅已完成可评', () => {
    expect(canReview(order)).toBe(true)
    expect(canReview({ ...order, status: 'pending_receive' })).toBe(false)
  })
  it('校验星级与长度', () => {
    expect(validateReview({ stars: 0, content: 'x' })).toBeTruthy()
    expect(validateReview({ stars: 5, content: 'x'.repeat(600) })).toBeTruthy()
    expect(validateReview({ stars: 4, content: '很好' })).toBeNull()
  })
})

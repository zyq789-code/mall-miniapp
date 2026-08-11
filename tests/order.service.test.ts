import { describe, expect, it } from 'vitest'
import type { Order, OrderItem, Address } from '../src/models/order'
import { BusinessError } from '../src/utils/errors'
import { calcOrderAmounts, pay, cancel, ship, receive, isExpired, canApplyAfterSale, genOrderNo, ORDER_TIMEOUT_MS } from '../src/services/order.service'

const item: OrderItem = { goodsId: 'g', skuId: 's', name: 'x', image: '', spec: 'a', price: 10000, quantity: 2 }
const addr: Address = { id: 'a', name: 'n', phone: '1', region: 'r', detail: 'd', isDefault: true }
const order = (status: Order['status'], t = 0, over: Partial<Order> = {}): Order => ({
  id: 'o', orderNo: 'n', status, items: [item], totalAmount: 20000,
  couponDeduction: 0, pointsDeduction: 0, freight: 0, payAmount: 20000, address: addr,
  createTime: t, payTime: undefined, shipTime: undefined, receiveTime: undefined, ...over,
})

describe('order', () => {
  it('金额 = 总额-券-积分+运费，最低为0', () => {
    expect(calcOrderAmounts([item], 2000, 1000)).toEqual({ totalAmount: 20000, freight: 0, payAmount: 17000 })
    expect(calcOrderAmounts([{ ...item, price: 1000 }], 2000, 1000).payAmount).toBe(0)
    expect(calcOrderAmounts([{ ...item, price: 1000 }], 0, 0).freight).toBe(600)
  })
  it('pay 只允许待付款', () => {
    expect(pay(order('pending_pay'), 100).status).toBe('pending_ship')
    expect(() => pay(order('canceled'), 100)).toThrow(BusinessError)
  })
  it('pay 拒绝超时订单', () => {
    expect(() => pay(order('pending_pay', 0), ORDER_TIMEOUT_MS + 1)).toThrow(BusinessError)
  })
  it('cancel 只允许待付款', () => {
    expect(cancel(order('pending_pay')).status).toBe('canceled')
    expect(() => cancel(order('pending_ship'))).toThrow(BusinessError)
  })
  it('ship/receive 状态守卫', () => {
    expect(ship(order('pending_ship'), 200).status).toBe('pending_receive')
    expect(() => ship(order('pending_pay'), 200)).toThrow(BusinessError)
    expect(receive(order('pending_receive'), 300).status).toBe('completed')
    expect(() => receive(order('pending_ship'), 300)).toThrow(BusinessError)
  })
  it('超时自动取消判定', () => {
    expect(isExpired(order('pending_pay', 0), ORDER_TIMEOUT_MS + 1)).toBe(true)
    expect(isExpired(order('pending_ship', 0), ORDER_TIMEOUT_MS + 1)).toBe(false)
  })
  it('超时边界：恰好15分钟不算超时', () => {
    expect(isExpired(order('pending_pay', 0), ORDER_TIMEOUT_MS)).toBe(false)
  })
  it('售后资格：待收货/已完成且7天内', () => {
    expect(canApplyAfterSale(order('pending_receive', 0), 3600 * 1000)).toBe(true)
    expect(canApplyAfterSale(order('completed', 0), 8 * 24 * 3600 * 1000)).toBe(false)
    expect(canApplyAfterSale(order('pending_pay', 0), 1000)).toBe(false)
  })
  it('售后资格按 shipTime/receiveTime 起算', () => {
    const shipOrder = order('pending_receive', 0, { shipTime: 100 })
    expect(canApplyAfterSale(shipOrder, 100 + 6 * 24 * 3600 * 1000)).toBe(true)
    expect(canApplyAfterSale(shipOrder, 100 + 7 * 24 * 3600 * 1000)).toBe(false)  // 恰好7天不满足
    const recvOrder = order('completed', 0, { receiveTime: 100 })
    expect(canApplyAfterSale(recvOrder, 100 + 3 * 24 * 3600 * 1000)).toBe(true)
    expect(canApplyAfterSale(recvOrder, 100 + 7 * 24 * 3600 * 1000)).toBe(false)
  })
  it('genOrderNo 格式', () => { expect(genOrderNo(1000)).toMatch(/^1000\d{1,}$/) })
})

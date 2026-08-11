import type { Order, OrderItem } from '../models/order'
import { BusinessError, ERR } from '../utils/errors'
import { calcFreight } from '../utils/format'

export const ORDER_TIMEOUT_MS = 15 * 60 * 1000
export const AFTERSALE_DAYS_MS = 7 * 24 * 3600 * 1000

export function calcOrderAmounts(items: OrderItem[], couponDeduction: number, pointsDeduction: number): { totalAmount: number; freight: number; payAmount: number } {
  const totalAmount = items.reduce((s, it) => s + it.price * it.quantity, 0)
  const freight = calcFreight(totalAmount)
  const payAmount = Math.max(0, totalAmount - couponDeduction - pointsDeduction + freight)
  return { totalAmount, freight, payAmount }
}
export function isExpired(order: Order, now: number): boolean {
  return order.status === 'pending_pay' && now - order.createTime > ORDER_TIMEOUT_MS
}
function assertStatus(order: Order, expected: Order['status'], code: string) {
  if (order.status !== expected) throw new BusinessError(code, `订单状态 ${order.status} 不允许该操作`)
}
export function pay(order: Order, now: number): Order {
  assertStatus(order, 'pending_pay', ERR.ORDER_NOT_PAYABLE)
  if (isExpired(order, now)) throw new BusinessError(ERR.ORDER_EXPIRED, '订单已超时，请重新下单')
  return { ...order, status: 'pending_ship', payTime: now }
}
export function cancel(order: Order): Order {
  assertStatus(order, 'pending_pay', ERR.ORDER_NOT_CANCELABLE)
  return { ...order, status: 'canceled' }
}
export function ship(order: Order, now: number): Order {
  assertStatus(order, 'pending_ship', ERR.ORDER_NOT_SHIPPABLE)
  return { ...order, status: 'pending_receive', shipTime: now }
}
export function receive(order: Order, now: number): Order {
  assertStatus(order, 'pending_receive', ERR.ORDER_NOT_RECEIVABLE)
  return { ...order, status: 'completed', receiveTime: now }
}
export function canApplyAfterSale(order: Order, now: number): boolean {
  if (order.status !== 'pending_receive' && order.status !== 'completed') return false
  const ref = order.receiveTime ?? order.shipTime ?? order.createTime
  return now - ref < AFTERSALE_DAYS_MS
}
export function genOrderNo(now: number): string {
  return `${now}${Math.floor(Math.random() * 10000)}`
}

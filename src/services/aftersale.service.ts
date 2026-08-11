import type { AfterSale, AfterSaleType } from '../models/aftersale'
import { BusinessError, ERR } from '../utils/errors'
export function applyAfterSale(id: string, orderId: string, type: AfterSaleType, reason: string, now: number): AfterSale {
  return { id, orderId, type, status: 'pending', reason, applyTime: now }
}
function assertState(a: AfterSale, expected: AfterSale['status']) {
  if (a.status !== expected) throw new BusinessError(ERR.AFTERSALE_STATE, `售后状态 ${a.status} 不允许该操作`)
}
export function approve(a: AfterSale): AfterSale { assertState(a, 'pending'); return { ...a, status: 'approved' } }
export function refund(a: AfterSale): AfterSale { assertState(a, 'approved'); return { ...a, status: 'refunded' } }
export function reject(a: AfterSale): AfterSale { assertState(a, 'pending'); return { ...a, status: 'rejected' } }

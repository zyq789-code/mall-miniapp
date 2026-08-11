import { describe, expect, it } from 'vitest'
import { BusinessError, ERR } from '../src/utils/errors'
import { formatPrice, calcFreight } from '../src/utils/format'
import { storage } from '../src/utils/storage'

describe('errors', () => {
  it('抛出带 code 的业务错误', () => {
    try { throw new BusinessError(ERR.OUT_OF_STOCK, '库存不足') }
    catch (e: any) { expect(e.code).toBe('OUT_OF_STOCK'); expect(e.name).toBe('BusinessError') }
  })
})
describe('format', () => {
  it('分转元', () => { expect(formatPrice(12345)).toBe('¥123.45') })
  it('满99包邮否则6元', () => { expect(calcFreight(10000)).toBe(0); expect(calcFreight(5000)).toBe(600) })
})
describe('storage', () => {
  it('node 环境内存回退可读写', () => {
    storage.set('k', { a: 1 }); expect(storage.get('k', null)).toEqual({ a: 1 })
    expect(storage.get('none', 'def')).toBe('def')
    storage.remove('k'); expect(storage.get('k', null)).toBeNull()
  })
})

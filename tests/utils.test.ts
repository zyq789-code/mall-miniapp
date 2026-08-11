import { describe, expect, it } from 'vitest'
import { BusinessError, ERR } from '../src/utils/errors'
import { formatPrice, calcFreight, formatTime, todayKey } from '../src/utils/format'
import { storage, KEYS } from '../src/utils/storage'

describe('errors', () => {
  it('抛出带 code 的业务错误', () => {
    let err: unknown
    try { throw new BusinessError(ERR.OUT_OF_STOCK, '库存不足') } catch (e) { err = e }
    expect(err).toBeInstanceOf(BusinessError)
    if (err instanceof BusinessError) {
      expect(err.code).toBe('OUT_OF_STOCK')
      expect(err.name).toBe('BusinessError')
    }
  })
})
describe('format', () => {
  it('分转元', () => { expect(formatPrice(12345)).toBe('¥123.45') })
  it('满99包邮否则6元', () => {
    expect(calcFreight(10000)).toBe(0)
    expect(calcFreight(5000)).toBe(600)
    expect(calcFreight(9900)).toBe(0)     // 恰好满99
    expect(calcFreight(9899)).toBe(600)   // 差1分不包邮
  })
  it('formatTime 本地时间格式化', () => {
    const ts = new Date(2026, 7, 11, 9, 30).getTime()
    expect(formatTime(ts)).toBe('2026-08-11 09:30')
  })
  it('todayKey 日期键', () => {
    const ts = new Date(2026, 7, 11, 9, 30).getTime()
    expect(todayKey(ts)).toBe('2026-08-11')
  })
})
describe('storage', () => {
  it('node 环境内存回退可读写', () => {
    storage.set('k', { a: 1 }); expect(storage.get('k', null)).toEqual({ a: 1 })
    expect(storage.get('none', 'def')).toBe('def')
    storage.remove('k'); expect(storage.get('k', null)).toBeNull()
  })
})
describe('constants', () => {
  it('常量字典存在', () => {
    expect(ERR.OUT_OF_STOCK).toBe('OUT_OF_STOCK')
    expect(KEYS.cart).toBe('cart')
  })
})

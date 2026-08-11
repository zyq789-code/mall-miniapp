import { describe, expect, it } from 'vitest'
import { listGoods, searchGoods, collectCategoryIds } from '../src/mock/goods'
import { upsertOrder, getOrders } from '../src/api/order.api'
import type { Address } from '../src/models/order'
import type { Order } from '../src/models/order'

describe('mock goods', () => {
  it('按分类筛选与排序', () => {
    const phone = listGoods('c11')
    expect(phone.every(g => g.categoryId === 'c11')).toBe(true)
    const asc = listGoods(undefined, 'priceAsc')
    expect(asc[0].price).toBeLessThanOrEqual(asc[1].price)
    const desc = listGoods(undefined, 'priceDesc')
    expect(desc[0].price).toBeGreaterThanOrEqual(desc[1].price)
  })
  it('collectCategoryIds 展开一级分类到后代', () => {
    expect(collectCategoryIds('c1')).toEqual(['c1', 'c11'])
    expect(collectCategoryIds('c11')).toEqual(['c11'])
  })
  it('一级分类筛选可命中叶子商品', () => {
    const phones = listGoods('c1')
    expect(phones.length).toBeGreaterThan(0)
    expect(phones.every(g => collectCategoryIds('c1').includes(g.categoryId))).toBe(true)
    expect(phones.map(g => g.id)).toContain('g1')
  })
  it('搜索去空格大小写命中', () => {
    expect(searchGoods('  手机 ')).toHaveLength(1)
    expect(searchGoods('旗舰')).toHaveLength(1)
    expect(searchGoods('不存在的')).toHaveLength(0)
  })
})

describe('order api', () => {
  it('upsertOrder 新增与更新', () => {
    const addr: Address = { id: 'a', name: 'n', phone: '1', region: 'r', detail: 'd', isDefault: true }
    const o: Order = { id: 'o1', orderNo: 'n1', status: 'pending_pay', items: [], totalAmount: 0, couponDeduction: 0, pointsDeduction: 0, freight: 0, payAmount: 0, address: addr, createTime: 0 }
    upsertOrder(o)
    expect(getOrders()).toHaveLength(1)
    upsertOrder({ ...o, status: 'pending_ship' })
    expect(getOrders()).toHaveLength(1)
    expect(getOrders()[0].status).toBe('pending_ship')
  })
})

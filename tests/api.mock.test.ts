import { describe, expect, it, vi, beforeEach } from 'vitest'
import { listGoods, searchGoods, collectCategoryIds } from '../src/mock/goods'
import { getOrders, getOrder, createOrder, updateOrderStatus } from '../src/api/order.api'
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
    expect(collectCategoryIds('c1')).toEqual(['c1', 'c11', 'c12'])
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
  const addr: Address = { id: 'a', name: 'n', phone: '1', region: 'r', detail: 'd', isDefault: true }
  const o: Order = { id: 'o1', orderNo: 'n1', status: 'pending_pay', items: [], totalAmount: 0, couponDeduction: 0, pointsDeduction: 0, freight: 0, payAmount: 0, address: addr, createTime: 0 }

  const request = vi.fn()
  beforeEach(() => {
    request.mockReset()
    ;(globalThis as unknown as { uni: { request: typeof request } }).uni = { request }
    request.mockImplementation((opts: { url: string; method?: string; success?: (r: unknown) => void }) => {
      const url = opts.url
      if (opts.method === 'POST') opts.success?.({ statusCode: 201, data: { success: true, data: o } })
      else if (url.includes('/status')) opts.success?.({ statusCode: 200, data: { success: true, data: { ...o, status: 'pending_ship' } } })
      else if (url.endsWith('/orders/mine')) opts.success?.({ statusCode: 200, data: { success: true, data: { list: [o], total: 1 } } })
      else if (url.endsWith('/o1')) opts.success?.({ statusCode: 200, data: { success: true, data: o } })
      else opts.success?.({ statusCode: 404, data: { success: false, message: 'not found' } })
    })
  })

  it('异步拉取/详情/创建/状态流转', async () => {
    expect(await getOrders()).toEqual([o])
    expect(await getOrder('o1')).toEqual(o)
    await expect(getOrder('missing')).resolves.toBeUndefined()
    expect(await createOrder(o)).toEqual(o)
    expect(await updateOrderStatus(o.id, 'pending_ship')).toMatchObject({ status: 'pending_ship' })

    const post = request.mock.calls.find(c => c[0].method === 'POST')
    expect(post?.[0].data).toEqual(o)
    const put = request.mock.calls.find(c => c[0].method === 'PUT')
    expect(put?.[0].data).toEqual({ status: 'pending_ship' })
  })
})

import { describe, expect, it } from 'vitest'
import type { CartItem } from '../src/models/goods'
import { addToCart, updateQuantity, toggleChecked, toggleAllChecked, removeItem, calcCheckedAmount, countChecked } from '../src/services/cart.service'

const c = (goodsId: string, skuId: string, quantity = 1, checked = true): CartItem =>
  ({ goodsId, skuId, quantity, checked, addedAt: 1 })

describe('cart', () => {
  it('同商品同规格合并数量', () => {
    expect(addToCart([c('g1', 's1')], c('g1', 's1', 2))).toEqual([{ ...c('g1', 's1'), quantity: 3 }])
  })
  it('不同规格新增条目且不修改原数组', () => {
    const list = [c('g1', 's1')]
    const r = addToCart(list, c('g1', 's2'))
    expect(r).toHaveLength(2); expect(list).toHaveLength(1)
  })
  it('updateQuantity 修改数量', () => {
    expect(updateQuantity([c('g1', 's1', 2)], 'g1', 's1', 5)[0].quantity).toBe(5)
  })
  it('toggleChecked 切换单项', () => {
    expect(toggleChecked([c('g1', 's1')], 'g1', 's1')[0].checked).toBe(false)
  })
  it('toggleAllChecked 全选/反选', () => {
    expect(toggleAllChecked([c('g1', 's1'), c('g2', 's1')], true).every(i => i.checked)).toBe(true)
  })
  it('removeItem 删除条目', () => {
    expect(removeItem([c('g1', 's1'), c('g2', 's1')], 'g1', 's1')).toHaveLength(1)
  })
  it('calcCheckedAmount 只算勾选项', () => {
    const price = () => 1000
    const list = [c('g1', 's1', 2, true), c('g2', 's1', 1, false)]
    expect(calcCheckedAmount(list, price)).toBe(2000)
    expect(countChecked(list)).toBe(1)
  })
})

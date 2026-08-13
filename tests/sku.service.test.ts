import { describe, expect, it } from 'vitest'
import type { Sku } from '../src/models/goods'
import { generateSkus, findSku, isSkuComplete, getPriceRange, isValidSelection } from '../src/services/sku.service'

const colors = { name: '颜色', values: ['黑', '白'] }
const ram = { name: '内存', values: ['128G', '256G'] }

describe('generateSkus', () => {
  it('空规格维度生成单个默认 SKU', () => {
    const skus = generateSkus([], 1000, 50)
    expect(skus).toHaveLength(1)
    expect(skus[0]).toMatchObject({ id: '1', price: 1000, stock: 50, attrs: {} })
  })
  it('单维度 2 值生成 2 个 SKU，id 1..n', () => {
    const skus = generateSkus([colors], 2000)
    expect(skus).toHaveLength(2)
    expect(skus.map(s => s.attrs)).toEqual([{ 颜色: '黑' }, { 颜色: '白' }])
    expect(skus.map(s => s.id)).toEqual(['1', '2'])
  })
  it('双维度 2×2 生成 4 个 SKU，attrs 为完整笛卡尔积', () => {
    const skus = generateSkus([colors, ram], 1000)
    expect(skus).toHaveLength(4)
    expect(skus.map(s => s.attrs)).toEqual([
      { 颜色: '黑', 内存: '128G' },
      { 颜色: '黑', 内存: '256G' },
      { 颜色: '白', 内存: '128G' },
      { 颜色: '白', 内存: '256G' },
    ])
    expect(skus.every(s => s.price === 1000 && s.stock === 100)).toBe(true)
  })
})

describe('findSku', () => {
  const skus: Sku[] = generateSkus([colors, ram], 1000)
  it('选中全部属性命中对应 SKU', () => {
    expect(findSku(skus, { 颜色: '黑', 内存: '256G' })?.attrs).toEqual({ 颜色: '黑', 内存: '256G' })
  })
  it('少选（部分属性但已选合法）命中匹配子集的 SKU', () => {
    expect(findSku(skus, { 颜色: '黑' })?.attrs).toEqual({ 颜色: '黑', 内存: '128G' })
  })
  it('错选（非法值）不命中', () => {
    expect(findSku(skus, { 颜色: '黑', 内存: '512G' })).toBeUndefined()
  })
  it('空 sku 列表返回 undefined', () => {
    expect(findSku([], { 颜色: '黑' })).toBeUndefined()
  })
})

describe('isSkuComplete', () => {
  it('选全所有维度为 true', () => {
    expect(isSkuComplete([colors, ram], { 颜色: '黑', 内存: '128G' })).toBe(true)
  })
  it('未选全是 false', () => {
    expect(isSkuComplete([colors, ram], { 颜色: '黑' })).toBe(false)
    expect(isSkuComplete([colors, ram], {})).toBe(false)
  })
  it('空 specs 视为 complete', () => {
    expect(isSkuComplete([], {})).toBe(true)
  })
  it('值选中但为空字符串视为未选全', () => {
    expect(isSkuComplete([colors], { 颜色: '' })).toBe(false)
  })
})

describe('getPriceRange', () => {
  const skus: Sku[] = [
    { id: '1', attrs: { 颜色: '黑' }, price: 1000, stock: 1 },
    { id: '2', attrs: { 颜色: '白' }, price: 3000, stock: 1 },
    { id: '3', attrs: { 颜色: '蓝' }, price: 2000, stock: 1 },
  ]
  it('有 skus 返回 min/max', () => {
    expect(getPriceRange({ skus })).toEqual({ min: 1000, max: 3000 })
  })
  it('无 skus 返回 null', () => {
    expect(getPriceRange({ skus: [] })).toBeNull()
  })
})

describe('isValidSelection', () => {
  it('全为合法规格值返回 true', () => {
    expect(isValidSelection([colors, ram], { 颜色: '白', 内存: '256G' })).toBe(true)
  })
  it('含非法规格值返回 false', () => {
    expect(isValidSelection([colors], { 颜色: '绿' })).toBe(false)
  })
  it('未知规格维度名返回 false', () => {
    expect(isValidSelection([colors], { 尺寸: '大' })).toBe(false)
  })
})

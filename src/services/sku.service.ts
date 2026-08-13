import type { Goods, SpecGroup, Sku } from '../models/goods'

/** 从规格维度生成所有 SKU 组合（笛卡尔积）。每个组合默认 basePrice/stock；id 用 1..n */
export function generateSkus(specs: SpecGroup[], basePrice: number, stock = 100): Sku[] {
  let combos: Array<Record<string, string>> = [{}]
  for (const group of specs) {
    combos = combos.flatMap((combo) =>
      group.values.map((value) => ({ ...combo, [group.name]: value })),
    )
  }
  return combos.map((attrs, i) => ({
    id: String(i + 1),
    attrs,
    price: basePrice,
    stock,
  }))
}

/** 按已选属性找到匹配 SKU（selected 可能没选全） */
export function findSku(skus: Sku[], selected: Record<string, string>): Sku | undefined {
  return skus.find((sku) => Object.entries(selected).every(([name, value]) => sku.attrs[name] === value))
}

/** 已选属性是否已完整覆盖所有规格维度 */
export function isSkuComplete(specs: SpecGroup[], selected: Record<string, string>): boolean {
  return specs.every((group) => selected[group.name] !== undefined && selected[group.name] !== '')
}

/** 商品价格区间（最小/最大 SKU 价），用于"¥xx 起"展示 */
export function getPriceRange(goods: Pick<Goods, 'skus'>): { min: number; max: number } | null {
  if (goods.skus.length === 0) return null
  const prices = goods.skus.map((sku) => sku.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** 校验已选属性是否都是合法规格值 */
export function isValidSelection(specs: SpecGroup[], selected: Record<string, string>): boolean {
  return Object.entries(selected).every(([name, value]) => {
    const group = specs.find((g) => g.name === name)
    return group !== undefined && group.values.includes(value)
  })
}

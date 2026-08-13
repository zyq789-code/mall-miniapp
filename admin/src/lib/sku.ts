import type { SpecGroup } from '../api/products'

/** 由规格生成的单个 SKU 行：价格单位与编辑表单一致（元），提交时再转分。 */
export interface SkuRow {
  attrs: Record<string, string>
  price: number // 元
  stock: number
}

/** 新组合的默认价格/库存（可选）。 */
export interface SkuDefaults {
  price?: number // 元
  stock?: number
}

/** attrs 的稳定签名（key 排序后序列化），用于与已有 SKU 精确匹配。 */
function attrsKey(attrs: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(attrs)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = attrs[key]
        return acc
      }, {}),
  )
}

/**
 * 由规格维度做笛卡尔积生成全部 SKU 组合。
 * - existingSkus 中 attrs 完全匹配的组合沿用其 price/stock（编辑时不丢数据）。
 * - 新组合使用 defaults 的 price/stock，缺省为 0。
 * - 无有效规格维度（空名或空值）时返回 []，兼容不填规格的商品。
 */
export function generateSkuRows(
  specs: SpecGroup[],
  existingSkus: SkuRow[] = [],
  defaults: SkuDefaults = {},
): SkuRow[] {
  const validSpecs = specs.filter((s) => s.name.trim() !== '' && s.values.length > 0)
  if (validSpecs.length === 0) return []

  let combos: Array<Record<string, string>> = [{}]
  for (const group of validSpecs) {
    combos = combos.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name]: value })))
  }

  const existing = new Map(existingSkus.map((s) => [attrsKey(s.attrs), s] as const))

  return combos.map((attrs) => {
    const matched = existing.get(attrsKey(attrs))
    return {
      attrs,
      price: matched?.price ?? defaults.price ?? 0,
      stock: matched?.stock ?? defaults.stock ?? 0,
    }
  })
}

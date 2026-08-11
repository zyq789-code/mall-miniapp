import type { Goods } from '../models/goods'
import { listGoods, getGoods, searchGoods } from '../mock/goods'

export interface GoodsRepository {
  list(opts?: { categoryId?: string; sort?: 'sales' | 'priceAsc' | 'priceDesc' }): Goods[]
  get(id: string): Goods | undefined
  search(keyword: string): Goods[]
}
export const goodsRepo: GoodsRepository = {
  list: (opts) => listGoods(opts?.categoryId, opts?.sort),
  get: getGoods,
  search: searchGoods,
}

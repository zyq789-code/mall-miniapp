import type { Goods } from '../models/goods'
import { request } from './request'

export interface GoodsRepository {
  list(opts?: { categoryId?: string; sort?: 'sales' | 'priceAsc' | 'priceDesc' }): Promise<Goods[]>
  get(id: string): Promise<Goods | undefined>
  search(keyword: string): Promise<Goods[]>
}

/** 门店只展示在售商品；管理后台下架后即从小程序消失。 */
function isOn(g: Goods): boolean {
  return g.status === 'on'
}

export const goodsRepo: GoodsRepository = {
  async list(opts) {
    const data = await request<{ list: Goods[] }>('/products', {
      data: { ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}) },
    })
    let r = (data?.list ?? []).filter(isOn)
    if (opts?.sort === 'sales') r.sort((a, b) => b.sales - a.sales)
    if (opts?.sort === 'priceAsc') r.sort((a, b) => a.price - b.price)
    if (opts?.sort === 'priceDesc') r.sort((a, b) => b.price - a.price)
    return r
  },
  async get(id) {
    try { return await request<Goods>(`/products/${id}`) }
    catch { return undefined }
  },
  async search(keyword) {
    const data = await request<{ list: Goods[] }>('/products', { data: { keyword } })
    return (data?.list ?? []).filter(isOn)
  },
}

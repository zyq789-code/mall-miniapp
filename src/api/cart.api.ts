import type { CartItem } from '../models/goods'
import { request } from './request'

/** 后端购物车项 DTO（camelCase，checked 为布尔）。 */
interface CartItemDto {
  goodsId: string
  skuId: string
  quantity: number
  checked: boolean
  addedAt: number
}

function toCartItem(dto: CartItemDto): CartItem {
  return {
    goodsId: dto.goodsId,
    skuId: dto.skuId,
    quantity: dto.quantity,
    checked: !!dto.checked,
    addedAt: dto.addedAt,
  }
}

/** 拉取当前用户购物车（带用户 token）。 */
export async function getCart(): Promise<CartItem[]> {
  const data = await request<{ list: CartItemDto[] }>('/cart')
  return (data?.list ?? []).map(toCartItem)
}

/** 加入购物车（同 goods+sku 后端自动累加数量）。 */
export function addItem(item: CartItem): Promise<unknown> {
  return request('/cart', {
    method: 'POST',
    data: { goodsId: item.goodsId, skuId: item.skuId, quantity: item.quantity },
  })
}

/** 更新数量 / 勾选状态。 */
export function updateItem(goodsId: string, skuId: string, patch: { quantity?: number; checked?: boolean }): Promise<unknown> {
  return request(`/cart/${goodsId}/${skuId}`, { method: 'PUT', data: patch })
}

/** 删除单个购物车项。 */
export function removeItem(goodsId: string, skuId: string): Promise<unknown> {
  return request(`/cart/${goodsId}/${skuId}`, { method: 'DELETE' })
}

/** 清空当前用户购物车。 */
export function clearCart(): Promise<unknown> {
  return request('/cart/clear', { method: 'DELETE' })
}

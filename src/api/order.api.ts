import type { Order } from '../models/order'
import { request } from './request'

/** 我的订单（GET /orders/mine，带用户 token，只看当前用户自己的订单）。 */
export async function getOrders(): Promise<Order[]> {
  const data = await request<{ list: Order[] }>('/orders/mine')
  return data?.list ?? []
}

/** 订单详情；不存在或请求失败时返回 undefined。 */
export async function getOrder(id: string): Promise<Order | undefined> {
  try {
    return await request<Order>(`/orders/${id}`)
  } catch {
    return undefined
  }
}

/** 创建订单（POST /orders，公开接口）。 */
export function createOrder(order: Order): Promise<Order> {
  return request<Order>('/orders', { method: 'POST', data: order })
}

/** 订单状态流转（PUT /orders/:id/status，支付/取消/收货共用）。 */
export function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  return request<Order>(`/orders/${id}/status`, { method: 'PUT', data: { status } })
}

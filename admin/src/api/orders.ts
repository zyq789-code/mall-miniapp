import { request } from './client'

export type OrderStatus =
  | 'pending_pay'
  | 'pending_ship'
  | 'pending_receive'
  | 'completed'
  | 'canceled'

export interface OrderItem {
  goodsId: string
  skuId: string
  name: string
  image: string
  spec: string
  price: number // 分
  quantity: number
}

export interface OrderAddress {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

export interface Order {
  id: string
  orderNo: string
  status: OrderStatus
  totalAmount: number // 分
  freight: number // 分
  payAmount: number // 分
  address: OrderAddress | null
  items: OrderItem[]
  couponDeduction: number // 分
  pointsDeduction: number // 分
  createTime: number
  payTime: number | null
  shipTime: number | null
  receiveTime: number | null
}

export interface OrderList {
  list: Order[]
  total: number
}

export interface OrderQuery {
  status?: OrderStatus
}

/** GET /orders，支持 status 过滤。 */
export function getOrders(params: OrderQuery = {}): Promise<OrderList> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  const qs = query.toString()
  return request<OrderList>(`/orders${qs ? `?${qs}` : ''}`)
}

/** GET /orders/:id，订单详情。 */
export function getOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}`)
}

/** PUT /orders/:id/ship，仅待发货状态可发货（需 token，client 自动带）。 */
export function shipOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/ship`, { method: 'PUT' })
}

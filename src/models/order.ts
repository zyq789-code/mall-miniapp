export type OrderStatus = 'pending_pay' | 'pending_ship' | 'pending_receive' | 'completed' | 'canceled'
export interface OrderItem { goodsId: string; skuId: string; name: string; image: string; spec: string; price: number; quantity: number }
export interface Address { id: string; name: string; phone: string; region: string; detail: string; isDefault: boolean }
export interface Order {
  id: string; orderNo: string; status: OrderStatus
  items: OrderItem[]; totalAmount: number; couponDeduction: number; pointsDeduction: number
  freight: number; payAmount: number; address: Address
  createTime: number; payTime?: number; shipTime?: number; receiveTime?: number
}

import type { Order } from '../models/order'
import { storage, KEYS } from '../utils/storage'
export function getOrders(): Order[] { return storage.get<Order[]>(KEYS.orders, []) }
export function saveOrders(list: Order[]) { storage.set(KEYS.orders, list) }
export function getOrder(id: string): Order | undefined { return getOrders().find(o => o.id === id) }
export function upsertOrder(order: Order) {
  const list = getOrders()
  const i = list.findIndex(o => o.id === order.id)
  saveOrders(i >= 0 ? list.map(o => (o.id === order.id ? order : o)) : [...list, order])
}

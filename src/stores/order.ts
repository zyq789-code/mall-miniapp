import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order } from '../models/order'
import { getOrders, createOrder, updateOrderStatus } from '../api/order.api'
import { pay, cancel, ship, receive } from '../services/order.service'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])

  /** 拉取"我的订单"作为本地快照；未登录/token 失效时置空而不是抛错。 */
  const sync = async () => {
    try {
      orders.value = await getOrders()
    } catch {
      orders.value = []
    }
  }

  /** 创建订单：先写后端，成功后尽力刷新列表（刷新失败不影响下单结果）。 */
  const create = async (o: Order) => {
    await createOrder(o)
    try { await sync() } catch { /* ignore */ }
  }

  /** 支付：客户端守卫算出新状态 → 后端流转 → 刷新。 */
  const doPay = async (o: Order) => {
    const next = pay(o, Date.now())
    await updateOrderStatus(o.id, next.status)
    await sync()
    return next
  }

  /** 取消订单。 */
  const doCancel = async (o: Order) => {
    const next = cancel(o)
    await updateOrderStatus(o.id, next.status)
    await sync()
    return next
  }

  /** 模拟发货。 */
  const doShip = async (o: Order) => {
    const next = ship(o, Date.now())
    await updateOrderStatus(o.id, next.status)
    await sync()
    return next
  }

  /** 确认收货。 */
  const doReceive = async (o: Order) => {
    const next = receive(o, Date.now())
    await updateOrderStatus(o.id, next.status)
    await sync()
    return next
  }

  return { orders, sync, create, doPay, doCancel, doShip, doReceive }
})

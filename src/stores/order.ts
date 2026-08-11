import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order } from '../models/order'
import { getOrders, upsertOrder } from '../api/order.api'
import { pay, cancel, ship, receive } from '../services/order.service'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>(getOrders())
  const sync = () => { orders.value = getOrders() }
  const create = (o: Order) => { upsertOrder(o); orders.value = getOrders() }
  const doPay = (o: Order) => { const r = pay(o, Date.now()); upsertOrder(r); sync(); return r }
  const doCancel = (o: Order) => { const r = cancel(o); upsertOrder(r); sync(); return r }
  const doShip = (o: Order) => { const r = ship(o, Date.now()); upsertOrder(r); sync(); return r }
  const doReceive = (o: Order) => { const r = receive(o, Date.now()); upsertOrder(r); sync(); return r }
  return { orders, sync, create, doPay, doCancel, doShip, doReceive }
})

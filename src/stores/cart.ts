import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CartItem } from '../models/goods'
import { getCart, saveCart } from '../api/cart.api'
import { addToCart, toggleChecked, toggleAllChecked, updateQuantity, removeItem, removeMany } from '../services/cart.service'

export const useCartStore = defineStore('cart', () => {
  const list = ref<CartItem[]>(getCart())
  const setList = (v: CartItem[]) => { list.value = v; saveCart(v) }
  const add = (item: CartItem) => setList(addToCart(list.value, item))
  const toggle = (gid: string, sid: string) => setList(toggleChecked(list.value, gid, sid))
  const toggleAll = (checked: boolean) => setList(toggleAllChecked(list.value, checked))
  const setQty = (gid: string, sid: string, q: number) => setList(updateQuantity(list.value, gid, sid, q))
  const remove = (gid: string, sid: string) => setList(removeItem(list.value, gid, sid))
  const removeBatch = (items: { goodsId: string; skuId: string }[]) => setList(removeMany(list.value, items))
  const sync = () => { list.value = getCart() }
  return { list, add, toggle, toggleAll, setQty, remove, removeBatch, sync }
})

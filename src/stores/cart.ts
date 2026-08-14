import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CartItem } from '../models/goods'
import { getCart, addItem, updateItem, removeItem as apiRemoveItem } from '../api/cart.api'
import {
  addToCart,
  toggleChecked,
  toggleAllChecked,
  updateQuantity,
  removeItem,
  removeMany,
} from '../services/cart.service'

/**
 * 购物车（后端驱动，按用户隔离）。
 * 所有写操作 = 本地乐观更新 + 调后端 API + 失败回滚。
 * 登录/退出时由 user store 调用 clear() 清空本地快照，避免跨用户泄漏。
 */
export const useCartStore = defineStore('cart', () => {
  const list = ref<CartItem[]>([])

  /** 从服务器拉取当前用户购物车（登录后 / 购物车页 onShow 时调用）。 */
  const sync = async (): Promise<void> => {
    list.value = await getCart()
  }

  /** 清空本地快照（不删服务器数据；登录/退出时调用）。 */
  const clear = (): void => {
    list.value = []
  }

  /** 加购：本地合并数量 + 后端 upsert。 */
  const add = async (item: CartItem): Promise<void> => {
    const prev = list.value
    list.value = addToCart(list.value, item)
    try {
      await addItem(item)
    } catch (e) {
      list.value = prev
      throw e
    }
  }

  /** 单项勾选切换。 */
  const toggle = async (gid: string, sid: string): Promise<void> => {
    const item = list.value.find((x) => x.goodsId === gid && x.skuId === sid)
    if (!item) return
    const prev = list.value
    list.value = toggleChecked(list.value, gid, sid)
    try {
      await updateItem(gid, sid, { checked: !item.checked })
    } catch (e) {
      list.value = prev
      throw e
    }
  }

  /** 全选/反选。 */
  const toggleAll = async (checked: boolean): Promise<void> => {
    const prev = list.value
    list.value = toggleAllChecked(list.value, checked)
    try {
      await Promise.all(list.value.map((x) => updateItem(x.goodsId, x.skuId, { checked })))
    } catch (e) {
      list.value = prev
      throw e
    }
  }

  /** 修改数量（下限 1）。 */
  const setQty = async (gid: string, sid: string, q: number): Promise<void> => {
    const quantity = Math.max(1, Math.floor(q))
    const prev = list.value
    list.value = updateQuantity(list.value, gid, sid, quantity)
    try {
      await updateItem(gid, sid, { quantity })
    } catch (e) {
      list.value = prev
      throw e
    }
  }

  /** 删除单个购物车项。 */
  const remove = async (gid: string, sid: string): Promise<void> => {
    const prev = list.value
    list.value = removeItem(list.value, gid, sid)
    try {
      await apiRemoveItem(gid, sid)
    } catch (e) {
      list.value = prev
      throw e
    }
  }

  /** 批量删除（后端逐个删，失败回滚本地）。 */
  const removeBatch = async (items: { goodsId: string; skuId: string }[]): Promise<void> => {
    if (!items.length) return
    const prev = list.value
    list.value = removeMany(list.value, items)
    try {
      await Promise.all(items.map((x) => apiRemoveItem(x.goodsId, x.skuId)))
    } catch (e) {
      list.value = prev
      throw e
    }
  }

  /** 下单后清结算项：删除所有勾选项。 */
  const clearChecked = async (): Promise<void> => {
    const checked = list.value
      .filter((x) => x.checked)
      .map((x) => ({ goodsId: x.goodsId, skuId: x.skuId }))
    if (!checked.length) return
    await removeBatch(checked)
  }

  return { list, sync, clear, add, toggle, toggleAll, setQty, remove, removeBatch, clearChecked }
})

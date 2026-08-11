import type { CartItem } from '../models/goods'
import { storage, KEYS } from '../utils/storage'
export function getCart(): CartItem[] { return storage.get<CartItem[]>(KEYS.cart, []) }
export function saveCart(list: CartItem[]) { storage.set(KEYS.cart, list) }

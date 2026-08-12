// uni 存在则用 uni storage，node/测试环境内存回退
const memory = new Map<string, unknown>()
const hasUni = typeof uni !== 'undefined'
export const storage = {
  get<T>(key: string, def: T): T {
    const v = hasUni ? uni.getStorageSync(key) : memory.get(key)
    return v === '' || v == null ? def : (v as T)
  },
  set(key: string, val: unknown) {
    if (hasUni) uni.setStorageSync(key, val); else memory.set(key, val)
  },
  remove(key: string) {
    if (hasUni) uni.removeStorageSync(key); else memory.delete(key)
  },
}
export const KEYS = {
  cart: 'cart', orders: 'orders', addresses: 'addresses',
  user: 'user', coupons: 'coupons', aftersales: 'aftersales',
  favorites: 'favorites', footprints: 'footprints', selectedCoupon: 'selectedCoupon',
  lastSignDay: 'lastSignDay', reviews: 'reviews', flashPurchased: 'flashPurchased',
} as const

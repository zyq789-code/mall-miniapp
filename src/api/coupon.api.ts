import type { UserCoupon } from '../models/coupon'
import { storage, KEYS } from '../utils/storage'

export function getCoupons(): UserCoupon[] { return storage.get<UserCoupon[]>(KEYS.coupons, []) }
export function saveCoupons(list: UserCoupon[]) { storage.set(KEYS.coupons, list) }

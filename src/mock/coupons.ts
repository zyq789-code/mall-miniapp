import type { Coupon } from '../models/coupon'
export const couponSeeds: Coupon[] = [
  { id: 'cp1', name: '满100减20', type: 'reduce', threshold: 10000, discount: 2000, scope: 'all', startAt: 0, endAt: 4100000000000, status: 'unused' },
  { id: 'cp2', name: '满300减60', type: 'reduce', threshold: 30000, discount: 6000, scope: 'all', startAt: 0, endAt: 4100000000000, status: 'unused' },
  { id: 'cp3', name: '全场9折', type: 'discount', threshold: 0, discount: 90, scope: 'all', startAt: 0, endAt: 4100000000000, status: 'unused' },
]

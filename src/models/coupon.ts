export type CouponType = 'reduce' | 'discount'
export type CouponStatus = 'unused' | 'used' | 'expired'
export interface Coupon {
  id: string; name: string; type: CouponType
  threshold: number          // 满 X 分可用
  discount: number           // reduce: 减 Y 分；discount: 折扣(8.5折=85)
  scope: 'all' | string[]    // 全场 或 分类id列表
  startAt: number; endAt: number; status: CouponStatus
}
export interface UserCoupon extends Coupon { userId: string; receivedAt: number; couponId: string }

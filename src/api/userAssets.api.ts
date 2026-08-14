import type { UserCoupon } from '../models/coupon'
import type { FootprintItem } from '../models/goods'
import { request } from './request'

// ---------- 收藏 ----------

/** 当前用户收藏的商品 id 列表（带用户 token）。 */
export async function getFavorites(): Promise<string[]> {
  const data = await request<{ list: string[] }>('/favorites')
  return data?.list ?? []
}

/** 收藏（幂等）。 */
export function addFavorite(goodsId: string): Promise<unknown> {
  return request('/favorites', { method: 'POST', data: { goodsId } })
}

/** 取消收藏。 */
export function removeFavorite(goodsId: string): Promise<unknown> {
  return request(`/favorites/${encodeURIComponent(goodsId)}`, { method: 'DELETE' })
}

// ---------- 足迹 ----------

/** 当前用户足迹（倒序、去重同 goodsId 保留最新、最多 50）。 */
export async function getFootprints(): Promise<FootprintItem[]> {
  const data = await request<{ list: FootprintItem[] }>('/footprints')
  return data?.list ?? []
}

/** 记录足迹（幂等，同 goodsId 刷新 time）。 */
export function recordFootprint(goodsId: string): Promise<unknown> {
  return request('/footprints', { method: 'POST', data: { goodsId } })
}

/** 清空足迹。 */
export function clearFootprints(): Promise<unknown> {
  return request('/footprints', { method: 'DELETE' })
}

// ---------- 优惠券 ----------

/** 后端 user_coupons DTO（/api/coupons 原始返回）。 */
interface UserCouponDto {
  id: string
  couponId: string
  userId: string
  name: string
  type: UserCoupon['type']
  threshold: number
  discount: number
  scope: 'all' | string[]
  startAt: number
  endAt: number
  status: UserCoupon['status']
  receivedAt: number
}

function toUserCoupon(dto: UserCouponDto): UserCoupon {
  return {
    id: dto.id,
    couponId: dto.couponId,
    userId: dto.userId,
    name: dto.name,
    type: dto.type,
    threshold: dto.threshold,
    discount: dto.discount,
    scope: dto.scope,
    startAt: dto.startAt,
    endAt: dto.endAt,
    status: dto.status,
    receivedAt: dto.receivedAt,
  }
}

/** 当前用户已领券列表（expired 由后端计算）。 */
export async function getCoupons(): Promise<UserCoupon[]> {
  const data = await request<{ list: UserCouponDto[] }>('/coupons')
  return (data?.list ?? []).map(toUserCoupon)
}

/** 从领券中心种子领取。body { couponId }。 */
export function claimCoupon(couponId: string): Promise<unknown> {
  return request('/coupons/claim', { method: 'POST', data: { couponId } })
}

/** 标记已用（下单用券时）。 */
export function markCouponUsed(id: string): Promise<unknown> {
  return request(`/coupons/${encodeURIComponent(id)}/status`, { method: 'PUT', data: { status: 'used' } })
}

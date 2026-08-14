import type { Review } from '../models/review'
import type { AfterSale } from '../models/aftersale'
import type { UserProfile } from './user.api'
import { request } from './request'

// ---------- 评价 ----------

/** 后端 reviews DTO（/api/reviews 原始返回）。 */
interface ReviewDto {
  id: string
  orderId: string
  goodsId: string
  stars: number
  content: string
  anonymous: boolean
  time: number
}

function toReview(dto: ReviewDto): Review {
  return {
    id: dto.id,
    orderId: dto.orderId,
    goodsId: dto.goodsId,
    stars: dto.stars,
    content: dto.content,
    anonymous: dto.anonymous,
    time: dto.time,
  }
}

export interface CreateReviewInput {
  orderId: string
  goodsId: string
  stars: number
  content: string
  anonymous: boolean
}

/** 写评价（POST /api/reviews，需登录）。 */
export function createReview(data: CreateReviewInput): Promise<unknown> {
  return request('/reviews', { method: 'POST', data })
}

/** 商品评价列表（GET /api/reviews?goodsId=，公开接口）。 */
export async function getReviewsByGoods(goodsId: string): Promise<Review[]> {
  const data = await request<{ list: ReviewDto[] }>(`/reviews?goodsId=${encodeURIComponent(goodsId)}`)
  return (data?.list ?? []).map(toReview)
}

// ---------- 售后 ----------

/** 后端 aftersales DTO（/api/aftersales 原始返回）。 */
interface AfterSaleDto {
  id: string
  orderId: string
  type: AfterSale['type']
  status: AfterSale['status']
  reason: string
  applyTime: number
}

function toAfterSale(dto: AfterSaleDto): AfterSale {
  return {
    id: dto.id,
    orderId: dto.orderId,
    type: dto.type,
    status: dto.status,
    reason: dto.reason,
    applyTime: dto.applyTime,
  }
}

export interface CreateAfterSaleInput {
  orderId: string
  type: AfterSale['type']
  reason: string
}

/** 申请售后（POST /api/aftersales，需登录）。 */
export function createAfterSale(data: CreateAfterSaleInput): Promise<unknown> {
  return request('/aftersales', { method: 'POST', data })
}

/** 当前用户售后列表（GET /api/aftersales，需登录）。 */
export async function getAfterSales(): Promise<AfterSale[]> {
  const data = await request<{ list: AfterSaleDto[] }>('/aftersales')
  return (data?.list ?? []).map(toAfterSale)
}

// ---------- 积分联动 ----------

/** 调整积分（POST /api/user/points，delta 可正可负，结果不能 <0），返回最新资料。 */
export function adjustPoints(delta: number): Promise<UserProfile> {
  return request<UserProfile>('/user/points', { method: 'POST', data: { delta } })
}

/** 累计消费 +amount（分）（POST /api/user/spend），返回最新资料。 */
export function addSpend(amount: number): Promise<UserProfile> {
  return request<UserProfile>('/user/spend', { method: 'POST', data: { amount } })
}

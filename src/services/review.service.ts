import type { Order } from '../models/order'
import { BusinessError, ERR } from '../utils/errors'
export function canReview(order: Order): boolean { return order.status === 'completed' }
export function validateReview(r: { stars: number; content: string }): string | null {
  if (r.stars < 1 || r.stars > 5) return '评分需在 1-5 星'
  if (r.content.length > 500) return '评价内容不能超过 500 字'
  return null
}
export function assertCanReview(order: Order) {
  if (!canReview(order)) throw new BusinessError(ERR.REVIEW_INVALID, '当前订单不可评价')
}
